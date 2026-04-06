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
import {
  getTripById,
  getTripItems,
  getTripResults,
  getTripSuitcases,
  generateTripSuggestions,
  calculateTrip,
} from "../../api/tripApi";

export default function TripOverviewScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [suitcases, setSuitcases] = useState([]);
  const [items, setItems] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const loadTripOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [tripData, suitcasesData, itemsData, resultsData] =
        await Promise.allSettled([
          getTripById(tripId),
          getTripSuitcases(tripId),
          getTripItems(tripId),
          getTripResults(tripId),
        ]);

      if (tripData.status === "fulfilled") {
        setTrip(tripData.value);
      } else {
        throw tripData.reason;
      }

      setSuitcases(
        suitcasesData.status === "fulfilled" ? suitcasesData.value || [] : []
      );

      setItems(itemsData.status === "fulfilled" ? itemsData.value || [] : []);

      setResults(resultsData.status === "fulfilled" ? resultsData.value : null);
    } catch (err) {
      console.error("Load trip overview error:", err);
      setError(err?.response?.data?.message || "Failed to load trip overview.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripOverview();
  }, [loadTripOverview]);

  const handleGenerateSuggestions = async () => {
    try {
      setGenerating(true);
      setActionError("");
      setActionMessage("");

      const data = await generateTripSuggestions(tripId);

      const profileUsed = data?.profileUsed;

      const message = profileUsed
        ? `Suggestions generated using size ${profileUsed.defaultSize}, travel style ${profileUsed.travelStyle}, and packing mode ${profileUsed.packingMode}.`
        : data?.message || "Suggestions generated successfully.";

      setActionMessage(message);
      await loadTripOverview();
    } catch (err) {
      console.error("Generate suggestions error:", err);
      setActionError(
        err?.response?.data?.message || "Failed to generate suggestions."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCalculateTrip = async () => {
    try {
      setCalculating(true);
      setActionError("");
      setActionMessage("");

      const data = await calculateTrip(tripId);

      setActionMessage(data?.message || "Trip calculated successfully.");
      await loadTripOverview();
    } catch (err) {
      console.error("Calculate trip error:", err);
      setActionError(
        err?.response?.data?.message || "Failed to calculate trip."
      );
    } finally {
      setCalculating(false);
    }
  };

  const overallStatus = useMemo(() => {
    if (!results?.totals) return "Not calculated";
    return results.totals.overallFits ? "Fits" : "Needs changes";
  }, [results]);

  const checklistReady = useMemo(() => {
    if (!items.length) return "Empty";
    const packedCount = items.filter((item) => {
      const status = item.packingStatus || item.packing_status || "pending";
      return status !== "pending";
    }).length;

    if (packedCount === 0) return "Not started";
    if (packedCount === items.length) return "Complete";
    return `${packedCount}/${items.length} updated`;
  }, [items]);

  const travelDayReady = useMemo(() => {
    if (!items.length) return "Not set";
    const taggedCount = items.filter((item) => {
      const mode = item.travelDayMode || item.travel_day_mode || "normal";
      return mode !== "normal";
    }).length;

    if (taggedCount === 0) return "Not set";
    return `${taggedCount} items set`;
  }, [items]);

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
    if (adjustment) return adjustment;

    if (!items.length) return "Generate suggestions or add items";
    if (!suitcases.length) return "Add at least one bag";
    if (!results?.totals) return "Calculate this trip";

    return "No urgent action needed";
  }, [results, items, suitcases]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip command center...</Text>
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip Command Center</Text>
          <Text style={styles.title}>{trip?.trip_name || "Unnamed Trip"}</Text>
          <Text style={styles.subtitle}>
            {trip?.destination || "No destination"} •{" "}
            {trip?.duration_days ? `${trip.duration_days} days` : "No duration"}
          </Text>

          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>Overall Trip Status</Text>
                <Text
                  style={[
                    styles.heroValue,
                    overallStatus === "Fits"
                      ? styles.goodText
                      : overallStatus === "Needs changes"
                      ? styles.dangerText
                      : styles.neutralText,
                  ]}
                >
                  {overallStatus}
                </Text>
              </View>

              <View style={styles.heroMiniCard}>
                <Text style={styles.heroMiniLabel}>Items</Text>
                <Text style={styles.heroMiniValue}>{items.length}</Text>
              </View>
            </View>

            <Text style={styles.heroSubtext}>
              {overallStatus === "Fits"
                ? "This trip is in a good state and ready for execution."
                : overallStatus === "Needs changes"
                ? "This trip needs adjustment before travel."
                : "You still need to generate suggestions or calculate this trip."}
            </Text>
          </View>

          {actionMessage ? (
            <View style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </View>
          ) : null}

          {actionError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Readiness Snapshot</Text>

            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Bags</Text>
                <Text style={styles.snapshotValue}>{suitcases.length}</Text>
                <Text style={styles.snapshotSubtext}>
                  {suitcases.length ? "Configured" : "Missing"}
                </Text>
              </View>

              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Items</Text>
                <Text style={styles.snapshotValue}>{items.length}</Text>
                <Text style={styles.snapshotSubtext}>
                  {items.length ? "Ready to review" : "No items yet"}
                </Text>
              </View>

              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Checklist</Text>
                <Text style={styles.snapshotValue}>{checklistReady}</Text>
                <Text style={styles.snapshotSubtext}>
                  Packing execution status
                </Text>
              </View>

              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Travel Day</Text>
                <Text style={styles.snapshotValue}>{travelDayReady}</Text>
                <Text style={styles.snapshotSubtext}>
                  Accessibility and wear plan
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Smart Action Center</Text>
            <Text style={styles.topActionText}>{topAction}</Text>

            <View style={styles.primaryActionsRow}>
              <Pressable
                style={styles.primaryActionButton}
                onPress={handleGenerateSuggestions}
                disabled={generating}
              >
                <Text style={styles.primaryActionButtonText}>
                  {generating ? "Generating..." : "Generate Suggestions"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryActionButton}
                onPress={handleCalculateTrip}
                disabled={calculating}
              >
                <Text style={styles.secondaryActionButtonText}>
                  {calculating ? "Calculating..." : "Calculate Trip"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quick Navigation</Text>

            <View style={styles.quickGrid}>
              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripBags", { tripId })}
              >
                <Text style={styles.quickTitle}>Bags</Text>
                <Text style={styles.quickSubtitle}>Manage suitcases</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripItems", { tripId })}
              >
                <Text style={styles.quickTitle}>Items</Text>
                <Text style={styles.quickSubtitle}>Review and add items</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripChecklist", { tripId })}
              >
                <Text style={styles.quickTitle}>Checklist</Text>
                <Text style={styles.quickSubtitle}>Track packing progress</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripTravelDay", { tripId })}
              >
                <Text style={styles.quickTitle}>Travel Day</Text>
                <Text style={styles.quickSubtitle}>What to wear and access</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripResults", { tripId })}
              >
                <Text style={styles.quickTitle}>Results</Text>
                <Text style={styles.quickSubtitle}>Fit and smart actions</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Travel Type: </Text>
              {trip?.travel_type || "—"}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Weather: </Text>
              {trip?.weather_type || "—"}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Traveler Count: </Text>
              {trip?.traveler_count || 1}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Results Status: </Text>
              {overallStatus}
            </Text>
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
    fontSize: 14,
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
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  heroSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  heroMiniCard: {
    minWidth: 90,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMiniLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  heroMiniValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  goodText: {
    color: colors.success,
  },
  dangerText: {
    color: colors.danger,
  },
  neutralText: {
    color: colors.text,
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  snapshotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  snapshotCard: {
    width: "47%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  snapshotLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  snapshotValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  snapshotSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  topActionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
    fontWeight: "600",
  },
  primaryActionsRow: {
    gap: spacing.sm,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryActionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryActionButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryActionButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickCard: {
    width: "47%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  quickSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  detailText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  detailLabel: {
    color: colors.text,
    fontWeight: "700",
  },
});

