import { createContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import * as notificationService from '@/lib/notification-service';

export type NotificationContextType = {
  pushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
};

export const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Only run on physical devices; push tokens don't work on simulators
    if (!Device.isDevice) return;

    async function registerForPushNotifications() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
        });
        setPushToken(tokenData.data);

        if (user) {
          await notificationService.registerPushToken(user.id, tokenData.data);
        }
      } catch (error) {
        console.warn('Failed to get push token:', error);
      }
    }

    registerForPushNotifications();

    // Foreground notification handler
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Notification response handler (user tapped notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      switch (data.type) {
        case 'challenge_invite':
          router.push(`/(modals)/challenge-invite?id=${data.challengeId}`);
          break;
        case 'challenge_result':
          router.push(`/(modals)/challenge-result?id=${data.challengeId}`);
          break;
        case 'streak_reminder':
          router.push('/(tabs)');
          break;
        default:
          break;
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user, router]);

  return (
    <NotificationContext.Provider value={{ pushToken, permissionStatus }}>
      {children}
    </NotificationContext.Provider>
  );
}
