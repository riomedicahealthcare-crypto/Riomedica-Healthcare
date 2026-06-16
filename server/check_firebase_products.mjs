import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBhbOn155u8Pxi9BGaPxP9DMai0TOX7eo4",
  authDomain: "riomedica-healthcare.firebaseapp.com",
  databaseURL: "https://riomedica-healthcare-default-rtdb.firebaseio.com",
  projectId: "riomedica-healthcare",
  storageBucket: "riomedica-healthcare.firebasestorage.app",
  messagingSenderId: "502281093407",
  appId: "1:502281093407:android:c67abd87f164de1dfc702a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function run() {
  try {
    const snap = await get(ref(db, '/'));
    if (!snap.exists()) {
      console.log("Database does not exist on Firebase RTDB");
      process.exit(0);
    }
    const val = snap.val();
    console.log("Firebase DB products length:", val.products ? val.products.length : "undefined");
    if (val.products) {
      const withPackshot = val.products.filter(p => p.packshot);
      console.log("Firebase DB products with packshot:", withPackshot.length);
      if (withPackshot.length > 0) {
        console.log("Sample firebase packshot values:");
        console.log(withPackshot.slice(0, 3).map(p => ({ id: p.id, name: p.name, packshot: p.packshot.substring(0, 100) })));
      }
    }
  } catch (err) {
    console.error("Error connecting to Firebase:", err.message);
  }
  process.exit(0);
}

run();
