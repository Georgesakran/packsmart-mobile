import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SuitcaseSetupScreen from "../screens/tripFlow/SuitcaseSetupScreen";
import AirlineBagRulesScreen from "../screens/tripFlow/AirlineBagRulesScreen";
import ARSuitcaseScanScreen from "../screens/tripFlow/ARSuitcaseScanScreen";
import SmartInventoryScreen from "../screens/tripFlow/SmartInventoryScreen";
import AddMoreItemsScreen from "../screens/tripFlow/AddMoreItemsScreen";
import InventoryReviewScreen from "../screens/tripFlow/InventoryReviewScreen";
import PackingSimulationScreen from "../screens/tripFlow/PackingSimulationScreen";
import FinalPackingReviewScreen from "../screens/tripFlow/FinalPackingReviewScreen";
import VisualPackingPlayerScreen from "../screens/tripFlow/VisualPackingPlayerScreen";
import VisualPacking3DScreen from "../screens/tripFlow/VisualPacking3DScreen";

const Stack = createNativeStackNavigator();

export default function TripFlowStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SuitcaseSetup"
        component={SuitcaseSetupScreen}
        options={{ title: "Suitcase Setup" }}
      />

      <Stack.Screen
        name="AirlineBagRules"
        component={AirlineBagRulesScreen}
        options={{ title: "Airline Rules" }}
      />

      <Stack.Screen
        name="ARSuitcaseScan"
        component={ARSuitcaseScanScreen}
        options={{ title: "Scan Suitcase" }}
      />

      <Stack.Screen
        name="SmartInventory"
        component={SmartInventoryScreen}
        options={{ title: "Smart Inventory" }}
      />

      <Stack.Screen
        name="AddMoreItems"
        component={AddMoreItemsScreen}
        options={{ title: "Add More Items" }}
      />

      <Stack.Screen
        name="InventoryReview"
        component={InventoryReviewScreen}
        options={{ title: "Review Items" }}
      />

      <Stack.Screen
        name="PackingSimulation"
        component={PackingSimulationScreen}
        options={{ title: "Packing Simulation" }}
      />

      <Stack.Screen
        name="FinalPackingReview"
        component={FinalPackingReviewScreen}
        options={{ title: "Final Review" }}
      />

      <Stack.Screen
        name="VisualPackingPlayer"
        component={VisualPackingPlayerScreen}
        options={{ title: "Visual Packing Player" }}
      />

      <Stack.Screen
        name="VisualPacking3D"
        component={VisualPacking3DScreen}
        options={{ title: "3D Packing Player" }}
      />
    </Stack.Navigator>
  );
}