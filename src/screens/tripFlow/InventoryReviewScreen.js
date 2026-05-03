import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  getTripItems,
  updateTripItem,
  deleteTripItem,
} from "../../api/tripApi";

function prettifyCategory(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCategoryTone(category = "") {
  const key = String(category || "").toLowerCase();

  switch (key) {
    case "clothing":
    case "bottoms":
    case "outerwear":
      return {
        bg: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
      };
    case "underwear":
      return {
        bg: "#f8fafc",
        border: "#cbd5e1",
        text: "#475569",
      };
    case "shoes":
      return {
        bg: "#f0fdf4",
        border: "#bbf7d0",
        text: "#15803d",
      };
    case "toiletries":
      return {
        bg: "#fffbeb",
        border: "#fde68a",
        text: "#b45309",
      };
    case "tech":
      return {
        bg: "#eef2ff",
        border: "#c7d2fe",
        text: "#4338ca",
      };
    case "documents":
      return {
        bg: "#faf5ff",
        border: "#e9d5ff",
        text: "#7e22ce",
      };
    case "accessories":
      return {
        bg: "#fdf2f8",
        border: "#fbcfe8",
        text: "#be185d",
      };
    default:
      return {
        bg: "#f8fafc",
        border: "#e2e8f0",
        text: "#334155",
      };
  }
}

function getPackBehaviorLabel(value = "normal") {
  switch (String(value || "normal").toLowerCase()) {
    case "keep_accessible":
      return "Keep Accessible";
    case "wear_on_travel_day":
      return "Wear on Travel Day";
    default:
      return "Pack Normally";
  }
}

export default function InventoryReviewScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [busyItemId, setBusyItemId] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadItems = useCallback(async (showLoader = true) => {
    try {
      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      if (showLoader) setLoading(true);
      setError("");

      const response = await getTripItems(tripId);
      const normalized = Array.isArray(response) ? response : [];
      setItems(normalized);
    } catch (err) {
      console.error("Load trip items error:", err);
      setError(err?.response?.data?.message || "Failed to load trip items.");
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadItems(true);
  }, [loadItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems(false);
  };

  const totalItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [items]);

  const groupedCount = useMemo(() => {
    return new Set(items.map((item) => item.category || "misc")).size;
  }, [items]);

  const accessibleCount = useMemo(() => {
    return items.filter(
      (item) => String(item.pack_behavior || "normal") === "keep_accessible"
    ).length;
  }, [items]);

  const travelDayCount = useMemo(() => {
    return items.filter(
      (item) => String(item.pack_behavior || "normal") === "wear_on_travel_day"
    ).length;
  }, [items]);

  const visibleItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aName = String(a.custom_name || a.base_item_name || a.name || "").toLowerCase();
      const bName = String(b.custom_name || b.base_item_name || b.name || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [items]);

  const updateItemBehavior = async (item, nextBehavior) => {
    try {
      setBusyItemId(item.id);
      setError("");
      setActionMessage("");

      await updateTripItem(tripId, item.id, {
        customName: item.custom_name || item.base_item_name || item.name || "Item",
        quantity: Number(item.quantity || 1),
        category: item.category || "misc",
        sizeCode: item.size_code || null,
        packBehavior: nextBehavior,
        baseVolumeCm3: Number(item.base_volume_cm3 || 0),
        baseWeightG: Number(item.base_weight_g || 0),
        assignedBagId: item.assigned_bag_id || null,
      });

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, pack_behavior: nextBehavior }
            : entry
        )
      );

      setActionMessage("Item preference updated.");
    } catch (err) {
      console.error("Update item behavior error:", err);
      setError(err?.response?.data?.message || "Failed to update item preference.");
    } finally {
      setBusyItemId(null);
    }
  };

  const changeQuantity = async (item, delta) => {
    try {
      const currentQty = Number(item.quantity || 1);
      const nextQty = currentQty + delta;

      if (nextQty < 1) {
        handleDeleteItem(item);
        return;
      }

      setBusyItemId(item.id);
      setError("");
      setActionMessage("");

      await updateTripItem(tripId, item.id, {
        customName: item.custom_name || item.base_item_name || item.name || "Item",
        quantity: nextQty,
        category: item.category || "misc",
        sizeCode: item.size_code || null,
        packBehavior: item.pack_behavior || "normal",
        baseVolumeCm3: Number(item.base_volume_cm3 || 0),
        baseWeightG: Number(item.base_weight_g || 0),
        assignedBagId: item.assigned_bag_id || null,
      });

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: nextQty } : entry
        )
      );

      setActionMessage("Item quantity updated.");
    } catch (err) {
      console.error("Update quantity error:", err);
      setError(err?.response?.data?.message || "Failed to update item quantity.");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteItem = (item) => {
    const itemName =
      item.custom_name || item.base_item_name || item.name || "this item";

    Alert.alert(
      "Remove item?",
      `Do you want to remove ${itemName} from the trip?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setBusyItemId(item.id);
              setError("");
              setActionMessage("");

              await deleteTripItem(tripId, item.id);
              setItems((prev) => prev.filter((entry) => entry.id !== item.id));

              setActionMessage("Item removed from trip.");
            } catch (err) {
              console.error("Delete item error:", err);
              setError(err?.response?.data?.message || "Failed to remove item.");
            } finally {
              setBusyItemId(null);
            }
          },
        },
      ]
    );
  };

  const handleContinueToSimulation = () => {
    if (!tripId) {
      setError("Trip ID is missing.");
      return;
    }

    if (items.length === 0) {
      Alert.alert(
        "No items yet",
        "You need at least a few items before starting the simulation."
      );
      return;
    }

    navigation.navigate("PackingSimulation", { tripId });
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip items...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart vNext</Text>
          <Text style={styles.title}>Inventory Review</Text>
          <Text style={styles.subtitle}>
            Final quick review before PackSmart calculates the best packing result.
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

          <AppCard>
            <SectionHeader
              title="Refinement Summary"
              subtitle="Simple trip-level review before simulation."
            />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{totalItemCount}</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Categories</Text>
                <Text style={styles.summaryValue}>{groupedCount}</Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCardSoft}>
                <Text style={styles.summaryLabel}>Accessible</Text>
                <Text style={styles.summaryValue}>{accessibleCount}</Text>
              </View>

              <View style={styles.summaryCardSoft}>
                <Text style={styles.summaryLabel}>Travel Day</Text>
                <Text style={styles.summaryValue}>{travelDayCount}</Text>
              </View>
            </View>
          </AppCard>

          <AppCard style={styles.infoCard}>
            <SectionHeader
              title="How to use this screen"
              subtitle="Keep it light. Only mark special items if needed."
            />

            <View style={styles.infoList}>
              <Text style={styles.infoText}>• Pack Normally → default for most items</Text>
              <Text style={styles.infoText}>• Keep Accessible → passport, charger, medicine, documents</Text>
              <Text style={styles.infoText}>• Wear on Travel Day → shoes, jacket, hoodie, bulky clothing</Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Trip Items"
              subtitle="Refine only what matters. PackSmart will handle the rest."
            />

            {visibleItems.length === 0 ? (
              <EmptyState
                title="Your trip inventory is still empty"
                description="Go back and add a few basics first, then come back here for the final review."
              />
            ) : (
              <View style={styles.itemsList}>
                {visibleItems.map((item) => {
                  const name =
                    item.custom_name || item.base_item_name || item.name || "Item";
                  const quantity = Number(item.quantity || 1);
                  const tone = getCategoryTone(item.category);
                  const currentBehavior = String(item.pack_behavior || "normal");
                  const isBusy = busyItemId === item.id;

                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemTopRow}>
                        <View style={styles.itemTextWrap}>
                          <Text style={styles.itemTitle}>{name}</Text>
                          <Text style={styles.itemMeta}>
                            {prettifyCategory(item.category || "misc")}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.categoryBadge,
                            {
                              backgroundColor: tone.bg,
                              borderColor: tone.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryBadgeText,
                              { color: tone.text },
                            ]}
                          >
                            {prettifyCategory(item.category || "misc")}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.behaviorHeader}>
                        <Text style={styles.behaviorLabel}>Packing Preference</Text>
                        <Text style={styles.behaviorValue}>
                          {getPackBehaviorLabel(currentBehavior)}
                        </Text>
                      </View>

                      <View style={styles.behaviorButtonsWrap}>
                        <AppButton
                          title="Pack Normally"
                          variant={currentBehavior === "normal" ? "primary" : "secondary"}
                          size="sm"
                          onPress={() => updateItemBehavior(item, "normal")}
                          disabled={isBusy}
                          style={styles.behaviorButton}
                        />

                        <AppButton
                          title="Keep Accessible"
                          variant={currentBehavior === "keep_accessible" ? "primary" : "secondary"}
                          size="sm"
                          onPress={() => updateItemBehavior(item, "keep_accessible")}
                          disabled={isBusy}
                          style={styles.behaviorButton}
                        />

                        <AppButton
                          title="Wear on Travel Day"
                          variant={currentBehavior === "wear_on_travel_day" ? "primary" : "secondary"}
                          size="sm"
                          onPress={() => updateItemBehavior(item, "wear_on_travel_day")}
                          disabled={isBusy}
                          style={styles.behaviorButton}
                        />
                      </View>

                      <View style={styles.itemActionsRow}>
                        <View style={styles.quantityWrap}>
                          <AppButton
                            title="−"
                            variant="secondary"
                            size="sm"
                            fullWidth={false}
                            disabled={isBusy}
                            onPress={() => changeQuantity(item, -1)}
                            style={styles.qtyButton}
                          />

                          <View style={styles.qtyValueWrap}>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                          </View>

                          <AppButton
                            title="+"
                            variant="secondary"
                            size="sm"
                            fullWidth={false}
                            disabled={isBusy}
                            onPress={() => changeQuantity(item, 1)}
                            style={styles.qtyButton}
                          />
                        </View>

                        <AppButton
                          title={isBusy ? "Working..." : "Remove"}
                          variant="secondary"
                          size="sm"
                          fullWidth={false}
                          disabled={isBusy}
                          onPress={() => handleDeleteItem(item)}
                          style={styles.removeButton}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Next Step"
              subtitle="Start the simulation when your item list looks good enough."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title="Continue to Packing Simulation"
                onPress={handleContinueToSimulation}
                size="md"
              />

              <AppButton
                title="Back to Trip Items"
                variant="secondary"
                onPress={() => navigation.navigate("TripItems", { tripId })}
                size="md"
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
    flexGrow: 1,
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
    fontWeight: "800",
    color: colors.secondary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
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
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  summaryCardSoft: {
    flex: 1,
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 16,
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  infoCard: {
    backgroundColor: "#f8fbff",
    borderColor: "#dbeafe",
  },
  infoList: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: spacing.md,
    gap: spacing.md,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
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
  itemMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  behaviorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  behaviorLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  behaviorValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
  behaviorButtonsWrap: {
    gap: spacing.sm,
  },
  behaviorButton: {},
  itemActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  quantityWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyButton: {
    width: 42,
    minHeight: 40,
    paddingHorizontal: 0,
  },
  qtyValueWrap: {
    minWidth: 34,
    alignItems: "center",
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  removeButton: {
    minWidth: 96,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});