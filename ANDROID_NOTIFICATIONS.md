# Android Local Notifications Setup & Testing

## Quick Test
1. Use the **"Test Notifications"** button in Settings (top-right gear icon)
2. Check if you receive a notification on your device

## Building for Android

### Prerequisites
- Android Studio installed
- Android SDK configured
- Device/emulator running Android 5.0+ (API level 21+)

### Build Steps

```bash
# 1. Build the web app
npm run build

# 2. Sync with Capacitor (copies web assets to native app)
npm run android:sync

# 3. Open in Android Studio
npm run android:open
```

### Testing Local Notifications

#### Method 1: Test Button
1. Build and install the app on your Android device
2. Open the app and navigate to any page
3. Tap the Settings icon (gear) in the top-right
4. Tap "Test Notifications" button
5. Check your notification panel for the test notification

#### Method 2: Financial Triggers
1. Add some transactions to trigger budget alerts:
   - Set a monthly budget in the Budget section
   - Add expenses that exceed 80% of your budget
   - You should receive a budget alert notification

2. Create and progress towards a savings goal:
   - Create a new savings goal
   - Update the goal to 75%+ completion
   - You should receive a goal progress notification

### Android Permissions

The app automatically requests notification permissions when first opened. If denied:

1. Go to **Settings > Apps > SmartSpend > Notifications**
2. Enable **"Allow notifications"**
3. Restart the app

### Troubleshooting

#### No Notifications Appearing
1. Check device notification settings
2. Ensure notifications are enabled for the app
3. Check if "Do Not Disturb" mode is enabled
4. Try the test button in app settings

#### Notifications Not Triggering
1. Check the browser console for errors (use Chrome DevTools for debugging)
2. Verify user has enabled notifications in profile settings
3. Ensure financial data exists to trigger notifications

#### Building Issues
```bash
# Clean and rebuild
npx cap clean android
npm run build
npx cap sync android
```

### Notification Icons
- The app uses `ic_notification` icon (configured in capacitor.config.ts)
- Icon color: `#007BFF` (blue)
- Sound: Default system notification sound

### Development Tips
- Test on real Android device for best results
- Use `adb logcat` to see native Android logs
- Chrome DevTools can debug the web layer when connected via USB

## Production Deployment
For production apps, you'll need to:
1. Generate a signed APK/AAB
2. Upload to Google Play Store
3. Test on various Android versions and devices
