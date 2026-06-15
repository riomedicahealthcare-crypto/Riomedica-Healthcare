
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
  console.log("1. Testing write to Firebase RTDB at path active_otps/email/test_diagnose...");
  try {
    const testRef = ref(db, "active_otps/email/test_diagnose");
    await set(testRef, {
      otp: "999999",
      expiresAt: Date.now() + 5 * 60 * 1000,
      createdAt: new Date().toISOString(),
      originalKey: "riomedicahealthcare@gmail.com",
      isSent: false
    });
    console.log("? SUCCESS: Write to database succeeded! Your Firebase security rules are correctly set up and open.");
    
    console.log("\n2. Reading back the test OTP node...");
    const snap = await get(testRef);
    if (snap.exists()) {
      console.log("? SUCCESS: Read from database succeeded! Data:", snap.val());
    } else {
      console.log("? ERROR: Read succeeded but no data was found.");
    }
    
    console.log("\n3. Cleaning up test node...");
    await remove(testRef);
    console.log("? SUCCESS: Test node deleted.");
    
  } catch (err) {
    console.error("? ERROR: Firebase Realtime Database operation failed!");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    if (err.message.includes("Permission denied")) {
      console.log("\n?? ACTION REQUIRED: Go to your Firebase Console -> Realtime Database -> Rules tab, and set both \".read\" and \".write\" to true.");
    }
  }
  process.exit(0);
}

test();

