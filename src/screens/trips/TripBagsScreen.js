import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripSuitcases } from "../../api/tripApi";

export default function TripBagsScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [bags, setBags] = useState([]);
  const [error, setError] = useState("");

  const loadBags = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [tripData, bagsData] = await Promise.all([
        getTripById(tripId),
        getTripSuitcases(tripId),
      ]);

      setTrip(tripData || null);
      setBags(Array.isArray(bagsData) ? bagsData : []);
    } catch (err) {
      console.error("Load trip bags error:", err);
      setError(err?.response?.data?.message || "Failed to load trip bags.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadBags();
  }, [loadBags]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadBags();
    });

    return unsubscribe;
  }, [navigation, loadBags]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip bags...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trip / Bags</Text>
          <Text style={styles.title}>{trip?.trip_name || "Trip Bags"}</Text>
          <Text style={styles.subtitle}>
            Review, add, and manage all bags linked to this trip.
          </Text>

          <View style={styles.topActionsRow}>
            <AppButton
              title="Add Bag"
              onPress={() =>
                navigation.navigate("AddTripBag", {
                  tripId,
                })
              }
              style={styles.flexButton}
            />

            <AppButton
              title="Refresh"
              onPress={loadBags}
              variant="secondary"
              style={styles.flexButton}
            />
          </View>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Bag Summary"
              subtitle="A quick view of the current bag setup for this trip."
            />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Total Bags</Text>
                <Text style={styles.summaryMiniValue}>{bags.length}</Text>
              </View>

              <View style={styles.summaryMiniCard}>
                <Text style={styles.summaryMiniLabel}>Primary</Text>
                <Text style={styles.summaryMiniValue}>
                  {bags.find((bag) => bag.is_primary || bag.isPrimary) ? "Set" : "None"}
                </Text>
              </View>
            </View>
          </AppCard>

          {bags.length === 0 ? (
            <EmptyState
              title="No bags added yet"
              description="This trip does not have any bags assigned yet."
            />
          ) : (
            bags.map((bag) => {
              const isPrimary = !!bag.is_primary || !!bag.isPrimary;
              const volume = bag.volume_cm3 || bag.volumeCm3 || 0;
              const maxWeight = bag.max_weight_kg || bag.maxWeightKg || 0;
              const dimensions =
                bag.length_cm && bag.width_cm && bag.height_cm
                  ? `${bag.length_cm} × ${bag.width_cm} × ${bag.height_cm} cm`
                  : "Not set";

              return (
                <AppCard key={bag.id} style={styles.bagCard}>
                  <View style={styles.bagTopRow}>
                    <View style={styles.bagNameWrap}>
                      <Text style={styles.bagName}>{bag.name}</Text>
                      <Text style={styles.bagRoleText}>
                        Role: {bag.bag_role || bag.bagRole || "main"}
                      </Text>
                    </View>

                    {isPrimary ? (
                      <StatusBadge label="Primary" tone="info" />
                    ) : (
                      <StatusBadge
                        label={bag.bag_role || bag.bagRole || "Bag"}
                        tone="neutral"
                      />
                    )}
                  </View>

                  <View style={styles.metaGroup}>
                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Volume: </Text>
                      {volume} cm³
                    </Text>

                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Max Weight: </Text>
                      {maxWeight} kg
                    </Text>

                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Dimensions: </Text>
                      {dimensions}
                    </Text>
                  </View>

                  <AppButton
                    title="Edit Bag"
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate("EditTripBag", {
                        tripId,
                        bag,
                      })
                    }
                    style={styles.editButton}
                  />
                </AppCard>
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
  topActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
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
    marginBottom: 6,
  },
  summaryMiniValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  bagCard: {},
  bagTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bagNameWrap: {
    flex: 1,
  },
  bagName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  bagRoleText: {
    fontSize: 13,
    color: colors.textMuted,
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
  editButton: {
    marginTop: spacing.lg,
  },
});