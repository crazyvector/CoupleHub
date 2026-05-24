import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function testRead() {
  try {
    const authRef = doc(db, 'system', 'auth');
    const snap = await getDoc(authRef);
    if (snap.exists()) {
      console.log("SUCCES: Am putut citi documentul:", snap.data());
    } else {
      console.log("SUCCES: Am putut citi, dar documentul nu există.");
    }
    process.exit(0);
  } catch (err) {
    console.error("EROARE LA CITIRE:", err);
    process.exit(1);
  }
}

testRead();
