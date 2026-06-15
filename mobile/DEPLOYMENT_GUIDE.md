# Riomedica Healthcare — Mobile App Deployment Guide
## Google Play Store (Android) & Apple App Store (iOS)

---

## 📁 Project Structure

```
mobile app/
├── client/          ← Existing React Web App (DO NOT MODIFY)
├── server/          ← Existing Express Backend (DO NOT MODIFY)
├── mobile/          ← NEW: Native Mobile Wrapper (Capacitor)
│   ├── capacitor.config.ts     ← Main Capacitor config
│   ├── package.json            ← Mobile dependencies
│   ├── Build_Android.bat       ← One-click Android builder (Windows)
│   ├── Build_iOS.sh            ← iOS builder (macOS only)
│   ├── android-permissions.xml ← Android permission declarations
│   ├── ios-info.plist          ← iOS permission declarations
│   ├── store-listing.md        ← App store copy & metadata
│   └── DEPLOYMENT_GUIDE.md     ← This guide
```

---

## ⚙️ Prerequisites

### For Android (Windows/macOS/Linux)
| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17+ | https://adoptium.net |
| Android Studio | Latest | https://developer.android.com/studio |

After installing Android Studio:
1. Open Android Studio → SDK Manager
2. Install **Android SDK Platform 34**
3. Install **Android Build Tools 34.0.0**
4. Set `ANDROID_HOME` environment variable to your SDK path

### For iOS (macOS ONLY)
| Tool | Version | Download |
|------|---------|----------|
| macOS | Ventura 13+ | Required |
| Xcode | 15+ | Mac App Store |
| CocoaPods | Latest | `sudo gem install cocoapods` |
| Apple Developer Account | Paid ($99/year) | https://developer.apple.com |

> ⚠️ **iOS apps CANNOT be built on Windows.** You must use a Mac.

---

## 🤖 ANDROID — Step by Step

### Step 1: Install Tools
1. Download and install **Android Studio** from https://developer.android.com/studio
2. Download and install **Java JDK 17** from https://adoptium.net
3. In Android Studio, go to **SDK Manager** and install Android SDK 33+

### Step 2: Run the Build Script
Navigate to the `mobile/` folder in Windows Explorer and double-click:
```
Build_Android.bat
```

This script will automatically:
- Install npm packages
- Build your React web app
- Add the Android platform
- Sync the web build to Android
- Open Android Studio

### Step 3: Generate Signed APK / AAB in Android Studio
1. Wait for **Gradle sync** to finish (progress bar at bottom)
2. Go to **Build → Generate Signed Bundle / APK**
3. Choose **Android App Bundle (.aab)** for Play Store *(recommended)*
4. Click **Create new** to create a keystore:
   - Keystore path: `mobile/release-key.keystore`
   - Key alias: `riomedica-key`
   - Validity: `25` years
   - Fill in your name and country
5. Select **release** build variant
6. Click **Finish** — the `.aab` file will be generated

> 🔑 **IMPORTANT**: Keep your `release-key.keystore` file safe! If you lose it, you can NEVER update your app on the Play Store.

### Step 4: Upload to Google Play Console
1. Go to https://play.google.com/console
2. Sign in with your Google account (requires one-time $25 developer fee)
3. Click **Create app**
4. Fill in the app details from `store-listing.md`
5. Go to **Production → Releases → Create release**
6. Upload your `.aab` file
7. Complete the content rating, pricing, and store listing sections
8. Submit for **Google Review** (takes 3–7 days)

---

## 🍎 iOS — Step by Step (Requires Mac)

### Step 1: Install Tools on Mac
```bash
# Install Xcode from Mac App Store, then install CocoaPods
sudo gem install cocoapods
```

### Step 2: Copy project to Mac
Copy the entire `mobile app/` project folder to your Mac (via USB, AirDrop, or GitHub clone).

### Step 3: Run the Build Script
```bash
cd "mobile app/mobile"
chmod +x Build_iOS.sh
./Build_iOS.sh
```

### Step 4: Configure Signing in Xcode
1. Xcode will open automatically
2. Click the **App** project in the Navigator (left panel)
3. Click **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Apple Developer Team**
6. Set **Bundle Identifier** to `com.riomedica.healthcare`

### Step 5: Add iOS Permissions to Info.plist
1. In Xcode, expand `App → App → Info.plist`
2. Copy and add the permission keys from `ios-info.plist` in this folder

### Step 6: Archive and Submit
1. Select **Any iOS Device (arm64)** as the target device (top bar)
2. Go to **Product → Archive** (takes 5–10 minutes)
3. The **Organizer** window opens automatically
4. Click **Distribute App → App Store Connect → Upload**
5. Follow the prompts and submit

### Step 7: Submit on App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click **My Apps → + → New App**
3. Fill in the app details from `store-listing.md`
4. Add screenshots (required: iPhone 6.5" and iPad 12.9")
5. Submit for **Apple Review** (takes 1–3 days)

---

## 🔄 Updating the App Later

When you make code changes and want to update the mobile app:

### Android Update
```bash
# From mobile/ directory:
npm run build:android
```
This rebuilds the web app, syncs to Android, and opens Android Studio for a new release.

### iOS Update (on Mac)
```bash
npm run build:ios
```

---

## 🛠️ Troubleshooting

### "vite: command not found"
```bash
cd ../client && npm install && cd ../mobile
```

### "SDK location not found" (Android)
Set the ANDROID_HOME environment variable:
- Windows: System Properties → Environment Variables → New
  - Variable: `ANDROID_HOME`
  - Value: `C:\Users\YourName\AppData\Local\Android\Sdk`

### "No matching provisioning profiles found" (iOS)
- Ensure you have a paid Apple Developer account ($99/year)
- In Xcode, go to Preferences → Accounts → Download Manual Profiles

### App crashes on launch
- Make sure `client/dist/` folder exists (run web build first)
- Check that `capacitor.config.ts` webDir path is correct: `../client/dist`

### White screen on Android
- Enable cleartext in Android by running:
  ```bash
  npx cap sync android
  ```
- Check `allowMixedContent: true` in `capacitor.config.ts`

---

## 📊 App Versioning

Update the version in these files before each release:
1. `mobile/package.json` → `"version": "1.0.1"`
2. `client/package.json` → `"version": "1.0.1"`
3. Android: `android/app/build.gradle` → `versionCode` and `versionName`
4. iOS: Xcode → General tab → Version and Build number

---

## 💰 Store Fees Summary

| Store | One-time Fee | Annual Fee |
|-------|-------------|------------|
| Google Play Store | $25 USD (one-time) | Free |
| Apple App Store | — | $99 USD/year |

---

## 📞 Support

- Project Repo: https://github.com/riomedicahealthcare-crypto/Riomedica-Healthcare
- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio
- App Store Connect: https://appstoreconnect.apple.com
- Play Console: https://play.google.com/console
