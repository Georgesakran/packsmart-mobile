import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/home/HomeScreen";
import TemplatesScreen from "../screens/templates/TemplatesScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import TripsStackNavigator from "./TripsStackNavigator";
import { getTrips } from "../api/tripApi";
import { buildNotificationsFromTrips } from "../utils/buildNotifications";

const Tab = createBottomTabNavigator();

export default function AppTabsNavigator() {
  const [trips, setTrips] = useState([]);

  const loadTripsForNotifications = useCallback(async () => {
    try {
      const data = await getTrips();
      setTrips(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load trips for badge error:", error);
    }
  }, []);

  useEffect(() => {
    loadTripsForNotifications();
  }, [loadTripsForNotifications]);

  const notificationCount = useMemo(() => {
    return buildNotificationsFromTrips(trips).length;
  }, [trips]);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trips" component={TripsStackNavigator} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
        }}
      />
      <Tab.Screen name="Templates" component={TemplatesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}