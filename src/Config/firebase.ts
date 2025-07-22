// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB5B0qapBJyablkDc1DDuX5zix0stPK_54',
  authDomain: 'shodamarine-c6fae.firebaseapp.com',
  projectId: 'shodamarine-c6fae',
  storageBucket: 'shodamarine-c6fae.firebasestorage.app',
  messagingSenderId: '180365432015',
  appId: '1:180365432015:web:158568b4f432416cc693ba',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
