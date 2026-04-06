import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripResults } from "../../api/tripApi";

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

  const mainConstraint = useMemo(() => {
    return results?.smartAdjustments?.mainConstraint || "none";
  }, [results]);

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
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </AppScreen>
    );
  }

  if (!results?.totals) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>No saved results found for this trip.</Text>
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

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Overall Status</Text>
            <Text
              style={[
                styles.heroValue,
                overallStatus === "Fits" ? styles.goodText : styles.dangerText,
              ]}
            >
              {overallStatus}
            </Text>
            <Text style={styles.heroSubtext}>
              {results.totals.overallFits
                ? "This packing setup should fit within your trip bags."
                : "This setup needs adjustment before travel."}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Used Capacity</Text>
              <Text style={styles.statValue}>
                {results.totals.usedCapacityPercent ?? 0}%
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Weight</Text>
              <Text style={styles.statValue}>
                {results.totals.weightKg ?? 0} kg
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Volume</Text>
              <Text style={styles.statValue}>
                {results.totals.totalVolumeCm3 ?? 0} cm³
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Remaining Volume</Text>
              <Text style={styles.statValue}>
                {results.totals.remainingVolumeCm3 ?? 0} cm³
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Bags</Text>
              <Text style={styles.statValue}>
                {results.suitcases?.length || 0}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Main Constraint</Text>
              <Text style={styles.statValue}>
                {mainConstraint === "none" ? "None" : mainConstraint}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top Action</Text>
            <Text style={styles.sectionBody}>{topAction}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bag Distribution</Text>

            {results.bagDistribution?.length ? (
              results.bagDistribution.map((bag) => (
                <View key={bag.id} style={styles.bagCard}>
                  <View style={styles.bagTopRow}>
                    <Text style={styles.bagName}>{bag.name}</Text>
                    <View
                      style={[
                        styles.badge,
                        bag.volumeFits && bag.weightFits
                          ? styles.goodBadge
                          : styles.warnBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          bag.volumeFits && bag.weightFits
                            ? styles.goodBadgeText
                            : styles.warnBadgeText,
                        ]}
                      >
                        {bag.volumeFits && bag.weightFits ? "Fits" : "Review"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Role: </Text>
                    {bag.bagRole || bag.bag_role || "main"}
                  </Text>

                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Usage: </Text>
                    {bag.usedCapacityPercent ?? 0}%
                  </Text>

                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Used Weight: </Text>
                    {bag.usedWeightKg ?? 0} kg
                  </Text>

                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Remaining Volume: </Text>
                    {bag.remainingVolumeCm3 ?? 0} cm³
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No bag distribution available.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Rebalancing Suggestions</Text>

            {results.bagRebalancingSuggestions?.length ? (
              results.bagRebalancingSuggestions.map((entry, index) => (
                <View key={index} style={styles.infoCard}>
                  <Text style={styles.infoTitle}>
                    Move {entry.itemName} × {entry.quantity}
                  </Text>
                  <Text style={styles.infoBody}>
                    From {entry.fromBag?.name} → To {entry.toBag?.name}
                  </Text>
                  <Text style={styles.infoReason}>{entry.reason}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No rebalancing suggestions are needed.
              </Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Item Substitution Suggestions</Text>

            {results.itemSubstitutionSuggestions?.length ? (
              results.itemSubstitutionSuggestions.map((entry, index) => (
                <View key={index} style={styles.infoCard}>
                  <Text style={styles.infoTitle}>
                    {entry.type === "replace" &&
                      `Replace ${entry.fromItem} with ${entry.toItem}`}
                    {entry.type === "reduce" &&
                      `Reduce ${entry.itemName} from ${entry.fromQuantity} to ${entry.toQuantity}`}
                    {entry.type === "simplify" &&
                      `Simplify ${entry.fromItem} into ${entry.toItem}`}
                  </Text>
                  <Text style={styles.infoReason}>{entry.reason}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No substitution suggestions are needed.
              </Text>
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
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  goodText: {
    color: colors.success,
  },
  dangerText: {
    color: colors.danger,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
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
  sectionBody: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 24,
  },
  bagCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bagTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  bagName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 6,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  goodBadge: {
    backgroundColor: "#dcfce7",
  },
  goodBadgeText: {
    color: "#166534",
  },
  warnBadge: {
    backgroundColor: "#fef3c7",
  },
  warnBadgeText: {
    color: "#92400e",
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
});