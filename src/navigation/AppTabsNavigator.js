import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/home/HomeScreen";
import TemplatesScreen from "../screens/templates/TemplatesScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsStackNavigator from "./NotificationsStackNavigator";
import TripsStackNavigator from "./TripsStackNavigator";
import { useNotifications } from "../context/NotificationsContext";

const Tab = createBottomTabNavigator();

export default function AppTabsNavigator() {
  const { notificationCount } = useNotifications();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trips" component={TripsStackNavigator} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStackNavigator}
        options={{
          headerShown: false,
          tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
        }}
      />
      <Tab.Screen name="Templates" component={TemplatesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}