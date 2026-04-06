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
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripResults } from "../../api/tripApi";
import BagUsageCard from "../../components/trips/BagUsageCard";

export default function TripResultsScreen({ route }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [tripData, resultsData] = await Promise.all([
        getTripById(tripId),
        getTripResults(tripId),
      ]);

      setTrip(tripData || null);
      setResults(resultsData || null);
    } catch (err) {
      console.error("Load trip results error:", err);
      setError(err?.response?.data?.message || "Failed to load trip results.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const overallStatus = useMemo(() => {
    if (!results?.totals) return "Not calculated";
    return results.totals.overallFits ? "Fits" : "Needs changes";
  }, [results]);

  const overallTone = useMemo(() => {
    if (overallStatus === "Fits") return "success";
    if (overallStatus === "Needs changes") return "danger";
    return "neutral";
  }, [overallStatus]);

  const mainConstraint = useMemo(() => {
    return results?.smartAdjustments?.mainConstraint || "none";
  }, [results]);

  const constraintLabel = useMemo(() => {
    if (mainConstraint === "none") return "No major issue";
    if (mainConstraint === "both") return "Volume + Weight";
    return mainConstraint;
  }, [mainConstraint]);

  const topAction = useMemo(() => {
    const rebalance = results?.bagRebalancingSuggestions?.[0];
    if (rebalance) {
      return `Move ${rebalance.itemName} to ${rebalance.toBag?.name}`;
    }

    const substitution = results?.itemSubstitutionSuggestions?.[0];
    if (substitution) {
      if (substitution.type === "replace") {
        return `Replace ${substitution.fromItem} with ${substitution.toItem}`;
      }

      if (substitution.type === "reduce") {
        return `Reduce ${substitution.itemName} to ${substitution.toQuantity}`;
      }

      if (substitution.type === "simplify") {
        return `Simplify ${substitution.fromItem}`;
      }
    }

    const adjustment = results?.smartAdjustments?.adjustments?.[0];
    if (adjustment) {
      return adjustment;
    }

    return "No urgent action needed";
  }, [results]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip results...</Text>
        </View>
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <AppCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </AppCard>
        </View>
      </AppScreen>
    );
  }

  if (!results?.totals) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <EmptyState
            title="No saved results found"
            description="Calculate this trip first to see fit status and smart actions."
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Results</Text>
          <Text style={styles.title}>{trip?.trip_name || "Trip Results"}</Text>
          <Text style={styles.subtitle}>
            Review fit status, smart actions, and bag distribution.
          </Text>

          <AppCard style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroLabel}>Overall Status</Text>
                <Text style={styles.heroValue}>{overallStatus}</Text>
              </View>

              <StatusBadge label={overallStatus} tone={overallTone} />
            </View>

            <Text style={styles.heroSubtext}>
              {results.totals.overallFits
                ? "This packing setup should fit within your trip bags."
                : "This setup needs adjustment before travel."}
            </Text>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Top Decision"
              subtitle="The most important thing to understand right now."
            />

            <View style={styles.topDecisionWrap}>
              <View style={styles.topDecisionCard}>
                <Text style={styles.topDecisionLabel}>Main Constraint</Text>
                <Text style={styles.topDecisionValue}>{constraintLabel}</Text>
              </View>

              <View style={styles.topDecisionCard}>
                <Text style={styles.topDecisionLabel}>Top Action</Text>
                <Text style={styles.topDecisionAction}>{topAction}</Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Trip Totals"
              subtitle="Core packing totals for this result."
            />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Used Capacity</Text>
                <Text style={styles.summaryMiniValue}>
                  {results.totals.usedCapacityPercent ?? 0}%
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total Weight</Text>
                <Text style={styles.summaryMiniValue}>
                  {results.totals.weightKg ?? 0} kg
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total Volume</Text>
                <Text style={styles.summaryMiniValue}>
                  {results.totals.totalVolumeCm3 ?? 0} cm³
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Remaining Volume</Text>
                <Text style={styles.summaryMiniValue}>
                  {results.totals.remainingVolumeCm3 ?? 0} cm³
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Bags</Text>
                <Text style={styles.summaryMiniValue}>
                  {results.suitcases?.length || 0}
                </Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Volume Fits</Text>
                <Text style={styles.summaryMiniValue}>
                  {results.totals.volumeFits ? "Yes" : "No"}
                </Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Bag Distribution"
              subtitle="How the current setup is distributed across your bags."
            />

              {results.bagDistribution?.length ? (
                results.bagDistribution.map((bag) => (
                  <BagUsageCard key={bag.id} bag={bag} />
                ))
              ) : (
                <EmptyState
                  title="No bag distribution available"
                  description="No bag distribution data is available for this result."
                />
              )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Rebalancing Suggestions"
              subtitle="Suggested moves to improve bag balance."
            />

            {results.bagRebalancingSuggestions?.length ? (
              results.bagRebalancingSuggestions.map((entry, index) => (
                <AppCard key={index} style={styles.innerCard}>
                  <Text style={styles.infoTitle}>
                    Move {entry.itemName} × {entry.quantity}
                  </Text>
                  <Text style={styles.infoBody}>
                    From {entry.fromBag?.name} → To {entry.toBag?.name}
                  </Text>
                  <Text style={styles.infoReason}>{entry.reason}</Text>
                </AppCard>
              ))
            ) : (
              <EmptyState
                title="No rebalancing suggestions"
                description="This result does not currently need bag rebalancing."
              />
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Substitution Suggestions"
              subtitle="Ideas for simplifying or improving the current item mix."
            />

            {results.itemSubstitutionSuggestions?.length ? (
              results.itemSubstitutionSuggestions.map((entry, index) => (
                <AppCard key={index} style={styles.innerCard}>
                  <Text style={styles.infoTitle}>
                    {entry.type === "replace" &&
                      `Replace ${entry.fromItem} with ${entry.toItem}`}
                    {entry.type === "reduce" &&
                      `Reduce ${entry.itemName} from ${entry.fromQuantity} to ${entry.toQuantity}`}
                    {entry.type === "simplify" &&
                      `Simplify ${entry.fromItem} into ${entry.toItem}`}
                  </Text>
                  <Text style={styles.infoReason}>{entry.reason}</Text>
                </AppCard>
              ))
            ) : (
              <EmptyState
                title="No substitution suggestions"
                description="No substitution changes are needed for this result."
              />
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
  heroCard: {
    borderRadius: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubtext: {
    fontSize: 14,
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
  topDecisionWrap: {
    gap: spacing.sm,
  },
  topDecisionCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  topDecisionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  topDecisionValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  topDecisionAction: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 22,
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
  innerCard: {
    backgroundColor: "#f8fafc",
    marginTop: spacing.sm,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 6,
  },
  infoReason: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
});