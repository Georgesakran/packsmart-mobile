import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  applySuggestedItemsToTrip,
  getSuggestedItemsForTrip,
  getTripById,
} from "../../api/tripApi";

const SECTION_ORDER = [
  { key: "essentials", label: "Essentials" },
  { key: "clothing", label: "Clothing" },
  { key: "toiletries", label: "Toiletries" },
  { key: "tech", label: "Tech" },
  { key: "accessories", label: "Accessories" },
  { key: "shoes", label: "Shoes" },
];

export default function SuggestedItemsScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [tripData, suggestionData] = await Promise.all([
          getTripById(tripId),
          getSuggestedItemsForTrip(tripId),
        ]);

        setTrip(tripData || null);
        setGroupedItems(suggestionData?.grouped || {});
        setWarnings(Array.isArray(suggestionData?.warnings) ? suggestionData.warnings : []);
      } catch (err) {
        console.error("Load suggested items error:", err);
        setError(
          err?.response?.data?.message || "Failed to load suggested items."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  const totalSelectedItems = useMemo(() => {
    return Object.values(groupedItems).reduce((total, items) => {
      if (!Array.isArray(items)) return total;
      return (
        total +
        items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      );
    }, 0);
  }, [groupedItems]);

  const hasAnyItems = useMemo(() => {
    return Object.values(groupedItems).some(
      (items) => Array.isArray(items) && items.length > 0
    );
  }, [groupedItems]);

  const updateItemQuantity = (groupKey, index, delta) => {
    setGroupedItems((prev) => {
      const currentGroup = Array.isArray(prev[groupKey]) ? [...prev[groupKey]] : [];
      const item = currentGroup[index];
      if (!item) return prev;

      const nextQuantity = Number(item.quantity || 0) + delta;

      if (nextQuantity <= 0) {
        currentGroup.splice(index, 1);
      } else {
        currentGroup[index] = {
          ...item,
          quantity: nextQuantity,
        };
      }

      return {
        ...prev,
        [groupKey]: currentGroup,
      };
    });
  };

  const removeItem = (groupKey, index) => {
    setGroupedItems((prev) => {
      const currentGroup = Array.isArray(prev[groupKey]) ? [...prev[groupKey]] : [];
      currentGroup.splice(index, 1);

      return {
        ...prev,
        [groupKey]: currentGroup,
      };
    });
  };

  const flattenedItems = useMemo(() => {
    return SECTION_ORDER.flatMap((section) =>
      Array.isArray(groupedItems[section.key]) ? groupedItems[section.key] : []
    );
  }, [groupedItems]);

  const handleApplySuggestedItems = async () => {
    try {
      setSaving(true);
      setError("");
      setActionMessage("");

      if (flattenedItems.length === 0) {
        setError("There are no suggested items to apply.");
        return;
      }

      await applySuggestedItemsToTrip(tripId, flattenedItems, true);

      setActionMessage("Suggested items applied successfully.");

      navigation.navigate("TripCalculationResults", { tripId });
    } catch (err) {
      console.error("Apply suggested items error:", err);
      setError(
        err?.response?.data?.message || "Failed to apply suggested items."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading suggested items...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trips / Suggested Items</Text>
          <Text style={styles.title}>Suggested Packing List</Text>
          <Text style={styles.subtitle}>
            Review the smart item suggestions for this trip before continuing.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          {actionMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </AppCard>
          ) : null}

          <AppButton
            title="Add Custom Item"
            variant="secondary"
            onPress={() => navigation.navigate("AddCustomItem", { tripId })}
          />

          <AppButton
            title="Open Saved Custom Items"
            variant="secondary"
            onPress={() => navigation.navigate("SavedCustomItems", { tripId })}
          />

          <AppCard>
            <SectionHeader
              title="Trip Context"
              subtitle="These suggestions are based on your current trip setup."
            />

            <View style={styles.metaGroup}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Trip: </Text>
                {trip?.trip_name || "Unnamed Trip"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Destination: </Text>
                {trip?.destination ||
                  `${trip?.destination_city || ""}${
                    trip?.destination_city && trip?.destination_country ? ", " : ""
                  }${trip?.destination_country || ""}` ||
                  "—"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Duration: </Text>
                {trip?.duration_days || 0} day
                {Number(trip?.duration_days || 0) === 1 ? "" : "s"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Travelers: </Text>
                {trip?.traveler_count || 1}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Trip Type: </Text>
                {trip?.trip_type || trip?.travel_type || "casual"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Packing Mode: </Text>
                {trip?.packing_mode || "balanced"}
              </Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Warnings"
              subtitle="Important notes based on the current bag setup and trip type."
            />

            {warnings.length === 0 ? (
              <EmptyState
                title="No warnings"
                description="The current trip setup looks good so far."
              />
            ) : (
              warnings.map((warning, index) => (
                <View key={`${warning}-${index}`} style={styles.warningCard}>
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Suggested Items"
              subtitle="Adjust quantities, remove items, and confirm the list."
            />

            {!hasAnyItems ? (
              <EmptyState
                title="No suggested items"
                description="No suggested items were generated for this trip."
              />
            ) : (
              SECTION_ORDER.map((section) => {
                const items = Array.isArray(groupedItems[section.key])
                  ? groupedItems[section.key]
                  : [];

                if (items.length === 0) return null;

                return (
                  <View key={section.key} style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>{section.label}</Text>

                    {items.map((item, index) => (
                      <View
                        key={`${section.key}-${item.itemId || item.displayName}-${index}`}
                        style={styles.itemCard}
                      >
                        <View style={styles.itemHeader}>
                          <View style={styles.itemTextWrap}>
                            <Text style={styles.itemTitle}>
                              {item.displayName || item.customName || "Item"}
                            </Text>
                            <Text style={styles.itemSubtitle}>
                              {item.category || "misc"} • {item.packBehavior || "standard"}
                            </Text>
                          </View>

                          {item.isEssential ? (
                            <StatusBadge label="Essential" tone="success" />
                          ) : (
                            <StatusBadge label="Optional" tone="info" />
                          )}
                        </View>

                        <View style={styles.itemMetaWrap}>
                          <Text style={styles.itemMetaText}>
                            <Text style={styles.metaLabel}>Volume: </Text>
                            {item.baseVolumeCm3} cm³
                          </Text>

                          <Text style={styles.itemMetaText}>
                            <Text style={styles.metaLabel}>Weight: </Text>
                            {item.baseWeightG} g
                          </Text>
                        </View>

                        <View style={styles.itemActionsRow}>
                          <AppButton
                            title="-"
                            variant="secondary"
                            onPress={() => updateItemQuantity(section.key, index, -1)}
                            style={styles.counterButton}
                          />

                          <View style={styles.quantityBox}>
                            <Text style={styles.quantityLabel}>Quantity</Text>
                            <Text style={styles.quantityValue}>
                              {item.quantity || 1}
                            </Text>
                          </View>

                          <AppButton
                            title="+"
                            variant="secondary"
                            onPress={() => updateItemQuantity(section.key, index, 1)}
                            style={styles.counterButton}
                          />
                        </View>

                        <AppButton
                          title="Remove Item"
                          variant="secondary"
                          onPress={() => removeItem(section.key, index)}
                        />
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Final Review"
              subtitle="Apply the current suggested list to this trip."
            />

            <Text style={styles.finalText}>
              <Text style={styles.metaLabel}>Total Items: </Text>
              {totalSelectedItems}
            </Text>

            <Text style={styles.finalText}>
              <Text style={styles.metaLabel}>Unique Entries: </Text>
              {flattenedItems.length}
            </Text>

            <AppButton
              title="Apply Suggested Items"
              onPress={handleApplySuggestedItems}
              loading={saving}
              style={styles.saveButton}
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
    lineHeight: 22,
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
  metaGroup: {
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  warningCard: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  sectionBlock: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  itemMetaWrap: {
    gap: 6,
    marginBottom: spacing.md,
  },
  itemMetaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  itemActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  counterButton: {
    width: 56,
  },
  quantityBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
  },
  quantityLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  finalText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});