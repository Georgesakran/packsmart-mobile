import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { buildQuickInsightBadges } from "../../utils/buildQuickInsightBadges";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTrips } from "../../api/tripApi";
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
      setTrips(Array.isArray(tripsData) ? tripsData : []);
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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadHomeData);
    return unsubscribe;
  }, [navigation, loadHomeData]);

  const insights = useMemo(() => {
    return buildHomeInsights(trips, notifications);
  }, [trips, notifications]);

  const topTripTone = useMemo(() => {
    const score = insights.topTrip?.readinessScore || 0;
    if (score >= 85) return "success";
    if (score >= 60) return "info";
    if (score >= 35) return "warning";
    return "danger";
  }, [insights.topTrip]);

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
            Your trips, reminders, and next best actions in one place.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard style={styles.heroCard}>
            <Text style={styles.heroTitle}>Today’s Travel Snapshot</Text>
            <Text style={styles.heroSubtitle}>
              A quick view of your current planning momentum.
            </Text>

            <View style={styles.heroStatsGrid}>
              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatLabel}>Trips</Text>
                <Text style={styles.heroStatValue}>{insights.totalTrips}</Text>
              </View>

              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatLabel}>Reminders</Text>
                <Text style={styles.heroStatValue}>
                  {insights.totalNotifications}
                </Text>
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
              subtitle="The fastest ways to move your planning forward."
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
                title="Open Trips"
                variant="secondary"
                onPress={() => navigation.navigate("Trips")}
                style={styles.flexButton}
              />
            </View>

            <View style={styles.quickActionsRow}>
              <AppButton
                title="Open Notifications"
                variant="secondary"
                onPress={() => navigation.navigate("Notifications")}
                style={styles.flexButton}
              />

              <AppButton
                title="Open Templates"
                variant="secondary"
                onPress={() => navigation.navigate("Templates")}
                style={styles.flexButton}
              />
            </View>
          </AppCard>

          <AppCard style={styles.focusCard}>
            <SectionHeader
              title="Current Focus"
              subtitle="The trip that currently deserves the most attention."
            />

            {!insights.topTrip ? (
              <EmptyState
                title="No active trips yet"
                description="Create your first trip to start building your travel flow."
              />
            ) : (
              <View style={styles.focusWrap}>
                <View style={styles.focusTopRow}>
                  <View style={styles.focusTextWrap}>
                    <Text style={styles.focusTripName}>
                      {insights.topTrip.trip_name || "Unnamed Trip"}
                    </Text>
                    <Text style={styles.focusTripMeta}>
                      {insights.topTrip.destination || "No destination"}
                    </Text>
                  </View>

                  <StatusBadge
                    label={`${insights.topTrip.readinessScore}/100`}
                    tone={topTripTone}
                  />
                </View>

                <View style={styles.focusDetails}>
                  <Text style={styles.focusDetailText}>
                    <Text style={styles.focusDetailLabel}>Next Action: </Text>
                    {insights.topTrip.nextAction}
                  </Text>

                  <Text style={styles.focusDetailText}>
                    <Text style={styles.focusDetailLabel}>Bags: </Text>
                    {insights.topTrip.bagsCount}
                    {"   "}
                    <Text style={styles.focusDetailLabel}>Items: </Text>
                    {insights.topTrip.itemsCount}
                  </Text>

                  <Text style={styles.focusDetailText}>
                    <Text style={styles.focusDetailLabel}>Results: </Text>
                    {insights.topTrip.hasResults ? "Ready" : "Not calculated"}
                  </Text>
                </View>
                <View style={styles.quickBadgesRow}>
                  {buildQuickInsightBadges(insights.topTrip || {}).map((badge) => (
                    <StatusBadge
                      key={`top-${badge.label}`}
                      label={badge.label}
                      tone={badge.tone}
                    />
                  ))}
                </View>

                <View style={styles.focusButtons}>
                  <AppButton
                    title="Open Trip"
                    onPress={() =>
                      navigation.navigate("Trips", {
                        screen: "TripOverview",
                        params: { tripId: insights.topTrip.id },
                      })
                    }
                  />

                  <AppButton
                    title="Trip Results"
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate("Trips", {
                        screen: "TripResults",
                        params: { tripId: insights.topTrip.id },
                      })
                    }
                  />
                </View>
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Urgent Reminders"
              subtitle="The highest-priority signals that need attention now."
            />

            {insights.urgentNotifications.length === 0 ? (
              <EmptyState
                title="No urgent reminders"
                description="Nothing urgent needs your attention right now."
              />
            ) : (
              insights.urgentNotifications.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    <StatusBadge label="Urgent" tone="danger" />
                  </View>

                  <Text style={styles.reminderMessage}>{item.message}</Text>
                </View>
              ))
            )}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Active Trips"
              subtitle="Trips ranked by readiness and planning progress."
            />

            {insights.activeTrips.length === 0 ? (
              <EmptyState
                title="No trips yet"
                description="Create a trip to begin planning and tracking."
              />
            ) : (
              insights.activeTrips.slice(0, 5).map((trip) => (
                <View key={trip.id} style={styles.tripRowCard}>
                  <View style={styles.tripRowTop}>
                    <View style={styles.tripRowText}>
                      <Text style={styles.tripRowTitle}>
                        {trip.trip_name || "Unnamed Trip"}
                      </Text>
                      <Text style={styles.tripRowSubtitle}>
                        {trip.destination || "No destination"}
                      </Text>
                    </View>

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

                  <Text style={styles.tripRowHint}>{trip.nextAction}</Text>

                  <View style={styles.quickBadgesRow}>
                    {buildQuickInsightBadges(trip).map((badge) => (
                      <StatusBadge
                        key={`${trip.id}-${badge.label}`}
                        label={badge.label}
                        tone={badge.tone}
                      />
                    ))}
                  </View>

                  <AppButton
                    title="Open"
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate("Trips", {
                        screen: "TripOverview",
                        params: { tripId: trip.id },
                      })
                    }
                    style={styles.openButton}
                  />
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
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
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
    borderRadius: 22,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  heroStatsGrid: {
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
    borderRadius: 16,
    padding: spacing.md,
  },
  heroStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  focusCard: {
    borderRadius: 20,
  },
  focusWrap: {
    gap: spacing.md,
  },
  focusTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  focusTextWrap: {
    flex: 1,
  },
  focusTripName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  focusTripMeta: {
    fontSize: 14,
    color: colors.textMuted,
  },
  focusDetails: {
    gap: 8,
  },
  focusDetailText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  focusDetailLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  focusButtons: {
    gap: spacing.sm,
  },
  reminderCard: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: 8,
  },
  reminderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  reminderMessage: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  tripRowCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tripRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: 8,
  },
  tripRowText: {
    flex: 1,
  },
  tripRowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  tripRowSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tripRowHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  openButton: {
    marginTop: 2,
  },
  quickBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});