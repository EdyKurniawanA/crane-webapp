'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { WiFiConnectionPrompt } from "@/components/wifi-connection-prompt"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from '@/components/protected-route'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore'
import { useFirebase } from '@/contexts/firebase-context'
import { ref, onValue } from 'firebase/database'
import { database } from '@/lib/firebase'
import { fetchData } from '@/lib/fetchData'

interface SensorData {
  loadCell: number
  humidity: number
  temperature: { celsius: number; fahrenheit: number }
  hcsr04: { x: number; y: number; z: number }
  vibration: number
  vibrationCount: number
}

export default function MonitorPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [sensorData, setSensorData] = useState<SensorData>({
    loadCell: 0,
    humidity: 0.0,
    temperature: { celsius: 0, fahrenheit: 32 },
    hcsr04: { x: 0, y: 0, z: 0 },
    vibration: 0,
    vibrationCount: 0
  })

  useEffect(() => {
    if (isConnected) {
      const unsubscribe = fetchData('sensor', (data: any) => {
        if (data) {
          console.log('Received data:', data);
          setSensorData({
            loadCell: data.weight,
            temperature: { celsius: data.temp, fahrenheit: (data.temp * 9/5) + 32 },
            hcsr04: {
              x: data.jarakX,
              y: data.jarakY,
              z: data.jarakZ
            },
            vibration: data.vibrationFrequency,
            humidity: data.humi,
            vibrationCount: data.vibrationCount || 0
          });
          console.log('Received temperature data:', data.temp);
          console.log('Mapped temperature data:', {
            celsius: data.temp.celsius,
            fahrenheit: data.temp.fahrenheit
          });
        }
      });

      return () => unsubscribe();
    }
  }, [isConnected]);

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
            <CardContent>
              <p className="text-2xl font-bold">
                {sensorData.loadCell !== undefined ? sensorData.loadCell.toFixed(2) : 'N/A'} g
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Humidity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {sensorData.humidity !== undefined ? sensorData.humidity.toFixed(2) : 'N/A'}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {sensorData.temperature.celsius !== undefined ? sensorData.temperature.celsius.toFixed(2) : 'N/A'}°C / {sensorData.temperature.fahrenheit !== undefined ? sensorData.temperature.fahrenheit.toFixed(2) : 'N/A'}°F
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>HC-SR04</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl">
                X: {sensorData.hcsr04.x !== undefined ? sensorData.hcsr04.x.toFixed(2) : 'N/A'}
              </p>
              <p className="text-xl">
                Y: {sensorData.hcsr04.y !== undefined ? sensorData.hcsr04.y.toFixed(2) : 'N/A'}
              </p>
              <p className="text-xl">
                Z: {sensorData.hcsr04.z !== undefined ? sensorData.hcsr04.z.toFixed(2) : 'N/A'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vibration Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {sensorData.vibration !== undefined ? sensorData.vibration.toFixed(2) : 'N/A'} Hz
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vibration Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {sensorData.vibrationCount !== undefined ? sensorData.vibrationCount : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

