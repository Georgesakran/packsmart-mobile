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
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  calculateTrip,
  getTripById,
  getTripResults,
} from "../../api/tripApi";

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatPercent(value) {
  return `${Number(value || 0)}%`;
}

export default function TripCalculationResultsScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [trip, setTrip] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [tripData, resultsData] = await Promise.all([
        getTripById(tripId),
        getTripResults(tripId),
      ]);

      setTrip(tripData || null);
      setResults(resultsData || null);
    } catch (err) {
      console.error("Load trip calculation results error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load trip calculation results."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError("");
      setActionMessage("");

      const data = await calculateTrip(tripId);
      setResults(data || null);
      setActionMessage("Trip calculated successfully.");
    } catch (err) {
      console.error("Calculate trip error:", err);
      setError(err?.response?.data?.message || "Failed to calculate trip.");
    } finally {
      setCalculating(false);
    }
  };

  const bagResults = useMemo(() => {
    return Array.isArray(results?.bagResults) ? results.bagResults : [];
  }, [results]);

  const warnings = useMemo(() => {
    return Array.isArray(results?.warnings) ? results.warnings : [];
  }, [results]);

  const overflowItems = useMemo(() => {
    return Array.isArray(results?.overflowItems) ? results.overflowItems : [];
  }, [results]);

  const fixSuggestions = useMemo(() => {
    return Array.isArray(results?.fixSuggestions) ? results.fixSuggestions : [];
  }, [results]);

  const travelDay = useMemo(() => {
    return results?.travelDay || {};
  }, [results]);

  const wornOnTravelDay = useMemo(() => {
    return Array.isArray(travelDay?.wornOnTravelDay)
      ? travelDay.wornOnTravelDay
      : [];
  }, [travelDay]);

  const keepAccessible = useMemo(() => {
    return Array.isArray(travelDay?.keepAccessible)
      ? travelDay.keepAccessible
      : [];
  }, [travelDay]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading calculation results...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.kicker}>Trips / Calculation</Text>
          <Text style={styles.title}>Packing Results</Text>
          <Text style={styles.subtitle}>
            Review the fit, capacity, overflow, and recommended next actions.
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
              title="Trip Context"
              subtitle="This result is based on the current bags and selected items."
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
                <Text style={styles.metaLabel}>Trip Type: </Text>
                {trip?.trip_type || trip?.travel_type || "casual"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Packing Mode: </Text>
                {trip?.packing_mode || "balanced"}
              </Text>
            </View>
          </AppCard>

          {!results ? (
            <AppCard>
              <EmptyState
                title="No calculation results yet"
                description="Run the calculation to see whether the current setup fits."
              />

              <AppButton
                title="Calculate Trip"
                onPress={handleCalculate}
                loading={calculating}
                style={styles.calculateButton}
              />
            </AppCard>
          ) : (
            <>
              <AppCard>
                <SectionHeader
                  title="Overall Result"
                  subtitle="The packing engine summary for this trip."
                />

                <View style={styles.resultTopRow}>
                  <View style={styles.resultTextWrap}>
                    <Text style={styles.resultTitle}>
                      {results?.overallFits
                        ? "Everything fits"
                        : "Adjustment needed"}
                    </Text>
                    <Text style={styles.resultSubtitle}>
                      {results?.overallFits
                        ? "The selected bags can currently handle this trip setup."
                        : "Some items still need adjustment, removal, or a larger bag setup."}
                    </Text>
                  </View>

                  <StatusBadge
                    label={results?.overallFits ? "Fits" : "Does Not Fit"}
                    tone={results?.overallFits ? "success" : "danger"}
                  />
                </View>

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryMiniCard}>
                    <Text style={styles.summaryMiniLabel}>Used Volume</Text>
                    <Text style={styles.summaryMiniValue}>
                      {formatNumber(results?.totalUsedVolumeCm3)} cm³
                    </Text>
                  </View>

                  <View style={styles.summaryMiniCard}>
                    <Text style={styles.summaryMiniLabel}>Free Volume</Text>
                    <Text style={styles.summaryMiniValue}>
                      {formatNumber(results?.totalFreeVolumeCm3)} cm³
                    </Text>
                  </View>

                  <View style={styles.summaryMiniCard}>
                    <Text style={styles.summaryMiniLabel}>Used Weight</Text>
                    <Text style={styles.summaryMiniValue}>
                      {formatNumber(results?.totalUsedWeightG)} g
                    </Text>
                  </View>

                  <View style={styles.summaryMiniCard}>
                    <Text style={styles.summaryMiniLabel}>Free Weight</Text>
                    <Text style={styles.summaryMiniValue}>
                      {formatNumber(results?.totalFreeWeightG)} g
                    </Text>
                  </View>
                </View>

                <View style={styles.secondaryStatsWrap}>
                  <Text style={styles.secondaryStatText}>
                    <Text style={styles.metaLabel}>Overflow Items: </Text>
                    {results?.overflowItemCount || 0}
                  </Text>

                  <Text style={styles.secondaryStatText}>
                    <Text style={styles.metaLabel}>Travel-Day Worn: </Text>
                    {results?.wornOnTravelDayCount || 0}
                  </Text>
                </View>
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Bag Breakdown"
                  subtitle="Capacity usage and item distribution for each selected bag."
                />

                {bagResults.length === 0 ? (
                  <EmptyState
                    title="No bag results"
                    description="No selected bags were included in this calculation."
                  />
                ) : (
                  bagResults.map((bag) => (
                    <View key={bag.bagId} style={styles.bagCard}>
                      <View style={styles.bagHeader}>
                        <View style={styles.bagTextWrap}>
                          <Text style={styles.bagTitle}>{bag.bagName}</Text>
                          <Text style={styles.bagSubtitle}>
                            {bag.bagType}
                          </Text>
                        </View>

                        <View style={styles.badgesColumn}>
                          <StatusBadge
                            label={`Vol ${formatPercent(
                              bag.volumeUsagePercent
                            )}`}
                            tone={
                              bag.volumeUsagePercent >= 90
                                ? "danger"
                                : bag.volumeUsagePercent >= 75
                                ? "warning"
                                : "success"
                            }
                          />
                          <StatusBadge
                            label={`Wt ${formatPercent(
                              bag.weightUsagePercent
                            )}`}
                            tone={
                              bag.weightUsagePercent >= 90
                                ? "danger"
                                : bag.weightUsagePercent >= 75
                                ? "warning"
                                : "success"
                            }
                          />
                        </View>
                      </View>

                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>
                          <Text style={styles.metaLabel}>Used Volume: </Text>
                          {formatNumber(bag.usedVolumeCm3)} /{" "}
                          {formatNumber(bag.availableVolumeCm3)} cm³
                        </Text>

                        <Text style={styles.metaText}>
                          <Text style={styles.metaLabel}>Remaining Volume: </Text>
                          {formatNumber(bag.remainingVolumeCm3)} cm³
                        </Text>

                        <Text style={styles.metaText}>
                          <Text style={styles.metaLabel}>Used Weight: </Text>
                          {formatNumber(bag.usedWeightG)} /{" "}
                          {formatNumber(bag.availableWeightG)} g
                        </Text>

                        <Text style={styles.metaText}>
                          <Text style={styles.metaLabel}>Remaining Weight: </Text>
                          {formatNumber(bag.remainingWeightG)} g
                        </Text>
                      </View>

                      <View style={styles.itemsWrap}>
                        <Text style={styles.itemsSectionTitle}>Assigned Items</Text>

                        {Array.isArray(bag.items) && bag.items.length > 0 ? (
                          bag.items.map((item, index) => (
                            <View
                              key={`${bag.bagId}-${item.id || item.name}-${index}`}
                              style={styles.assignedItemRow}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.assignedItemTitle}>
                                  {item.name}
                                </Text>
                                <Text style={styles.assignedItemSubtitle}>
                                  Qty {item.quantity} • {item.category || "misc"}
                                </Text>
                              </View>

                              <StatusBadge
                                label={`${formatNumber(item.volumeCm3)} cm³`}
                                tone="info"
                              />
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyInlineText}>
                            No items assigned to this bag.
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Warnings"
                  subtitle="Important capacity and planning warnings."
                />

                {warnings.length === 0 ? (
                  <EmptyState
                    title="No warnings"
                    description="No important warnings were generated."
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
                  title="Overflow Items"
                  subtitle="Items that could not be assigned to the selected bags."
                />

                {overflowItems.length === 0 ? (
                  <EmptyState
                    title="No overflow"
                    description="All assignable items currently fit in the selected bags."
                  />
                ) : (
                  overflowItems.map((item, index) => (
                    <View
                      key={`${item.id || item.name}-${index}`}
                      style={styles.overflowCard}
                    >
                      <Text style={styles.overflowTitle}>{item.name}</Text>
                      <Text style={styles.overflowSubtitle}>
                        Qty {item.quantity} • {item.category || "misc"}
                      </Text>
                      <Text style={styles.overflowReason}>{item.reason}</Text>
                    </View>
                  ))
                )}
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Travel Day Handling"
                  subtitle="Items treated outside the main packing volume."
                />

                <View style={styles.travelDayBlock}>
                  <Text style={styles.travelDayTitle}>Worn on Travel Day</Text>
                  {wornOnTravelDay.length === 0 ? (
                    <Text style={styles.emptyInlineText}>
                      No items marked as worn on travel day.
                    </Text>
                  ) : (
                    wornOnTravelDay.map((item, index) => (
                      <View
                        key={`worn-${item.id || item.name}-${index}`}
                        style={styles.travelDayItemRow}
                      >
                        <Text style={styles.travelDayItemText}>
                          {item.name} • Qty {item.quantity}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.travelDayBlock}>
                  <Text style={styles.travelDayTitle}>Keep Accessible</Text>
                  {keepAccessible.length === 0 ? (
                    <Text style={styles.emptyInlineText}>
                      No items marked as keep accessible.
                    </Text>
                  ) : (
                    keepAccessible.map((item, index) => (
                      <View
                        key={`accessible-${item.id || item.name}-${index}`}
                        style={styles.travelDayItemRow}
                      >
                        <Text style={styles.travelDayItemText}>
                          {item.name} • Qty {item.quantity}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Fix Suggestions"
                  subtitle="Recommended next steps to improve the packing setup."
                />

                {fixSuggestions.length === 0 ? (
                  <EmptyState
                    title="No fix suggestions"
                    description="No extra fix guidance was needed for this result."
                  />
                ) : (
                  fixSuggestions.map((suggestion, index) => (
                    <View
                      key={`${suggestion}-${index}`}
                      style={styles.suggestionCard}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))
                )}
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Actions"
                  subtitle="Recalculate after changing bags or items."
                />

                <View style={styles.actionsColumn}>
                  <AppButton
                    title="Recalculate Trip"
                    onPress={handleCalculate}
                    loading={calculating}
                  />

                  <AppButton
                    title="Open Trip Overview"
                    variant="secondary"
                    onPress={() => navigation.navigate("TripOverview", { tripId })}
                  />
                </View>
              </AppCard>
            </>
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
  calculateButton: {
    marginTop: spacing.lg,
  },
  resultTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
    marginBottom: 4,
  },
  summaryMiniValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  secondaryStatsWrap: {
    gap: 8,
    marginTop: spacing.lg,
  },
  secondaryStatText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  bagCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  bagHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bagTextWrap: {
    flex: 1,
  },
  bagTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  bagSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  badgesColumn: {
    gap: 6,
    alignItems: "flex-end",
  },
  itemsWrap: {
    marginTop: spacing.lg,
  },
  itemsSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  assignedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assignedItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  assignedItemSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyInlineText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
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
  overflowCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  overflowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  overflowSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  overflowReason: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 19,
  },
  travelDayBlock: {
    marginTop: spacing.md,
  },
  travelDayTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  travelDayItemRow: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  travelDayItemText: {
    fontSize: 14,
    color: colors.text,
  },
  suggestionCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});