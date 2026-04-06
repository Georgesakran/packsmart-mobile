import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/home/HomeScreen";
import TemplatesScreen from "../screens/templates/TemplatesScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import TripsStackNavigator from "./TripsStackNavigator";

const Tab = createBottomTabNavigator();

export default function AppTabsNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trips" component={TripsStackNavigator} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Templates" component={TemplatesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}