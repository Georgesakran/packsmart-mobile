import React, { useCallback, useEffect, useState } from "react";
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
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripItems } from "../../api/tripApi";

export default function TripItemsScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [tripData, itemsData] = await Promise.all([
        getTripById(tripId),
        getTripItems(tripId),
      ]);

      setTrip(tripData || null);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error("Load trip items error:", err);
      setError(err?.response?.data?.message || "Failed to load trip items.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadItems();
    });

    return unsubscribe;
  }, [navigation, loadItems]);

  const getDisplayName = (item) => {
    return (
      item.custom_name ||
      item.base_item_name ||
      item.name ||
      `Item #${item.item_id || item.id}`
    );
  };

  const getPackingStatus = (item) => {
    return item.packingStatus || item.packing_status || "pending";
  };

  const getPackingTone = (item) => {
    const status = getPackingStatus(item);

    if (status === "packed") return "success";
    if (status === "wear_on_travel_day") return "info";
    if (status === "skip") return "danger";
    return "neutral";
  };

  const getPackingLabel = (item) => {
    const status = getPackingStatus(item);

    if (status === "packed") return "Packed";
    if (status === "wear_on_travel_day") return "Travel Day";
    if (status === "skip") return "Skipped";
    return "Pending";
  };

  const getTravelDayMode = (item) => {
    const mode = item.travelDayMode || item.travel_day_mode || "normal";

    if (mode === "wear_on_travel_day") return "Wear Today";
    if (mode === "keep_accessible") return "Accessible";
    return "Normal";
  };

  const getPriorityTone = (item) => {
    const priority = item.priority || "recommended";

    if (priority === "essential") return "danger";
    if (priority === "optional") return "neutral";
    return "warning";
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Items</Text>
          <Text style={styles.title}>{trip?.trip_name || "Trip Items"}</Text>
          <Text style={styles.subtitle}>
            Review, add, and manage all items linked to this trip.
          </Text>

          <View style={styles.topActionsRow}>
            <AppButton
              title="Add Item"
              onPress={() =>
                navigation.navigate("AddTripItem", {
                  tripId,
                })
              }
              style={styles.flexButton}
            />

            <AppButton
              title="Apply Template"
              variant="secondary"
              onPress={() =>
                navigation.navigate("ApplyTemplate", {
                  tripId,
                })
              }
              style={styles.flexButton}
            />
          </View>

          <AppButton
            title="Refresh"
            variant="secondary"
            onPress={loadItems}
          />

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Items Summary"
              subtitle="A quick view of the current item setup for this trip."
            />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total Items</Text>
                <Text style={styles.summaryMiniValue}>{items.length}</Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Packed/Updated</Text>
                <Text style={styles.summaryMiniValue}>
                  {
                    items.filter((item) => {
                      const status =
                        item.packingStatus || item.packing_status || "pending";
                      return status !== "pending";
                    }).length
                  }
                </Text>
              </View>
            </View>
          </AppCard>

          {items.length === 0 ? (
            <EmptyState
              title="No items added yet"
              description="This trip does not have any items assigned yet."
            />
          ) : (
            items.map((item) => (
              <AppCard key={item.id}>
                <View style={styles.itemTopRow}>
                  <View style={styles.itemTitleWrap}>
                    <Text style={styles.itemTitle}>
                      {getDisplayName(item)} × {item.quantity || 1}
                    </Text>
                    <Text style={styles.itemSubTitle}>
                      Category: {item.category || "Not set"}
                    </Text>
                  </View>

                  <StatusBadge
                    label={getPackingLabel(item)}
                    tone={getPackingTone(item)}
                  />
                </View>

                <View style={styles.badgesRow}>
                  <StatusBadge
                    label={getTravelDayMode(item)}
                    tone="info"
                  />
                  <StatusBadge
                    label={item.priority || "recommended"}
                    tone={getPriorityTone(item)}
                  />
                </View>

                <View style={styles.metaGroup}>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Size: </Text>
                    {item.size_code || item.sizeCode || "Not set"}
                  </Text>

                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Assigned Bag: </Text>
                    {item.assigned_bag_name && item.assigned_bag_role
                      ? `${item.assigned_bag_name} (${item.assigned_bag_role})`
                      : item.preferredBagRole
                      ? `Auto / preferred: ${item.preferredBagRole}`
                      : "Auto"}
                  </Text>

                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Remove Priority: </Text>
                    {item.removePriority || item.remove_priority || "medium"}
                  </Text>
                </View>
                <AppButton
                  title="Edit Size & Fold"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate("TripItemProfileEditor", {
                      tripId,
                      tripItem: item,
                    })
                  }
                />

                <AppButton
                  title="Edit Item"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate("EditTripItem", {
                      tripId,
                      item,
                    })
                  }
                  style={styles.editButton}
                />
              </AppCard>
            ))
          )}
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
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  topActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  summaryMiniCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  summaryMiniLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  summaryMiniValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemTitleWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  itemSubTitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  editButton: {
    marginTop: spacing.lg,
  },
});