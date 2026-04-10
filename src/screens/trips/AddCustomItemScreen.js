import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { createCustomItem, createTripItem } from "../../api/tripApi";

const CATEGORY_OPTIONS = [
  "clothing",
  "toiletries",
  "tech",
  "documents",
  "accessories",
  "shoes",
  "health",
  "misc",
];

const PACK_BEHAVIOR_OPTIONS = ["foldable", "compressible", "rigid"];

const AUDIENCE_OPTIONS = ["unisex", "men", "women", "kids"];

export default function AddCustomItemScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [form, setForm] = useState({
    name: "",
    category: "misc",
    audience: "unisex",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    baseWeightG: "",
    packBehavior: "rigid",
    notes: "",
    quantity: "1",
    saveForFuture: true,
    addToCurrentTrip: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const calculatedVolume = useMemo(() => {
    const l = Number(form.lengthCm || 0);
    const w = Number(form.widthCm || 0);
    const h = Number(form.heightCm || 0);

    if (l > 0 && w > 0 && h > 0) {
      return l * w * h;
    }

    return 0;
  }, [form.lengthCm, form.widthCm, form.heightCm]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleBooleanField = (key) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const validate = () => {
    setError("");

    if (!form.name.trim()) {
      setError("Custom item name is required.");
      return false;
    }

    if (!form.packBehavior) {
      setError("Pack behavior is required.");
      return false;
    }

    if (calculatedVolume <= 0) {
      setError("Please enter valid dimensions.");
      return false;
    }

    if (!form.baseWeightG || Number(form.baseWeightG) <= 0) {
      setError("Please enter a valid weight in grams.");
      return false;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("Please enter a valid quantity.");
      return false;
    }

    if (!tripId && form.addToCurrentTrip) {
      setError("Trip ID is missing for adding this item to the current trip.");
      return false;
    }

    if (!form.saveForFuture && !form.addToCurrentTrip) {
      setError("Choose at least one action: save for future or add to this trip.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    try {
      if (!validate()) return;

      setSaving(true);
      setError("");
      setSuccessMessage("");

      let createdLibraryItem = null;

      if (form.saveForFuture) {
        createdLibraryItem = await createCustomItem({
          name: form.name.trim(),
          category: form.category,
          audience: form.audience,
          lengthCm: Number(form.lengthCm),
          widthCm: Number(form.widthCm),
          heightCm: Number(form.heightCm),
          baseWeightG: Number(form.baseWeightG),
          packBehavior: form.packBehavior,
          notes: form.notes?.trim() || "",
        });
      }

      if (form.addToCurrentTrip) {
        await createTripItem(tripId, {
          itemId: null,
          customName: form.name.trim(),
          sourceType: "custom",
          quantity: Number(form.quantity),
          sizeCode: null,
          category: form.category,
          audience: form.audience,
          baseVolumeCm3: calculatedVolume,
          baseWeightG: Number(form.baseWeightG),
          packBehavior: form.packBehavior,
          assignedBagId: null,
        });
      }

      setSuccessMessage("Custom item saved successfully.");

      Alert.alert(
        "Success",
        "Your custom item was saved successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              if (tripId && form.addToCurrentTrip) {
                navigation.goBack();
              } else {
                navigation.navigate("SavedCustomItems", { tripId });
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("Save custom item error:", err);
      setError(err?.response?.data?.message || "Failed to save custom item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <Text style={styles.kicker}>Custom Items</Text>
            <Text style={styles.title}>Add Custom Item</Text>
            <Text style={styles.subtitle}>
              Create a custom item and optionally add it directly to this trip.
            </Text>

            {error ? (
              <AppCard style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </AppCard>
            ) : null}

            {successMessage ? (
              <AppCard style={styles.successCard}>
                <Text style={styles.successText}>{successMessage}</Text>
              </AppCard>
            ) : null}

            <AppCard>
              <SectionHeader
                title="Basic Details"
                subtitle="Define the custom item name, category, and behavior."
              />

              <Text style={styles.label}>Item Name</Text>
              <TextInput
                value={form.name}
                onChangeText={(value) => updateField("name", value)}
                style={styles.input}
                placeholder="Perfume Bottle"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.optionsWrap}>
                {CATEGORY_OPTIONS.map((option) => (
                  <AppButton
                    key={option}
                    title={option}
                    variant={form.category === option ? "primary" : "secondary"}
                    onPress={() => updateField("category", option)}
                    style={styles.optionButton}
                  />
                ))}
              </View>

              <Text style={styles.label}>Audience</Text>
              <View style={styles.optionsWrap}>
                {AUDIENCE_OPTIONS.map((option) => (
                  <AppButton
                    key={option}
                    title={option}
                    variant={form.audience === option ? "primary" : "secondary"}
                    onPress={() => updateField("audience", option)}
                    style={styles.optionButton}
                  />
                ))}
              </View>

              <Text style={styles.label}>Pack Behavior</Text>
              <View style={styles.optionsWrap}>
                {PACK_BEHAVIOR_OPTIONS.map((option) => (
                  <AppButton
                    key={option}
                    title={option}
                    variant={form.packBehavior === option ? "primary" : "secondary"}
                    onPress={() => updateField("packBehavior", option)}
                    style={styles.optionButton}
                  />
                ))}
              </View>
            </AppCard>

            <AppCard>
              <SectionHeader
                title="Dimensions and Weight"
                subtitle="These values are used in the packing engine."
              />

              <Text style={styles.label}>Length (cm)</Text>
              <TextInput
                value={form.lengthCm}
                onChangeText={(value) => updateField("lengthCm", value)}
                style={styles.input}
                keyboardType="numeric"
                placeholder="6"
              />

              <Text style={styles.label}>Width (cm)</Text>
              <TextInput
                value={form.widthCm}
                onChangeText={(value) => updateField("widthCm", value)}
                style={styles.input}
                keyboardType="numeric"
                placeholder="4"
              />

              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                value={form.heightCm}
                onChangeText={(value) => updateField("heightCm", value)}
                style={styles.input}
                keyboardType="numeric"
                placeholder="12"
              />

              <Text style={styles.label}>Weight (g)</Text>
              <TextInput
                value={form.baseWeightG}
                onChangeText={(value) => updateField("baseWeightG", value)}
                style={styles.input}
                keyboardType="numeric"
                placeholder="320"
              />

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Calculated Volume</Text>
                <Text style={styles.summaryValue}>
                  {calculatedVolume > 0 ? `${calculatedVolume} cm³` : "Not calculated yet"}
                </Text>
              </View>
            </AppCard>

            <AppCard>
              <SectionHeader
                title="Trip Options"
                subtitle="Choose whether to save this item for future use and/or add it to this trip."
              />

              <Text style={styles.label}>Quantity for This Trip</Text>
              <TextInput
                value={form.quantity}
                onChangeText={(value) => updateField("quantity", value)}
                style={styles.input}
                keyboardType="numeric"
                placeholder="1"
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                value={form.notes}
                onChangeText={(value) => updateField("notes", value)}
                style={[styles.input, styles.notesInput]}
                placeholder="Glass bottle, fragile item..."
                multiline
              />

              <View style={styles.toggleBlock}>
                <Text style={styles.toggleTitle}>Save for future trips</Text>
                <AppButton
                  title={form.saveForFuture ? "Enabled" : "Disabled"}
                  variant={form.saveForFuture ? "primary" : "secondary"}
                  onPress={() => toggleBooleanField("saveForFuture")}
                />
              </View>

              <View style={styles.toggleBlock}>
                <Text style={styles.toggleTitle}>Add directly to current trip</Text>
                <AppButton
                  title={form.addToCurrentTrip ? "Enabled" : "Disabled"}
                  variant={form.addToCurrentTrip ? "primary" : "secondary"}
                  onPress={() => toggleBooleanField("addToCurrentTrip")}
                />
              </View>
            </AppCard>

            <AppCard>
              <View style={styles.actionsColumn}>
                <AppButton
                  title="Save Custom Item"
                  onPress={handleSave}
                  loading={saving}
                />

                <AppButton
                  title="Open Saved Custom Items"
                  variant="secondary"
                  onPress={() => navigation.navigate("SavedCustomItems", { tripId })}
                />
              </View>
            </AppCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    lineHeight: 22,
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
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionButton: {
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  toggleBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  successCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
  },
});