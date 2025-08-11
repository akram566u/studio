
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: Replace these placeholder values with the configuration
// from your new Firebase project.
const firebaseConfig = {
  "projectId": "REPLACE_WITH_YOUR_PROJECT_ID",
  "appId": "REPLACE_WITH_YOUR_APP_ID",
  "storageBucket": "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  "apiKey": "REPLACE_WITH_YOUR_API_KEY",
  "authDomain": "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  "messagingSenderId": "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

    
