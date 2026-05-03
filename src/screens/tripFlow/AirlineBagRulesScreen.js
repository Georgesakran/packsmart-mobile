import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function AirlineBagRulesScreen() {
  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Airline Bag Rules</Text>
        <Text style={styles.subtitle}>
          Upcoming screen: fetch and display airline baggage dimensions and rules.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
  },
});