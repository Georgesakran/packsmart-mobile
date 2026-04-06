import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { createTripItem, getTripSuitcases } from "../../api/tripApi";

export default function AddTripItemScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("custom");
  const [sizeCode, setSizeCode] = useState("");
  const [packBehavior, setPackBehavior] = useState("foldable");
  const [baseVolumeCm3, setBaseVolumeCm3] = useState("");
  const [baseWeightG, setBaseWeightG] = useState("");
  const [assignedBagId, setAssignedBagId] = useState("");

  const [bags, setBags] = useState([]);
  const [loadingBags, setLoadingBags] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBags = async () => {
      try {
        setLoadingBags(true);
        const data = await getTripSuitcases(tripId);
        setBags(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load bags for item create error:", err);
      } finally {
        setLoadingBags(false);
      }
    };

    loadBags();
  }, [tripId]);

  const handleCreateItem = async () => {
    try {
      setSubmitting(true);
      setError("");

      await createTripItem(tripId, {
        customName,
        quantity: Number(quantity),
        category,
        sizeCode: sizeCode || null,
        packBehavior,
        baseVolumeCm3: Number(baseVolumeCm3),
        baseWeightG: Number(baseWeightG),
        assignedBagId: assignedBagId ? Number(assignedBagId) : null,
      });

      navigation.goBack();
    } catch (err) {
      console.error("Create trip item error:", err);
      setError(err?.response?.data?.message || "Failed to create item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Items / Create</Text>
          <Text style={styles.title}>Add Custom Item</Text>
          <Text style={styles.subtitle}>
            Create a manual item directly from your mobile app.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Beach Towel"
              value={customName}
              onChangeText={setCustomName}
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipsRow}>
              {["custom", "tops", "bottoms", "shoes", "accessories", "tech"].map((value) => (
                <Pressable
                  key={value}
                  style={[styles.chip, category === value && styles.chipActive]}
                  onPress={() => setCategory(value)}
                >
                  <Text
                    style={[styles.chipText, category === value && styles.chipTextActive]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Size Code (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="M"
              value={sizeCode}
              onChangeText={setSizeCode}
            />

            <Text style={styles.label}>Pack Behavior</Text>
            <View style={styles.chipsRow}>
              {["foldable", "compressible", "rigid", "semi-rigid"].map((value) => (
                <Pressable
                  key={value}
                  style={[styles.chip, packBehavior === value && styles.chipActive]}
                  onPress={() => setPackBehavior(value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      packBehavior === value && styles.chipTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Base Volume (cm³)</Text>
            <TextInput
              style={styles.input}
              placeholder="2500"
              keyboardType="numeric"
              value={baseVolumeCm3}
              onChangeText={setBaseVolumeCm3}
            />

            <Text style={styles.label}>Base Weight (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="500"
              keyboardType="numeric"
              value={baseWeightG}
              onChangeText={setBaseWeightG}
            />

            <Text style={styles.label}>Assign to Bag (optional)</Text>
            {loadingBags ? (
              <Text style={styles.helperText}>Loading bags...</Text>
            ) : bags.length === 0 ? (
              <Text style={styles.helperText}>No bags available. Item will stay auto-assigned.</Text>
            ) : (
              <View style={styles.chipsRow}>
                <Pressable
                  style={[styles.chip, assignedBagId === "" && styles.chipActive]}
                  onPress={() => setAssignedBagId("")}
                >
                  <Text
                    style={[styles.chipText, assignedBagId === "" && styles.chipTextActive]}
                  >
                    Auto
                  </Text>
                </Pressable>

                {bags.map((bag) => (
                  <Pressable
                    key={bag.id}
                    style={[
                      styles.chip,
                      assignedBagId === String(bag.id) && styles.chipActive,
                    ]}
                    onPress={() => setAssignedBagId(String(bag.id))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        assignedBagId === String(bag.id) && styles.chipTextActive,
                      ]}
                    >
                      {bag.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={styles.primaryButton}
              onPress={handleCreateItem}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Add Item</Text>
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
  helperText: {
    fontSize: 14,
    color: colors.textMuted,
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
  errorText: {
    color: colors.danger,
    marginTop: spacing.md,
  },
});