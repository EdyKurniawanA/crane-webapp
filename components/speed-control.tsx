'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface SpeedControlProps {
  label: string
  value: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  align?: 'left' | 'center' | 'right'
  onChange: (value: number) => void
}

export function SpeedControl({
  label,
  value,
  defaultValue = 100,
  min = 0,
  max = 255,
  step = 1,
  align = 'center',
  onChange
}: SpeedControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function updatePosition() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        setPopoverPosition(spaceBelow < 200 ? 'top' : 'bottom')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('resize', updatePosition)
    updatePosition()

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [])

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setPopoverPosition(spaceBelow < 200 ? 'top' : 'bottom')
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button 
        variant="ghost" 
        className="text-sm" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}: {value}
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: popoverPosition === 'bottom' ? -5 : 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: popoverPosition === 'bottom' ? -5 : 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md origin-top",
              popoverPosition === 'top' ? "bottom-full mb-2" : "top-full mt-2",
              align === 'left' && "-left-40",
              align === 'center' && "left-1/2 -translate-x-1/2",
              align === 'right' && "right-0"
            )}
          >
            <div className="space-y-2">
              <Label>{label} ({min}-{max})</Label>
              <Slider
                defaultValue={[defaultValue]}
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(values) => onChange(values[0])}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 