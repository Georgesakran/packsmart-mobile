import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTrips } from "../../api/tripApi";
import { buildNotificationsFromTrips } from "../../utils/buildNotifications";

export default function NotificationsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTrips();
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load notifications error:", err);
      setError(err?.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const notifications = useMemo(() => {
    return buildNotificationsFromTrips(trips);
  }, [trips]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading reminders...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Notifications</Text>
          <Text style={styles.title}>Reminders Center</Text>
          <Text style={styles.subtitle}>
            Smart reminders generated from your current trip states.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Overview"
              subtitle="A quick view of how many reminders need your attention."
            />

            <View style={styles.overviewRow}>
              <View style={styles.overviewBox}>
                <Text style={styles.overviewLabel}>Trips</Text>
                <Text style={styles.overviewValue}>{trips.length}</Text>
              </View>

              <View style={styles.overviewBox}>
                <Text style={styles.overviewLabel}>Reminders</Text>
                <Text style={styles.overviewValue}>{notifications.length}</Text>
              </View>
            </View>
          </AppCard>

          {notifications.length === 0 ? (
            <EmptyState
              title="No reminders right now"
              description="Your trips currently do not need any reminders."
            />
          ) : (
            notifications.map((notification, index) => (
              <Pressable
                key={notification.id}
                onPress={() =>
                  navigation.navigate("Trips", {
                    screen: "TripOverview",
                    params: { tripId: notification.tripId },
                  })
                }
              >
                <AppCard style={styles.notificationCard}>
                  <View style={styles.notificationTopRow}>
                    <View style={styles.notificationTextWrap}>
                      <Text style={styles.notificationIndex}>
                        Reminder #{index + 1}
                      </Text>
                      <Text style={styles.notificationIndex}>
                        Priority {notification.priority}
                      </Text>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                    </View>

                    <StatusBadge
                      label={
                        notification.type === "setup"
                          ? "Setup"
                          : notification.type === "action"
                          ? "Action"
                          : notification.type === "warning"
                          ? "Warning"
                          : notification.type === "progress"
                          ? "Progress"
                          : notification.type === "travel-day"
                          ? "Travel Day"
                          : notification.type === "ready"
                          ? "Ready"
                          : notification.type === "schedule"
                          ? "Schedule"
                          : notification.type === "urgent"
                          ? "Urgent"
                          : notification.type
                      }
                      tone={notification.tone}
                    />
                  </View>
                </AppCard>
              </Pressable>
            ))
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
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  overviewRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  overviewBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  notificationCard: {},
  notificationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  notificationTextWrap: {
    flex: 1,
  },
  notificationIndex: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
});