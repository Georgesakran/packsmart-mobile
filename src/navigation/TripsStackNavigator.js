import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TripsListScreen from "../screens/trips/TripsListScreen";
import TripOverviewScreen from "../screens/trips/TripOverviewScreen";
import TripBagsScreen from "../screens/trips/TripBagsScreen";
import TripItemsScreen from "../screens/trips/TripItemsScreen";

const Stack = createNativeStackNavigator();

export default function TripsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TripsList"
        component={TripsListScreen}
        options={{ title: "Trips" }}
      />
      <Stack.Screen
        name="TripOverview"
        component={TripOverviewScreen}
        options={{ title: "Trip Overview" }}
      />
      <Stack.Screen
        name="TripBags"
        component={TripBagsScreen}
        options={{ title: "Trip Bags" }}
      />
      <Stack.Screen
        name="TripItems"
        component={TripItemsScreen}
        options={{ title: "Trip Items" }}
      />
    </Stack.Navigator>
  );
}