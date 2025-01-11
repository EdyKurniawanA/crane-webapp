import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD6dypGd4f0ybn7scimVZtBhngNHI1pEfM",
  authDomain: "automaticcrane-62ca3.firebaseapp.com",
  databaseURL: "https://automaticcrane-62ca3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "automaticcrane-62ca3",
  storageBucket: "automaticcrane-62ca3.firebasestorage.app",
  messagingSenderId: "608636991764",
  appId: "1:608636991764:web:588b5e3a722ab651492a01",
  measurementId: "G-0GW5FS0629"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Realtime Database
const database = getDatabase(app);

// Initialize providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export { app, auth, db, analytics, database }; 