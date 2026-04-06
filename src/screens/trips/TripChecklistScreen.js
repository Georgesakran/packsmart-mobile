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

export default function TripChecklistScreen({ route }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    pending: 0,
    packed: 0,
    wearOnTravelDay: 0,
    skip: 0,
    completionPercent: 0,
  });
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const loadChecklistData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [tripData, itemsData, summaryResponse] = await Promise.all([
        getTripById(tripId),
        getTripItems(tripId),
        client.get(`/trips/${tripId}/checklist-summary`),
      ]);

      setTrip(tripData || null);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setSummary(
        summaryResponse.data || {
          totalItems: 0,
          pending: 0,
          packed: 0,
          wearOnTravelDay: 0,
          skip: 0,
          completionPercent: 0,
        }
      );
    } catch (err) {
      console.error("Load checklist data error:", err);
      setError(
        err?.response?.data?.message || "Failed to load trip checklist."
      );
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadChecklistData();
  }, [loadChecklistData]);

  const updatePackingStatus = async (itemId, packingStatus) => {
    try {
      setUpdatingItemId(itemId);
      setActionMessage("");
      setError("");

      const response = await client.put(
        `/trips/${tripId}/items/${itemId}/packing-status`,
        { packingStatus }
      );

      setActionMessage(
        response.data?.message || "Packing status updated successfully."
      );

      await loadChecklistData();
    } catch (err) {
      console.error("Update packing status error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update packing status."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

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

  const getPackingStatusLabel = (item) => {
    const status = getPackingStatus(item);

    if (status === "packed") return "Packed";
    if (status === "wear_on_travel_day") return "Travel Day";
    if (status === "skip") return "Skipped";
    return "Pending";
  };

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;

    return items.filter((item) => {
      const status = getPackingStatus(item);

      if (filter === "pending") return status === "pending";
      if (filter === "packed") return status === "packed";
      if (filter === "travel_day") return status === "wear_on_travel_day";
      if (filter === "skip") return status === "skip";

      return true;
    });
  }, [items, filter]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip checklist...</Text>
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
          <Text style={styles.kicker}>Trip / Checklist</Text>
          <Text style={styles.title}>{trip?.trip_name || "Trip Checklist"}</Text>
          <Text style={styles.subtitle}>
            Track what is packed, skipped, or set for travel day.
          </Text>

          <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Checklist Progress</Text>
            <Text style={styles.progressPercent}>
              {summary.completionPercent || 0}% complete
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${summary.completionPercent || 0}%` },
                ]}
              />
            </View>

            <View style={styles.miniStatsGrid}>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatLabel}>Total</Text>
                <Text style={styles.miniStatValue}>{summary.totalItems}</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatLabel}>Pending</Text>
                <Text style={styles.miniStatValue}>{summary.pending}</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatLabel}>Packed</Text>
                <Text style={styles.miniStatValue}>{summary.packed}</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatLabel}>Travel Day</Text>
                <Text style={styles.miniStatValue}>{summary.wearOnTravelDay}</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatLabel}>Skipped</Text>
                <Text style={styles.miniStatValue}>{summary.skip}</Text>
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
                  filter === "pending" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("pending")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "pending" && styles.filterChipTextActive,
                  ]}
                >
                  Pending
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterChip,
                  filter === "packed" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("packed")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "packed" && styles.filterChipTextActive,
                  ]}
                >
                  Packed
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterChip,
                  filter === "travel_day" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("travel_day")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "travel_day" && styles.filterChipTextActive,
                  ]}
                >
                  Travel Day
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterChip,
                  filter === "skip" && styles.filterChipActive,
                ]}
                onPress={() => setFilter("skip")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "skip" && styles.filterChipTextActive,
                  ]}
                >
                  Skipped
                </Text>
              </Pressable>
            </View>
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No checklist items found</Text>
              <Text style={styles.emptyText}>
                No items match the current filter.
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const status = getPackingStatus(item);

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemTitle}>
                      {getDisplayName(item)} × {item.quantity || 1}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        status === "packed"
                          ? styles.statusPacked
                          : status === "wear_on_travel_day"
                          ? styles.statusTravelDay
                          : status === "skip"
                          ? styles.statusSkipped
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          status === "packed"
                            ? styles.statusPackedText
                            : status === "wear_on_travel_day"
                            ? styles.statusTravelDayText
                            : status === "skip"
                            ? styles.statusSkippedText
                            : styles.statusPendingText,
                        ]}
                      >
                        {getPackingStatusLabel(item)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Priority: </Text>
                      {item.priority || "recommended"}
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

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.secondaryButton}
                      disabled={updatingItemId === item.id}
                      onPress={() => updatePackingStatus(item.id, "packed")}
                    >
                      <Text style={styles.secondaryButtonText}>Pack</Text>
                    </Pressable>

                    <Pressable
                      style={styles.secondaryButton}
                      disabled={updatingItemId === item.id}
                      onPress={() =>
                        updatePackingStatus(item.id, "wear_on_travel_day")
                      }
                    >
                      <Text style={styles.secondaryButtonText}>Travel Day</Text>
                    </Pressable>

                    <Pressable
                      style={styles.skipButton}
                      disabled={updatingItemId === item.id}
                      onPress={() => updatePackingStatus(item.id, "skip")}
                    >
                      <Text style={styles.skipButtonText}>Skip</Text>
                    </Pressable>

                    <Pressable
                      style={styles.secondaryButton}
                      disabled={updatingItemId === item.id}
                      onPress={() => updatePackingStatus(item.id, "pending")}
                    >
                      <Text style={styles.secondaryButtonText}>Reset</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
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
  progressCard: {
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
  progressPercent: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressBar: {
    width: "100%",
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  miniStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  miniStatCard: {
    minWidth: "30%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  miniStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  miniStatValue: {
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusPending: {
    backgroundColor: "#e5e7eb",
  },
  statusPendingText: {
    color: "#374151",
  },
  statusPacked: {
    backgroundColor: "#dcfce7",
  },
  statusPackedText: {
    color: "#166534",
  },
  statusTravelDay: {
    backgroundColor: "#dbeafe",
  },
  statusTravelDayText: {
    color: "#1d4ed8",
  },
  statusSkipped: {
    backgroundColor: "#fee2e2",
  },
  statusSkippedText: {
    color: "#b91c1c",
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
  skipButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
  },
});