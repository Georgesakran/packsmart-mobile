import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { createPackingTemplate } from "../../api/tripApi";

export default function CreateTemplateScreen({ navigation }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [travelType, setTravelType] = useState("");
  const [weatherType, setWeatherType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      setError("");

      await createPackingTemplate({
        name,
        description,
        travelType,
        weatherType,
      });

      navigation.goBack();
    } catch (err) {
      console.error("Create template error:", err);
      setError(err?.response?.data?.message || "Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Templates / Create</Text>
          <Text style={styles.title}>Create Template</Text>
          <Text style={styles.subtitle}>
            Create a reusable packing template from mobile.
          </Text>

          <AppCard>
            <SectionHeader
              title="Template Details"
              subtitle="Basic template information."
            />

            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Weekend Light Pack"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              placeholder="A lightweight 2-3 day template"
              multiline
            />

            <Text style={styles.label}>Travel Type</Text>
            <TextInput
              value={travelType}
              onChangeText={setTravelType}
              style={styles.input}
              placeholder="casual"
            />

            <Text style={styles.label}>Weather Type</Text>
            <TextInput
              value={weatherType}
              onChangeText={setWeatherType}
              style={styles.input}
              placeholder="mixed"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <AppButton
              title="Create Template"
              onPress={handleCreate}
              loading={submitting}
              style={styles.submitButton}
            />
          </AppCard>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.danger,
    fontSize: 14,
  },
});