import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { deleteTripBag, updateTripBag } from "../../api/tripApi";

export default function EditTripBagScreen({ route, navigation }) {
  const { tripId, bag } = route.params || {};

  const [name, setName] = useState(bag?.name || "");
  const [bagRole, setBagRole] = useState(bag?.bag_role || bag?.bagRole || "main");
  const [volumeCm3, setVolumeCm3] = useState(
    String(bag?.volume_cm3 || bag?.volumeCm3 || "")
  );
  const [maxWeightKg, setMaxWeightKg] = useState(
    String(bag?.max_weight_kg || bag?.maxWeightKg || "")
  );
  const [lengthCm, setLengthCm] = useState(
    bag?.length_cm ? String(bag.length_cm) : ""
  );
  const [widthCm, setWidthCm] = useState(
    bag?.width_cm ? String(bag.width_cm) : ""
  );
  const [heightCm, setHeightCm] = useState(
    bag?.height_cm ? String(bag.height_cm) : ""
  );
  const [isPrimary, setIsPrimary] = useState(!!bag?.is_primary || !!bag?.isPrimary);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError("");

      await updateTripBag(tripId, bag.id, {
        suitcaseType: bag?.suitcase_type || bag?.suitcaseType || "custom",
        name,
        volumeCm3: Number(volumeCm3),
        maxWeightKg: Number(maxWeightKg),
        lengthCm: lengthCm ? Number(lengthCm) : null,
        widthCm: widthCm ? Number(widthCm) : null,
        heightCm: heightCm ? Number(heightCm) : null,
        isCustom: true,
        bagRole,
        isPrimary,
      });

      navigation.goBack();
    } catch (err) {
      console.error("Update trip bag error:", err);
      setError(err?.response?.data?.message || "Failed to update bag.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Bag",
      "Are you sure you want to delete this bag from the trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDelete,
        },
      ]
    );
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError("");

      await deleteTripBag(tripId, bag.id);

      navigation.goBack();
    } catch (err) {
      console.error("Delete trip bag error:", err);
      setError(err?.response?.data?.message || "Failed to delete bag.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Bags / Edit</Text>
          <Text style={styles.title}>Edit Bag</Text>
          <Text style={styles.subtitle}>
            Update this bag or remove it from the trip.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Bag Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Cabin Carry-On"
            />

            <Text style={styles.label}>Bag Role</Text>
            <View style={styles.chipsRow}>
              {["main", "carry_on", "personal", "extra"].map((role) => (
                <Pressable
                  key={role}
                  style={[styles.chip, bagRole === role && styles.chipActive]}
                  onPress={() => setBagRole(role)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      bagRole === role && styles.chipTextActive,
                    ]}
                  >
                    {role}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Volume (cm³)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={volumeCm3}
              onChangeText={setVolumeCm3}
            />

            <Text style={styles.label}>Max Weight (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={maxWeightKg}
              onChangeText={setMaxWeightKg}
            />

            <Text style={styles.label}>Length (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={lengthCm}
              onChangeText={setLengthCm}
            />

            <Text style={styles.label}>Width (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={widthCm}
              onChangeText={setWidthCm}
            />

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCm}
            />

            <Text style={styles.label}>Primary Bag</Text>
            <View style={styles.chipsRow}>
              <Pressable
                style={[styles.chip, isPrimary && styles.chipActive]}
                onPress={() => setIsPrimary(true)}
              >
                <Text
                  style={[styles.chipText, isPrimary && styles.chipTextActive]}
                >
                  Yes
                </Text>
              </Pressable>

              <Pressable
                style={[styles.chip, !isPrimary && styles.chipActive]}
                onPress={() => setIsPrimary(false)}
              >
                <Text
                  style={[styles.chipText, !isPrimary && styles.chipTextActive]}
                >
                  No
                </Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={styles.primaryButton}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Bag</Text>
              )}
            </Pressable>
          </View>
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
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#e5e7eb",
  },
  chipActive: {
    backgroundColor: "#dbeafe",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: "#1d4ed8",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.md,
  },
});