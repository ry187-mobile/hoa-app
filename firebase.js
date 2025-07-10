// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCrx5lm2arW0jCm6i_haDEt1bs3yQXJEsE",
  authDomain: "hoaapp-mobile.firebaseapp.com",
  projectId: "hoaapp-mobile",
  storageBucket: "hoaapp-mobile.appspot.com",
  messagingSenderId: "914497576832",
  appId: "1:914497576832:web:6f177d9641e83c02dfab65",
  measurementId: "G-F00S497VS2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
