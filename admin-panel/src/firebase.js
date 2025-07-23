// Firebase config for admin panel
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your own Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyCrx5lm2arW0jCm6i_haDEt1bs3yQXJEsE',
  authDomain: 'hoaapp-mobile.firebaseapp.com',
  projectId: 'hoaapp-mobile',
  storageBucket: 'hoaapp-mobile.appspot.com',
  messagingSenderId: '914497576832',
  appId: '1:914497576832:web:6f177d9641e83c02dfab65',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 