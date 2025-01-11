'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useFirebase } from '@/contexts/firebase-context'
import { useFirebaseAuth } from '@/hooks/use-firebase-auth'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useFirebase()
  const { signOut } = useFirebaseAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/80 backdrop-blur-sm">
      <div className="container h-full mx-auto px-4">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/pnup-logo.png"
                alt="PNUP Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <Image
                src="/betro_ig.jpg"
                alt="Betro Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <Link href="/" className="text-2xl font-bold tracking-tighter">
              Overhead Crane
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/monitor" className="hover:text-primary transition-colors">Monitor</Link>
            <Link href="/profile" className="hover:text-primary transition-colors">Profile</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm">{user.email}</span>
                  <Button variant="outline" onClick={signOut}>
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 border-b bg-background/95 backdrop-blur-sm py-4">
            <div className="container px-4 flex flex-col space-y-4">
              <Link 
                href="/" 
                className="hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/monitor" 
                className="hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Monitor
              </Link>
              <Link 
                href="/profile" 
                className="hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <Link 
                href="/contact" 
                className="hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/about" 
                className="hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <span className="text-sm">{user.email}</span>
                    <Button variant="outline" onClick={signOut}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button>Login</Button>
                  </Link>
                )}
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

