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
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import {
  completePackingStep,
  generatePackingSteps,
  getPackingSteps,
  getTripById,
} from "../../api/tripApi";

function prettifyToken(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function GuidedPackingScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadSteps = async () => {
    const stepsData = await getPackingSteps(tripId);
    setSteps(Array.isArray(stepsData) ? stepsData : []);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const tripData = await getTripById(tripId);
        setTrip(tripData || null);

        await loadSteps();
      } catch (err) {
        console.error("Load guided packing error:", err);
        setError(
          err?.response?.data?.message || "Failed to load guided packing steps."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  useEffect(() => {
    if (steps.length === 0) {
      setCurrentIndex(0);
      return;
    }

    const firstIncompleteIndex = steps.findIndex((step) => !step.isCompleted);
    if (firstIncompleteIndex >= 0) {
      setCurrentIndex(firstIncompleteIndex);
    } else {
      setCurrentIndex(steps.length - 1);
    }
  }, [steps]);

  const currentStep = useMemo(() => {
    if (!Array.isArray(steps) || steps.length === 0) return null;
    return steps[currentIndex] || null;
  }, [steps, currentIndex]);

  const completedCount = useMemo(() => {
    return steps.filter((step) => step.isCompleted).length;
  }, [steps]);

  const progressPercent = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round((completedCount / steps.length) * 100);
  }, [completedCount, steps.length]);

  const handleGenerateSteps = async () => {
    try {
      setGenerating(true);
      setError("");
      setActionMessage("");

      await generatePackingSteps(tripId);
      await loadSteps();

      setActionMessage("Packing steps generated successfully.");
    } catch (err) {
      console.error("Generate packing steps error:", err);
      setError(
        err?.response?.data?.message || "Failed to generate packing steps."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteStep = async () => {
    try {
      if (!currentStep || currentStep.isCompleted) return;

      setCompleting(true);
      setError("");
      setActionMessage("");

      await completePackingStep(tripId, currentStep.id);

      const updatedSteps = steps.map((step) =>
        step.id === currentStep.id
          ? { ...step, isCompleted: true, completedAt: new Date().toISOString() }
          : step
      );

      setSteps(updatedSteps);
      setActionMessage("Packing step completed.");

      const nextIncompleteIndex = updatedSteps.findIndex(
        (step) => !step.isCompleted
      );

      if (nextIncompleteIndex >= 0) {
        setCurrentIndex(nextIncompleteIndex);
      }
    } catch (err) {
      console.error("Complete packing step error:", err);
      setError(
        err?.response?.data?.message || "Failed to complete packing step."
      );
    } finally {
      setCompleting(false);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading guided packing...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Trips / Guided Packing</Text>
          <Text style={styles.title}>Guided Packing</Text>
          <Text style={styles.subtitle}>
            Follow the packing steps one by one and complete them as you go.
          </Text>

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
          ) : null}

          {actionMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader
              title="Trip Context"
              subtitle="Current guided packing session for this trip."
            />

            <View style={styles.metaGroup}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Trip: </Text>
                {trip?.trip_name || "Unnamed Trip"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Destination: </Text>
                {trip?.destination ||
                  `${trip?.destination_city || ""}${
                    trip?.destination_city && trip?.destination_country ? ", " : ""
                  }${trip?.destination_country || ""}` ||
                  "—"}
              </Text>

              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>Duration: </Text>
                {trip?.duration_days || 0} day
                {Number(trip?.duration_days || 0) === 1 ? "" : "s"}
              </Text>
            </View>
          </AppCard>

          {steps.length === 0 ? (
            <AppCard>
              <EmptyState
                title="No packing steps yet"
                description="Generate guided packing steps from the latest calculation result."
              />

              <AppButton
                title="Generate Packing Steps"
                onPress={handleGenerateSteps}
                loading={generating}
                style={styles.generateButton}
              />
            </AppCard>
          ) : (
            <>
              <AppCard>
                <SectionHeader
                  title="Packing Progress"
                  subtitle="Track how much of the guided packing plan is complete."
                />

                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>{progressPercent}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progressPercent}%` }]}
                  />
                </View>

                <View style={styles.progressStatsRow}>
                  <Text style={styles.progressStatText}>
                    <Text style={styles.metaLabel}>Completed: </Text>
                    {completedCount}/{steps.length}
                  </Text>

                  <Text style={styles.progressStatText}>
                    <Text style={styles.metaLabel}>Current Step: </Text>
                    {currentStep?.stepOrder || 0}/{steps.length}
                  </Text>
                </View>
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Current Step"
                  subtitle="Follow this instruction before moving to the next step."
                />

                {currentStep ? (
                  <>
                    <View style={styles.currentStepHeader}>
                      <View style={styles.currentStepTextWrap}>
                        <Text style={styles.currentStepTitle}>
                          Step {currentStep.stepOrder}
                        </Text>
                        <Text style={styles.currentStepItemName}>
                          {currentStep.itemName || "Item"}
                        </Text>
                      </View>

                      <StatusBadge
                        label={
                          currentStep.isCompleted ? "Completed" : "Pending"
                        }
                        tone={currentStep.isCompleted ? "success" : "warning"}
                      />
                    </View>

                    <View style={styles.metaGroup}>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Quantity: </Text>
                        {currentStep.quantity || 1}
                      </Text>

                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Step Type: </Text>
                        {prettifyToken(currentStep.stepType)}
                      </Text>

                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Fold Type: </Text>
                        {prettifyToken(currentStep.foldType)}
                      </Text>

                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Target Bag: </Text>
                        {currentStep.targetBagName || "Travel Day"}
                      </Text>

                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Target Zone: </Text>
                        {prettifyToken(currentStep.targetZone)}
                      </Text>
                    </View>

                    <View style={styles.instructionCard}>
                      <Text style={styles.instructionLabel}>Instruction</Text>
                      <Text style={styles.instructionText}>
                        {currentStep.instructionText}
                      </Text>
                    </View>

                    <View style={styles.actionsRow}>
                      <AppButton
                        title="Previous"
                        variant="secondary"
                        onPress={goPrevious}
                        disabled={currentIndex === 0}
                        style={styles.flexButton}
                      />

                      <AppButton
                        title="Next"
                        variant="secondary"
                        onPress={goNext}
                        disabled={currentIndex === steps.length - 1}
                        style={styles.flexButton}
                      />
                    </View>

                    <AppButton
                      title={
                        currentStep.isCompleted
                          ? "Step Already Completed"
                          : "Mark Step Complete"
                      }
                      onPress={handleCompleteStep}
                      loading={completing}
                      disabled={currentStep.isCompleted}
                      style={styles.completeButton}
                    />
                  </>
                ) : (
                  <EmptyState
                    title="No current step"
                    description="There is no active packing step to display."
                  />
                )}
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Step Overview"
                  subtitle="A quick view of all steps in this guided packing plan."
                />

                <View style={styles.stepsOverviewWrap}>
                  {steps.map((step) => (
                    <View
                      key={step.id}
                      style={[
                        styles.stepOverviewRow,
                        step.id === currentStep?.id && styles.stepOverviewRowActive,
                      ]}
                    >
                      <View style={styles.stepOverviewTextWrap}>
                        <Text style={styles.stepOverviewTitle}>
                          Step {step.stepOrder} • {step.itemName}
                        </Text>
                        <Text style={styles.stepOverviewSubtitle}>
                          {prettifyToken(step.stepType)} •{" "}
                          {step.targetBagName || "Travel Day"}
                        </Text>
                      </View>

                      <StatusBadge
                        label={step.isCompleted ? "Done" : "Pending"}
                        tone={step.isCompleted ? "success" : "info"}
                      />
                    </View>
                  ))}
                </View>
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Actions"
                  subtitle="Regenerate or return to the trip results when needed."
                />

                <View style={styles.actionsColumn}>
                  <AppButton
                    title="Regenerate Packing Steps"
                    variant="secondary"
                    onPress={handleGenerateSteps}
                    loading={generating}
                  />

                  <AppButton
                    title="Open Packing Results"
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate("TripCalculationResults", { tripId })
                    }
                  />
                </View>
              </AppCard>
            </>
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
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
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
  metaGroup: {
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
  generateButton: {
    marginTop: spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  progressStatsRow: {
    gap: 8,
    marginTop: spacing.md,
  },
  progressStatText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  currentStepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  currentStepTextWrap: {
    flex: 1,
  },
  currentStepTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.secondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  currentStepItemName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  instructionCard: {
    marginTop: spacing.lg,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 16,
    padding: spacing.md,
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  flexButton: {
    flex: 1,
  },
  completeButton: {
    marginTop: spacing.md,
  },
  stepsOverviewWrap: {
    gap: spacing.sm,
  },
  stepOverviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  stepOverviewRowActive: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff",
  },
  stepOverviewTextWrap: {
    flex: 1,
  },
  stepOverviewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  stepOverviewSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});