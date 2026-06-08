import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

async function generatePromo() {
  try {
    const code = Math.random().toString(36).substring(2, 12).toUpperCase();
    await setDoc(doc(db, 'promo_codes', code), {
      active: true,
      usedBy: null,
      createdAt: new Date().toISOString()
    });
    console.log("SUCCESS_CODE=" + code);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

generatePromo();
