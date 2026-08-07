import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAlM9J7jjEgAK0GWzrM1Soe8X-a9z3qmQ",
  authDomain: "couplehub-17d57.firebaseapp.com",
  projectId: "couplehub-17d57",
  storageBucket: "couplehub-17d57.firebasestorage.app",
  messagingSenderId: "61283267985",
  appId: "1:61283267985:web:bf721ebc04edff68a95630"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TARGET_COUPLE = 'default_couple_hub';

async function migrateCollection(collectionName) {
  try {
    const snap = await getDocs(collection(db, collectionName));
    console.log(`Found ${snap.size} docs in ${collectionName}`);
    let migrated = 0;
    for (const d of snap.docs) {
      await setDoc(doc(db, 'couples', TARGET_COUPLE, collectionName, d.id), d.data());
      migrated++;
    }
    console.log(`Migrated ${migrated} docs for ${collectionName}`);
  } catch (err) {
    console.error(`Failed for ${collectionName}:`, err.message);
  }
}

async function run() {
  const collections = [
    'memories', 'moods_her', 'moods_his', 'diary_her', 'diary_his',
    'events', 'messages', 'system', 'notifications', 'custom_coupons', 'profiles'
  ];
  for (const col of collections) {
    await migrateCollection(col);
  }
  console.log("Done!");
  process.exit(0);
}

run();
