import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  deletePackingTemplate,
  getPackingTemplateById,
  updatePackingTemplate,
} from "../../api/tripApi";

export default function EditTemplateScreen({ route, navigation }) {
  const { templateId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [travelType, setTravelType] = useState("");
  const [weatherType, setWeatherType] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPackingTemplateById(templateId);
        setTemplate(data || null);

        setName(data?.name || "");
        setDescription(data?.description || "");
        setTravelType(data?.travel_type || data?.travelType || "");
        setWeatherType(data?.weather_type || data?.weatherType || "");
      } catch (err) {
        console.error("Load template error:", err);
        setError(err?.response?.data?.message || "Failed to load template.");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      await updatePackingTemplate(templateId, {
        name,
        description,
        travelType,
        weatherType,
      });

      navigation.goBack();
    } catch (err) {
      console.error("Update template error:", err);
      setError(err?.response?.data?.message || "Failed to update template.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              setError("");

              await deletePackingTemplate(templateId);
              navigation.goBack();
            } catch (err) {
              console.error("Delete template error:", err);
              setError(err?.response?.data?.message || "Failed to delete template.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading template...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Templates / Edit</Text>
          <Text style={styles.title}>{template?.name || "Edit Template"}</Text>
          <Text style={styles.subtitle}>
            Update this template or remove it.
          </Text>

          <AppCard>
            <SectionHeader
              title="Template Details"
              subtitle="Edit the basic template information."
            />

            <Text style={styles.label}>Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              multiline
            />

            <Text style={styles.label}>Travel Type</Text>
            <TextInput
              value={travelType}
              onChangeText={setTravelType}
              style={styles.input}
            />

            <Text style={styles.label}>Weather Type</Text>
            <TextInput
              value={weatherType}
              onChangeText={setWeatherType}
              style={styles.input}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actionsColumn}>
              <AppButton
                title="Save Changes"
                onPress={handleSave}
                loading={saving}
              />

              <AppButton
                title="Delete Template"
                variant="danger"
                onPress={handleDelete}
                loading={deleting}
              />
            </View>
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
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  helperText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 15,
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
  actionsColumn: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.danger,
    fontSize: 14,
  },
});