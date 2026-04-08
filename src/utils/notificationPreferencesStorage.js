import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "packsmart_notification_preferences_v1";

export const defaultNotificationPreferences = {
  enabled: true,
  checklistReminders: true,
  travelDayReminders: true,
  scheduleReminders: true,
  readyReminders: true,

  quietModeEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",

  reminderMode: "normal", // minimal | normal | important_only
};

export async function loadNotificationPreferences() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) return defaultNotificationPreferences;

    const parsed = JSON.parse(raw);

    return {
      ...defaultNotificationPreferences,
      ...parsed,
    };
  } catch (error) {
    console.error("Load notification preferences error:", error);
    return defaultNotificationPreferences;
  }
}

export async function saveNotificationPreferences(preferences) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Save notification preferences error:", error);
  }
}