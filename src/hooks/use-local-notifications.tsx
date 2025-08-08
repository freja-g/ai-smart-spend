import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

export const useLocalNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const initializeLocalNotifications = async () => {
      if (!user) return;

      try {
        // Request permission for local notifications
        const permissionStatus = await LocalNotifications.requestPermissions();
        
        if (permissionStatus.display === 'granted') {
          console.log('Local notification permission granted');
          
          // Listen for local notification actions
          LocalNotifications.addListener('localNotificationReceived', (notification) => {
            console.log('Local notification received:', notification);
            
            toast({
              title: notification.title || 'Notification',
              description: notification.body || 'You have a new notification',
            });
          });

          // Listen for local notification actions
          LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
            console.log('Local notification action performed:', notification);
            
            // Handle notification action (e.g., navigate to specific screen)
            // You can implement navigation logic here
          });
        } else {
          console.log('Local notification permission not granted');
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