import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import AppButton from "../../components/common/AppButton";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { useNotifications } from "../../context/NotificationsContext";

export default function NotificationsScreen({ navigation }) {
  const {
    trips,
    notifications,
    loadingNotifications,
    refreshNotifications,
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  if (loadingNotifications) {
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
          <AppCard>
            <SectionHeader
              title="Controls"
              subtitle="Manage how your trip reminders behave."
            />

            <AppButton
              title="Open Notification Preferences"
              variant="secondary"
              onPress={() => navigation.navigate("NotificationPreferences")}
            />
          </AppCard>

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
                        Priority {notification.priority} • Reminder #{index + 1}
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