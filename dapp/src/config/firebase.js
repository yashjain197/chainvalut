// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWM7ole49klzJdSwupoR1yDgWkgMpiAZA",
  authDomain: "chainvault-997c7.firebaseapp.com",
  databaseURL: "https://chainvault-997c7-default-rtdb.firebaseio.com",
  projectId: "chainvault-997c7",
  storageBucket: "chainvault-997c7.firebasestorage.app",
  messagingSenderId: "490876607479",
  appId: "1:490876607479:web:56b84f60f2b67bb47a14e7",
  measurementId: "G-XPYY3FDRRY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, database, storage, analytics };
