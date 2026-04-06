import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  getTripById,
  getTripItems,
  getTripResults,
  getTripSuitcases,
} from "../../api/tripApi";

export default function TripOverviewScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [suitcases, setSuitcases] = useState([]);
  const [items, setItems] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

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

  const resultStatus = useMemo(() => {
    if (!results?.totals) return "Not calculated";
    return results.totals.overallFits ? "Fits" : "Needs changes";
  }, [results]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip overview...</Text>
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
      <View style={styles.container}>
        <Text style={styles.kicker}>Trip Overview</Text>
        <Text style={styles.title}>{trip?.trip_name || "Unnamed Trip"}</Text>
        <Text style={styles.subtitle}>
          {trip?.destination || "No destination"} •{" "}
          {trip?.duration_days ? `${trip.duration_days} days` : "No duration"}
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Trip Command Center</Text>
          <Text style={styles.summaryText}>
            This is the mobile control hub for your trip.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Travel Type</Text>
            <Text style={styles.statValue}>{trip?.travel_type || "—"}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Weather</Text>
            <Text style={styles.statValue}>{trip?.weather_type || "—"}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Bags</Text>
            <Text style={styles.statValue}>{suitcases.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Items</Text>
            <Text style={styles.statValue}>{items.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Results</Text>
            <Text style={styles.statValue}>{resultStatus}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Travelers</Text>
            <Text style={styles.statValue}>{trip?.traveler_count || 1}</Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() =>
                  navigation.navigate("TripBags", {
                  tripId,
                  })
              }
            >
              <Text style={styles.actionTitle}>Bags</Text>
              <Text style={styles.actionSubtitle}>Manage suitcases and bag roles</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate("TripItems", {
                  tripId,
                })
              }
            >
              <Text style={styles.actionTitle}>Items</Text>
              <Text style={styles.actionSubtitle}>Review and edit trip items</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate("TripChecklist", {
                  tripId,
                })
              }
            >
              <Text style={styles.actionTitle}>Checklist</Text>
              <Text style={styles.actionSubtitle}>Track packing progress</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate("TripTravelDay", {
                  tripId,
                })
              }
            >
              <Text style={styles.actionTitle}>Travel Day</Text>
              <Text style={styles.actionSubtitle}>Plan what to wear and keep close</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate("TripResults", {
                  tripId,
                })
              }
            >
              <Text style={styles.actionTitle}>Results</Text>
              <Text style={styles.actionSubtitle}>See packing fit and smart actions</Text>
            </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
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
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  actionsGrid: {
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});