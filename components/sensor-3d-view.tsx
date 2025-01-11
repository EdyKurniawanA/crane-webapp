'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Text, OrbitControls } from '@react-three/drei'
import { useTheme } from 'next-themes'
import * as THREE from 'three'

interface Sensor3DViewProps {
  x: number
  y: number
  z: number
}

function GridIntersections({ x, y, z, color }: { x: number; y: number; z: number; color: string }) {
  return (
    <>
      {/* Intersection point */}
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Lines to show intersection */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([x, 0, 0, x, y, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff0000" opacity={0.5} transparent />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([x, y, 0, x, y, z])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff0000" opacity={0.5} transparent />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, y, z, x, y, z])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff0000" opacity={0.5} transparent />
      </line>
    </>
  )
}

function AxisPoints({ count, axis, color }: { count: number, axis: 'x' | 'y' | 'z', color: string }) {
  const TextComponent = Text as any;
  return Array.from({ length: count + 1 }, (_, i) => {
    const position = {
      x: axis === 'x' ? i : 0,
      y: axis === 'y' ? i : 0,
      z: axis === 'z' ? i : 0
    }
    
    return (
      <group key={i}>
        <TextComponent
          position={[
            position.x + (axis === 'x' ? 0 : 0.3),
            position.y + (axis === 'y' ? 0 : 0.3),
            position.z + (axis === 'z' ? 0 : 0.3)
          ]}
          fontSize={0.5}
          color={color}
        >
          {(i * 10).toString()}
        </TextComponent>
      </group>
    )
  })
}

export function Sensor3DView({ x, y, z }: Sensor3DViewProps): React.JSX.Element {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const CanvasComponent = Canvas as any
  const TextComponent = Text as any
  const OrbitControlsComponent = OrbitControls as any

  // Avoid hydration mismatch
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-full h-[300px]" />

  // Scale down the input values to match our grid
  const scaledX = x / 10
  const scaledY = y / 10
  const scaledZ = z / 10

  const gridColor = theme === 'dark' ? '#ffffff' : '#000000'
  const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'

  return (
    <div className="w-full h-[300px]" style={{ background: backgroundColor }}>
      <CanvasComponent 
        camera={{ 
          position: [15, 15, 15],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        
        {/* Grid lines */}
        {Array.from({ length: 11 }, (_, i) => (
          <group key={i}>
            {/* XZ plane lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([i, 0, 0, i, 0, 10])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={gridColor} />
            </line>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([0, 0, i, 10, 0, i])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={gridColor} />
            </line>

            {/* YZ plane lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([0, i, 0, 0, i, 10])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={gridColor} />
            </line>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([0, 0, i, 0, 10, i])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={gridColor} />
            </line>

            {/* XY plane lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([i, 0, 0, i, 10, 0])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={gridColor} />
            </line>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([0, i, 0, 10, i, 0])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={gridColor} />
            </line>
          </group>
        ))}

        {/* Grid intersections */}
        <GridIntersections x={scaledX} y={scaledY} z={scaledZ} color={gridColor} />

        {/* Axis points with numbers */}
        <AxisPoints count={10} axis="x" color={gridColor} />
        <AxisPoints count={10} axis="y" color={gridColor} />
        <AxisPoints count={10} axis="z" color={gridColor} />

        {/* Axis labels */}
        <TextComponent position={[11, 0, 0]} fontSize={1} color={gridColor} children="X" />
        <TextComponent position={[0, 11, 0]} fontSize={1} color={gridColor} children="Y" />
        <TextComponent position={[0, 0, 11]} fontSize={1} color={gridColor} children="Z" />

        {/* Controls */}
        <OrbitControlsComponent 
          enableZoom={true} 
          enablePan={true}
          minDistance={10}
          maxDistance={50}
        />
      </CanvasComponent>
    </div>
  )
} 