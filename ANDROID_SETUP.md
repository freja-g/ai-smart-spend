# Android Development Setup

This app is configured to work on Android using Capacitor. Follow these steps to build and run on Android.

## Prerequisites

1. **Android Studio** - Download and install from [https://developer.android.com/studio](https://developer.android.com/studio)
2. **Java Development Kit (JDK)** - Android Studio includes this
3. **Android SDK** - Managed through Android Studio

## Development Workflow

### 1. For Production Build
```bash
# Build and sync the app for production
npm run android:sync

# Open in Android Studio
npm run android:open
```

### 2. For Development with Hot Reload
```bash
# Start the dev server first
npm run dev

# In another terminal, sync with dev server connection
npm run android:sync:dev

# Open in Android Studio
npm run android:open
```

### 3. Direct Run (if Android emulator/device is connected)
```bash
# For production build
npm run android:run

# For development with hot reload
npm run android:run:dev
```

## Configuration Files

- `capacitor.config.ts` - Production config (uses built files)
- `capacitor.config.dev.ts` - Development config (connects to dev server)

## Network Configuration

The app is configured to allow HTTP connections for development:
- `android/app/src/main/res/xml/network_security_config.xml` - Allows localhost connections
- Localhost connections are permitted for development servers

## Building APK

1. Open the project in Android Studio: `npm run android:open`
2. In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
3. The APK will be generated in `android/app/build/outputs/apk/`

## Troubleshooting

### If the app can't connect to dev server:
1. Make sure your dev server is running: `npm run dev`
2. Check that your device/emulator can reach your development machine
3. Try using your machine's IP address instead of localhost in `capacitor.config.dev.ts`

### If build fails:
1. Make sure Android Studio and SDK are properly installed
2. Check that ANDROID_HOME environment variable is set
3. Ensure you have the correct SDK version (API 34)

## App Information

- **App ID**: app.lovable.e5458f28a63f40859b73487964bf1e9e
- **App Name**: SmartSpend
- **Min SDK**: 22
- **Target SDK**: 34
- **Compile SDK**: 34
