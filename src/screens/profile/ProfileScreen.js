import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function ProfileScreen() {
  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Your account and packing preferences will appear here
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
  },
});