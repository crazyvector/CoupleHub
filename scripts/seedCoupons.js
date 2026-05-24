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

const coupons = [
  {
    id: 'massage',
    emoji: '💆♀️',
    title: 'Masaj',
    description: 'Un masaj relaxant de 30 minute, oricând vrei',
    color: '#FFB5C8',
  },
  {
    id: 'cooking',
    emoji: '👨🍳',
    title: 'Gătesc eu',
    description: 'Aleg eu rețeta și gătesc tot — tu te odihnești',
    color: '#B5EAD7',
  },
  {
    id: 'movie',
    emoji: '🎬',
    title: 'Seară de Film',
    description: 'Tu alegi filmul, eu aduc snacks-urile',
    color: '#C8B6FF',
  },
  {
    id: 'breakfast',
    emoji: '🥐',
    title: 'Mic dejun la pat',
    description: 'Mic dejun surprise servit în pat',
    color: '#FFCBA4',
  },
  {
    id: 'date',
    emoji: '🌹',
    title: 'Date Night',
    description: 'O seară romantică planificată 100% de mine',
    color: '#FFD7BA',
  },
  {
    id: 'walk',
    emoji: '🚶♂️',
    title: 'Plimbare surpriză',
    description: 'O plimbare secretă spre un loc frumos',
    color: '#B5D8EB',
  },
  // Extra romantice:
  {
    id: 'bath',
    emoji: '🛁',
    title: 'Baie Relaxantă',
    description: 'Îți pregătesc o baie cu spumă și muzică ambientală',
    color: '#C8E6C9',
  },
  {
    id: 'cleaning',
    emoji: '🧹',
    title: 'Zi fără treburi',
    description: 'Mă ocup eu de toate treburile casei astăzi',
    color: '#FFE082',
  },
  {
    id: 'listening',
    emoji: '👂',
    title: 'Sesiune de Venting',
    description: 'O oră în care te ascult fără întreruperi',
    color: '#E1BEE7',
  },
  {
    id: 'hug',
    emoji: '🤗',
    title: 'Îmbrățișare infinită',
    description: 'O îmbrățișare strânsă de 5 minute când ai nevoie',
    color: '#FFAB91',
  }
];

async function seed() {
  const couponsCol = collection(db, 'couponsList');
  
  // 1. Ștergem tot ce e vechi
  const snapshot = await getDocs(couponsCol);
  for (const document of snapshot.docs) {
    await deleteDoc(document.ref);
  }
  console.log("Cupoane vechi șterse.");

  // 2. Adăugăm cupoanele noi
  for (const c of coupons) {
    await addDoc(couponsCol, c);
  }
  console.log("10 Cupoane noi au fost adăugate cu succes!");
  process.exit(0);
}

seed().catch(console.error);
