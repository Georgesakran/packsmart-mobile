import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import NotificationPreferencesScreen from "../screens/notifications/NotificationPreferencesScreen";

const Stack = createNativeStackNavigator();

export default function NotificationsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NotificationsHome"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ title: "Notification Preferences" }}
      />
    </Stack.Navigator>
  );
}