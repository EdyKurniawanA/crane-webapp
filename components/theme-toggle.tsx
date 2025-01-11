"use client"

import * as React from "react"
import { Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Avoid hydration mismatch
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const toggleTheme = () => {
    // Get button position for the animation origin
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Create and configure the transition element
    const transition = document.createElement('div')
    transition.style.position = 'fixed'
    transition.style.left = `${x}px`
    transition.style.top = `${y}px`
    transition.style.width = '0'
    transition.style.height = '0'
    transition.style.borderRadius = '50%'
    transition.style.backgroundColor = theme === 'light' ? 'black' : 'white'
    transition.style.transform = 'translate(-50%, -50%)'
    transition.style.transition = 'all 700ms ease-in-out'
    transition.style.zIndex = '999'
    transition.style.pointerEvents = 'none'

    document.body.appendChild(transition)

    // Trigger the animation
    requestAnimationFrame(() => {
      const maxDim = Math.max(
        window.innerWidth,
        window.innerHeight
      )
      transition.style.width = `${maxDim * 3}px`
      transition.style.height = `${maxDim * 3}px`
    })

    // Change theme near the end of the animation
    setTimeout(() => {
      setTheme(theme === "light" ? "dark" : "light")
      // Clean up the transition element
      setTimeout(() => {
        document.body.removeChild(transition)
      }, 100)  // Short cleanup delay after theme change
    }, 600)  // Change theme 100ms before animation ends (700ms - 100ms)
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

