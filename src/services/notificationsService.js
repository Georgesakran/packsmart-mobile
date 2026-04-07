import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device.");
    return null;
  }

  let { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log("Expo projectId not found yet. Skipping push token for now.");
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenResponse?.data || null;
  } catch (error) {
    console.error("Get Expo push token error:", error);
    return null;
  }
}

export async function scheduleLocalNotification({
  title,
  body,
  seconds = 2,
  data = {},
}) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

export async function sendInstantLocalNotification({
  title,
  body,
  data = {},
}) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null,
  });
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleMultipleLocalReminders(reminders = []) {
    const scheduledIds = [];
    const storageKey = "scheduled_smart_reminders_v1";
  
    const existingRaw = await AsyncStorage.getItem(storageKey);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
  
    for (const reminder of reminders) {
      if (existing[reminder.id]) continue;
  
      const scheduledId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: {
            tripId: reminder.tripId,
            reminderId: reminder.id,
            kind: "smart-trip-reminder",
            targetScreen: reminder.targetScreen || "TripOverview",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: reminder.seconds,
          repeats: false,
        },
      });
  
      existing[reminder.id] = scheduledId;
  
      scheduledIds.push({
        reminderId: reminder.id,
        scheduledId,
      });
    }
  
    await AsyncStorage.setItem(storageKey, JSON.stringify(existing));
  
    return scheduledIds;
  }