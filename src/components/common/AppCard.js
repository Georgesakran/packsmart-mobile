import React from "react";
import { StyleSheet, View } from "react-native";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function AppCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
});