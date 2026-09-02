import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyANFhP14_BJOaImr50PiFoychlbR88JeXU",
  authDomain: "powerking-betting-tips.firebaseapp.com",
  databaseURL: "https://powerking-betting-tips-default-rtdb.firebaseio.com",
  projectId: "powerking-betting-tips",
  storageBucket: "powerking-betting-tips.appspot.com",
  messagingSenderId: "617291483997",
  appId: "1:617291483997:web:e3114cc5c5fa03d9d7b6b4",
  measurementId: "G-57VGM61EY8"
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
