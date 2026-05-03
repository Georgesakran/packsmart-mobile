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
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import EmptyState from "../../components/common/EmptyState";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTrips } from "../../api/tripApi";

function normalizeTrip(trip) {
  const bagsCount = Number(trip.bagsCount || trip.bags_count || 0);
  const itemsCount = Number(trip.itemsCount || trip.items_count || 0);
  const hasResults = !!trip.hasResults || !!trip.has_results;
  const overallFits = trip.overallFits === true || trip.overall_fits === true;

  let flowStage = "new";
  let flowLabel = "New trip";

  if (bagsCount === 0) {
    flowStage = "suitcase_setup";
    flowLabel = "Suitcase setup pending";
  } else if (itemsCount === 0) {
    flowStage = "inventory";
    flowLabel = "Inventory pending";
  } else if (!hasResults) {
    flowStage = "simulation_ready";
    flowLabel = "Ready for simulation";
  } else if (hasResults && overallFits) {
    flowStage = "packed";
    flowLabel = "Packing looks good";
  } else if (hasResults && !overallFits) {
    flowStage = "needs_fix";
    flowLabel = "Needs packing adjustments";
  }

  return {
    ...trip,
    bagsCount,
    itemsCount,
    hasResults,
    overallFits,
    flowStage,
    flowLabel,
  };
}

function getStageTone(stage) {
  switch (stage) {
    case "packed":
      return {
        bg: "#ecfdf5",
        border: "#bbf7d0",
        text: "#166534",
      };
    case "simulation_ready":
      return {
        bg: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
      };
    case "needs_fix":
      return {
        bg: "#fff7ed",
        border: "#fdba74",
        text: "#c2410c",
      };
    default:
      return {
        bg: "#f8fafc",
        border: "#e2e8f0",
        text: "#475569",
      };
  }
}

function getTripDateLabel(trip) {
  if (trip?.start_date) return trip.start_date;
  if (trip?.created_at) return trip.created_at?.split?.("T")?.[0] || trip.created_at;
  return "No date";
}

