# Riomedica Healthcare — Standalone iOS Testing Workspace

This folder contains a pre-built, self-contained Capacitor iOS native project package. The React web assets are already compiled and bundled directly inside the iOS app folder structure, so you can test it on a Mac with Xcode.

---

## 📁 Folder Structure
```
riomedica-ios-testing/
├── client/
│   └── dist/              # Pre-compiled React web app bundle
├── ios/                   # Native Xcode project structure
│   └── App/
│       ├── App.xcworkspace # Main Xcode workspace (open this file!)
│       ├── Podfile        # CocoaPods dependency specification
│       └── App/public     # Embedded static build copies
├── Setup_Mac.sh           # Automatic environment builder script
├── capacitor.config.json  # Capacitor configuration metadata
└── package.json           # Capacitor CLI dependencies
```

---

## 💻 Prerequisites (Run on macOS Only)
Before starting, ensure your Mac has:
1. **Node.js** (LTS version recommended) installed: https://nodejs.org
2. **Xcode** installed from the Mac App Store.
3. **CocoaPods** installed.

---

## 🚀 How to Run and Test (iOS Simulator / Device)

### Option 1: Automated Script (Recommended)
1. Copy this entire `riomedica-ios-testing` folder to your Mac (via USB drive, AirDrop, or Git).
2. Open the **Terminal** app on your Mac.
3. Navigate to this folder directory:
   ```bash
   cd /path/to/riomedica-ios-testing
   ```
4. Grant execution permissions to the script and run it:
   ```bash
   chmod +x Setup_Mac.sh
   ./Setup_Mac.sh
   ```
5. The script will automatically install npm dependencies, configure your CocoaPods, and open the workspace in Xcode.

---

### Option 2: Manual Run
If you prefer setting up the workspace manually, execute these commands in your Mac terminal:
1. Navigate to this directory and install packages:
   ```bash
   cd riomedica-ios-testing
   npm install
   ```
2. Open the native project folder and run `pod install`:
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```
3. Open the workspace in Xcode:
   ```bash
   open ios/App/App.xcworkspace
   ```

---

## 📱 Testing Inside Xcode
Once the workspace is open in Xcode:
1. **Choose Target Device**: In the top bar of Xcode, select your preferred iPhone or iPad Simulator (e.g., *iPhone 15*), or connect a physical iOS device.
2. **Compile and Run**: Press the **Play (Run)** icon in the top left, or press `Cmd + R` on your keyboard.
3. **Inspect Console Logs**: The bottom debugger area in Xcode will stream any console statements, API responses, or errors from the detailing app.

---

> ℹ️ **Note on API Connections**:
> * By default, the app connects to the B2B mock server built inside.
> * If you want to connect to a live backend running on your Windows server machine, ensure your Mac (or simulator) and the Windows machine are connected to the same Wi-Fi/Local Network.
> * Update the Server IP settings in the app or log in to sync the online database.
