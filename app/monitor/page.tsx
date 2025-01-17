'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { WiFiConnectionPrompt } from "@/components/wifi-connection-prompt"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from '@/components/protected-route'
// import { db } from '@/lib/firebase'
import { collection, addDoc, query, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { useFirebase } from '@/contexts/firebase-context'
import { ref, onValue } from 'firebase/database'
// import { database } from '@/lib/firebase'
import { fetchData } from '@/lib/fetchData'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { Sensor3DView } from '@/components/sensor-3d-view'
import { db } from '@/lib/firebase'

interface SensorData {
  loadCell: number
  humidity: number
  temperature: { celsius: number; fahrenheit: number }
  hcsr04: { x: number; y: number; z: number }
  vibration: number
  vibrationCount: number
}

interface HumidityDataPoint {
  time: string;
  value: number;
}

interface VibrationDataPoint {
  time: string;
  value: number;
}

export default function MonitorPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [humidityHistory, setHumidityHistory] = useState<HumidityDataPoint[]>([])
  const [vibrationHistory, setVibrationHistory] = useState<VibrationDataPoint[]>([])
  const [sensorData, setSensorData] = useState<SensorData>({
    loadCell: 0,
    humidity: 0.0,
    temperature: { celsius: 0, fahrenheit: 32 },
    hcsr04: { x: 0, y: 0, z: 0 },
    vibration: 0,
    vibrationCount: 0
  })

  useEffect(() => {
    if (isConnected && isMonitoring) {
      const unsubscribe = fetchData('sensor', async (data: any) => {
        if (data) {
          console.log('Received data:', data);
          setSensorData({
            loadCell: data.weight || 0,
            humidity: data.humi || 0,
            temperature: { 
              celsius: data.temp || 0, 
              fahrenheit: ((data.temp || 0) * 9/5) + 32 
            },
            hcsr04: {
              x: data.jarakX || 0,
              y: data.jarakY || 0,
              z: data.jarakZ || 0
            },
            vibration: data.vibrationFrequency || 0,
            vibrationCount: data.vibrationCount || 0
          });

          // Update humidity history
          const now = new Date();
          const timeStr = now.toLocaleTimeString();
          setHumidityHistory(prev => {
            const newHistory = [...prev, { time: timeStr, value: data.humi || 0 }];
            return newHistory.slice(-10);
          });

          // Update vibration history
          setVibrationHistory(prev => {
            const newHistory = [...prev, { time: timeStr, value: data.vibrationFrequency || 0 }];
            return newHistory.slice(-10);
          });
        }
      });

      return () => unsubscribe();
    }
  }, [isConnected, isMonitoring]);

  const handleConnect = () => {
    setIsConnected(true)
  }

  const handleBack = () => {
    setIsConnected(false)
    setIsMonitoring(false)
  }

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  if (!isConnected) {
    return <WiFiConnectionPrompt onConnect={handleConnect} />
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
          >
            Back to Instructions
          </Button>
          <Button 
            variant={isMonitoring ? "destructive" : "default"}
            onClick={toggleMonitoring}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Cell</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[100px]">
              <p className="text-4xl font-bold">
                {sensorData.loadCell !== undefined ? sensorData.loadCell.toFixed(2) : 'N/A'} g
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Humidity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={humidityHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Humidity (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-2xl font-bold mt-4 text-center">
                Current: {sensorData.humidity !== undefined ? sensorData.humidity.toFixed(2) : 'N/A'}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      barSize={10}
                      data={[
                        {
                          value: sensorData.temperature.celsius,
                          fill: '#2563eb'
                        }
                      ]}
                      startAngle={180}
                      endAngle={0}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={30 / 2}
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-current text-2xl font-bold"
                      >
                        {sensorData.temperature.celsius !== undefined ? `${sensorData.temperature.celsius.toFixed(1)}°C` : 'N/A'}
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      barSize={10}
                      data={[
                        {
                          value: sensorData.temperature.fahrenheit,
                          fill: '#dc2626'
                        }
                      ]}
                      startAngle={180}
                      endAngle={0}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[32, 212]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={30 / 2}
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-current text-2xl font-bold"
                      >
                        {sensorData.temperature.fahrenheit !== undefined ? `${sensorData.temperature.fahrenheit.toFixed(1)}°F` : 'N/A'}
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>HC-SR04</CardTitle>
            </CardHeader>
            <CardContent>
              <Sensor3DView
                x={sensorData.hcsr04.x}
                y={sensorData.hcsr04.y}
                z={sensorData.hcsr04.z}
              />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">X-axis</p>
                  <p className="text-xl font-semibold">
                    {sensorData.hcsr04.x !== undefined ? sensorData.hcsr04.x.toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Y-axis</p>
                  <p className="text-xl font-semibold">
                    {sensorData.hcsr04.y !== undefined ? sensorData.hcsr04.y.toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Z-axis</p>
                  <p className="text-xl font-semibold">
                    {sensorData.hcsr04.z !== undefined ? sensorData.hcsr04.z.toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vibration Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="100%"
                    barSize={15}
                    data={[
                      {
                        value: Math.min(sensorData.vibration, 50),
                        fill: sensorData.vibration <= 10 ? '#22c55e' : 
                              sensorData.vibration <= 30 ? '#eab308' : '#dc2626'
                      }
                    ]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 50]}
                      angleAxisId={0}
                      tick={{ fontSize: 12 }}
                      ticks={[0, 10, 30, 50]}
                    />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={15/2}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-current text-2xl font-bold"
                    >
                      {sensorData.vibration !== undefined ? `${sensorData.vibration.toFixed(1)} Hz` : 'N/A'}
                    </text>
                    <text
                      x="50%"
                      y="65%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`fill-current text-sm ${
                        sensorData.vibration <= 10 ? 'text-green-500' :
                        sensorData.vibration <= 30 ? 'text-yellow-500' : 'text-red-500'
                      }`}
                    >
                      {sensorData.vibration <= 10 ? 'Normal' :
                       sensorData.vibration <= 30 ? 'Pre-caution' : 'Danger'}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mb-1"></div>
                  <span>1-10 Hz</span>
                  <span className="text-green-500">Normal</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mb-1"></div>
                  <span>11-30 Hz</span>
                  <span className="text-yellow-500">Pre-caution</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mb-1"></div>
                  <span>31-50 Hz</span>
                  <span className="text-red-500">Danger</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vibration Count</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[100px]">
              <p className="text-4xl font-bold">
                {sensorData.vibrationCount !== undefined ? sensorData.vibrationCount : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

