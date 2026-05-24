import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAlM9J7jjEgAK0GWzrM1Soe8X-a9z3qmQ",
  authDomain: "couplehub-17d57.firebaseapp.com",
  projectId: "couplehub-17d57",
  storageBucket: "couplehub-17d57.firebasestorage.app",
  messagingSenderId: "61283267985",
  appId: "1:61283267985:web:bf721ebc04edff68a95630",
  measurementId: "G-4PG6KCGR1W"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
