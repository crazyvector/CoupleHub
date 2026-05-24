import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

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

const foodItems = [
  { label: 'Pizza 🍕', color: '#FFB5C8' },
  { label: 'Sushi 🍣', color: '#B5EAD7' },
  { label: 'Burger 🍔', color: '#C8B6FF' },
  { label: 'Paste 🍝', color: '#FFCBA4' },
  { label: 'Gătim noi 👨‍🍳', color: '#B5D8EB' },
  { label: 'Shaorma 🌯', color: '#E1BEE7' }
];

const dateItems = [
  { label: 'Film la cinema 🎬', color: '#FFB5C8' },
  { label: 'Plimbare parc 🌳', color: '#B5EAD7' },
  { label: 'Gătim împreună 👨‍🍳', color: '#C8B6FF' },
  { label: 'Board Games 🎲', color: '#FFCBA4' },
  { label: 'Picnic romantic 🧺', color: '#B5D8EB' },
  { label: 'Cafenea ☕', color: '#E1BEE7' }
];

async function seed() {
  const foodCol = collection(db, 'wheel_food');
  const dateCol = collection(db, 'wheel_date');
  
  // 1. Ștergem tot ce e vechi
  const snapshotFood = await getDocs(foodCol);
  for (const document of snapshotFood.docs) {
    await deleteDoc(document.ref);
  }
  const snapshotDate = await getDocs(dateCol);
  for (const document of snapshotDate.docs) {
    await deleteDoc(document.ref);
  }

  // 2. Adăugăm
  for (const item of foodItems) {
    await addDoc(foodCol, item);
  }
  for (const item of dateItems) {
    await addDoc(dateCol, item);
  }
  
  console.log("Ruletele au fost initializate cu succes!");
  process.exit(0);
}

seed().catch(console.error);
