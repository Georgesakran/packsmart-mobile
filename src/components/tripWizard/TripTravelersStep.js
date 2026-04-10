import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../common/AppCard";
import AppButton from "../common/AppButton";
import SectionHeader from "../common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function TripTravelersStep({ form, updateField }) {
  const count = Number(form.travelerCount || 1);

  return (
    <AppCard>
      <SectionHeader
        title="Travelers"
        subtitle="Choose how many travelers this trip includes."
      />

      <View style={styles.counterWrap}>
        <AppButton
          title="-"
          variant="secondary"
          onPress={() => updateField("travelerCount", Math.max(1, count - 1))}
          style={styles.counterButton}
        />

        <View style={styles.counterValueBox}>
          <Text style={styles.counterLabel}>Traveler Count</Text>
          <Text style={styles.counterValue}>{count}</Text>
        </View>

        <AppButton
          title="+"
          variant="secondary"
          onPress={() => updateField("travelerCount", count + 1)}
          style={styles.counterButton}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  counterWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  counterButton: {
    width: 64,
  },
  counterValueBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
  },
  counterLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  counterValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
});