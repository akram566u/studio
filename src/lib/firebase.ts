
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLJyWdCtjzJLPiVw9Aj0Uw16yhSxJfhS0",
  authDomain: "staking-hub-3.firebaseapp.com",
  projectId: "staking-hub-3",
  storageBucket: "staking-hub-3.firebasestorage.app",
  messagingSenderId: "1068308590899",
  appId: "1:1068308590899:web:99866ad07a5a8e10f88e46",
  measurementId: "G-PLZJDQ6SCZ"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

    
