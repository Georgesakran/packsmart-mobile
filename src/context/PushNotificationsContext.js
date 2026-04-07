import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Notifications from "expo-notifications";
import {
    registerForPushNotificationsAsync,
    scheduleLocalNotification,
    sendInstantLocalNotification,
    cancelAllScheduledNotifications,
    scheduleMultipleLocalReminders,
} from "../services/notificationsService";
import { navigate } from "../navigation/navigationRef";

const PushNotificationsContext = createContext(null);

export function PushNotificationsProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState("unknown");
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    let notificationListener;
    let responseListener;
  
    const setup = async () => {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
  
      const permissions = await Notifications.getPermissionsAsync();
      setNotificationPermission(permissions.status || "unknown");
    };
  
    setup();
  
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
  
      const data = response?.notification?.request?.content?.data || {};
      const tripId = data?.tripId;
      const targetScreen = data?.targetScreen || "TripOverview";
  
      if (!tripId) return;
  
      setTimeout(() => {
        navigate("Trips", {
          screen: targetScreen,
          params: { tripId },
        });
      }, 800);
    });
  
    notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setLastNotification(notification);
      }
    );
  
    responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received:", response);
  
        const data = response?.notification?.request?.content?.data || {};
        const tripId = data?.tripId;
        const targetScreen = data?.targetScreen || "TripOverview";
  
        if (!tripId) return;
  
        navigate("Trips", {
          screen: targetScreen,
          params: { tripId },
        });
      });
  
    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      expoPushToken,
      notificationPermission,
      lastNotification,
      scheduleLocalNotification,
      sendInstantLocalNotification,
      cancelAllScheduledNotifications,
      scheduleMultipleLocalReminders,
    }),
    [expoPushToken, notificationPermission, lastNotification]
  );

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);

  if (!context) {
    throw new Error(
      "usePushNotifications must be used inside PushNotificationsProvider"
    );
  }

  return context;
}