import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  const getModeTone = (mode) => {
    if (mode === "wear_on_travel_day") return "info";
    if (mode === "keep_accessible") return "success";
    return "neutral";
  };

  const getModeLabel = (mode) => {
    if (mode === "wear_on_travel_day") return "Wear Today";
    if (mode === "keep_accessible") return "Accessible";
    return "Normal";
  };

  const renderItemCard = (item) => (
    <AppCard key={item.id}>
      <View style={styles.itemTopRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {item.displayName} × {item.quantity || 1}
          </Text>

          <Text style={styles.itemSubText}>
            Priority: {item.priority || "recommended"}
          </Text>
        </View>

        <StatusBadge
          label={getModeLabel(item.travelDayMode)}
          tone={getModeTone(item.travelDayMode)}
        />
      </View>

      <View style={styles.metaGroup}>
        <Text style={styles.metaText}>
          <Text style={styles.metaLabel}>Bag: </Text>
          {item.assigned_bag_name && item.assigned_bag_role
            ? `${item.assigned_bag_name} (${item.assigned_bag_role})`
            : item.preferredBagRole
            ? `Auto / preferred: ${item.preferredBagRole}`
            : "Auto"}
        </Text>

        <Text style={styles.metaText}>
          <Text style={styles.metaLabel}>Category: </Text>
          {item.category || "Not set"}
        </Text>
      </View>

      <View style={styles.actionsGrid}>
        <AppButton
          title="Wear Today"
          variant="secondary"
          disabled={updatingItemId === item.id}
          onPress={() => updateTravelDayMode(item.id, "wear_on_travel_day")}
          style={styles.actionButton}
        />

        <AppButton
          title="Accessible"
          variant="secondary"
          disabled={updatingItemId === item.id}
          onPress={() => updateTravelDayMode(item.id, "keep_accessible")}
          style={styles.actionButton}
        />

        <AppButton
          title="Set Normal"
          variant="secondary"
          disabled={updatingItemId === item.id}
          onPress={() => updateTravelDayMode(item.id, "normal")}
          style={styles.fullWidthAction}
        />
      </View>
    </AppCard>
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

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Travel Day</Text>
          <Text style={styles.title}>{trip?.trip_name || "Travel Day Plan"}</Text>
          <Text style={styles.subtitle}>
            Decide what to wear, what to keep close, and what stays packed.
          </Text>

          {actionMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </AppCard>
          ) : null}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Travel Day Summary"
              subtitle="A quick view of what is worn, accessible, or left as normal."
            />

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
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Filters"
              subtitle="Focus on the items you want to review now."
            />

            <View style={styles.filtersRow}>
              <AppButton
                title="All"
                variant={filter === "all" ? "primary" : "secondary"}
                onPress={() => setFilter("all")}
                style={styles.filterButton}
              />
              <AppButton
                title="Wear Today"
                variant={filter === "wear_on_travel_day" ? "primary" : "secondary"}
                onPress={() => setFilter("wear_on_travel_day")}
                style={styles.filterButton}
              />
              <AppButton
                title="Accessible"
                variant={filter === "keep_accessible" ? "primary" : "secondary"}
                onPress={() => setFilter("keep_accessible")}
                style={styles.filterButton}
              />
              <AppButton
                title="Normal"
                variant={filter === "normal" ? "primary" : "secondary"}
                onPress={() => setFilter("normal")}
                style={styles.filterButton}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Wear on Travel Day"
              subtitle="Items you plan to wear during transit."
            />

            {groupedItems.wearOnTravelDay.length === 0 ? (
              <EmptyState
                title="No wear-today items"
                description="No items are marked to wear on travel day."
              />
            ) : (
              groupedItems.wearOnTravelDay.map(renderItemCard)
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Keep Accessible"
              subtitle="Items you want easy to reach during travel."
            />

            {groupedItems.keepAccessible.length === 0 ? (
              <EmptyState
                title="No accessible items"
                description="No items are marked as keep accessible."
              />
            ) : (
              groupedItems.keepAccessible.map(renderItemCard)
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Normal Packed Items"
              subtitle="Items that stay in your normal luggage plan."
            />

            {groupedItems.normal.length === 0 ? (
              <EmptyState
                title="No normal items"
                description="No items are currently marked as normal."
              />
            ) : (
              groupedItems.normal.map(renderItemCard)
            )}
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
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
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
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryMiniCard: {
    minWidth: "47%",
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  summaryMiniLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryMiniValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
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
    marginBottom: 6,
  },
  itemSubText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metaGroup: {
    gap: 8,
    marginBottom: spacing.md,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: "47%",
  },
  fullWidthAction: {
    width: "100%",
  },
});