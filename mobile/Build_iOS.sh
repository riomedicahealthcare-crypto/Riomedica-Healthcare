#!/bin/bash
# Riomedica Healthcare - iOS Build Script
# NOTE: This script MUST be run on macOS with Xcode installed.
# It cannot be run on Windows.

echo ""
echo "===================================================="
echo " RIOMEDICA HEALTHCARE - iOS BUILDER"
echo " Apple App Store Deployment Tool"
echo "===================================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "[ERROR] This script must be run on macOS."
    echo "iOS apps can only be built and signed on macOS with Xcode."
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "[ERROR] Xcode is not installed."
    echo "Please install Xcode from the Mac App Store."
    exit 1
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "[INFO] Installing CocoaPods..."
    sudo gem install cocoapods
fi

echo "[1/5] Installing Capacitor dependencies..."
npm install

echo ""
echo "[2/5] Building React web app..."
cd ../client
npm install
npm run build
cd ../mobile

echo ""
echo "[3/5] Adding iOS platform..."
npx cap add ios 2>/dev/null || echo "(Already added, skipping...)"

echo ""
echo "[4/5] Syncing web build to iOS project..."
npx cap sync ios

echo ""
echo "[5/5] Opening Xcode..."
npx cap open ios

echo ""
echo "===================================================="
echo " XCODE IS OPENING..."
echo ""
echo " NEXT STEPS IN XCODE:"
echo " 1. Sign in to your Apple Developer account"
echo "    Xcode > Preferences > Accounts"
echo " 2. Set your Team (Apple Developer team)"
echo "    Project Navigator > App > Signing & Capabilities"
echo " 3. Set Bundle Identifier: com.riomedica.healthcare"
echo " 4. Select a device or 'Any iOS Device (arm64)'"
echo " 5. Product > Archive"
echo " 6. In Organizer: Distribute App > App Store Connect"
echo " 7. Submit to App Store Review"
echo "===================================================="
echo ""
