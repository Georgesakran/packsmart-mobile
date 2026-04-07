import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AppTabsNavigator from "./AppTabsNavigator";
import AuthNavigator from "./AuthNavigator";
import useAuth from "../hooks/useAuth";
import colors from "../theme/colors";
import { navigationRef } from "./navigationRef";

export default function RootNavigator() {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppTabsNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}