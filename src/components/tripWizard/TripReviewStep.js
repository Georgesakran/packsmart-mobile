import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../common/AppCard";
import SectionHeader from "../common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function TripReviewStep({ form, airlines = [] }) {
  const selectedAirline =
    airlines.find((airline) => Number(airline.id) === Number(form.airlineId)) ||
    null;

  const rows = [
    { label: "Trip Name", value: form.tripName || "Auto-generate later" },
    {
      label: "Destination",
      value: `${form.destinationCity || "—"}${form.destinationCity && form.destinationCountry ? ", " : ""}${form.destinationCountry || ""}`,
    },
    { label: "Start Date", value: form.startDate || "—" },
    { label: "End Date", value: form.endDate || "—" },
    { label: "Duration", value: form.durationDays ? `${form.durationDays} days` : "—" },
    { label: "Travelers", value: String(form.travelerCount || 1) },
    { label: "Trip Type", value: form.tripType || "—" },
    { label: "Airline", value: selectedAirline?.name || "Not selected" },
    { label: "Packing Mode", value: form.packingMode || "—" },
  ];

  return (
    <AppCard>
      <SectionHeader
        title="Review Trip Setup"
        subtitle="Check everything before creating the trip."
      />

      <View style={styles.rowsWrap}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  rowsWrap: {
    gap: spacing.sm,
  },
  row: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "700",
  },
});