import React from "react";
import { StyleSheet, View } from "react-native";
import AppCard from "../common/AppCard";
import AppButton from "../common/AppButton";
import SectionHeader from "../common/SectionHeader";
import spacing from "../../theme/spacing";

const PACKING_MODES = [
  { key: "light", label: "Light" },
  { key: "balanced", label: "Balanced" },
  { key: "maximum_prepared", label: "Maximum Prepared" },
  { key: "carry_on_only", label: "Carry-On Only" },
];

export default function TripPackingModeStep({ form, updateField }) {
  return (
    <AppCard>
      <SectionHeader
        title="Packing Mode"
        subtitle="Choose how aggressively or lightly you want to pack."
      />

      <View style={styles.optionsWrap}>
        {PACKING_MODES.map((mode) => (
          <AppButton
            key={mode.key}
            title={mode.label}
            variant={form.packingMode === mode.key ? "primary" : "secondary"}
            onPress={() => updateField("packingMode", mode.key)}
            style={styles.optionButton}
          />
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  optionsWrap: {
    gap: spacing.sm,
  },
  optionButton: {
    marginTop: 4,
  },
});