#!/bin/bash
# Riomedica Healthcare - Standalone iOS Setup & Testing Tool
# This script must be run on macOS with Xcode installed.

clear
echo "====================================================="
echo "  RIOMEDICA HEALTHCARE — STANDALONE iOS SETUP TOOL   "
echo "  Preparing iOS Testing Workspace on Mac            "
echo "====================================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ [ERROR] This script must be run on macOS (Darwin)."
    echo "iOS applications can only be built, compiled, and run on macOS with Xcode."
    exit 1
fi

# Check Node.js
echo "🔍 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "⚠️  [WARN] Node.js is not installed."
    echo "   Please download and install Node.js LTS from: https://nodejs.org"
    echo "   Press any key once Node.js is installed to continue..."
    read -n 1 -s
else
    echo "✅ Node.js detected: $(node -v)"
fi

# Install npm dependencies
echo ""
echo "📦 Installing Capacitor core CLI tools..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ [ERROR] Failed to install npm packages."
    exit 1
fi
echo "✅ Core packages installed successfully."

# Check CocoaPods
echo ""
echo "🔍 Checking CocoaPods status..."
if ! command -v pod &> /dev/null; then
    echo "⚠️  [WARN] CocoaPods is not installed. Trying to install CocoaPods..."
    echo "👉 Enter your Mac password if prompted to authorize installation:"
    sudo gem install cocoapods
    if [ $? -ne 0 ]; then
        echo "❌ [ERROR] CocoaPods installation failed. Install it manually using:"
        echo "   sudo gem install cocoapods"
        exit 1
    fi
else
    echo "✅ CocoaPods detected: $(pod --version)"
fi

# Run CocoaPods install in iOS Directory
echo ""
echo "🚀 Running 'pod install' to generate Xcode workspaces..."
cd ios/App
pod install
if [ $? -ne 0 ]; then
    echo "❌ [ERROR] CocoaPods sync failed."
    cd ../..
    exit 1
fi
cd ../..
echo "✅ Pods synchronized successfully."

# Open in Xcode
echo ""
echo "🖥️  Opening Xcode workspace..."
if command -v npx &> /dev/null; then
    npx cap open ios
else
    open ios/App/App.xcworkspace
fi

echo ""
echo "====================================================="
echo " 🎉 SETUP SUCCESSFUL! Xcode is opening."
echo ""
echo " NEXT STEPS IN XCODE:"
echo " 1. Select your target device or simulator (e.g. iPhone 15)"
echo " 2. Click the Play (Run) button or press Cmd + R"
echo " 3. Verify the detailing app launches on screen!"
echo "====================================================="
echo ""
