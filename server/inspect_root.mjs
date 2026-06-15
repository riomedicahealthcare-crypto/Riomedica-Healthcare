import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

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

async function inspect() {
  console.log("Reading entire database root from Firebase...");
  try {
    const rootRef = ref(db, '/');
    const snap = await get(rootRef);
    if (snap.exists()) {
      const data = snap.val();
      // Mask any values that look like passwords
      const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (key.toLowerCase().includes('pass') || key.toLowerCase().includes('key')) {
          return '***';
        }
        return value;
      }));
      console.log("Database contents:", JSON.stringify(cleanData, null, 2));
    } else {
      console.log("Database is empty.");
    }
  } catch (err) {
    console.error("Firebase read failed:", err);
  }
  process.exit(0);
}

inspect();