function getSmartTip(trips = []) {
  if (!trips.length) {
    return "Start with one trip, choose the airline, then set the suitcase before inventory.";
  }

  const noBagsTrip = trips.find((trip) => trip.bagsCount === 0);
  if (noBagsTrip) {
    return `Your trip "${noBagsTrip.trip_name || "Unnamed Trip"}" still needs suitcase setup.`;
  }

  const noItemsTrip = trips.find((trip) => trip.bagsCount > 0 && trip.itemsCount === 0);
  if (noItemsTrip) {
    return `Your trip "${noItemsTrip.trip_name || "Unnamed Trip"}" is ready for smart inventory.`;
  }

  const readyForSimulation = trips.find(
    (trip) => trip.bagsCount > 0 && trip.itemsCount > 0 && !trip.hasResults
  );
  if (readyForSimulation) {
    return `Your trip "${readyForSimulation.trip_name || "Unnamed Trip"}" is ready for packing simulation.`;
  }

  const needsFixTrip = trips.find((trip) => trip.hasResults && !trip.overallFits);
  if (needsFixTrip) {
    return `Your trip "${needsFixTrip.trip_name || "Unnamed Trip"}" needs packing adjustments before travel.`;
  }

  return "Your current trips look organized. Continue refining simulation and packing flow.";
}

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTrips();
      const safeTrips = Array.isArray(data) ? data.map(normalizeTrip) : [];
      setTrips(safeTrips);
    } catch (err) {
      console.error("Load dashboard error:", err);
      setError(err?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadDashboard);
    return unsubscribe;
  }, [navigation, loadDashboard]);

  const activeTrips = useMemo(() => {
    return trips.filter((trip) => (trip.status || "draft") !== "archived");
  }, [trips]);

  const lastTrip = useMemo(() => {
    return activeTrips[0] || null;
  }, [activeTrips]);

  const upcomingTrips = useMemo(() => {
    return activeTrips.slice(0, 4);
  }, [activeTrips]);

  const smartTip = useMemo(() => getSmartTip(activeTrips), [activeTrips]);

  const continueAction = useMemo(() => {
    if (!lastTrip) return null;

    if (lastTrip.bagsCount === 0) {
      return {
        label: "Continue Suitcase Setup",
        onPress: () =>
          navigation.navigate("TripsTab", {
            screen: "SuitcaseSetup",
            params: { tripId: lastTrip.id },
          }),
      };
    }

    if (lastTrip.itemsCount === 0) {
      return {
        label: "Continue Smart Inventory",
        onPress: () =>
          navigation.navigate("TripsTab", {
            screen: "SmartInventory",
            params: { tripId: lastTrip.id },
          }),
      };
    }

    if (!lastTrip.hasResults) {
      return {
        label: "Open Trip Simulation",
        onPress: () =>
          navigation.navigate("TripOverview", {
            tripId: lastTrip.id,
          }),
      };
    }

    return {
      label: "Open Trip",
      onPress: () =>
        navigation.navigate("TripOverview", {
          tripId: lastTrip.id,
        }),
    };
  }, [lastTrip, navigation]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading PackSmart dashboard...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.heroBlock}>
            <Text style={styles.kicker}>PackSmart</Text>
            <Text style={styles.title}>Plan, scan, and pack smarter</Text>
            <Text style={styles.subtitle}>
              Build your trip, set your suitcase, scan your items, and move toward simulation.
            </Text>

            <AppButton
              title="New Trip"
              onPress={() => navigation.navigate("NewTrip")}
              style={styles.heroButton}
            />
          </View>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionTopRow}>
              <Text style={styles.sectionTitle}>Continue Last Trip</Text>
            </View>

            {!lastTrip ? (
              <EmptyState
                title="No trips yet"
                description="Create your first trip to start the new PackSmart flow."
              />
            ) : (
              <>
                <Text style={styles.continueTripName}>
                  {lastTrip.trip_name || "Unnamed Trip"}
                </Text>

                <Text style={styles.continueTripMeta}>
                  {lastTrip.destination || "No destination"} • {getTripDateLabel(lastTrip)}
                </Text>

                <View
                  style={[
                    styles.stagePill,
                    {
                      backgroundColor: getStageTone(lastTrip.flowStage).bg,
                      borderColor: getStageTone(lastTrip.flowStage).border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stagePillText,
                      { color: getStageTone(lastTrip.flowStage).text },
                    ]}
                  >
                    {lastTrip.flowLabel}
                  </Text>
                </View>

                <View style={styles.tripMiniStats}>
                  <Text style={styles.tripMiniStatText}>
                    Bags: {lastTrip.bagsCount}
                  </Text>
                  <Text style={styles.tripMiniStatText}>
                    Items: {lastTrip.itemsCount}
                  </Text>
                  <Text style={styles.tripMiniStatText}>
                    Results: {lastTrip.hasResults ? "Ready" : "Pending"}
                  </Text>
                </View>

                {continueAction ? (
                  <AppButton
                    title={continueAction.label}
                    onPress={continueAction.onPress}
                    style={styles.fullWidthButton}
                  />
                ) : null}
              </>
            )}
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionTopRow}>
              <Text style={styles.sectionTitle}>Upcoming Trips</Text>
              <Pressable onPress={() => navigation.navigate("TripsTab", { screen: "TripsHome" })}>
                <Text style={styles.linkText}>View all</Text>
              </Pressable>
            </View>

            {upcomingTrips.length === 0 ? (
              <EmptyState
                title="No upcoming trips"
                description="Your active trips will appear here."
              />
            ) : (
              <View style={styles.tripList}>
                {upcomingTrips.map((trip) => (
                  <Pressable
                    key={trip.id}
                    style={styles.tripRow}
                    onPress={() =>
                      navigation.navigate("TripsTab", {
                        screen: "TripOverview",
                        params: { tripId: trip.id },
                      })
                    }
                  >
                    <View style={styles.tripRowTextWrap}>
                      <Text style={styles.tripRowTitle}>
                        {trip.trip_name || "Unnamed Trip"}
                      </Text>
                      <Text style={styles.tripRowSubtitle}>
                        {trip.destination || "No destination"}
                      </Text>
                      <Text style={styles.tripRowDate}>{getTripDateLabel(trip)}</Text>
                    </View>

                    <View
                      style={[
                        styles.tripRowStatus,
                        {
                          backgroundColor: getStageTone(trip.flowStage).bg,
                          borderColor: getStageTone(trip.flowStage).border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tripRowStatusText,
                          { color: getStageTone(trip.flowStage).text },
                        ]}
                      >
                        {trip.flowLabel}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </AppCard>

          <View style={styles.quickToolsGrid}>
            <Pressable
              style={styles.quickToolCard}
              onPress={() => navigation.navigate("NewTrip")}
            >
              <Text style={styles.quickToolTitle}>New Trip</Text>
              <Text style={styles.quickToolSubtitle}>
                Start a new travel flow
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickToolCard}
              onPress={() => navigation.navigate("TripsTab", { screen: "TripsHome" })}
            >
              <Text style={styles.quickToolTitle}>All Trips</Text>
              <Text style={styles.quickToolSubtitle}>
                Open your trip list
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickToolCard}
              onPress={() => navigation.navigate("ProfileTab", { screen: "ProfileHome" })}
            >
              <Text style={styles.quickToolTitle}>Profile</Text>
              <Text style={styles.quickToolSubtitle}>
                Account and saved flow later
              </Text>
            </Pressable>
          </View>

          <AppCard style={styles.tipCard}>
            <Text style={styles.tipEyebrow}>Smart Tip</Text>
            <Text style={styles.tipText}>{smartTip}</Text>
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
  heroBlock: {
    gap: spacing.md,
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
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 24,
  },
  heroButton: {
    marginTop: spacing.sm,
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
  sectionCard: {
    gap: spacing.md,
  },
  sectionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  continueTripName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  continueTripMeta: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  stagePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: spacing.xs,
  },
  stagePillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tripMiniStats: {
    gap: 6,
    marginTop: spacing.xs,
  },
  tripMiniStatText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  fullWidthButton: {
    marginTop: spacing.sm,
  },
  tripList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tripRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: "#fff",
    gap: spacing.sm,
  },
  tripRowTextWrap: {
    gap: 4,
  },
  tripRowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  tripRowSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  tripRowDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tripRowStatus: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tripRowStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  quickToolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickToolCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    gap: 8,
  },
  quickToolTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  quickToolSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  tipCard: {
    backgroundColor: "#f8fbff",
    borderColor: "#dbeafe",
  },
  tipEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.secondary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    fontWeight: "500",
  },
});