import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, remove } from "firebase/database";

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

async function test() {
  const testRef = ref(db, "active_otps/email/test_diagnose");
  
  console.log("1. Writing active_otps/email/test_diagnose with originalKey=riomedicahealthcare@gmail.com and isSent=false...");
  await set(testRef, {
    otp: "888888",
    expiresAt: Date.now() + 5 * 60 * 1000,
    createdAt: new Date().toISOString(),
    originalKey: "riomedicahealthcare@gmail.com",
    isSent: false
  });

  console.log("2. Waiting 3 seconds for server to process...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("3. Reading node back...");
  const snap = await get(testRef);
  if (snap.exists()) {
    console.log("Current state of OTP node in database:", JSON.stringify(snap.val(), null, 2));
  } else {
    console.log("Node does not exist (perhaps deleted).");
  }

  // Cleanup
  await remove(testRef);
  console.log("4. Cleaned up test node.");
  process.exit(0);
}

test();
