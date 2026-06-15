# How to Install the App on your iPhone (iOS Testing)

To install and run **Riomedica Healthcare** on a physical iPhone, you need to use a Mac with Xcode. Apple requires iOS apps to be signed with a digital profile before they can launch on a physical device.

You can do this **completely for free** using a standard, personal Apple ID (no paid $99/year Apple Developer Account required!).

---

## 🛠️ Step 1: Prep your iPhone (Enable Developer Mode)
iOS 16+ requires you to enable Developer Mode on your iPhone to launch local apps:
1. On your iPhone, go to **Settings > Privacy & Security**.
2. Scroll to the bottom and tap **Developer Mode**.
3. Toggle the switch to **ON**.
4. Confirm the prompt and **restart** your iPhone.
5. Once your iPhone restarts, unlock it, and tap **Turn On** when prompted to confirm Developer Mode.

---

## 💻 Step 2: Open the Project on Mac
1. Copy the standalone `riomedica-ios-testing` folder to your Mac (via AirDrop, USB, Git, etc.).
2. Open the **Terminal** app on your Mac, navigate to the folder, and run:
   ```bash
   chmod +x Setup_Mac.sh
   ./Setup_Mac.sh
   ```
3. Wait for Xcode to open (it will load the native `App.xcworkspace`).

---

## 🔑 Step 3: Configure Free Signing in Xcode
1. **Connect your iPhone** to the Mac using a lightning or USB-C cable. Select **Trust this Computer** on the iPhone screen if prompted.
2. In Xcode's left sidebar, click the top-level **App** project file.
3. In the center editor panel, select the **Signing & Capabilities** tab.
4. Check the box **Automatically manage signing**.
5. In the **Team** dropdown:
   * Select **Add an Account...** and sign in using your standard Apple ID (the same one you use on your iPhone).
   * Once signed in, select your Apple ID in the Team list (it will appear as `Your Name (Personal Team)`).
6. Change the **Bundle Identifier** to something unique (Apple requires free accounts to use a custom suffix, e.g. `com.riomedica.healthcare.test`).

---

## 🚀 Step 4: Install and Run on your iPhone
1. In Xcode's top toolbar, locate the device selector dropdown (which defaults to simulator models like *iPhone 15*).
2. Scroll to the top of the list and select your **connected physical iPhone** (e.g., *Pooja's iPhone*).
3. Click the **Play (Run)** button (or press `Cmd + R` on your keyboard).
4. Xcode will build the project, sign it with your certificate, and transfer it to your iPhone.

---

## 🔒 Step 5: Trust the Developer Certificate (First time only)
When the app finishes transferring, you will see a popup on your iPhone saying "Untrusted Developer". You must tell iOS to allow it:
1. On your iPhone, go to **Settings > General**.
2. Scroll down and tap **VPN & Device Management** (or *Device Management*).
3. Under *Developer App*, tap your Apple ID email address.
4. Tap **Trust [Your Email Address]** and confirm.
5. Return to your home screen and tap the **Riomedica Healthcare** app icon to launch it!

---

> ℹ️ **Note on Free Account Limitations**:
> * **7-Day Expiry:** Apple signatures signed using free personal developer profiles are valid for **7 days**. After 7 days, the app will refuse to open. To renew, simply connect your iPhone to the Mac, open Xcode, and click **Run** (`Cmd + R`) again.
> * **Paid Accounts ($99/year):** If you sign using a paid Apple Developer Account, the signatures are valid for a full year and you can distribute builds to up to 10,000 testers using **Apple TestFlight**.
