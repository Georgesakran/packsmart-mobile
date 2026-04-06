import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import AppCard from "./AppCard";

export default function EmptyState({ title, description }) {
  return (
    <AppCard>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
});