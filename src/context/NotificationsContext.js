import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getTrips } from "../api/tripApi";
import { buildNotificationsFromTrips } from "../utils/buildNotifications";
import { useNotificationPreferences } from "./NotificationPreferencesContext";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [trips, setTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { preferences } = useNotificationPreferences();

  const refreshNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);

      const data = await getTrips();
      const tripsArray = Array.isArray(data) ? data : [];

      setTrips(tripsArray);
      setNotifications(buildNotificationsFromTrips(tripsArray, preferences));
    } catch (error) {
      console.error("Refresh notifications error:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [preferences]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const value = useMemo(
    () => ({
      trips,
      notifications,
      notificationCount: notifications.length,
      loadingNotifications,
      refreshNotifications,
    }),
    [trips, notifications, loadingNotifications, refreshNotifications]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }

  return context;
}