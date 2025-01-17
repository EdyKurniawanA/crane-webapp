'use client';

import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SpeedControl } from "@/components/speed-control"
import { fetchData } from '@/lib/fetchData'
import { Sensor3DView } from '@/components/sensor-3d-view'

// Safety limits based on Arduino configuration
const SAFETY_LIMITS = {
  motorX: {
    maxSpeed: 100,
    minSpeed: 0
  },
  motorY: {
    maxSpeedUp: 80,
    maxSpeedDown: 50,
    minSpeed: 0
  },
  motorZ: {
    maxSpeed: 200,
    minSpeed: 0
  },
  servo: {
    maxAngle: 180,
    minAngle: 0,
    defaultAngle: 90
  }
} as const;

interface MotorState {
  state: -1 | 0 | 1;
  speed: number;
}

interface ServoState {
  angle: number;
}

interface SensorData {
  loadCell: number
  vibration: number
  vibrationCount: number
}

export default function ControlPage() {
  const [motorX, setMotorX] = useState<MotorState>({ state: 0, speed: SAFETY_LIMITS.motorX.maxSpeed });
  const [motorY, setMotorY] = useState<MotorState>({ state: 0, speed: SAFETY_LIMITS.motorY.maxSpeedUp });
  const [motorZ, setMotorZ] = useState<MotorState>({ state: 0, speed: SAFETY_LIMITS.motorZ.maxSpeed });
  const [servo, setServo] = useState<ServoState>({ angle: SAFETY_LIMITS.servo.defaultAngle });

  // Custom speeds for each motor with safety limits
  const [customSpeedX, setCustomSpeedX] = useState<number>(SAFETY_LIMITS.motorX.maxSpeed);
  const [customSpeedY, setCustomSpeedY] = useState<{ up: number; down: number }>({ 
    up: SAFETY_LIMITS.motorY.maxSpeedUp, 
    down: SAFETY_LIMITS.motorY.maxSpeedDown 
  });
  const [customSpeedZ, setCustomSpeedZ] = useState<number>(SAFETY_LIMITS.motorZ.maxSpeed);

  // Safety state
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState(false);

  const [sensorData, setSensorData] = useState<SensorData>({
    loadCell: 0,
    vibration: 0,
    vibrationCount: 0
  });

  useEffect(() => {
    const controlsRef = ref(database, 'controls');
    console.log('Setting up Firebase controls listener...');
    
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Received control state update:', data);
      if (data) {
        if (data.motorX) {
          console.log('Updating Motor X state:', data.motorX);
          setMotorX(data.motorX);
          setCustomSpeedX(data.motorX.speed);
        }
        if (data.motorY) {
          console.log('Updating Motor Y state:', data.motorY);
          setMotorY(data.motorY);
          if (data.motorY.speed === SAFETY_LIMITS.motorY.maxSpeedUp || data.motorY.speed === SAFETY_LIMITS.motorY.maxSpeedDown) {
            setCustomSpeedY(prev => ({
              ...prev,
              up: data.motorY.state === 1 ? data.motorY.speed : prev.up,
              down: data.motorY.state === -1 ? data.motorY.speed : prev.down
            }));
          }
        }
        if (data.motorZ) {
          console.log('Updating Motor Z state:', data.motorZ);
          setMotorZ(data.motorZ);
          setCustomSpeedZ(data.motorZ.speed);
        }
        if (data.servo) {
          console.log('Updating Servo state:', data.servo);
          const safeAngle = Math.max(
            SAFETY_LIMITS.servo.minAngle,
            Math.min(data.servo.angle, SAFETY_LIMITS.servo.maxAngle)
          );
          setServo({ angle: safeAngle });
        }
      }
    });

    return () => {
      console.log('Cleaning up Firebase controls listener');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = fetchData('sensor', async (data: any) => {
      if (data) {
        setSensorData({
          loadCell: data.weight || 0,
          vibration: data.vibrationFrequency || 0,
          vibrationCount: data.vibrationCount || 0
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const validateSpeed = (motor: string, speed: number, direction?: 'up' | 'down'): boolean => {
    console.log(`Validating ${motor} speed:`, { speed, direction });
    
    if (motor === 'motorY' && direction) {
      const limit = direction === 'up' ? SAFETY_LIMITS.motorY.maxSpeedUp : SAFETY_LIMITS.motorY.maxSpeedDown;
      if (speed > limit) {
        console.warn(`Speed validation failed: ${direction} speed (${speed}) exceeds limit (${limit})`);
        setSafetyWarning(`${direction.toUpperCase()} speed cannot exceed ${limit}`);
        return false;
      }
    } else {
      const limits = SAFETY_LIMITS[motor as keyof typeof SAFETY_LIMITS];
      if ('maxSpeed' in limits && speed > limits.maxSpeed) {
        console.warn(`Speed validation failed: ${motor} speed (${speed}) exceeds limit (${limits.maxSpeed})`);
        setSafetyWarning(`${motor} speed cannot exceed ${limits.maxSpeed}`);
        return false;
      }
    }
    console.log('Speed validation passed');
    setSafetyWarning(null);
    return true;
  };

  const handleMotorControl = async (motor: string, state: -1 | 0 | 1) => {
    console.log(`Motor control request:`, { motor, state });
    
    if (isEmergencyStopped && state !== 0) {
      console.warn('Motor control blocked: Emergency stop is active');
      setSafetyWarning("Emergency stop is active. Reset required.");
      return;
    }

    try {
      const speeds = {
        motorX: customSpeedX,
        motorY: state === 1 ? customSpeedY.up : customSpeedY.down,
        motorZ: customSpeedZ
      };
      
      const speed = speeds[motor as keyof typeof speeds];
      console.log(`Attempting to control ${motor}:`, { state, speed });
      
      if (!validateSpeed(motor, speed, state === 1 ? 'up' : 'down')) {
        return;
      }

      await set(ref(database, `controls/${motor}`), {
        state,
        speed
      });
      console.log(`Successfully updated ${motor} control:`, { state, speed });
    } catch (error) {
      console.error('Error controlling motor:', error);
      setSafetyWarning('Failed to control motor');
    }
  };

  const handleServoControl = async (angle: number) => {
    console.log('Servo control request:', { angle });
    
    if (isEmergencyStopped) {
      console.warn('Servo control blocked: Emergency stop is active');
      setSafetyWarning("Emergency stop is active. Reset required.");
      return;
    }

    try {
      const safeAngle = Math.max(
        SAFETY_LIMITS.servo.minAngle,
        Math.min(angle, SAFETY_LIMITS.servo.maxAngle)
      );
      
      if (safeAngle !== angle) {
        console.warn(`Servo angle adjusted from ${angle} to ${safeAngle} due to limits`);
        setSafetyWarning(`Servo angle limited to range ${SAFETY_LIMITS.servo.minAngle}-${SAFETY_LIMITS.servo.maxAngle}`);
      } else {
        setSafetyWarning(null);
      }

      await set(ref(database, 'controls/servo'), {
        angle: Math.round(safeAngle)
      });
      console.log('Successfully updated servo angle:', safeAngle);
    } catch (error) {
      console.error('Error controlling servo:', error);
      setSafetyWarning('Failed to control servo');
    }
  };

  const handleSpeedChange = async (motor: string, speed: number, direction?: 'up' | 'down') => {
    console.log(`Speed change request:`, { motor, speed, direction });
    
    if (!validateSpeed(motor, speed, direction)) {
      return;
    }

    if (motor === 'motorY' && direction) {
      console.log(`Updating Motor Y ${direction} speed to:`, speed);
      setCustomSpeedY(prev => ({ ...prev, [direction]: speed }));
    } else if (motor === 'motorX') {
      console.log('Updating Motor X speed to:', speed);
      setCustomSpeedX(speed);
    } else if (motor === 'motorZ') {
      console.log('Updating Motor Z speed to:', speed);
      setCustomSpeedZ(speed);
    }
  };

  const handleEmergencyStop = async () => {
    console.warn('EMERGENCY STOP ACTIVATED');
    setIsEmergencyStopped(true);
    setSafetyWarning("Emergency stop activated. Reset all controls.");
    
    try {
      await Promise.all([
        handleMotorControl('motorX', 0),
        handleMotorControl('motorY', 0),
        handleMotorControl('motorZ', 0),
        handleServoControl(SAFETY_LIMITS.servo.defaultAngle)
      ]);
      console.log('Emergency stop: All controls reset successfully');
    } catch (error) {
      console.error('Error during emergency stop:', error);
    }
  };

  const handleEmergencyReset = () => {
    console.log('Emergency stop reset requested');
    setIsEmergencyStopped(false);
    setSafetyWarning(null);
    console.log('Emergency stop reset complete');
  };

  return (
    <div className="container mx-auto p-2 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Crane Control System</h1>

      {safetyWarning && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{safetyWarning}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Card className="shadow-sm">
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Load Cell</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current Weight</p>
              <p className="text-3xl font-bold">
                {sensorData.loadCell.toFixed(2)}
                <span className="text-base font-normal text-muted-foreground ml-1">g</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Vibration Status</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Frequency</p>
                <p className="text-lg font-semibold">
                  {sensorData.vibration.toFixed(1)} Hz
                </p>
                <p className={cn(
                  "text-xs font-medium",
                  sensorData.vibration <= 10 ? "text-green-500" :
                  sensorData.vibration <= 30 ? "text-yellow-500" : "text-red-500"
                )}>
                  {sensorData.vibration <= 10 ? "Normal" :
                   sensorData.vibration <= 30 ? "Pre-caution" : "Danger"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Count</p>
                <p className="text-lg font-semibold">{sensorData.vibrationCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Motor X Control (Left/Right) */}
        <Card className="shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Motor X Control (Left/Right)
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                motorX.state !== 0 ? "bg-green-500 animate-pulse" : "bg-gray-300"
              )} />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline"
                size="lg"
                className={cn(
                  "w-20 h-20 transition-all text-sm",
                  motorX.state === -1 && "bg-primary/20 border-primary"
                )}
                onMouseDown={() => handleMotorControl('motorX', -1)}
                onMouseUp={() => handleMotorControl('motorX', 0)}
              >
                ← Left
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className={cn(
                  "w-20 h-20 transition-all text-sm",
                  motorX.state === 1 && "bg-primary/20 border-primary"
                )}
                onMouseDown={() => handleMotorControl('motorX', 1)}
                onMouseUp={() => handleMotorControl('motorX', 0)}
              >
                Right →
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <SpeedControl
                label="Speed"
                value={customSpeedX}
                defaultValue={100}
                onChange={(value) => handleSpeedChange('motorX', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Motor Y Control (Up/Down) */}
        <Card className="shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Motor Y Control (Up/Down)
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                motorY.state !== 0 ? "bg-green-500 animate-pulse" : "bg-gray-300"
              )} />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline"
                size="lg"
                className={cn(
                  "w-20 h-20 transition-all text-sm",
                  motorY.state === 1 && "bg-primary/20 border-primary"
                )}
                onMouseDown={() => handleMotorControl('motorY', 1)}
                onMouseUp={() => handleMotorControl('motorY', 0)}
              >
                ↑ Up
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className={cn(
                  "w-20 h-20 transition-all text-sm",
                  motorY.state === -1 && "bg-primary/20 border-primary"
                )}
                onMouseDown={() => handleMotorControl('motorY', -1)}
                onMouseUp={() => handleMotorControl('motorY', 0)}
              >
                Down ↓
              </Button>
            </div>
            <div className="flex justify-between items-center gap-2">
              <SpeedControl
                label="Up Speed"
                value={customSpeedY.up}
                defaultValue={80}
                onChange={(value) => handleSpeedChange('motorY', value, 'up')}
              />
              <SpeedControl
                label="Down Speed"
                value={customSpeedY.down}
                defaultValue={50}
                align="left"
                onChange={(value) => handleSpeedChange('motorY', value, 'down')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Motor Z Control (Forward/Backward) */}
        <Card className="shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Motor Z Control (Forward/Backward)
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                motorZ.state !== 0 ? "bg-green-500 animate-pulse" : "bg-gray-300"
              )} />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline"
                size="lg"
                className={cn(
                  "w-20 h-20 transition-all text-sm",
                  motorZ.state === 1 && "bg-primary/20 border-primary"
                )}
                onMouseDown={() => handleMotorControl('motorZ', 1)}
                onMouseUp={() => handleMotorControl('motorZ', 0)}
              >
                Forward
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className={cn(
                  "w-20 h-20 transition-all text-sm",
                  motorZ.state === -1 && "bg-primary/20 border-primary"
                )}
                onMouseDown={() => handleMotorControl('motorZ', -1)}
                onMouseUp={() => handleMotorControl('motorZ', 0)}
              >
                Back
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <SpeedControl
                label="Speed"
                value={customSpeedZ}
                defaultValue={200}
                onChange={(value) => handleSpeedChange('motorZ', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Servo Control */}
        <Card className="shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Servo Control
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                servo.angle !== SAFETY_LIMITS.servo.defaultAngle ? "bg-blue-500" : "bg-gray-300"
              )} />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex justify-between items-center">
              <SpeedControl
                label="Angle"
                value={servo.angle}
                defaultValue={90}
                min={0}
                max={180}
                onChange={(value) => handleServoControl(value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Controls */}
      <div className="fixed bottom-4 right-4 flex items-center gap-4">
        <Button 
          variant={isEmergencyStopped ? "default" : "destructive"}
          size="lg"
          className={cn(
            "w-20 h-20 rounded-xl transition-all hover:scale-105 flex flex-col items-center justify-center text-center leading-none text-xs p-0",
            isEmergencyStopped && "bg-green-500 hover:bg-green-600 text-white"
          )}
          onClick={isEmergencyStopped ? handleEmergencyReset : handleEmergencyStop}
        >
          {isEmergencyStopped ? 'RESET' : (
            <div className="flex flex-col gap-0.5">
              <span>EMERGENCY</span>
              <span>STOP</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
} 