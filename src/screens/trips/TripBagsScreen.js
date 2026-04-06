import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
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
        <Text style={styles.kicker}>Trip / Bags</Text>
        <Text style={styles.title}>{trip?.trip_name || "Trip Bags"}</Text>
        <Text style={styles.subtitle}>
          Review all bags linked to this trip.
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() =>
            navigation.navigate("AddTripBag", {
              tripId,
            })
          }
        >
          <Text style={styles.addButtonText}>+ Add Bag</Text>
        </Pressable>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Bags</Text>
          <Text style={styles.summaryValue}>{bags.length}</Text>
        </View>

        {bags.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No bags added yet</Text>
            <Text style={styles.emptyText}>
              This trip does not have any bags assigned yet.
            </Text>
          </View>
        ) : (
          bags.map((bag) => (
            <View key={bag.id} style={styles.bagCard}>
              <View style={styles.bagTopRow}>
                <Text style={styles.bagName}>{bag.name}</Text>
                <View
                  style={[
                    styles.badge,
                    bag.is_primary ? styles.primaryBadge : styles.roleBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      bag.is_primary
                        ? styles.primaryBadgeText
                        : styles.roleBadgeText,
                    ]}
                  >
                    {bag.is_primary ? "Primary" : bag.bag_role || "Bag"}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Role: </Text>
                  {bag.bag_role || "main"}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Volume: </Text>
                  {bag.volume_cm3 || bag.volumeCm3 || 0} cm³
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Max Weight: </Text>
                  {bag.max_weight_kg || bag.maxWeightKg || 0} kg
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Dimensions: </Text>
                  {bag.length_cm && bag.width_cm && bag.height_cm
                    ? `${bag.length_cm} × ${bag.width_cm} × ${bag.height_cm} cm`
                    : "Not set"}
                </Text>
              </View>
            </View>
          ))
        )}
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
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  bagCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bagTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bagName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  primaryBadge: {
    backgroundColor: "#dbeafe",
  },
  roleBadge: {
    backgroundColor: "#e5e7eb",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  primaryBadgeText: {
    color: "#1d4ed8",
  },
  roleBadgeText: {
    color: "#374151",
    textTransform: "capitalize",
  },
  metaRow: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});