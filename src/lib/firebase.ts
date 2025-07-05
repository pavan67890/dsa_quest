import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Only initialize Firebase if the API key is provided to prevent crashes.
if (firebaseConfig.apiKey) {
    if (typeof window !== 'undefined') {
        console.log('Firebase Init: Using authDomain:', firebaseConfig.authDomain);
    }
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        googleProvider.addScope("https://www.googleapis.com/auth/drive.appdata");
    } catch (e) {
        // If initialization fails, ensure auth remains null.
        console.error("Firebase initialization error:", e);
        auth = null;
        googleProvider = null;
    }
} else {
    if (typeof window !== 'undefined') {
        console.warn('Firebase configuration (API Key) not found. Cloud Sync will be disabled.');
    }
}

export { auth, googleProvider };
