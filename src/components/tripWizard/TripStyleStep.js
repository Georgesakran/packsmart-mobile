import React from "react";
import { StyleSheet, View } from "react-native";
import AppCard from "../common/AppCard";
import AppButton from "../common/AppButton";
import SectionHeader from "../common/SectionHeader";
import spacing from "../../theme/spacing";

const TRIP_TYPES = [
  "casual",
  "business",
  "beach",
  "sports",
  "family",
  "winter",
  "city_break",
  "formal_event",
];

export default function TripStyleStep({ form, updateField }) {
  return (
    <AppCard>
      <SectionHeader
        title="Trip Style"
        subtitle="Choose the type of trip so the system can plan better."
      />

      <View style={styles.optionsWrap}>
        {TRIP_TYPES.map((type) => (
          <AppButton
            key={type}
            title={type}
            variant={form.tripType === type ? "primary" : "secondary"}
            onPress={() => updateField("tripType", type)}
            style={styles.optionButton}
          />
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionButton: {
    marginTop: 4,
  },
});