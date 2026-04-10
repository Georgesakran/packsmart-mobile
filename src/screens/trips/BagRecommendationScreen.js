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
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  getTripById,
  recommendBagsForTrip,
  saveSelectedTripBags,
} from "../../api/tripApi";

export default function BagRecommendationScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedBagIds, setSelectedBagIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [tripData, recommendationData] = await Promise.all([
          getTripById(tripId),
          recommendBagsForTrip(tripId),
        ]);

        setTrip(tripData || null);
        setRecommendation(recommendationData || null);

        const recommendedIds = Array.isArray(recommendationData?.recommendedBags)
          ? recommendationData.recommendedBags
              .filter((bag) => bag.recommended)
              .slice(0, 2)
              .map((bag) => bag.id)
          : [];

        setSelectedBagIds(recommendedIds);
      } catch (err) {
        console.error("Load bag recommendations error:", err);
        setError(
          err?.response?.data?.message || "Failed to load bag recommendations."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  const recommendedBags = useMemo(() => {
    return Array.isArray(recommendation?.recommendedBags)
      ? recommendation.recommendedBags
      : [];
  }, [recommendation]);

  const compatibleBags = useMemo(() => {
    return Array.isArray(recommendation?.compatibleBags)
      ? recommendation.compatibleBags
      : [];
  }, [recommendation]);

  const recommendedCombos = useMemo(() => {
    return Array.isArray(recommendation?.recommendedCombos)
      ? recommendation.recommendedCombos
      : [];
  }, [recommendation]);

  const warnings = useMemo(() => {
    return Array.isArray(recommendation?.warnings)
      ? recommendation.warnings
      : [];
  }, [recommendation]);

  const toggleBagSelection = (bagId) => {
    setSelectedBagIds((prev) =>
      prev.includes(bagId)
        ? prev.filter((id) => id !== bagId)
        : [...prev, bagId]
    );
  };

  const handleSaveAndContinue = async () => {
    try {
      setSaving(true);
      setError("");
      setActionMessage("");

      if (selectedBagIds.length === 0) {
        setError("Please select at least one bag.");
        return;
      }

      const selectedBagsPayload = compatibleBags
        .filter((bag) => selectedBagIds.includes(bag.id))
        .map((bag) => ({
          bagCatalogId: bag.id,
          quantity: 1,
          roleLabel: bag.bag_type,
          isRecommended: recommendedBags.some((r) => r.id === bag.id),
        }));

      await saveSelectedTripBags(tripId, selectedBagsPayload);

      setActionMessage("Selected bags saved successfully.");

      navigation.navigate("SuggestedItems", { tripId });
    } catch (err) {
      console.error("Save selected bags error:", err);
      setError(err?.response?.data?.message || "Failed to save selected bags.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading bag recommendations...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trips / Bags</Text>
          <Text style={styles.title}>Recommended Bags</Text>
          <Text style={styles.subtitle}>
            Choose the best bags for this trip before moving to item selection.
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
              subtitle="This recommendation is based on your trip setup."
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
                <Text style={styles.metaLabel}>Travelers: </Text>
                {trip?.traveler_count || 1}
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

          <AppCard>
            <SectionHeader
              title="Recommended Bags"
              subtitle="These are the best matches for your trip setup."
            />

            {recommendedBags.length === 0 ? (
              <EmptyState
                title="No recommended bags"
                description="No recommended bags were found for this trip yet."
              />
            ) : (
              recommendedBags.map((bag) => {
                const selected = selectedBagIds.includes(bag.id);

                return (
                  <View key={bag.id} style={styles.bagCard}>
                    <View style={styles.bagHeader}>
                      <View style={styles.bagTextWrap}>
                        <Text style={styles.bagTitle}>{bag.name}</Text>
                        <Text style={styles.bagSubtitle}>
                          {bag.brand || "Generic"} • {bag.bag_type}
                        </Text>
                      </View>

                      <View style={styles.badgesColumn}>
                        <StatusBadge label={`Score ${bag.score}`} tone="success" />
                        {bag.recommended ? (
                          <StatusBadge label="Recommended" tone="info" />
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.metaGroup}>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Dimensions: </Text>
                        {bag.length_cm} × {bag.width_cm} × {bag.height_cm} cm
                      </Text>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Volume: </Text>
                        {bag.volume_cm3} cm³
                      </Text>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Max Weight: </Text>
                        {bag.max_weight_kg || "—"} kg
                      </Text>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Reason: </Text>
                        {bag.recommendation_reason || "Good match for this trip."}
                      </Text>
                    </View>

                    <AppButton
                      title={selected ? "Unselect" : "Select Bag"}
                      variant={selected ? "secondary" : "primary"}
                      onPress={() => toggleBagSelection(bag.id)}
                    />
                  </View>
                );
              })
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Recommended Combos"
              subtitle="Suggested combinations for balance and flexibility."
            />

            {recommendedCombos.length === 0 ? (
              <EmptyState
                title="No combos available"
                description="No bag combinations were generated yet."
              />
            ) : (
              recommendedCombos.map((combo) => (
                <View key={combo.label} style={styles.comboCard}>
                  <View style={styles.comboHeader}>
                    <Text style={styles.comboTitle}>{combo.label}</Text>
                    <StatusBadge label={`Score ${combo.score}`} tone="info" />
                  </View>

                  <Text style={styles.comboSubtitle}>
                    {Array.isArray(combo.bags)
                      ? combo.bags.map((bag) => bag.name).join(" + ")
                      : "No bags"}
                  </Text>

                  <Text style={styles.comboReason}>{combo.reason}</Text>
                </View>
              ))
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="All Compatible Bags"
              subtitle="You can also select manually from all compatible options."
            />

            {compatibleBags.length === 0 ? (
              <EmptyState
                title="No compatible bags"
                description="No airline-compatible bags were found."
              />
            ) : (
              compatibleBags.map((bag) => {
                const selected = selectedBagIds.includes(bag.id);

                return (
                  <View key={bag.id} style={styles.compatibleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compatibleTitle}>{bag.name}</Text>
                      <Text style={styles.compatibleSubtitle}>
                        {bag.bag_type} • Score {bag.score}
                      </Text>
                    </View>

                    <AppButton
                      title={selected ? "Selected" : "Select"}
                      variant={selected ? "secondary" : "secondary"}
                      onPress={() => toggleBagSelection(bag.id)}
                    />
                  </View>
                );
              })
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Warnings"
              subtitle="Important notes based on airline rules and trip context."
            />

            {warnings.length === 0 ? (
              <EmptyState
                title="No warnings"
                description="Everything looks good so far."
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
              title="Final Selection"
              subtitle="Save the selected bags and continue."
            />

            <Text style={styles.finalText}>
              <Text style={styles.metaLabel}>Selected Bags: </Text>
              {selectedBagIds.length}
            </Text>

            <AppButton
              title="Save Bags and Continue"
              onPress={handleSaveAndContinue}
              loading={saving}
              style={styles.saveButton}
            />
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
  },
  badgesColumn: {
    gap: 6,
    alignItems: "flex-end",
  },
  comboCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  comboHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  comboTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
  },
  comboSubtitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  comboReason: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  compatibleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compatibleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  compatibleSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
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
  finalText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});