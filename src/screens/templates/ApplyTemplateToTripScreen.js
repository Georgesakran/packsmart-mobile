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
import { applyTemplateToTrip, getTrips } from "../../api/tripApi";
import { useNotifications } from "../../context/NotificationsContext";

export default function ApplyTemplateToTripScreen({ route, navigation }) {
  const { templateId, templateName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [replaceExistingItems, setReplaceExistingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getTrips();
        const tripsArray = Array.isArray(data) ? data : [];

        setTrips(tripsArray);

        if (tripsArray.length > 0) {
          setSelectedTripId(tripsArray[0].id);
        }
      } catch (err) {
        console.error("Load trips for apply template error:", err);
        setError(err?.response?.data?.message || "Failed to load trips.");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []);

  const selectedTrip = useMemo(() => {
    return trips.find((trip) => trip.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  const handleApply = async () => {
    if (!selectedTripId) {
      setError("Please select a trip first.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setActionMessage("");

      const data = await applyTemplateToTrip(selectedTripId, templateId, {
        replaceExistingItems,
      });

      setActionMessage(data?.message || "Template applied successfully.");
      await refreshNotifications();

      navigation.navigate("Trips", {
        screen: "TripOverview",
        params: { tripId: selectedTripId },
      });
    } catch (err) {
      console.error("Apply template to trip error:", err);
      setError(err?.response?.data?.message || "Failed to apply template.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trips...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Templates / Apply</Text>
          <Text style={styles.title}>Apply Template to Trip</Text>
          <Text style={styles.subtitle}>
            Choose a trip and apply this template quickly.
          </Text>

          <AppCard>
            <SectionHeader
              title="Selected Template"
              subtitle="This is the template you are about to apply."
            />

            <Text style={styles.finalText}>
              <Text style={styles.finalLabel}>Template: </Text>
              {templateName || "Unnamed Template"}
            </Text>
          </AppCard>

          {actionMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </AppCard>
          ) : null}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Choose Trip"
              subtitle="Select which trip should receive this template."
            />

            {trips.length === 0 ? (
              <EmptyState
                title="No trips found"
                description="Create a trip first before applying this template."
              />
            ) : (
              <View style={styles.tripList}>
                {trips.map((trip) => {
                  const isSelected = selectedTripId === trip.id;

                  return (
                    <AppCard
                      key={trip.id}
                      style={[
                        styles.tripCard,
                        isSelected && styles.tripCardSelected,
                      ]}
                    >
                      <View style={styles.tripTopRow}>
                        <View style={styles.tripTextWrap}>
                          <Text style={styles.tripTitle}>
                            {trip.trip_name || "Unnamed Trip"}
                          </Text>
                          <Text style={styles.tripSubtitle}>
                            {trip.destination || "No destination"}
                          </Text>
                        </View>

                        {isSelected ? (
                          <StatusBadge label="Selected" tone="success" />
                        ) : (
                          <StatusBadge label="Trip" tone="neutral" />
                        )}
                      </View>

                      <AppButton
                        title={isSelected ? "Selected" : "Select Trip"}
                        variant={isSelected ? "secondary" : "secondary"}
                        onPress={() => setSelectedTripId(trip.id)}
                      />
                    </AppCard>
                  );
                })}
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Apply Mode"
              subtitle="Choose whether to keep existing items or replace them."
            />

            <View style={styles.modeActions}>
              <AppButton
                title={
                  !replaceExistingItems
                    ? "Add to Existing Items (Selected)"
                    : "Add to Existing Items"
                }
                variant="secondary"
                onPress={() => setReplaceExistingItems(false)}
              />

              <AppButton
                title={
                  replaceExistingItems
                    ? "Replace Existing Items (Selected)"
                    : "Replace Existing Items"
                }
                variant="secondary"
                onPress={() => setReplaceExistingItems(true)}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Final Action"
              subtitle="Apply this template to the selected trip."
            />

            <Text style={styles.finalText}>
              <Text style={styles.finalLabel}>Template: </Text>
              {templateName || "Unnamed Template"}
            </Text>

            <Text style={styles.finalText}>
              <Text style={styles.finalLabel}>Trip: </Text>
              {selectedTrip?.trip_name || "No trip selected"}
            </Text>

            <Text style={styles.finalText}>
              <Text style={styles.finalLabel}>Mode: </Text>
              {replaceExistingItems
                ? "Replace existing trip items"
                : "Add to existing trip items"}
            </Text>

            <AppButton
              title="Apply Template"
              onPress={handleApply}
              loading={submitting}
              style={styles.applyButton}
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
  successCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  tripList: {
    gap: spacing.sm,
  },
  tripCard: {
    backgroundColor: "#f8fafc",
  },
  tripCardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  tripTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tripTextWrap: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  tripSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modeActions: {
    gap: spacing.sm,
  },
  finalText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  finalLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  applyButton: {
    marginTop: spacing.lg,
  },
});