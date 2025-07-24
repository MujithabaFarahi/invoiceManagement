// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig as devConfig } from './firebase.dev';
import { firebaseConfig as prodConfig } from './firebase.prod';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const config =
  import.meta.env.VITE_FIREBASE_ENV === 'prod' ? prodConfig : devConfig;

// Initialize Firebase
const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);
export { app, db, auth };
