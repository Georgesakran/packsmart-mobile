import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripItems } from "../../api/tripApi";

export default function TripItemsScreen({ route }) {
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

  const getPackingStatusLabel = (item) => {
    const status = item.packingStatus || item.packing_status || "pending";

    if (status === "wear_on_travel_day") return "Travel Day";
    if (status === "packed") return "Packed";
    if (status === "skip") return "Skipped";
    return "Pending";
  };

  const getTravelDayModeLabel = (item) => {
    const mode = item.travelDayMode || item.travel_day_mode || "normal";

    if (mode === "wear_on_travel_day") return "Wear on Travel Day";
    if (mode === "keep_accessible") return "Keep Accessible";
    return "Normal";
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

  if (error) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Trip / Items</Text>
        <Text style={styles.title}>{trip?.trip_name || "Trip Items"}</Text>
        <Text style={styles.subtitle}>
          Review all items linked to this trip.
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() =>
            navigation.navigate("AddTripItem", {
              tripId,
            })
          }
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </Pressable>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Items</Text>
          <Text style={styles.summaryValue}>{items.length}</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No items added yet</Text>
            <Text style={styles.emptyText}>
              This trip does not have any items assigned yet.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemName}>
                  {getDisplayName(item)} × {item.quantity || 1}
                </Text>
              </View>

              <View style={styles.badgesRow}>
                <View style={[styles.badge, styles.statusBadge]}>
                  <Text style={[styles.badgeText, styles.statusBadgeText]}>
                    {getPackingStatusLabel(item)}
                  </Text>
                </View>

                <View style={[styles.badge, styles.travelDayBadge]}>
                  <Text style={[styles.badgeText, styles.travelDayBadgeText]}>
                    {getTravelDayModeLabel(item)}
                  </Text>
                </View>

                <View style={[styles.badge, styles.priorityBadge]}>
                  <Text style={[styles.badgeText, styles.priorityBadgeText]}>
                    {item.priority || "recommended"}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Category: </Text>
                  {item.category || "Not set"}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Size: </Text>
                  {item.size_code || item.sizeCode || "Not set"}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Assigned Bag: </Text>
                  {item.assigned_bag_name && item.assigned_bag_role
                    ? `${item.assigned_bag_name} (${item.assigned_bag_role})`
                    : item.preferredBagRole
                    ? `Auto / preferred: ${item.preferredBagRole}`
                    : "Auto"}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Remove Priority: </Text>
                  {item.removePriority || "medium"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
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
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: "center",
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  itemTopRow: {
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusBadge: {
    backgroundColor: "#e5e7eb",
  },
  travelDayBadge: {
    backgroundColor: "#dbeafe",
  },
  priorityBadge: {
    backgroundColor: "#dcfce7",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgeText: {
    color: "#374151",
  },
  travelDayBadgeText: {
    color: "#1d4ed8",
  },
  priorityBadgeText: {
    color: "#166534",
    textTransform: "capitalize",
  },
  metaRow: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});