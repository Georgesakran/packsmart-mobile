import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { useNotificationPreferences } from "../../context/NotificationPreferencesContext";
import { useNotifications } from "../../context/NotificationsContext";

export default function NotificationPreferencesScreen() {
  const {
    preferences,
    loadingPreferences,
    updatePreferences,
    resetPreferences,
  } = useNotificationPreferences();

  const { refreshNotifications } = useNotifications();

  const handleToggle = async (key, value) => {
    await updatePreferences({ [key]: value });
    await refreshNotifications();
  };

  const handleTextUpdate = async (key, value) => {
    await updatePreferences({ [key]: value });
    await refreshNotifications();
  };

  const handleReset = async () => {
    await resetPreferences();
    await refreshNotifications();
  };

  if (loadingPreferences) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading notification preferences...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Notifications / Preferences</Text>
        <Text style={styles.title}>Notification Preferences</Text>
        <Text style={styles.subtitle}>
          Control reminders, quiet mode, and timing behavior.
        </Text>

        <AppCard>
          <SectionHeader
            title="General"
            subtitle="Turn all smart reminders on or off."
          />

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Enable Notifications</Text>
              <Text style={styles.rowSubtitle}>
                Master switch for all in-app reminder logic.
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => handleToggle("enabled", value)}
            />
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader
            title="Reminder Types"
            subtitle="Choose which reminder categories should appear."
          />

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Checklist Reminders</Text>
              <Text style={styles.rowSubtitle}>
                Remind me to start or continue packing execution.
              </Text>
            </View>
            <Switch
              value={preferences.checklistReminders}
              onValueChange={(value) => handleToggle("checklistReminders", value)}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Travel Day Reminders</Text>
              <Text style={styles.rowSubtitle}>
                Remind me to mark wear-today and accessible items.
              </Text>
            </View>
            <Switch
              value={preferences.travelDayReminders}
              onValueChange={(value) => handleToggle("travelDayReminders", value)}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Schedule Reminders</Text>
              <Text style={styles.rowSubtitle}>
                Show reminders based on how close the trip date is.
              </Text>
            </View>
            <Switch
              value={preferences.scheduleReminders}
              onValueChange={(value) => handleToggle("scheduleReminders", value)}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Ready-State Reminders</Text>
              <Text style={styles.rowSubtitle}>
                Show positive reminders when a trip looks travel-ready.
              </Text>
            </View>
            <Switch
              value={preferences.readyReminders}
              onValueChange={(value) => handleToggle("readyReminders", value)}
            />
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader
            title="Quiet Mode"
            subtitle="Reduce non-urgent reminders during selected hours."
          />

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Enable Quiet Mode</Text>
              <Text style={styles.rowSubtitle}>
                Hide most reminders during quiet hours.
              </Text>
            </View>
            <Switch
              value={preferences.quietModeEnabled}
              onValueChange={(value) => handleToggle("quietModeEnabled", value)}
            />
          </View>

          <Text style={styles.label}>Quiet Hours Start</Text>
          <TextInput
            value={preferences.quietHoursStart}
            onChangeText={(value) => handleTextUpdate("quietHoursStart", value)}
            style={styles.input}
            placeholder="22:00"
          />

          <Text style={styles.label}>Quiet Hours End</Text>
          <TextInput
            value={preferences.quietHoursEnd}
            onChangeText={(value) => handleTextUpdate("quietHoursEnd", value)}
            style={styles.input}
            placeholder="08:00"
          />
        </AppCard>

        <AppCard>
          <SectionHeader
            title="Reminder Intensity"
            subtitle="Choose how selective reminders should be."
          />

          <View style={styles.modeButtons}>
            <AppButton
              title="Minimal"
              variant={
                preferences.reminderMode === "minimal" ? "primary" : "secondary"
              }
              onPress={() => handleTextUpdate("reminderMode", "minimal")}
            />
            <AppButton
              title="Normal"
              variant={
                preferences.reminderMode === "normal" ? "primary" : "secondary"
              }
              onPress={() => handleTextUpdate("reminderMode", "normal")}
            />
            <AppButton
              title="Important Only"
              variant={
                preferences.reminderMode === "important_only"
                  ? "primary"
                  : "secondary"
              }
              onPress={() => handleTextUpdate("reminderMode", "important_only")}
            />
          </View>
        </AppCard>

        <AppButton
          title="Reset to Default"
          variant="secondary"
          onPress={handleReset}
        />
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: "#fff",
  },
  modeButtons: {
    gap: spacing.sm,
  },
});