import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../common/AppCard";
import SectionHeader from "../common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function TripDatesStep({ form, updateField }) {
  return (
    <AppCard>
      <SectionHeader
        title="Travel Dates"
        subtitle="Enter the start and end dates for this trip."
      />

      <Text style={styles.label}>Start Date</Text>
      <TextInput
        value={form.startDate}
        onChangeText={(value) => updateField("startDate", value)}
        style={styles.input}
        placeholder="2026-06-10"
      />

      <Text style={styles.label}>End Date</Text>
      <TextInput
        value={form.endDate}
        onChangeText={(value) => updateField("endDate", value)}
        style={styles.input}
        placeholder="2026-06-13"
      />

      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Duration</Text>
        <Text style={styles.summaryValue}>
          {form.durationDays > 0
            ? `${form.durationDays} day${form.durationDays === 1 ? "" : "s"}`
            : "Not calculated yet"}
        </Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  summaryBox: {
    marginTop: spacing.lg,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
});