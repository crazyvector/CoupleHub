import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Extrage config din src/firebase.js (hacky, dar e doar un script node)
const firebaseConfig = {
  apiKey: "AIzaSyDAlM9J7jjEgAK0GWzrM1Soe8X-a9z3qmQ",
  authDomain: "couplehub-17d57.firebaseapp.com",
  projectId: "couplehub-17d57",
  storageBucket: "couplehub-17d57.firebasestorage.app",
  messagingSenderId: "61283267985",
  appId: "1:61283267985:web:bf721ebc04edff68a95630",
  measurementId: "G-4PG6KCGR1W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("Se conecteaza la Firebase pentru a schimba parola...");
  try {
    const authRef = doc(db, 'system', 'auth');
    await setDoc(authRef, { her: '2004' }, { merge: true });
    console.log("Parola pentru 'ea' a fost actualizata cu succes la '2004'!");
    process.exit(0);
  } catch (err) {
    console.error("Eroare:", err);
    process.exit(1);
  }
}

main();
