import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import colors from "../../theme/colors";

export default function AppScreen({ children, style }) {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});