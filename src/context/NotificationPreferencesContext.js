import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from "../utils/notificationPreferencesStorage";

const NotificationPreferencesContext = createContext(null);

export function NotificationPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(defaultNotificationPreferences);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  useEffect(() => {
    const init = async () => {
      const loaded = await loadNotificationPreferences();
      setPreferences(loaded);
      setLoadingPreferences(false);
    };

    init();
  }, []);

  const updatePreferences = async (updates) => {
    const next = {
      ...preferences,
      ...updates,
    };

    setPreferences(next);
    await saveNotificationPreferences(next);
  };

  const resetPreferences = async () => {
    setPreferences(defaultNotificationPreferences);
    await saveNotificationPreferences(defaultNotificationPreferences);
  };

  const value = useMemo(
    () => ({
      preferences,
      loadingPreferences,
      updatePreferences,
      resetPreferences,
    }),
    [preferences, loadingPreferences]
  );

  return (
    <NotificationPreferencesContext.Provider value={value}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext);

  if (!context) {
    throw new Error(
      "useNotificationPreferences must be used inside NotificationPreferencesProvider"
    );
  }

  return context;
}