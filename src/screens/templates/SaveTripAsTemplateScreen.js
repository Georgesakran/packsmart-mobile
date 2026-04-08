import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { saveTripAsTemplate } from "../../api/tripApi";

export default function SaveTripAsTemplateScreen({ route, navigation }) {
  const { tripId, tripName, travelType, weatherType } = route.params || {};

  const [name, setName] = useState(
    tripName ? `${tripName} Template` : ""
  );
  const [description, setDescription] = useState("");
  const [templateTravelType, setTemplateTravelType] = useState(travelType || "");
  const [templateWeatherType, setTemplateWeatherType] = useState(weatherType || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError("");

      await saveTripAsTemplate(tripId, {
        name,
        description,
        travelType: templateTravelType,
        weatherType: templateWeatherType,
      });

      navigation.navigate("Templates", {
        screen: "TemplatesHome",
      });
    } catch (err) {
      console.error("Save trip as template error:", err);
      setError(err?.response?.data?.message || "Failed to save template from trip.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Save as Template</Text>
          <Text style={styles.title}>Save Trip as Template</Text>
          <Text style={styles.subtitle}>
            Turn this trip into a reusable packing template.
          </Text>

          <AppCard>
            <SectionHeader
              title="Template Details"
              subtitle="This will save the current trip item setup as a reusable template."
            />

            <Text style={styles.label}>Template Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Weekend Valencia Template"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              placeholder="Saved from a successful trip setup"
              multiline
            />

            <Text style={styles.label}>Travel Type</Text>
            <TextInput
              value={templateTravelType}
              onChangeText={setTemplateTravelType}
              style={styles.input}
              placeholder="casual"
            />

            <Text style={styles.label}>Weather Type</Text>
            <TextInput
              value={templateWeatherType}
              onChangeText={setTemplateWeatherType}
              style={styles.input}
              placeholder="mixed"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <AppButton
              title="Save as Template"
              onPress={handleSave}
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