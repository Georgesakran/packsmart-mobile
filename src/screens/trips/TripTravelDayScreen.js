import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripItems } from "../../api/tripApi";
import client from "../../api/client";

export default function TripTravelDayScreen({ route }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    wearOnTravelDayCount: 0,
    keepAccessibleCount: 0,
    normalCount: 0,
    wearOnTravelDay: [],
    keepAccessible: [],
    normal: [],
  });
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const loadTravelDayData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [tripData, itemsData, summaryResponse] = await Promise.all([
        getTripById(tripId),
        getTripItems(tripId),
        client.get(`/trips/${tripId}/travel-day-summary`),
      ]);

      setTrip(tripData || null);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setSummary(
        summaryResponse.data || {
          totalItems: 0,
          wearOnTravelDayCount: 0,
          keepAccessibleCount: 0,
          normalCount: 0,
          wearOnTravelDay: [],
          keepAccessible: [],
          normal: [],
        }
      );
    } catch (err) {
      console.error("Load travel day data error:", err);
      setError(
        err?.response?.data?.message || "Failed to load travel day plan."
      );
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTravelDayData();
  }, [loadTravelDayData]);

  const updateTravelDayMode = async (itemId, travelDayMode) => {
    try {
      setUpdatingItemId(itemId);
      setActionMessage("");
      setError("");

      const response = await client.put(
        `/trips/${tripId}/items/${itemId}/travel-day-mode`,
        { travelDayMode }
      );

      setActionMessage(
        response.data?.message || "Travel day mode updated successfully."
      );

      await loadTravelDayData();
    } catch (err) {
      console.error("Update travel day mode error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update travel day mode."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const normalizedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      displayName:
        item.custom_name ||
        item.base_item_name ||
        item.name ||
        `Item #${item.item_id || item.id}`,
      travelDayMode: item.travelDayMode || item.travel_day_mode || "normal",
    }));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return normalizedItems;

    return normalizedItems.filter((item) => {
      if (filter === "wear_on_travel_day") {
        return item.travelDayMode === "wear_on_travel_day";
      }
      if (filter === "keep_accessible") {
        return item.travelDayMode === "keep_accessible";
      }
      if (filter === "normal") {
        return item.travelDayMode === "normal";
      }
      return true;
    });
  }, [normalizedItems, filter]);

  const groupedItems = useMemo(() => {
    return {
      wearOnTravelDay: filteredItems.filter(
        (item) => item.travelDayMode === "wear_on_travel_day"
      ),
      keepAccessible: filteredItems.filter(
        (item) => item.travelDayMode === "keep_accessible"
      ),
      normal: filteredItems.filter((item) => item.travelDayMode === "normal"),
    };
  }, [filteredItems]);

  const renderItemCard = (item) => (
    <View key={item.id} style={styles.itemCard}>
      <View style={styles.itemTopRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {item.displayName} × {item.quantity || 1}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Priority: </Text>
              {item.priority || "recommended"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Bag: </Text>
              {item.assigned_bag_name && item.assigned_bag_role
                ? `${item.assigned_bag_name} (${item.assigned_bag_role})`
                : item.preferredBagRole
                ? `Auto / preferred: ${item.preferredBagRole}`
                : "Auto"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.modeBadge,
            item.travelDayMode === "wear_on_travel_day"
              ? styles.modeWearBadge
              : item.travelDayMode === "keep_accessible"
              ? styles.modeAccessibleBadge
              : styles.modeNormalBadge,
          ]}
        >
          <Text
            style={[
              styles.modeBadgeText,
              item.travelDayMode === "wear_on_travel_day"
                ? styles.modeWearBadgeText
                : item.travelDayMode === "keep_accessible"
                ? styles.modeAccessibleBadgeText
                : styles.modeNormalBadgeText,
            ]}
          >
            {item.travelDayMode === "wear_on_travel_day"
              ? "Wear Today"
              : item.travelDayMode === "keep_accessible"
              ? "Accessible"
              : "Normal"}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.secondaryButton}
          disabled={updatingItemId === item.id}
          onPress={() => updateTravelDayMode(item.id, "wear_on_travel_day")}
        >
          <Text style={styles.secondaryButtonText}>Wear on Travel Day</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          disabled={updatingItemId === item.id}
          onPress={() => updateTravelDayMode(item.id, "keep_accessible")}
        >
          <Text style={styles.secondaryButtonText}>Keep Accessible</Text>
        </Pressable>

        <Pressable
          style={styles.normalButton}
          disabled={updatingItemId === item.id}
          onPress={() => updateTravelDayMode(item.id, "normal")}
        >
          <Text style={styles.normalButtonText}>Set Normal</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading travel day plan...</Text>
        </View>
      </AppScreen>
    );
  }

  if (error && items.length === 0) {
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Travel Day</Text>
          <Text style={styles.title}>{trip?.trip_name || "Travel Day Plan"}</Text>
          <Text style={styles.subtitle}>
            Decide what to wear, what to keep close, and what stays packed.
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Travel Day Summary</Text>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total</Text>
                <Text style={styles.summaryMiniValue}>{summary.totalItems}</Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Wear Today</Text>
                <Text style={styles.summaryMiniValue}>
                  {summary.wearOnTravelDayCount}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Accessible</Text>
                <Text style={styles.summaryMiniValue}>
                  {summary.keepAccessibleCount}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Normal</Text>
                <Text style={styles.summaryMiniValue}>{summary.normalCount}</Text>
              </View>
            </View>
          </View>

          {actionMessage ? (
            <View style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.filtersCard}>
            <Text style={styles.sectionTitle}>Filters</Text>

            <View style={styles.filtersRow}>
              <Pressable
                style={[
                  styles.filterChip,
                  filter === "all" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("all")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "all" && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterChip,
                  filter === "wear_on_travel_day" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("wear_on_travel_day")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "wear_on_travel_day" && styles.filterChipTextActive,
                  ]}
                >
                  Wear Today
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterChip,
                  filter === "keep_accessible" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("keep_accessible")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "keep_accessible" && styles.filterChipTextActive,
                  ]}
                >
                  Accessible
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterChip,
                  filter === "normal" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("normal")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "normal" && styles.filterChipTextActive,
                  ]}
                >
                  Normal
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Wear on Travel Day</Text>
            <Text style={styles.sectionSubtitle}>
              Items you plan to wear during transit.
            </Text>

            {groupedItems.wearOnTravelDay.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No items are marked to wear on travel day.
                </Text>
              </View>
            ) : (
              groupedItems.wearOnTravelDay.map(renderItemCard)
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Keep Accessible</Text>
            <Text style={styles.sectionSubtitle}>
              Items you want close and easy to reach during travel.
            </Text>

            {groupedItems.keepAccessible.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No items are marked as keep accessible.
                </Text>
              </View>
            ) : (
              groupedItems.keepAccessible.map(renderItemCard)
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Normal Packed Items</Text>
            <Text style={styles.sectionSubtitle}>
              Items that stay in your normal luggage plan.
            </Text>

            {groupedItems.normal.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No items are currently marked as normal.
                </Text>
              </View>
            ) : (
              groupedItems.normal.map(renderItemCard)
            )}
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryMiniCard: {
    minWidth: "47%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  summaryMiniLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryMiniValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  filtersCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: "#dbeafe",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  filterChipTextActive: {
    color: "#1d4ed8",
  },
  successCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metaRow: {
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  modeBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modeWearBadge: {
    backgroundColor: "#dbeafe",
  },
  modeWearBadgeText: {
    color: "#1d4ed8",
  },
  modeAccessibleBadge: {
    backgroundColor: "#dcfce7",
  },
  modeAccessibleBadgeText: {
    color: "#166534",
  },
  modeNormalBadge: {
    backgroundColor: "#e5e7eb",
  },
  modeNormalBadgeText: {
    color: "#374151",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  normalButton: {
    backgroundColor: "#ede9fe",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  normalButtonText: {
    color: "#6d28d9",
    fontSize: 13,
    fontWeight: "700",
  },
});