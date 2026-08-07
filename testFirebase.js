import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import { firebaseConfig } from "./src/firebase.js"; // wait, the config is there

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Fetching memories...");
    const snap = await getDocs(query(collection(db, "memories"), limit(1)));
    if (!snap.empty) {
      console.log("Success! Found a memory:", snap.docs[0].id);
    } else {
      console.log("Success! Collection is empty.");
    }
  } catch (err) {
    console.error("Failed:", err.message);
  }
}
test();
