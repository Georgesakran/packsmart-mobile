import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";
import { PushNotificationsProvider } from "./src/context/PushNotificationsContext";

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <PushNotificationsProvider>
          <RootNavigator />
        </PushNotificationsProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}