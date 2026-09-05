import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDxreIvibzHY-udAkGZaZ4spq8puc1_7FY",
  authDomain: "powerking-new.firebaseapp.com",
  databaseURL: "https://powerking-new-default-rtdb.firebaseio.com",
  projectId: "powerking-new",
  storageBucket: "powerking-new.firebasestorage.app",
  messagingSenderId: "667524424624",
  appId: "1:667524424624:web:3c38a0e12c9340f86fac75",
  measurementId: "G-8BDB2DL0YH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence for better performance
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn(
        'Multiple tabs open, persistence can only be enabled in one tab at a time.'
      );
    } else if (err.code === 'unimplemented') {
      console.warn("Browser doesn't support persistence");
    }
  });
}

export default app;
