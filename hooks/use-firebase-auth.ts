import { useState } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  UserCredential 
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';

export function useFirebaseAuth() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<UserCredential | null> => {
    try {
      setLoading(true);
      setError(null);
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<UserCredential | null> => {
    try {
      setLoading(true);
      setError(null);
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential | null> => {
    try {
      setLoading(true);
      setError(null);
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async (): Promise<UserCredential | null> => {
    try {
      setLoading(true);
      setError(null);
      return await signInWithPopup(auth, githubProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
  };
} 