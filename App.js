import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";
import { PushNotificationsProvider } from "./src/context/PushNotificationsContext";
import { NotificationPreferencesProvider } from "./src/context/NotificationPreferencesContext";

export default function App() {
  return (
    <AuthProvider>
      <NotificationPreferencesProvider>
        <NotificationsProvider>
          <PushNotificationsProvider>
            <RootNavigator />
          </PushNotificationsProvider>
        </NotificationsProvider>
      </NotificationPreferencesProvider>
    </AuthProvider>
  );
}