import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app);

const usersToCreate = [
  { email: 'ana@couple.hub', password: 'ana2004', role: 'her' },
  { email: 'andrei@couple.hub', password: 'andrei1990', role: 'his' },
  { email: 'admin@couple.hub', password: 'admin999999', role: 'admin' }
];

async function run() {
  for (const u of usersToCreate) {
    let uid;
    try {
      console.log(`Încercăm să creăm contul ${u.email}...`);
      const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
      uid = userCredential.user.uid;
      console.log(`✓ Cont creat cu succes: ${uid}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`Contul ${u.email} există deja. Încercăm să ne logăm...`);
        try {
          const userCredential = await signInWithEmailAndPassword(auth, u.email, u.password);
          uid = userCredential.user.uid;
          console.log(`✓ Logat cu succes pe contul existent: ${uid}`);
        } catch (loginErr) {
          console.error(`Eroare la logare pentru ${u.email}:`, loginErr);
          continue;
        }
      } else {
        console.error(`Eroare la creare cont ${u.email}:`, err);
        continue;
      }
    }

    if (uid) {
      // Setăm rolul în baza de date
      try {
        await setDoc(doc(db, 'userRoles', uid), { role: u.role });
        console.log(`✓ Rolul '${u.role}' a fost setat pentru UID-ul ${uid}`);
      } catch (dbErr) {
        console.error(`Eroare la setarea rolului pentru ${u.email}:`, dbErr);
      }
    }
  }

  console.log("Procesul de creare utilizatori a fost finalizat.");
  process.exit(0);
}

run().catch(console.error);
