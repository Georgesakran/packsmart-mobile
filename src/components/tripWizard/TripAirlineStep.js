import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../common/AppCard";
import AppButton from "../common/AppButton";
import SectionHeader from "../common/SectionHeader";
import StatusBadge from "../common/StatusBadge";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function TripAirlineStep({ form, updateField, airlines = [] }) {
  return (
    <AppCard>
      <SectionHeader
        title="Airline"
        subtitle="Choose the airline for this trip. This will power bag recommendations later."
      />

      <View style={styles.airlinesWrap}>
        <AppButton
          title={form.airlineId === null ? "Skip for now" : "Skip for now"}
          variant={form.airlineId === null ? "primary" : "secondary"}
          onPress={() => updateField("airlineId", null)}
        />

        {airlines.map((airline) => {
          const selected = Number(form.airlineId) === Number(airline.id);

          return (
            <View key={airline.id} style={styles.airlineCard}>
              <View style={styles.airlineHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.airlineName}>{airline.name}</Text>
                  <Text style={styles.airlineCode}>{airline.code || "—"}</Text>
                </View>

                {selected ? (
                  <StatusBadge label="Selected" tone="success" />
                ) : null}
              </View>

              <AppButton
                title={selected ? "Selected" : "Choose Airline"}
                variant={selected ? "secondary" : "secondary"}
                onPress={() => updateField("airlineId", airline.id)}
              />
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  airlinesWrap: {
    gap: spacing.sm,
  },
  airlineCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  airlineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  airlineName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  airlineCode: {
    fontSize: 13,
    color: colors.textMuted,
  },
});