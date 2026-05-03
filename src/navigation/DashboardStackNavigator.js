import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/home/HomeScreen";
import NewTripScreen from "../screens/dashboard/NewTripScreen";

const Stack = createNativeStackNavigator();

export default function DashboardStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardHome"
        component={HomeScreen}
        options={{ title: "Dashboard" }}
      />

      <Stack.Screen
        name="NewTrip"
        component={NewTripScreen}
        options={{ title: "New Trip" }}
      />
    </Stack.Navigator>
  );
}