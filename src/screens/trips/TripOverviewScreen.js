import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function TripOverviewScreen({ route }) {
  const { tripId, tripName } = route.params || {};

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Trip Overview</Text>
        <Text style={styles.title}>{tripName || "Unnamed Trip"}</Text>
        <Text style={styles.subtitle}>Trip ID: {tripId || "N/A"}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Command Center</Text>
          <Text style={styles.sectionText}>
            This screen will become the main mobile hub for each trip.
          </Text>
        </View>

        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionCard}>
            <Text style={styles.actionTitle}>Bags</Text>
            <Text style={styles.actionSubtitle}>Manage suitcases and bag roles</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <Text style={styles.actionTitle}>Items</Text>
            <Text style={styles.actionSubtitle}>Review and edit trip items</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <Text style={styles.actionTitle}>Checklist</Text>
            <Text style={styles.actionSubtitle}>Track packing progress</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <Text style={styles.actionTitle}>Travel Day</Text>
            <Text style={styles.actionSubtitle}>Plan what to wear and keep close</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <Text style={styles.actionTitle}>Results</Text>
            <Text style={styles.actionSubtitle}>See packing fit and smart actions</Text>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  actionsGrid: {
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});