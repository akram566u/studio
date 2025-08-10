
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "staking-glass-0",
  "appId": "1:966692134036:web:74c4f2a70e73bfe76ea881",
  "storageBucket": "staking-glass-0.firebasestorage.app",
  "apiKey": "AIzaSyCwT5IFEx49sJJ4l5vBsasUTlUUDcgwG_Q",
  "authDomain": "staking-glass-0.firebaseapp.com",
  "messagingSenderId": "966692134036"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

    