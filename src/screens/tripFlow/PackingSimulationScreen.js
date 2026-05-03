// PackingSimulationScreen.js
import React, { useEffect, useMemo, useState } from "react";
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
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import FlowProgressHeader from "../../components/tripFlow/FlowProgressHeader";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripItems, calculateTrip } from "../../api/tripApi";

export default function PackingSimulationScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!tripId) {
          setError("Trip ID is missing.");
          return;
        }

        const [tripData, tripItems] = await Promise.all([
          getTripById(tripId),
          getTripItems(tripId),
        ]);

        setTrip(tripData || null);
        setItems(Array.isArray(tripItems) ? tripItems : []);
      } catch (err) {
        console.error("Load packing simulation screen error:", err);
        setError(
          err?.response?.data?.message ||
            "Failed to load trip simulation data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [items]);

  const groupedCategoryCount = useMemo(() => {
    return new Set(items.map((item) => item.category || "misc")).size;
  }, [items]);

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

  const handleRunSimulation = async () => {
    try {
      setError("");
      setActionMessage("");

      if (!tripId) {
        setError("Trip ID is missing.");
        return;
      }

      if (!items.length) {
        setError("You need at least one item before running the simulation.");
        return;
      }

      setSimulating(true);

      await calculateTrip(tripId);

      setActionMessage("Packing simulation completed successfully.");

      navigation.navigate("FinalPackingReview", { tripId });
    } catch (err) {
      console.error("Run packing simulation error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to run the packing simulation."
      );
    } finally {
      setSimulating(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Preparing simulation...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart vNext</Text>
          <Text style={styles.title}>Packing Simulation</Text>
          <Text style={styles.subtitle}>
            PackSmart will estimate item size, decide better placement, and build
            your packing result automatically.
          </Text>

          <FlowProgressHeader
            currentStep="result"
            title="Your packing result is ready"
            subtitle="Check the fit, review simple recommendations, and open the 3D player to see the final packing order."
          />

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
              title="Trip Overview"
              subtitle="Quick check before you run the packing engine."
            />

            <View style={styles.tripInfoWrap}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Trip: </Text>
                {trip?.trip_name || "Unnamed Trip"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Destination: </Text>
                {tripDestination}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Duration: </Text>
                {trip?.duration_days || 0} day
                {Number(trip?.duration_days || 0) === 1 ? "" : "s"}
              </Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Inventory Snapshot"
              subtitle="This is what PackSmart will use for the simulation."
            />

            {items.length === 0 ? (
              <EmptyState
                title="No items ready for simulation"
                description="PackSmart needs at least a few trip items before it can calculate the packing result."
              />
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Items</Text>
                    <Text style={styles.summaryValue}>{totalItemsCount}</Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Categories</Text>
                    <Text style={styles.summaryValue}>{groupedCategoryCount}</Text>
                  </View>
                </View>

                <View style={styles.previewList}>
                  {items.slice(0, 6).map((item) => {
                    const name =
                      item.custom_name || item.base_item_name || item.name || "Item";

                    return (
                      <View key={item.id} style={styles.previewRow}>
                        <View style={styles.previewDot} />
                        <Text style={styles.previewText}>
                          {name} × {Number(item.quantity || 1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {items.length > 6 ? (
                  <Text style={styles.moreText}>
                    + {items.length - 6} more item
                    {items.length - 6 === 1 ? "" : "s"}
                  </Text>
                ) : null}
              </>
            )}
          </AppCard>

          <AppCard style={styles.infoCard}>
            <SectionHeader
              title="What PackSmart will do"
              subtitle="You do not need to enter complex packing details."
            />

            <View style={styles.infoList}>
              <Text style={styles.infoText}>• Estimate item dimensions automatically</Text>
              <Text style={styles.infoText}>• Decide folding and packing behavior</Text>
              <Text style={styles.infoText}>• Choose a better zone inside the suitcase</Text>
              <Text style={styles.infoText}>• Detect weak placements and improve them</Text>
              <Text style={styles.infoText}>• Generate final packing suggestions</Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Start"
              subtitle="Run the packing engine and continue to the result screen."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title={simulating ? "Running Simulation..." : "Start Packing Simulation"}
                onPress={handleRunSimulation}
                loading={simulating}
                size="md"
                disabled={!items.length}
              />

              <AppButton
                title="Back to Inventory Review"
                variant="secondary"
                onPress={() => navigation.navigate("InventoryReview", { tripId })}
                size="md"
                disabled={simulating}
              />
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
  tripInfoWrap: {
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
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  previewList: {
    gap: 10,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  previewText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  moreText: {
    marginTop: spacing.md,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  infoCard: {
    backgroundColor: "#f8fbff",
    borderColor: "#dbeafe",
  },
  infoList: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});