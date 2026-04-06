import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TripsListScreen from "../screens/trips/TripsListScreen";
import TripOverviewScreen from "../screens/trips/TripOverviewScreen";
import TripBagsScreen from "../screens/trips/TripBagsScreen";
import TripItemsScreen from "../screens/trips/TripItemsScreen";
import TripChecklistScreen from "../screens/trips/TripChecklistScreen";
import TripTravelDayScreen from "../screens/trips/TripTravelDayScreen";
import TripResultsScreen from "../screens/trips/TripResultsScreen";
import CreateTripScreen from "../screens/trips/CreateTripScreen";
import AddTripBagScreen from "../screens/trips/AddTripBagScreen";
import AddTripItemScreen from "../screens/trips/AddTripItemScreen";
import ApplyTemplateScreen from "../screens/trips/ApplyTemplateScreen";
import EditTripBagScreen from "../screens/trips/EditTripBagScreen";
import EditTripItemScreen from "../screens/trips/EditTripItemScreen";

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
        name="CreateTrip"
        component={CreateTripScreen}
        options={{ title: "Create Trip" }}
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
      <Stack.Screen
        name="TripChecklist"
        component={TripChecklistScreen}
        options={{ title: "Trip Checklist" }}
      />
      <Stack.Screen
        name="TripTravelDay"
        component={TripTravelDayScreen}
        options={{ title: "Travel Day" }}
      />
      <Stack.Screen
        name="TripResults"
        component={TripResultsScreen}
        options={{ title: "Trip Results" }}
      />
      <Stack.Screen
        name="AddTripBag"
        component={AddTripBagScreen}
        options={{ title: "Add Bag" }}
      />

      <Stack.Screen
        name="AddTripItem"
        component={AddTripItemScreen}
        options={{ title: "Add Item" }}
      />
      
      <Stack.Screen
        name="ApplyTemplate"
        component={ApplyTemplateScreen}
        options={{ title: "Apply Template" }}
      />

      <Stack.Screen
        name="EditTripBag"
        component={EditTripBagScreen}
        options={{ title: "Edit Bag" }}
      />
      <Stack.Screen
        name="EditTripItem"
        component={EditTripItemScreen}
        options={{ title: "Edit Item" }}
      />

    </Stack.Navigator>
  );
}