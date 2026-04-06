import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../common/AppCard";
import StatusBadge from "../common/StatusBadge";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

export default function BagUsageCard({ bag }) {
  const volumeUsage = Number(bag?.usedCapacityPercent || 0);
  const usedWeightKg = Number(bag?.usedWeightKg || 0);
  const maxWeightKg = Number(bag?.maxWeightKg || bag?.max_weight_kg || 0);

  const weightUsagePercent = useMemo(() => {
    if (!maxWeightKg) return 0;
    return Math.round((usedWeightKg / maxWeightKg) * 100);
  }, [usedWeightKg, maxWeightKg]);

  const status = useMemo(() => {
    if (!bag?.volumeFits || !bag?.weightFits) {
      return {
        label: "Overloaded",
        tone: "danger",
      };
    }

    if (volumeUsage >= 85 || weightUsagePercent >= 85) {
      return {
        label: "Tight",
        tone: "warning",
      };
    }

    return {
      label: "Healthy",
      tone: "success",
    };
  }, [bag, volumeUsage, weightUsagePercent]);

  const volumeBarTone = useMemo(() => {
    if (volumeUsage >= 100) return styles.barDanger;
    if (volumeUsage >= 85) return styles.barWarning;
    return styles.barSuccess;
  }, [volumeUsage]);

  const weightBarTone = useMemo(() => {
    if (weightUsagePercent >= 100) return styles.barDanger;
    if (weightUsagePercent >= 85) return styles.barWarning;
    return styles.barInfo;
  }, [weightUsagePercent]);

  return (
    <AppCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.name}>{bag?.name}</Text>
          <Text style={styles.role}>
            Role: {bag?.bagRole || bag?.bag_role || "main"}
          </Text>
        </View>

        <StatusBadge label={status.label} tone={status.tone} />
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Used Volume</Text>
          <Text style={styles.metricValue}>{bag?.usedVolumeCm3 || 0} cm³</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Remaining Volume</Text>
          <Text style={styles.metricValue}>
            {bag?.remainingVolumeCm3 || 0} cm³
          </Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Used Weight</Text>
          <Text style={styles.metricValue}>{usedWeightKg} kg</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Max Weight</Text>
          <Text style={styles.metricValue}>{maxWeightKg} kg</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Volume Usage</Text>
          <Text style={styles.progressValue}>{volumeUsage}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              volumeBarTone,
              { width: `${Math.min(volumeUsage, 100)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Weight Usage</Text>
          <Text style={styles.progressValue}>{weightUsagePercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              weightBarTone,
              { width: `${Math.min(weightUsagePercent, 100)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {bag?.items?.length || 0} assigned items
        </Text>

        <Text style={styles.footerText}>
          {bag?.volumeFits && bag?.weightFits ? "Fits" : "Needs review"}
        </Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    marginTop: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleWrap: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  role: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricBox: {
    minWidth: "47%",
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "700",
  },
  progressTrack: {
    width: "100%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  barSuccess: {
    backgroundColor: "#22c55e",
  },
  barInfo: {
    backgroundColor: "#3b82f6",
  },
  barWarning: {
    backgroundColor: "#f59e0b",
  },
  barDanger: {
    backgroundColor: "#ef4444",
  },
  footerRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});