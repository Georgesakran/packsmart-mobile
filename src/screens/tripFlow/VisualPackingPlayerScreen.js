//VisualPackingPlayerScreen.js
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
import { getTripById, getTripSimulationScene } from "../../api/tripApi";

function getZoneColor(zoneKey = "") {
  switch (zoneKey) {
    case "bottom_base":
      return "#dcfce7";
    case "middle_core":
      return "#dbeafe";
    case "top_layer":
      return "#fef3c7";
    case "quick_access":
      return "#ede9fe";
    default:
      return "#f8fafc";
  }
}

function getItemColor(category = "", isCurrent = false) {
  if (isCurrent) return "#2563eb";

  const normalized = String(category || "").toLowerCase();

  switch (normalized) {
    case "documents":
      return "#a78bfa";
    case "tech":
      return "#60a5fa";
    case "toiletries":
      return "#f59e0b";
    case "shoes":
      return "#22c55e";
    case "underwear":
      return "#94a3b8";
    case "bottoms":
    case "outerwear":
    case "clothing":
      return "#38bdf8";
    case "accessories":
      return "#f472b6";
    default:
      return "#cbd5e1";
  }
}

function formatZoneLabel(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildCanvasLayout(scene) {
  if (!scene?.bag?.innerDimensionsCm || !Array.isArray(scene?.zones)) {
    return null;
  }

  const canvas = {
    width: 320,
    height: 520,
    padding: 16,
  };

  const inner = scene.bag.innerDimensionsCm;
  const innerWidth = Number(inner.width || 1);
  const innerHeight = Number(inner.height || 1);

  const usableWidth = canvas.width - canvas.padding * 2;
  const usableHeight = canvas.height - canvas.padding * 2;

  const zones = scene.zones.map((zone) => {
    const bounds = zone.boundsCm || {};
    const x = canvas.padding + (Number(bounds.x || 0) / innerWidth) * usableWidth;
    const y =
      canvas.height -
      canvas.padding -
      ((Number(bounds.y || 0) + Number(bounds.h || 0)) / innerHeight) * usableHeight;
    const w = (Number(bounds.w || 0) / innerWidth) * usableWidth;
    const h = (Number(bounds.h || 0) / innerHeight) * usableHeight;

    return {
      zoneKey: zone.zoneKey,
      label: zone.label || formatZoneLabel(zone.zoneKey),
      x,
      y,
      w,
      h,
    };
  });

  return {
    canvas,
    zones,
  };
}

export default function VisualPackingPlayerScreen({ route, navigation }) {
  const { tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [scenePayload, setScenePayload] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [tripData, simulationData] = await Promise.all([
          getTripById(tripId),
          getTripSimulationScene(tripId),
        ]);

        setTrip(tripData || null);
        setScenePayload(simulationData || null);
      } catch (err) {
        console.error("Load visual player error:", err);
        setError(
          err?.response?.data?.message || "Failed to load visual packing player."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  const scene = useMemo(() => scenePayload?.scene || null, [scenePayload]);
  const steps = useMemo(() => (Array.isArray(scene?.steps) ? scene.steps : []), [scene]);
  const items = useMemo(() => (Array.isArray(scene?.items) ? scene.items : []), [scene]);
  const canvasLayout = useMemo(() => buildCanvasLayout(scene), [scene]);

  const currentStep = useMemo(() => {
    if (!steps.length) return null;
    return steps[currentIndex] || null;
  }, [steps, currentIndex]);

  const placedItemsForCurrentStep = useMemo(() => {
    if (!currentStep || !items.length) return [];

    return items.filter((item) => Number(item.stepNumber || 0) <= Number(currentStep.stepNumber || 0));
  }, [items, currentStep]);

  const currentHighlightIds = useMemo(() => {
    return Array.isArray(currentStep?.highlightItemIds)
      ? currentStep.highlightItemIds
      : [];
  }, [currentStep]);

  const progressPercent = useMemo(() => {
    if (!steps.length) return 0;
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  }, [steps.length, currentIndex]);

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
          <Text style={styles.helperText}>Loading visual packing player...</Text>
        </View>
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.kicker}>PackSmart vNext</Text>
          <Text style={styles.title}>Visual Packing Player</Text>
          <Text style={styles.subtitle}>
            Step through the suitcase scene and watch items get placed in order.
          </Text>

          <AppCard>
            <SectionHeader
              title="Session"
              subtitle="Current simulation scene for this trip."
            />

            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Trip: </Text>
              {trip?.trip_name || "Unnamed Trip"}
            </Text>

            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Scene Version: </Text>
              {scenePayload?.sceneVersion || 1}
            </Text>

            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Generated: </Text>
              {scenePayload?.generatedAt || "—"}
            </Text>
          </AppCard>

          {!scene || !steps.length || !canvasLayout ? (
            <AppCard>
              <EmptyState
                title="No simulation scene yet"
                description="Calculate the trip first so the backend can generate a 3D packing scene."
              />

              <AppButton
                title="Back to Packing Simulation"
                onPress={() => navigation.goBack()}
                style={styles.topButton}
              />
            </AppCard>
          ) : (
            <>
              <AppCard>
                <SectionHeader
                  title="Progress"
                  subtitle="Follow the scene step by step."
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
                    <Text style={styles.metaLabel}>Step: </Text>
                    {currentIndex + 1}/{steps.length}
                  </Text>

                  <StatusBadge
                    label={scene?.summary?.overallFits ? "Fits" : "Needs Fix"}
                    tone={scene?.summary?.overallFits ? "success" : "warning"}
                  />
                </View>
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Scene View"
                  subtitle="A lightweight visual player based on the backend 3D scene."
                />

                <View style={styles.sceneCard}>
                  <View style={styles.sceneCanvas}>
                    {canvasLayout.zones.map((zone) => (
                      <View
                        key={zone.zoneKey}
                        style={[
                          styles.zoneBlock,
                          {
                            left: zone.x,
                            top: zone.y,
                            width: zone.w,
                            height: zone.h,
                            backgroundColor: getZoneColor(zone.zoneKey),
                          },
                        ]}
                      >
                        <Text style={styles.zoneLabel}>{zone.label}</Text>
                      </View>
                    ))}

                    {placedItemsForCurrentStep.map((item) => {
                      const zone = scene.zones.find((z) => z.zoneKey === item.zoneKey);
                      if (!zone) return null;

                      const bounds = zone.boundsCm || {};
                      const pos = item.positionCm || {};
                      const size = item.sizeCm || {};

                      const innerWidth = Number(scene.bag.innerDimensionsCm.width || 1);
                      const innerHeight = Number(scene.bag.innerDimensionsCm.height || 1);

                      const usableWidth =
                        canvasLayout.canvas.width - canvasLayout.canvas.padding * 2;
                      const usableHeight =
                        canvasLayout.canvas.height - canvasLayout.canvas.padding * 2;

                      const x =
                        canvasLayout.canvas.padding +
                        (Number(pos.x || 0) / innerWidth) * usableWidth;

                      const y =
                        canvasLayout.canvas.height -
                        canvasLayout.canvas.padding -
                        ((Number(pos.y || 0) + Number(size.h || 0)) / innerHeight) *
                          usableHeight;

                      const w = Math.max(
                        24,
                        (Number(size.w || 0) / innerWidth) * usableWidth
                      );

                      const h = Math.max(
                        16,
                        (Number(size.h || 0) / innerHeight) * usableHeight
                      );

                      const isCurrent = currentHighlightIds.includes(item.tripItemId);

                      return (
                        <View
                          key={`${item.tripItemId}-${item.stepNumber}`}
                          style={[
                            styles.itemBlock,
                            {
                              left: x,
                              top: y,
                              width: w,
                              height: h,
                              backgroundColor: getItemColor(item.category, isCurrent),
                              borderColor: isCurrent ? "#1d4ed8" : "#ffffff",
                              borderWidth: isCurrent ? 2 : 1,
                            },
                          ]}
                        >
                          <Text
                            numberOfLines={2}
                            style={[
                              styles.itemBlockText,
                              isCurrent && styles.itemBlockTextCurrent,
                            ]}
                          >
                            {item.name}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Current Step"
                  subtitle="Instruction generated from the simulation scene."
                />

                {currentStep ? (
                  <>
                    <View style={styles.currentStepHeader}>
                      <View style={styles.currentStepTextWrap}>
                        <Text style={styles.currentStepTitle}>
                          Step {currentStep.stepNumber}
                        </Text>
                        <Text style={styles.currentStepInstruction}>
                          {currentStep.instruction}
                        </Text>
                      </View>

                      <StatusBadge label="Current" tone="info" />
                    </View>

                    <View style={styles.metaGroup}>
                      <Text style={styles.metaText}>
                        <Text style={styles.metaLabel}>Bag ID: </Text>
                        {currentStep.bagId}
                      </Text>

                      {currentHighlightIds.length > 0 ? (
                        <Text style={styles.metaText}>
                          <Text style={styles.metaLabel}>Highlight Items: </Text>
                          {currentHighlightIds.join(", ")}
                        </Text>
                      ) : null}
                    </View>
                  </>
                ) : (
                  <EmptyState
                    title="No current step"
                    description="This scene does not contain any playable steps."
                  />
                )}
              </AppCard>

              <AppCard>
                <SectionHeader
                  title="Actions"
                  subtitle="Move through the scene or return to simulation."
                />

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

                <View style={styles.actionsColumn}>
                  <AppButton
                    title="Back to Packing Simulation"
                    variant="secondary"
                    onPress={() => navigation.goBack()}
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
    flexGrow: 1,
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
    fontWeight: "800",
    color: colors.secondary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  topButton: {
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  metaGroup: {
    gap: 8,
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
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  progressStatText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  sceneCard: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  sceneCanvas: {
    width: 320,
    height: 520,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
  },
  zoneBlock: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    borderRadius: 12,
    padding: 6,
  },
  zoneLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  itemBlock: {
    position: "absolute",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  itemBlockText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  itemBlockTextCurrent: {
    color: "#ffffff",
  },
  currentStepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
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
  currentStepInstruction: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 24,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
});