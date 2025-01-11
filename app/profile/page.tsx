'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFirebase } from "@/contexts/firebase-context"
import { ProtectedRoute } from '@/components/protected-route'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { updateProfile } from 'firebase/auth'
import { useFirebaseAuth } from "@/hooks/use-firebase-auth"
import { useRouter } from 'next/navigation'

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber: string;
}

export default function ProfilePage() {
  const { user } = useFirebase()
  const { signOut } = useFirebaseAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile
          setProfile(prev => ({
            ...prev,
            ...userData,
            email: user.email || '', // Email from auth
            displayName: userData.displayName || user.displayName || '',
            phoneNumber: userData.phoneNumber || user.phoneNumber || '',
          }))
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchUserProfile()
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Batch updates to run in parallel
      const updates = []

      // Only update Firestore if there are changes
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const currentData = userDoc.data() as UserProfile
      if (JSON.stringify(currentData) !== JSON.stringify(profile)) {
        updates.push(
          setDoc(doc(db, 'users', user.uid), {
            ...profile,
          }, { merge: true })
        )
      }

      // Only update Auth profile if display name changed
      if (user.displayName !== profile.displayName) {
        updates.push(
          updateProfile(user, {
            displayName: profile.displayName
          })
        )
      }

      // Run all updates in parallel
      if (updates.length > 0) {
        await Promise.all(updates)
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            View and manage your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            {isEditing ? (
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter your name"
              />
            ) : (
              <p className="text-sm py-2">{profile.displayName || 'Not set'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <p className="text-sm py-2">{profile.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phoneNumber"
                value={profile.phoneNumber}
                onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Enter your phone number"
              />
            ) : (
              <p className="text-sm py-2">{profile.phoneNumber || 'Not set'}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-end gap-4 w-full">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>

          <div className="w-full border-t pt-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </CardFooter>
      </Card>
    </ProtectedRoute>
  )
}

