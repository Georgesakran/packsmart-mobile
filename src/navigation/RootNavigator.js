import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppTabsNavigator from "./AppTabsNavigator";

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <AppTabsNavigator />
    </NavigationContainer>
  );
}