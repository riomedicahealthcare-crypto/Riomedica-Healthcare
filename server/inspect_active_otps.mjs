import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

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
  console.log("Reading /active_otps from Firebase Realtime Database...");
  try {
    const activeOtpsRef = ref(db, 'active_otps');
    const snap = await get(activeOtpsRef);
    if (snap.exists()) {
      console.log("Active OTPs in database:", JSON.stringify(snap.val(), null, 2));
    } else {
      console.log("No active OTPs found in database.");
    }
  } catch (err) {
    console.error("Firebase read failed:", err);
  }
  process.exit(0);
}

inspect();
