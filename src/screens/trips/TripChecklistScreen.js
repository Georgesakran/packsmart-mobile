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

  const getPackingTone = (item) => {
    const status = getPackingStatus(item);

    if (status === "packed") return "success";
    if (status === "wear_on_travel_day") return "info";
    if (status === "skip") return "danger";
    return "neutral";
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

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Checklist</Text>
          <Text style={styles.title}>{trip?.trip_name || "Trip Checklist"}</Text>
          <Text style={styles.subtitle}>
            Track what is packed, skipped, or set for travel day.
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
              title="Checklist Progress"
              subtitle="A quick progress view of packing execution."
            />

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

            <View style={styles.summaryGrid}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total</Text>
                <Text style={styles.summaryMiniValue}>{summary.totalItems}</Text>
              </View>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Pending</Text>
                <Text style={styles.summaryMiniValue}>{summary.pending}</Text>
              </View>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Packed</Text>
                <Text style={styles.summaryMiniValue}>{summary.packed}</Text>
              </View>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Travel Day</Text>
                <Text style={styles.summaryMiniValue}>{summary.wearOnTravelDay}</Text>
              </View>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Skipped</Text>
                <Text style={styles.summaryMiniValue}>{summary.skip}</Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Filters"
              subtitle="Focus on the items that matter right now."
            />

            <View style={styles.filtersRow}>
              <AppButton
                title="All"
                variant={filter === "all" ? "primary" : "secondary"}
                onPress={() => setFilter("all")}
                style={styles.filterButton}
              />
              <AppButton
                title="Pending"
                variant={filter === "pending" ? "primary" : "secondary"}
                onPress={() => setFilter("pending")}
                style={styles.filterButton}
              />
              <AppButton
                title="Packed"
                variant={filter === "packed" ? "primary" : "secondary"}
                onPress={() => setFilter("packed")}
                style={styles.filterButton}
              />
              <AppButton
                title="Travel Day"
                variant={filter === "travel_day" ? "primary" : "secondary"}
                onPress={() => setFilter("travel_day")}
                style={styles.filterButton}
              />
              <AppButton
                title="Skipped"
                variant={filter === "skip" ? "primary" : "secondary"}
                onPress={() => setFilter("skip")}
                style={styles.filterButton}
              />
            </View>
          </AppCard>

          {filteredItems.length === 0 ? (
            <EmptyState
              title="No checklist items found"
              description="No items match the current filter."
            />
          ) : (
            filteredItems.map((item) => (
              <AppCard key={item.id}>
                <View style={styles.itemTopRow}>
                  <View style={styles.itemTitleWrap}>
                    <Text style={styles.itemTitle}>
                      {getDisplayName(item)} × {item.quantity || 1}
                    </Text>
                    <Text style={styles.itemSubText}>
                      Priority: {item.priority || "recommended"}
                    </Text>
                  </View>

                  <StatusBadge
                    label={getPackingStatusLabel(item)}
                    tone={getPackingTone(item)}
                  />
                </View>

                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Assigned Bag: </Text>
                  {item.assigned_bag_name && item.assigned_bag_role
                    ? `${item.assigned_bag_name} (${item.assigned_bag_role})`
                    : item.preferredBagRole
                    ? `Auto / preferred: ${item.preferredBagRole}`
                    : "Auto"}
                </Text>

                <View style={styles.actionsGrid}>
                  <AppButton
                    title="Pack"
                    variant="secondary"
                    loading={updatingItemId === item.id}
                    disabled={updatingItemId === item.id}
                    onPress={() => updatePackingStatus(item.id, "packed")}
                    style={styles.actionButton}
                  />
                  <AppButton
                    title="Travel Day"
                    variant="secondary"
                    loading={false}
                    disabled={updatingItemId === item.id}
                    onPress={() =>
                      updatePackingStatus(item.id, "wear_on_travel_day")
                    }
                    style={styles.actionButton}
                  />
                  <AppButton
                    title="Skip"
                    variant="danger"
                    loading={false}
                    disabled={updatingItemId === item.id}
                    onPress={() => updatePackingStatus(item.id, "skip")}
                    style={styles.actionButton}
                  />
                  <AppButton
                    title="Reset"
                    variant="secondary"
                    loading={false}
                    disabled={updatingItemId === item.id}
                    onPress={() => updatePackingStatus(item.id, "pending")}
                    style={styles.actionButton}
                  />
                </View>
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryMiniCard: {
    minWidth: "30%",
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
  itemTitleWrap: {
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
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
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
    minWidth: "47%",
  },
});