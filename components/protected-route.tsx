'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/contexts/firebase-context'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to login')
      router.push('/login')
    } else if (user) {
      console.log('User authenticated:', user.email)
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}