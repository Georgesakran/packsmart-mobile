import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  getTrips,
  getTripItems,
  getTripResults,
  getTripSuitcases,
} from "../../api/tripApi";
import { useNotifications } from "../../context/NotificationsContext";
import { buildHomeInsights } from "../../utils/buildHomeInsights";

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  const { notifications, refreshNotifications } = useNotifications();

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
  
      const tripsData = await getTrips();
      const tripsArray = Array.isArray(tripsData) ? tripsData : [];
  
      const enrichedTrips = await Promise.all(
        tripsArray.map(async (trip) => {
          const [bagsRes, itemsRes, resultsRes] = await Promise.allSettled([
            getTripSuitcases(trip.id),
            getTripItems(trip.id),
            getTripResults(trip.id),
          ]);
  
          const bags =
            bagsRes.status === "fulfilled" && Array.isArray(bagsRes.value)
              ? bagsRes.value
              : [];
  
          const items =
            itemsRes.status === "fulfilled" && Array.isArray(itemsRes.value)
              ? itemsRes.value
              : [];
  
          const results =
            resultsRes.status === "fulfilled" ? resultsRes.value : null;
  
          const checklistStarted = items.some((item) => {
            const status = item.packingStatus || item.packing_status || "pending";
            return status !== "pending";
          });
  
          const travelDayConfigured = items.some((item) => {
            const mode = item.travelDayMode || item.travel_day_mode || "normal";
            return mode !== "normal";
          });
  
          return {
            ...trip,
            bagsCount: bags.length,
            itemsCount: items.length,
            hasResults: !!results?.totals,
            overallFits: results?.totals?.overallFits ?? false,
            checklistStarted,
            travelDayConfigured,
          };
        })
      );
  
      setTrips(enrichedTrips);
      await refreshNotifications();
    } catch (err) {
      console.error("Load home data error:", err);
      setError(err?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const insights = useMemo(() => {
    return buildHomeInsights(trips, notifications);
  }, [trips, notifications]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading dashboard...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart</Text>
          <Text style={styles.title}>Home Dashboard</Text>
          <Text style={styles.subtitle}>
            Active trips, reminders, and the next best actions in one place.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard style={styles.heroCard}>
            <SectionHeader
              title="Your Activity Snapshot"
              subtitle="A quick look at your current travel planning state."
            />

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatLabel}>Trips</Text>
                <Text style={styles.heroStatValue}>{insights.totalTrips}</Text>
              </View>

              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatLabel}>Reminders</Text>
                <Text style={styles.heroStatValue}>{insights.totalNotifications}</Text>
              </View>

              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatLabel}>Urgent</Text>
                <Text style={styles.heroStatValue}>
                  {insights.urgentNotifications.length}
                </Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Quick Actions"
              subtitle="Jump into the most common trip actions."
            />

            <View style={styles.quickActionsRow}>
              <AppButton
                title="Create Trip"
                onPress={() =>
                  navigation.navigate("Trips", {
                    screen: "CreateTrip",
                  })
                }
                style={styles.flexButton}
              />

              <AppButton
                title="Open Notifications"
                variant="secondary"
                onPress={() => navigation.navigate("Notifications")}
                style={styles.flexButton}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Top Active Trip"
              subtitle="The strongest or most advanced trip right now."
            />

            {!insights.topTrip ? (
              <EmptyState
                title="No active trips yet"
                description="Create your first trip to start seeing active trip insights."
              />
            ) : (
              <View style={styles.topTripWrap}>
                <View style={styles.topTripHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topTripName}>
                      {insights.topTrip.trip_name || "Unnamed Trip"}
                    </Text>
                    <Text style={styles.topTripSubtext}>
                      {insights.topTrip.destination || "No destination"}
                    </Text>
                  </View>

                  <StatusBadge
                    label={`${insights.topTrip.readinessScore}/100`}
                    tone={
                      insights.topTrip.readinessScore >= 85
                        ? "success"
                        : insights.topTrip.readinessScore >= 60
                        ? "info"
                        : insights.topTrip.readinessScore >= 35
                        ? "warning"
                        : "danger"
                    }
                  />
                </View>

                <View style={styles.topTripMeta}>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Bags: </Text>
                    {insights.topTrip.bagsCount}
                  </Text>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Items: </Text>
                    {insights.topTrip.itemsCount}
                  </Text>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Next Action: </Text>
                    {insights.topTrip.nextAction}
                  </Text>
                </View>

                <AppButton
                  title="Open Trip"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate("Trips", {
                      screen: "TripOverview",
                      params: { tripId: insights.topTrip.id },
                    })
                  }
                />
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Urgent Reminders"
              subtitle="The most important reminders needing attention now."
            />

            {insights.urgentNotifications.length === 0 ? (
              <EmptyState
                title="No urgent reminders"
                description="Nothing urgent needs your attention right now."
              />
            ) : (
              insights.urgentNotifications.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.reminderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    <Text style={styles.reminderMessage}>{item.message}</Text>
                  </View>
                  <StatusBadge label="Urgent" tone="danger" />
                </View>
              ))
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Active Trips"
              subtitle="Your trips sorted by readiness and planning progress."
            />

            {insights.activeTrips.length === 0 ? (
              <EmptyState
                title="No trips yet"
                description="Create a trip to start building your packing workflow."
              />
            ) : (
              insights.activeTrips.slice(0, 5).map((trip) => (
                <View key={trip.id} style={styles.tripRow}>
                  <View style={styles.tripRowText}>
                    <Text style={styles.tripRowTitle}>
                      {trip.trip_name || "Unnamed Trip"}
                    </Text>
                    <Text style={styles.tripRowSubtitle}>
                      {trip.destination || "No destination"} • {trip.nextAction}
                    </Text>
                  </View>

                  <View style={styles.tripRowRight}>
                    <StatusBadge
                      label={`${trip.readinessScore}/100`}
                      tone={
                        trip.readinessScore >= 85
                          ? "success"
                          : trip.readinessScore >= 60
                          ? "info"
                          : trip.readinessScore >= 35
                          ? "warning"
                          : "danger"
                      }
                    />
                  </View>
                </View>
              ))
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
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  heroCard: {
    borderRadius: 20,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  heroStatBox: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  heroStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  topTripWrap: {
    gap: spacing.md,
  },
  topTripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  topTripName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  topTripSubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  topTripMeta: {
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
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  tripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tripRowText: {
    flex: 1,
  },
  tripRowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  tripRowSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  tripRowRight: {
    alignItems: "flex-end",
  },
});