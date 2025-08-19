import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

export const useLocalNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const initializeLocalNotifications = async () => {
      if (!user) return;

      try {
        // Check if we're on a native platform
        const isNative = Capacitor.isNativePlatform();
        console.log('Platform is native:', isNative);

        if (isNative) {
          // Request permission for local notifications
          const permissionStatus = await LocalNotifications.requestPermissions();
          console.log('Permission status:', permissionStatus);

          if (permissionStatus.display === 'granted') {
            console.log('Local notification permission granted');

            // Clear any existing listeners
            await LocalNotifications.removeAllListeners();

            // Listen for local notification actions (when user taps notification)
            LocalNotifications.addListener('localNotificationReceived', (notification) => {
              console.log('Local notification received:', notification);

              // Only show toast on web or when app is in foreground
              if (!isNative) {
                toast({
                  title: notification.title || 'Notification',
                  description: notification.body || 'You have a new notification',
                });
              }
            });

            // Listen for local notification actions (when user taps notification)
            LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
              console.log('Local notification action performed:', notificationAction);

              // Handle notification tap - you can add navigation logic here
              toast({
                title: "Notification Opened",
                description: "You tapped on a notification",
              });
            });
          } else {
            console.log('Local notification permission not granted');
            toast({
              title: "Notifications Disabled",
              description: "Please enable notifications in your device settings for alerts.",
              variant: "destructive"
            });
          }
        } else {
          console.log('Running on web - notifications will work in browser');
        }
      } catch (error) {
        console.error('Error initializing local notifications:', error);
      }
    };

    initializeLocalNotifications();

    // Cleanup listeners when component unmounts
    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, [user, toast]);

  const scheduleNotification = async (title: string, body: string, scheduleAt?: Date) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: scheduleAt ? { at: scheduleAt } : undefined,
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {}
          }
        ]
      });
      console.log('Local notification scheduled');
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [] });
      console.log('All local notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  };

  return {
    scheduleNotification,
    cancelAllNotifications
  };
};
