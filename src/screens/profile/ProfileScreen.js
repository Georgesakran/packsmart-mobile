import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import useAuth from "../../hooks/useAuth";

export default function ProfileScreen({ navigation }) {
  const { logout, user } = useAuth();

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Account access, app direction, and quick navigation.
          </Text>

          <AppCard style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroLabel}>Account Status</Text>
                <Text style={styles.heroValue}>Signed In</Text>
              </View>

              <StatusBadge label="Active" tone="success" />
            </View>

            <Text style={styles.heroSubtext}>
              Your PackSmart account is active and ready to use.
            </Text>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Account"
              subtitle="Basic signed-in account information."
            />

            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Status: </Text>
              Signed in
            </Text>

            {user?.email ? (
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Email: </Text>
                {user.email}
              </Text>
            ) : null}

            {user?.username ? (
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Username: </Text>
                {user.username}
              </Text>
            ) : null}
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Quick Access"
              subtitle="Jump into the main parts of the product."
            />

            <View style={styles.actionsColumn}>
              <AppButton
                title="Open Trips"
                onPress={() => navigation.navigate("Trips")}
              />

              <AppButton
                title="Create Trip"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("Trips", {
                    screen: "CreateTripWizard",
                  })
                }
              />

              <AppButton
                title="Open Presets"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("Trips", {
                    screen: "TravelPresets",
                  })
                }
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="App Status"
              subtitle="What is currently active in this version of PackSmart."
            />

            <View style={styles.statusList}>
              <Text style={styles.statusItem}>
                • Core product focus: trips, packing flow, and presets.
              </Text>
              <Text style={styles.statusItem}>
                • Notifications are currently paused during cleanup.
              </Text>
              <Text style={styles.statusItem}>
                • Templates are not part of the current main app structure.
              </Text>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="Session"
              subtitle="Sign out from your PackSmart account."
            />

            <AppButton title="Logout" variant="danger" onPress={logout} />
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
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
  },
  heroCard: {
    borderRadius: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
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
  statusList: {
    gap: spacing.sm,
  },
  statusItem: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
});