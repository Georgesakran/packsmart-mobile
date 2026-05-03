import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";

const FLOW_STEPS = [
  { key: "suitcase", label: "Suitcase" },
  { key: "items", label: "Items" },
  { key: "review", label: "Review" },
  { key: "simulate", label: "Simulate" },
  { key: "result", label: "Result" },
];

export default function FlowProgressHeader({
  currentStep = "items",
  title,
  subtitle,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.stepsRow}>
        {FLOW_STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted =
            FLOW_STEPS.findIndex((s) => s.key === currentStep) > index;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.dot,
                    isCompleted && styles.dotCompleted,
                    isActive && styles.dotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isActive && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {index < FLOW_STEPS.length - 1 ? (
                <View style={styles.line} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      {(title || subtitle) ? (
        <View style={styles.copyCard}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  dotCompleted: {
    backgroundColor: "#93c5fd",
    borderColor: "#60a5fa",
  },
  dotActive: {
    width: 14,
    height: 14,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 6,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
  },
  stepLabelCompleted: {
    color: "#2563eb",
  },
  stepLabelActive: {
    color: colors.text,
  },
  copyCard: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 16,
    padding: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});