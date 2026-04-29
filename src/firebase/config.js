import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDnf3ncNg05O_Fx5_mu0gu5SnPUClKR-DM",
  authDomain: "pana-voy.firebaseapp.com",
  databaseURL: "https://pana-voy-default-rtdb.firebaseio.com",
  projectId: "pana-voy",
  storageBucket: "pana-voy.firebasestorage.app",
  messagingSenderId: "970752375894",
  appId: "1:970752375894:web:98e4e98824d59536de4ff7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);