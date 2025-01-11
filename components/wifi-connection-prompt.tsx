'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Wifi } from 'lucide-react'

interface WiFiConnectionPromptProps {
  onConnect: () => void;
}

export function WiFiConnectionPrompt({ onConnect }: WiFiConnectionPromptProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-6 h-6" />
          Wi-Fi Connection Instructions
        </CardTitle>
        <CardDescription className="space-y-2">
          <p>Please connect to a Wi-Fi network, it's better to use the same network as your IoT devices to view sensor data.</p>
          <p className="font-medium mt-4">How to connect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <p>Windows: Click network icon in taskbar</p>
            <p>macOS: Click WiFi icon in menu bar</p>
            <p>iOS: Settings {'->'} WiFi</p>
            <p>Android: Settings {'->'} Network &amp; Internet {'->'} WiFi</p>
          </ul>
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button 
          onClick={onConnect}
          className="w-full"
        >
          Start Monitor
        </Button>
      </CardFooter>
    </Card>
  )
}

