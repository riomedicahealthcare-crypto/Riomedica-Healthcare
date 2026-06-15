# Riomedica Healthcare — Standalone Android Testing Workspace

This folder contains a pre-built, self-contained Android native project package. The Android APK installer files are already compiled and distributed here, and the React web assets are bundled inside the Android app assets folder.

---

## 📁 Folder Structure
```
riomedica-android-testing/
├── android/               # Native Android Studio / Gradle project
│   └── app/src/main/assets/public  # Embedded compiled web app
├── client/
│   └── dist/              # Pre-compiled React web app bundle
├── riomedica-healthcare.apk # READY TO INSTALL App package (rename of app-debug.apk)
├── app-debug.apk          # Debug APK package
├── capacitor.config.json  # Capacitor configuration metadata
└── package.json           # Capacitor CLI dependencies
```

---

## 🚀 How to Install and Test Immediately on Android

You do not need a computer to install the app on your phone:
1. **Transfer the APK:** Copy **`riomedica-healthcare.apk`** to your Android phone (using USB, email, WhatsApp, or Google Drive).
2. **Install:** Tap on the `.apk` file on your phone.
   * *Note:* If prompted by Android security, allow "Installation from Unknown Sources" or "Trust this Source".
3. **Launch:** Run the installed **Riomedica Healthcare** app from your app drawer!

---

## 💻 How to Compile and Run Locally (Developer Mode)

If you want to open the project in Android Studio or compile it from scratch, make sure you have:
1. **Node.js** (LTS version) installed: https://nodejs.org
2. **Java JDK 17+** installed: https://adoptium.net
3. **Android Studio** installed: https://developer.android.com/studio

### Step-by-Step Build Instructions:
1. Open your terminal or Command Prompt, and navigate to this directory:
   ```bash
   cd riomedica-android-testing
   ```
2. Install the Capacitor dependencies:
   ```bash
   npm install
   ```
3. Sync the web assets into the Android native folders:
   ```bash
   npx cap sync android
   ```
4. **Compile the APK via Command Line:**
   ```bash
   cd android
   .\gradlew assembleDebug
   ```
   The freshly built APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
5. **Or Open in Android Studio:**
   ```bash
   npx cap open android
   ```
   * Wait for Gradle build sync to complete.
   * Click the **Run** button to launch it on an emulator or a connected USB debugging phone.
