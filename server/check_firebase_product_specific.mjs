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
    const snap = await get(ref(db, 'products'));
    if (snap.exists()) {
      const products = snap.val();
      // products might be an array or object
      const prodArray = Array.isArray(products) ? products : Object.values(products);
      const prod = prodArray.find(p => p.id === 'prod_mq97ntpl_gnpln_0');
      console.log('Firebase Product ALCARIO-PRO packshot value:', JSON.stringify(prod ? prod.packshot : null));
    } else {
      console.log('Products path not found on Firebase');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

run();
