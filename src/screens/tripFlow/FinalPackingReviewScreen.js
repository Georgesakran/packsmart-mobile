// packsmart-mobile/src/screens/tripFlow/FinalPackingReviewScreen.js

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import StatusBadge from "../../components/common/StatusBadge";
import FlowProgressHeader from "../../components/tripFlow/FlowProgressHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripResults, calculateTrip } from "../../api/tripApi";

function formatCompactNumber(value = 0) {
  const number = Number(value || 0);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
  return `${Math.round(number)}`;
}

function formatVolumeCm3(value = 0) {
  return `${formatCompactNumber(value)} cm³`;
}

function formatWeightG(value = 0) {
  const grams = Number(value || 0);
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${Math.round(grams)} g`;
}

function formatTitle(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildConsumerSuggestions(results) {
  const suggestions = [];
  const overflowCount = Number(results?.overflowItemCount || 0);
  const warnings = Array.isArray(results?.warnings) ? results.warnings : [];
  const freeVolume = Number(results?.totalFreeVolumeCm3 || 0);
  const freeWeight = Number(results?.totalFreeWeightG || 0);
  const bagResults = Array.isArray(results?.bagResults) ? results.bagResults : [];
  const rawFixSuggestions = Array.isArray(results?.fixSuggestions)
    ? results.fixSuggestions
    : [];

  for (const entry of rawFixSuggestions) {
    if (typeof entry === "string") {
      suggestions.push(entry);
      continue;
    }

    if (entry?.title && entry?.description) {
      suggestions.push(`${entry.title}: ${entry.description}`);
      continue;
    }

    if (entry?.description) {
      suggestions.push(entry.description);
    }
  }

  if (overflowCount > 0) {
    suggestions.unshift(
      overflowCount === 1
        ? "Remove one bulky item or wear one item during travel to make everything fit."
        : `Remove or wear ${overflowCount} bulky items to make the trip fit more comfortably.`
    );
  }

  if (warnings.some((w) => String(w).toLowerCase().includes("weight"))) {
    suggestions.push("Reduce heavier items or move one heavy item out of the bag.");
  }

  if (warnings.some((w) => String(w).toLowerCase().includes("volume"))) {
    suggestions.push("Try packing fewer bulky items or use a larger suitcase.");
  }

  if (freeVolume > 0 && overflowCount === 0) {
    suggestions.push("Your setup fits. You still have some free space for small extras.");
  }

  if (freeWeight > 0 && overflowCount === 0) {
    suggestions.push("Weight looks safe for the current trip setup.");
  }

  if (bagResults.length > 1) {
    suggestions.push("Use the 3D view to check how items are distributed between bags.");
  }

  const deduped = [];
  const seen = new Set();

  for (const suggestion of suggestions) {
    const normalized = String(suggestion || "").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(String(suggestion).trim());
  }

  return deduped.slice(0, 5);
}

export default function FinalPackingReviewScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const [trip, setTrip] = useState(null);
  const [results, setResults] = useState(null);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      if (showLoader) setLoading(true);
      setError("");

      const [tripData, resultsData] = await Promise.all([
        getTripById(tripId),
        getTripResults(tripId),
      ]);

      setTrip(tripData || null);
      setResults(resultsData || null);
    } catch (err) {
      console.error("Load final packing review error:", err);
      setError(
        err?.response?.data?.message || "Failed to load packing results."
      );
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
  };

  const overallFits = !!results?.overallFits;

  const warnings = useMemo(() => {
    return Array.isArray(results?.warnings) ? results.warnings : [];
  }, [results]);

  const overflowItems = useMemo(() => {
    return Array.isArray(results?.overflowItems)
      ? results.overflowItems
      : Array.isArray(results?.overflow)
      ? results.overflow
      : [];
  }, [results]);

  const bagResults = useMemo(() => {
    return Array.isArray(results?.bagResults) ? results.bagResults : [];
  }, [results]);

  const consumerSuggestions = useMemo(() => {
    return buildConsumerSuggestions(results);
  }, [results]);

  const tripDestination = useMemo(() => {
    if (!trip) return "—";
    return (
      trip.destination ||
      `${trip.destination_city || ""}${
        trip.destination_city && trip.destination_country ? ", " : ""
      }${trip.destination_country || ""}` ||
      "—"
    );
  }, [trip]);

  const heroSummary = useMemo(() => {
    const overflowCount = Number(results?.overflowItemCount || overflowItems.length || 0);

    if (overallFits) {
      return "Everything fits. You can continue to the 3D packing player and follow the placement order.";
    }

    if (overflowCount > 0) {
      return `${overflowCount} item${
        overflowCount === 1 ? "" : "s"
      } still need adjustment before the trip fits comfortably.`;
    }

    return "Your setup needs a few adjustments before packing.";
  }, [overallFits, results, overflowItems.length]);

  const handleRerunSimulation = async () => {
    try {
      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      setRerunning(true);
      setError("");
      setActionMessage("");

      await calculateTrip(tripId);
      await loadData(false);

      setActionMessage("Packing simulation re-ran successfully.");
    } catch (err) {
      console.error("Rerun simulation error:", err);
      setError(
        err?.response?.data?.message || "Failed to rerun the simulation."
      );
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading packing results...</Text>
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
          <Text style={styles.title}>Packing Result</Text>
          <Text style={styles.subtitle}>
            Here is the final result and what PackSmart recommends next.
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

          <AppCard style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroEyebrow}>Trip Result</Text>
                <Text style={styles.heroTitle}>
                  {trip?.trip_name || "Unnamed Trip"}
                </Text>
                <Text style={styles.heroSubtitle}>{tripDestination}</Text>
              </View>

              <StatusBadge
                label={overallFits ? "Fits" : "Needs Adjustment"}
                tone={overallFits ? "success" : "warning"}
              />
            </View>

            <Text style={styles.heroSummary}>{heroSummary}</Text>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Quick Stats"
              subtitle="A simple summary of the current packing result."
            />

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Used Volume</Text>
                <Text style={styles.statValue}>
                  {formatVolumeCm3(results?.totalUsedVolumeCm3 || 0)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Free Volume</Text>
                <Text style={styles.statValue}>
                  {formatVolumeCm3(results?.totalFreeVolumeCm3 || 0)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Overflow</Text>
                <Text style={styles.statValue}>
                  {Number(results?.overflowItemCount || overflowItems.length || 0)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Bags Used</Text>
                <Text style={styles.statValue}>{bagResults.length}</Text>
              </View>
            </View>
          </AppCard>

          <AppCard style={styles.recommendCard}>
            <SectionHeader
              title="Recommended To Do"
              subtitle="Simple next steps based on this result."
            />

            {consumerSuggestions.length === 0 ? (
              <EmptyState
                title="No extra recommendations"
                description="Your current trip setup already looks good."
              />
            ) : (
              <View style={styles.recommendList}>
                {consumerSuggestions.map((suggestion, index) => (
                  <View key={`${index}-${suggestion}`} style={styles.recommendRow}>
                    <View style={styles.recommendDot} />
                    <Text style={styles.recommendText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Items That Need Attention"
              subtitle="Warnings and unpacked items in a simpler view."
            />

            {warnings.length === 0 && overflowItems.length === 0 ? (
              <EmptyState
                title="Nothing urgent"
                description="There are no warnings or overflow items right now."
              />
            ) : (
              <View style={styles.attentionList}>
                {warnings.map((warning, index) => (
                  <View key={`warning-${index}`} style={styles.attentionWarning}>
                    <Text style={styles.attentionWarningText}>{warning}</Text>
                  </View>
                ))}

                {overflowItems.map((item, index) => {
                  const name = item?.name || item?.itemName || `Item ${index + 1}`;

                  return (
                    <View key={`overflow-${index}-${name}`} style={styles.attentionOverflow}>
                      <Text style={styles.attentionOverflowTitle}>{name}</Text>
                      <Text style={styles.attentionOverflowMeta}>
                        {formatTitle(item?.category || "misc")}
                      </Text>
                      {item?.reason ? (
                        <Text style={styles.attentionOverflowReason}>{item.reason}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Next Actions"
              subtitle="Choose how you want to continue."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title="Open 3D Packing Player"
                onPress={() => navigation.navigate("VisualPacking3D", { tripId })}
                size="md"
              />

              <AppButton
                title="Adjust Inventory"
                variant="secondary"
                onPress={() => navigation.navigate("InventoryReview", { tripId })}
                size="md"
              />

              <AppButton
                title="Re-run Simulation"
                onPress={handleRerunSimulation}
                loading={rerunning}
                variant="secondary"
                size="md"
              />
            </View>
          </AppCard>

          <AppCard style={styles.secondaryInfoCard}>
            <SectionHeader
              title="Extra Details"
              subtitle="More technical numbers if you want to inspect the result."
            />

            <View style={styles.extraInfoList}>
              <Text style={styles.extraInfoText}>
                <Text style={styles.extraInfoLabel}>Used Weight: </Text>
                {formatWeightG(results?.totalUsedWeightG || 0)}
              </Text>

              <Text style={styles.extraInfoText}>
                <Text style={styles.extraInfoLabel}>Free Weight: </Text>
                {formatWeightG(results?.totalFreeWeightG || 0)}
              </Text>

              <Text style={styles.extraInfoText}>
                <Text style={styles.extraInfoLabel}>Travel Day Items: </Text>
                {Number(results?.wornOnTravelDayCount || 0)}
              </Text>
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
  heroCard: {
    backgroundColor: "#f8fbff",
    borderColor: "#dbeafe",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  heroSummary: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  recommendCard: {
    backgroundColor: "#f8fbff",
    borderColor: "#dbeafe",
  },
  recommendList: {
    gap: spacing.sm,
  },
  recommendRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  recommendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  recommendText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  attentionList: {
    gap: spacing.sm,
  },
  attentionWarning: {
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    borderRadius: 14,
    padding: spacing.md,
  },
  attentionWarningText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#92400e",
    fontWeight: "700",
  },
  attentionOverflow: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff7f7",
    borderRadius: 16,
    padding: spacing.md,
  },
  attentionOverflowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  attentionOverflowMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  attentionOverflowReason: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
    fontWeight: "600",
  },
  actionsColumn: {
    gap: spacing.sm,
  },
  secondaryInfoCard: {
    backgroundColor: "#fcfcfd",
    borderColor: "#eef2f7",
  },
  extraInfoList: {
    gap: 8,
  },
  extraInfoText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  extraInfoLabel: {
    fontWeight: "800",
    color: colors.text,
  },
});