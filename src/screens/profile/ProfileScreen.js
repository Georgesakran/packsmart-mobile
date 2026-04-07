import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import useAuth from "../../hooks/useAuth";
import { usePushNotifications } from "../../context/PushNotificationsContext";
import { useNotifications } from "../../context/NotificationsContext";
import { buildReminderCandidates } from "../../utils/buildReminderCandidates";

export default function ProfileScreen() {

  const { logout } = useAuth();
  const {
    expoPushToken,
    notificationPermission,
    sendInstantLocalNotification,
    scheduleLocalNotification,
    cancelAllScheduledNotifications,
    scheduleMultipleLocalReminders,
  } = usePushNotifications();
  
  const { trips } = useNotifications();

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Account, preferences, and notification readiness
        </Text>

        <AppCard>
          <SectionHeader
            title="Push Notifications"
            subtitle="Foundation and readiness status for local and push notifications."
          />

          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Permission: </Text>
            {notificationPermission}
          </Text>

          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Push Token: </Text>
            {expoPushToken ? "Available" : "Not available yet"}
          </Text>

          <View style={styles.actionsColumn}>
            <AppButton
              title="Test Instant Notification"
              onPress={() =>
                sendInstantLocalNotification({
                  title: "PackSmart Test",
                  body: "This is a local notification test.",
                })
              }
            />

            <AppButton
              title="Test Reminder in 5 Seconds"
              variant="secondary"
              onPress={() =>
                scheduleLocalNotification({
                  title: "PackSmart Reminder",
                  body: "This is a scheduled test reminder.",
                  seconds: 5,
                })
              }
            />
            
            <AppButton
              title="Schedule Smart Trip Reminders"
              variant="secondary"
              onPress={async () => {
                const reminders = buildReminderCandidates(trips);
                await scheduleMultipleLocalReminders(reminders);
              }}
            />

            <AppButton
              title="Cancel Scheduled Notifications"
              variant="secondary"
              onPress={cancelAllScheduledNotifications}
            />
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader
            title="Account"
            subtitle="Sign out of your PackSmart account."
          />

          <AppButton title="Logout" variant="danger" onPress={logout} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  metaLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  actionsColumn: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});