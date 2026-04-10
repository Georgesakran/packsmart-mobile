import React from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import AppCard from "../common/AppCard";
import SectionHeader from "../common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function TripBasicsStep({ form, updateField }) {
  return (
    <AppCard>
      <SectionHeader
        title="Trip Basics"
        subtitle="Start with the trip name and destination."
      />

      <Text style={styles.label}>Trip Name</Text>
      <TextInput
        value={form.tripName}
        onChangeText={(value) => updateField("tripName", value)}
        style={styles.input}
        placeholder="Barcelona Weekend"
      />

      <Text style={styles.label}>Destination City</Text>
      <TextInput
        value={form.destinationCity}
        onChangeText={(value) => updateField("destinationCity", value)}
        style={styles.input}
        placeholder="Barcelona"
      />

      <Text style={styles.label}>Destination Country</Text>
      <TextInput
        value={form.destinationCountry}
        onChangeText={(value) => updateField("destinationCountry", value)}
        style={styles.input}
        placeholder="Spain"
      />
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
});