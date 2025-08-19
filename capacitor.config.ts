import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e5458f28a63f40859b73487964bf1e9e',
  appName: 'SmartSpend',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#007BFF",
      sound: "default",
      requestPermissions: true,
      actionTypeId: "OPEN_APP",
      actions: [
        {
          id: "view",
          title: "View",
          requiresAuthentication: false,
          foreground: true
        }
      ]
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: "APK",
      signingType: "apksigner"
    },
    allowMixedContent: true
  }
};

export default config;
