import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, addDoc, collection } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config
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
const auth = getAuth(app);

const getBase64Image = (imagePath) => {
  const file = fs.readFileSync(imagePath);
  return `data:image/png;base64,${file.toString('base64')}`;
};

async function main() {
  console.log("Starting DB population...");

  // Generate a random couple ID to ensure freshness
  const coupleId = `insta_promo_${Date.now()}`;
  
  // Create User 1: Ana
  console.log("Creating Ana...");
  const anaCred = await createUserWithEmailAndPassword(auth, "ana.test3@couplehub.io", "password123");
  const anaUid = anaCred.user.uid;

  // Create User 2: Andrei
  console.log("Creating Andrei...");
  const andreiCred = await createUserWithEmailAndPassword(auth, "andrei.test3@couplehub.io", "password123");
  const andreiUid = andreiCred.user.uid;

  // Setup user docs
  console.log("Setting up user documents...");
  await setDoc(doc(db, 'users', anaUid), {
    name: "Ana",
    gender: "F",
    coupleId: coupleId,
    role: "her",
    status: "paired",
    createdAt: Date.now()
  });

  await setDoc(doc(db, 'users', andreiUid), {
    name: "Andrei",
    gender: "M",
    coupleId: coupleId,
    role: "his",
    status: "paired",
    createdAt: Date.now()
  });

  // Setup couple profiles
  console.log("Setting up couple profiles...");
  await setDoc(doc(db, 'couples', coupleId, 'profiles', 'her'), {
    name: "Ana",
    gender: "F",
    anniversaryDate: "2023-10-14",
    isConfigured: true,
    avatarUrl: null
  });

  await setDoc(doc(db, 'couples', coupleId, 'profiles', 'his'), {
    name: "Andrei",
    gender: "M",
    anniversaryDate: "2023-10-14",
    isConfigured: true,
    avatarUrl: null
  });

  // Setup system config
  await setDoc(doc(db, 'couples', coupleId, 'system', 'chatTheme'), {
    backgroundColor: '#ffffff',
    backgroundImage: null,
    isGradient: false
  });

  await setDoc(doc(db, 'couples', coupleId, 'system', 'compliments'), {
    his: "You're my favorite reason to smile! ❤️",
    her: "You are everything I ever wanted! I love you! 🥰"
  });

  // Add Messages
  console.log("Adding messages...");
  const messages = [
    { text: "Good morning, my love! ❤️", sender: "her", timestamp: Date.now() - 3600000 * 4 },
    { text: "Morning beautiful! How did you sleep?", sender: "his", timestamp: Date.now() - 3600000 * 3.9 },
    { text: "Great! Can't wait to see you today!!", sender: "her", timestamp: Date.now() - 3600000 * 3.8, reaction: "❤️" },
    { text: "Me too! Are we going to our favorite coffee shop?", sender: "his", timestamp: Date.now() - 3600000 * 3.7 },
    { text: "Yessss! ☕️🧁", sender: "her", timestamp: Date.now() - 3600000 * 3.6 }
  ];

  for (const msg of messages) {
    await addDoc(collection(db, 'couples', coupleId, 'messages'), msg);
  }

  // Add Events
  console.log("Adding events...");
  const events = [
    { title: "Date Night at the restaurant", date: new Date(Date.now() + 86400000 * 2).toISOString(), type: "date" },
    { title: "Mountain getaway", date: new Date(Date.now() + 86400000 * 5).toISOString(), type: "travel" },
    { title: "Our movie at the cinema", date: new Date(Date.now() + 86400000 * 10).toISOString(), type: "activity" }
  ];

  for (const ev of events) {
    await addDoc(collection(db, 'couples', coupleId, 'events'), ev);
  }

  // Add Memories with Base64 Images
  console.log("Adding memories...");
  // Image paths from generator:
  const img1Path = path.join(__dirname, "couple_memory_1_small.jpg");
  const img2Path = path.join(__dirname, "couple_memory_2_small.jpg");
  
  const getBase64ImageJpeg = (imagePath) => {
    const file = fs.readFileSync(imagePath);
    return `data:image/jpeg;base64,${file.toString('base64')}`;
  };

  const memories = [
    {
      title: "Our first coffee together",
      description: "We laughed so much at that small coffee shop. An unforgettable moment!",
      date: "2023-10-14",
      image: fs.existsSync(img1Path) ? getBase64ImageJpeg(img1Path) : null,
      reactions: ["❤️", "😍"]
    },
    {
      title: "That mountain sunset",
      description: "Words can't describe how beautiful it was. You are my everything.",
      date: "2024-05-20",
      image: fs.existsSync(img2Path) ? getBase64ImageJpeg(img2Path) : null,
      reactions: ["🥺", "✨"]
    }
  ];

  for (const mem of memories) {
    await addDoc(collection(db, 'couples', coupleId, 'memories'), mem);
  }

  // Add Moods
  console.log("Adding moods...");
  await addDoc(collection(db, 'couples', coupleId, 'moods_her'), {
    emoji: "🥰", label: "Loved", intensity: 100, note: "Can't wait to see my love!", timestamp: new Date().toISOString()
  });

  await addDoc(collection(db, 'couples', coupleId, 'moods_his'), {
    emoji: "🚀", label: "Excited", intensity: 100, note: "Ready for another amazing week with you!", timestamp: new Date().toISOString()
  });

  console.log("==================================================");
  console.log("✅ Done! Data has been successfully populated.");
  console.log("--------------------------------------------------");
  console.log("Here are the credentials for the test accounts:");
  console.log("User 1 (Her): ana.test3@couplehub.io / password123");
  console.log("User 2 (His): andrei.test3@couplehub.io / password123");
  console.log("==================================================");

  process.exit(0);
}

main().catch(console.error);
