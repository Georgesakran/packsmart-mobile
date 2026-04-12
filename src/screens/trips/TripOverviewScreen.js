import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import AppScreen from "../../components/common/AppScreen";
import AppButton from "../../components/common/AppButton";
import AppCard from "../../components/common/AppCard";
import StatusBadge from "../../components/common/StatusBadge";
import SectionHeader from "../../components/common/SectionHeader";
import {
  formatActivityDate,
  getActivityEventMeta,
  prettifyActivityDetails,
} from "../../utils/activityHistoryFormatter";
import { buildTripActivityInsights } from "../../utils/buildTripActivityInsights";
import { groupActivityHistory } from "../../utils/groupActivityHistory";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { useNotifications } from "../../context/NotificationsContext";
import {
  getTripById,
  getTripItems,
  getTripResults,
  getTripSuitcases,
  generateTripSuggestions,
  calculateTrip,
  getTripActivityHistory,
} from "../../api/tripApi";

export default function TripOverviewScreen({ route, navigation }) {
  const { tripId } = route.params || {};
  const { refreshNotifications } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [suitcases, setSuitcases] = useState([]);
  const [items, setItems] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [activityHistory, setActivityHistory] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);


  const loadTripOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
  
      const [tripData, suitcasesData, itemsData, resultsData, activityData] =
        await Promise.all([
          getTripById(tripId),
          getTripSuitcases(tripId),
          getTripItems(tripId),
          getTripResults(tripId),
          getTripActivityHistory(tripId),
        ]);
  
      setTrip(tripData || null);
      setSuitcases(Array.isArray(suitcasesData) ? suitcasesData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setResults(resultsData || null);
      setActivityHistory(Array.isArray(activityData) ? activityData : []);
    } catch (err) {
      console.error("Load trip overview error:", err);
      setError(err?.response?.data?.message || "Failed to load trip overview.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripOverview();
  }, [loadTripOverview]);

  useFocusEffect(
    useCallback(() => {
      loadTripOverview();
    }, [loadTripOverview])
  );
  // Another Option for lines 78 - 86
  // useFocusEffect(
  //   useCallback(() => {
  //     loadTripOverview();
  //   }, [loadTripOverview])
  // );

  const handleGenerateSuggestions = async () => {
    try {
      setGenerating(true);
      setActionError("");
      setActionMessage("");

      const data = await generateTripSuggestions(tripId);
      const profileUsed = data?.profileUsed;

      const message = profileUsed
        ? `Suggestions generated using size ${profileUsed.defaultSize}, travel style ${profileUsed.travelStyle}, and packing mode ${profileUsed.packingMode}.`
        : data?.message || "Suggestions generated successfully.";

      setActionMessage(message);
      await loadTripOverview();
      await refreshNotifications();
    } catch (err) {
      console.error("Generate suggestions error:", err);
      setActionError(
        err?.response?.data?.message || "Failed to generate suggestions."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCalculateTrip = async () => {
    try {
      setCalculating(true);
      setActionError("");
      setActionMessage("");

      const data = await calculateTrip(tripId);

      setActionMessage(data?.message || "Trip calculated successfully.");
      await loadTripOverview();
      await refreshNotifications();
    } catch (err) {
      console.error("Calculate trip error:", err);
      setActionError(
        err?.response?.data?.message || "Failed to calculate trip."
      );
    } finally {
      setCalculating(false);
    }
  };

  const overallStatus = useMemo(() => {
    if (!results?.totals) return "Not calculated";
    return results.totals.overallFits ? "Fits" : "Needs changes";
  }, [results]);

  const overallTone = useMemo(() => {
    if (overallStatus === "Fits") return "success";
    if (overallStatus === "Needs changes") return "danger";
    return "neutral";
  }, [overallStatus]);

  const checklistReady = useMemo(() => {
    if (!items.length) return "Empty";
    const packedCount = items.filter((item) => {
      const status = item.packingStatus || item.packing_status || "pending";
      return status !== "pending";
    }).length;

    if (packedCount === 0) return "Not started";
    if (packedCount === items.length) return "Complete";
    return `${packedCount}/${items.length} updated`;
  }, [items]);

  const travelDayReady = useMemo(() => {
    if (!items.length) return "Not set";
    const taggedCount = items.filter((item) => {
      const mode = item.travelDayMode || item.travel_day_mode || "normal";
      return mode !== "normal";
    }).length;

    if (taggedCount === 0) return "Not set";
    return `${taggedCount} items set`;
  }, [items]);

  const readiness = useMemo(() => {
    const bagsScore = suitcases.length > 0 ? 25 : 0;
    const itemsScore = items.length > 0 ? 20 : 0;
    const resultsScore = results?.totals ? 20 : 0;
  
    const checklistCompletedCount = items.filter((item) => {
      const status = item.packingStatus || item.packing_status || "pending";
      return status !== "pending";
    }).length;
  
    const checklistScore =
      items.length > 0 ? Math.round((checklistCompletedCount / items.length) * 20) : 0;
  
    const travelDayConfiguredCount = items.filter((item) => {
      const mode = item.travelDayMode || item.travel_day_mode || "normal";
      return mode !== "normal";
    }).length;
  
    const travelDayScore =
      items.length > 0 ? Math.round((travelDayConfiguredCount / items.length) * 15) : 0;
  
    const totalScore =
      bagsScore + itemsScore + resultsScore + checklistScore + travelDayScore;
  
    let label = "Getting started";
    let tone = "neutral";
  
    if (totalScore >= 85) {
      label = "Almost ready";
      tone = "success";
    } else if (totalScore >= 60) {
      label = "Good progress";
      tone = "info";
    } else if (totalScore >= 35) {
      label = "Needs work";
      tone = "warning";
    } else {
      label = "Not ready";
      tone = "danger";
    }
  
    const missing = [];
  
    if (!suitcases.length) missing.push("Add at least one bag");
    if (!items.length) missing.push("Add items or generate suggestions");
    if (!results?.totals) missing.push("Calculate the trip");
    if (items.length > 0 && checklistCompletedCount === 0) {
      missing.push("Start the checklist");
    }
    if (items.length > 0 && travelDayConfiguredCount === 0) {
      missing.push("Set travel-day items");
    }
  
    return {
      totalScore,
      label,
      tone,
      missing,
      breakdown: {
        bagsScore,
        itemsScore,
        resultsScore,
        checklistScore,
        travelDayScore,
      },
    };
  }, [suitcases, items, results]);

  const topAction = useMemo(() => {
    const rebalance = results?.bagRebalancingSuggestions?.[0];
    if (rebalance) {
      return `Move ${rebalance.itemName} to ${rebalance.toBag?.name}`;
    }

    const substitution = results?.itemSubstitutionSuggestions?.[0];
    if (substitution) {
      if (substitution.type === "replace") {
        return `Replace ${substitution.fromItem} with ${substitution.toItem}`;
      }
      if (substitution.type === "reduce") {
        return `Reduce ${substitution.itemName} to ${substitution.toQuantity}`;
      }
      if (substitution.type === "simplify") {
        return `Simplify ${substitution.fromItem}`;
      }
    }

    const adjustment = results?.smartAdjustments?.adjustments?.[0];
    if (adjustment) return adjustment;

    if (!items.length) return "Generate suggestions or add items";
    if (!suitcases.length) return "Add at least one bag";
    if (!results?.totals) return "Calculate this trip";

    return "No urgent action needed";
  }, [results, items, suitcases]);

  const copilot = useMemo(() => {
    const alerts = [];
  
    const hasBags = suitcases.length > 0;
    const hasItems = items.length > 0;
    const hasResults = !!results?.totals;
  
    const checklistCompletedCount = items.filter((item) => {
      const status = item.packingStatus || item.packing_status || "pending";
      return status !== "pending";
    }).length;
  
    const travelDayConfiguredCount = items.filter((item) => {
      const mode = item.travelDayMode || item.travel_day_mode || "normal";
      return mode !== "normal";
    }).length;
  
    const resultTotals = results?.totals;
    const mainConstraint = results?.smartAdjustments?.mainConstraint || "none";
    const firstAdjustment = results?.smartAdjustments?.adjustments?.[0];
    const firstRebalance = results?.bagRebalancingSuggestions?.[0];
    const firstSubstitution = results?.itemSubstitutionSuggestions?.[0];
  
    let status = "Waiting";
    let tone = "neutral";
    let headline = "Start building this trip";
    let nextStep = "Add bags and items or generate suggestions.";
  
    if (!hasBags) {
      status = "Blocked";
      tone = "danger";
      headline = "This trip has no bags yet";
      nextStep = "Add at least one bag before calculation.";
      alerts.push("No bag is configured for this trip.");
    } else if (!hasItems) {
      status = "Needs input";
      tone = "warning";
      headline = "This trip has no items yet";
      nextStep = "Generate suggestions or add custom items.";
      alerts.push("No items are currently attached to this trip.");
    } else if (!hasResults) {
      status = "Ready to calculate";
      tone = "info";
      headline = "Your trip is ready for calculation";
      nextStep = "Run Calculate Trip to generate fit results.";
      alerts.push("Items and bags are ready, but results are not generated yet.");
    } else if (resultTotals && !resultTotals.overallFits) {
      status = "Needs fixing";
      tone = "danger";
      headline =
        mainConstraint === "volume"
          ? "Volume is the main issue"
          : mainConstraint === "weight"
          ? "Weight is the main issue"
          : mainConstraint === "both"
          ? "Volume and weight both need attention"
          : "This packing plan needs adjustment";
  
      nextStep =
        firstAdjustment ||
        (firstRebalance
          ? `Try moving ${firstRebalance.itemName} to ${firstRebalance.toBag?.name}.`
          : "Review your items and bag setup.");
    } else if (
      resultTotals &&
      resultTotals.overallFits &&
      checklistCompletedCount < items.length
    ) {
      status = "Execution mode";
      tone = "info";
      headline = "Packing setup looks good";
      nextStep = "Continue the checklist and finish packing execution.";
    } else if (
      resultTotals &&
      resultTotals.overallFits &&
      checklistCompletedCount === items.length &&
      travelDayConfiguredCount === 0
    ) {
      status = "Almost ready";
      tone = "warning";
      headline = "Packing is nearly complete";
      nextStep = "Mark travel-day items and accessibility essentials.";
    } else if (
      resultTotals &&
      resultTotals.overallFits &&
      checklistCompletedCount === items.length &&
      travelDayConfiguredCount > 0
    ) {
      status = "Ready";
      tone = "success";
      headline = "This trip looks travel-ready";
      nextStep = "Do a final review and keep essentials accessible.";
    }
  
    if (resultTotals?.usedCapacityPercent >= 90 && resultTotals?.overallFits) {
      alerts.push("Your bag usage is high. Keep a little extra space if possible.");
    }
  
    if (firstRebalance) {
      alerts.push(
        `Rebalancing tip: move ${firstRebalance.itemName} to ${firstRebalance.toBag?.name}.`
      );
    }
  
    if (firstSubstitution) {
      if (firstSubstitution.type === "replace") {
        alerts.push(
          `Substitution idea: replace ${firstSubstitution.fromItem} with ${firstSubstitution.toItem}.`
        );
      } else if (firstSubstitution.type === "reduce") {
        alerts.push(
          `Reduce ${firstSubstitution.itemName} to ${firstSubstitution.toQuantity}.`
        );
      } else if (firstSubstitution.type === "simplify") {
        alerts.push(`Simplify ${firstSubstitution.fromItem}.`);
      }
    }
  
    if (hasItems && checklistCompletedCount === 0) {
      alerts.push("Checklist has not started yet.");
    }
  
    if (hasItems && travelDayConfiguredCount === 0) {
      alerts.push("No travel-day items are marked yet.");
    }
  
    return {
      status,
      tone,
      headline,
      nextStep,
      alerts: [...new Set(alerts)].slice(0, 4),
    };
  }, [suitcases, items, results]);

  const timeline = useMemo(() => {
    const hasBags = suitcases.length > 0;
    const hasItems = items.length > 0;
    const hasResults = !!results?.totals;
    const overallFits = !!results?.totals?.overallFits;
  
    const checklistCompletedCount = items.filter((item) => {
      const status = item.packingStatus || item.packing_status || "pending";
      return status !== "pending";
    }).length;
  
    const checklistComplete = hasItems && checklistCompletedCount === items.length;
  
    const travelDayConfiguredCount = items.filter((item) => {
      const mode = item.travelDayMode || item.travel_day_mode || "normal";
      return mode !== "normal";
    }).length;
  
    const travelDayReady = hasItems && travelDayConfiguredCount > 0;
  
    const steps = [
      {
        key: "setup",
        title: "Trip Setup",
        description: "Add the basic trip structure, including bags and items.",
        status: !hasBags || !hasItems ? "current" : "done",
      },
      {
        key: "planning",
        title: "Planning & Suggestions",
        description: "Generate suggestions or manually build your packing list.",
        status:
          hasBags && hasItems && !hasResults
            ? "current"
            : hasResults
            ? "done"
            : "upcoming",
      },
      {
        key: "calculation",
        title: "Calculation & Fit Check",
        description: "Calculate the trip and review fit, balance, and adjustments.",
        status:
          hasResults && !overallFits
            ? "current"
            : hasResults && overallFits
            ? "done"
            : "upcoming",
      },
      {
        key: "execution",
        title: "Packing Execution",
        description: "Use the checklist to track what is packed or skipped.",
        status:
          hasResults && overallFits && !checklistComplete
            ? "current"
            : checklistComplete
            ? "done"
            : "upcoming",
      },
      {
        key: "travel-day",
        title: "Travel Day Prep",
        description: "Mark what to wear, what to keep accessible, and final essentials.",
        status:
          checklistComplete && !travelDayReady
            ? "current"
            : checklistComplete && travelDayReady
            ? "done"
            : "upcoming",
      },
    ];
  
    let phaseLabel = "Getting started";
    let nextFocus = "Begin by setting up bags and items.";
  
    if (!hasBags || !hasItems) {
      phaseLabel = "Setup stage";
      nextFocus = "Build the trip foundation with bags and items.";
    } else if (!hasResults) {
      phaseLabel = "Planning stage";
      nextFocus = "Generate suggestions or calculate the trip.";
    } else if (hasResults && !overallFits) {
      phaseLabel = "Adjustment stage";
      nextFocus = "Fix fit issues before moving into packing execution.";
    } else if (overallFits && !checklistComplete) {
      phaseLabel = "Execution stage";
      nextFocus = "Continue packing and update the checklist.";
    } else if (checklistComplete && !travelDayReady) {
      phaseLabel = "Pre-departure stage";
      nextFocus = "Set travel-day and accessible items.";
    } else if (checklistComplete && travelDayReady) {
      phaseLabel = "Travel-ready stage";
      nextFocus = "Do a final review and keep essentials accessible.";
    }
  
    return {
      phaseLabel,
      nextFocus,
      steps,
    };
  }, [suitcases, items, results]);

  const visibleActivityHistory = useMemo(() => {
    return showAllActivity ? activityHistory : activityHistory.slice(0, 6);
  }, [activityHistory, showAllActivity]);
  
  const groupedActivityHistory = useMemo(() => {
    return groupActivityHistory(visibleActivityHistory);
  }, [visibleActivityHistory]);

  const activityInsights = useMemo(() => {
    return buildTripActivityInsights(activityHistory);
  }, [activityHistory]);

  const renderInsightValue = (event, fallback) => {
    if (!event) return fallback;
  
    return {
      title: event.title || "Activity",
      details: event.details || "No details available.",
      date: formatActivityDate(event.created_at),
    };
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading trip command center...</Text>
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
          <Text style={styles.kicker}>Trip Command Center</Text>
          <Text style={styles.title}>{trip?.trip_name || "Unnamed Trip"}</Text>
          <Text style={styles.subtitle}>
            {trip?.destination || "No destination"} •{" "}
            {trip?.duration_days ? `${trip.duration_days} days` : "No duration"}
          </Text>

          <AppCard style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroLabel}>Overall Trip Status</Text>
                <Text style={styles.heroValue}>{overallStatus}</Text>
              </View>

              <StatusBadge label={overallStatus} tone={overallTone} />
            </View>

            <Text style={styles.heroSubtext}>
              {overallStatus === "Fits"
                ? "This trip is in a good state and ready for execution."
                : overallStatus === "Needs changes"
                ? "This trip needs adjustment before travel."
                : "You still need to generate suggestions or calculate this trip."}
            </Text>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Readiness Score"
              subtitle="A quick score showing how close this trip is to being fully ready."
            />

            <View style={styles.readinessTopRow}>
              <View>
                <Text style={styles.readinessScore}>{readiness.totalScore}/100</Text>
                <Text style={styles.readinessLabel}>{readiness.label}</Text>
              </View>

              <StatusBadge label={readiness.label} tone={readiness.tone} />
            </View>

            <View style={styles.readinessBarsWrap}>
              <View style={styles.readinessRow}>
                <Text style={styles.readinessRowLabel}>Bags</Text>
                <Text style={styles.readinessRowValue}>
                  {readiness.breakdown.bagsScore}/25
                </Text>
              </View>

              <View style={styles.readinessRow}>
                <Text style={styles.readinessRowLabel}>Items</Text>
                <Text style={styles.readinessRowValue}>
                  {readiness.breakdown.itemsScore}/20
                </Text>
              </View>

              <View style={styles.readinessRow}>
                <Text style={styles.readinessRowLabel}>Results</Text>
                <Text style={styles.readinessRowValue}>
                  {readiness.breakdown.resultsScore}/20
                </Text>
              </View>

              <View style={styles.readinessRow}>
                <Text style={styles.readinessRowLabel}>Checklist</Text>
                <Text style={styles.readinessRowValue}>
                  {readiness.breakdown.checklistScore}/20
                </Text>
              </View>

              <View style={styles.readinessRow}>
                <Text style={styles.readinessRowLabel}>Travel Day</Text>
                <Text style={styles.readinessRowValue}>
                  {readiness.breakdown.travelDayScore}/15
                </Text>
              </View>
            </View>

            {readiness.missing.length > 0 ? (
              <View style={styles.readinessMissingWrap}>
                <Text style={styles.readinessMissingTitle}>What to improve next</Text>
                {readiness.missing.map((item, index) => (
                  <Text key={index} style={styles.readinessMissingItem}>
                    • {item}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={styles.readinessMissingWrap}>
                <Text style={styles.readinessPerfectText}>
                  This trip is in a very strong state. Keep going with final execution.
                </Text>
              </View>
            )}
          </AppCard>

          {actionMessage ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{actionMessage}</Text>
            </AppCard>
          ) : null}

          {actionError ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorText}>{actionError}</Text>
            </AppCard>
          ) : null}

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Readiness Snapshot"
              subtitle="A quick view of what is configured and what still needs attention."
            />

            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Bags</Text>
                <Text style={styles.snapshotValue}>{suitcases.length}</Text>
                <Text style={styles.snapshotSubtext}>
                  {suitcases.length ? "Configured" : "Missing"}
                </Text>
              </View>

              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Items</Text>
                <Text style={styles.snapshotValue}>{items.length}</Text>
                <Text style={styles.snapshotSubtext}>
                  {items.length ? "Ready to review" : "No items yet"}
                </Text>
              </View>

              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Checklist</Text>
                <Text style={styles.snapshotValue}>{checklistReady}</Text>
                <Text style={styles.snapshotSubtext}>
                  Packing execution status
                </Text>
              </View>

              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Travel Day</Text>
                <Text style={styles.snapshotValue}>{travelDayReady}</Text>
                <Text style={styles.snapshotSubtext}>
                  Accessibility and wear plan
                </Text>
              </View>
            </View>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="AI Packing Copilot"
              subtitle="A smart trip assistant that highlights what matters most right now."
            />

            <View style={styles.copilotTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.copilotHeadline}>{copilot.headline}</Text>
                <Text style={styles.copilotNextStep}>{copilot.nextStep}</Text>
              </View>

              <StatusBadge label={copilot.status} tone={copilot.tone} />
            </View>

            {copilot.alerts.length > 0 ? (
              <View style={styles.copilotAlertsWrap}>
                {copilot.alerts.map((alert, index) => (
                  <View key={index} style={styles.copilotAlertItem}>
                    <Text style={styles.copilotAlertBullet}>•</Text>
                    <Text style={styles.copilotAlertText}>{alert}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Smart Travel Timeline"
              subtitle="A simple journey view showing what stage this trip is in right now."
            />

            <View style={styles.timelineIntro}>
              <StatusBadge label={timeline.phaseLabel} tone="info" />
              <Text style={styles.timelineFocusText}>{timeline.nextFocus}</Text>
            </View>

            <View style={styles.timelineStepsWrap}>
              {timeline.steps.map((step) => (
                <View key={step.key} style={styles.timelineStepRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      step.status === "done" && styles.timelineDotDone,
                      step.status === "current" && styles.timelineDotCurrent,
                      step.status === "upcoming" && styles.timelineDotUpcoming,
                    ]}
                  />

                  <View style={styles.timelineStepContent}>
                    <View style={styles.timelineStepHeader}>
                      <Text style={styles.timelineStepTitle}>{step.title}</Text>
                      <StatusBadge
                        label={
                          step.status === "done"
                            ? "Done"
                            : step.status === "current"
                            ? "Current"
                            : "Upcoming"
                        }
                        tone={
                          step.status === "done"
                            ? "success"
                            : step.status === "current"
                            ? "info"
                            : "neutral"
                        }
                      />
                    </View>

                    <Text style={styles.timelineStepDescription}>{step.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Recent Insights"
              subtitle="Quick operational highlights based on this trip's activity history."
            />

            <View style={styles.insightsGrid}>
              {[
                {
                  label: "Last Activity",
                  value: renderInsightValue(
                    activityInsights.latestActivity,
                    "No activity yet"
                  ),
                },
                {
                  label: "Last Calculation",
                  value: renderInsightValue(
                    activityInsights.lastCalculated,
                    "No calculation yet"
                  ),
                },
                {
                  label: "Last Template Applied",
                  value: renderInsightValue(
                    activityInsights.lastTemplateApplied,
                    "No template applied yet"
                  ),
                },
                {
                  label: "Last Checklist Update",
                  value: renderInsightValue(
                    activityInsights.lastChecklistUpdate,
                    "No checklist updates yet"
                  ),
                },
                {
                  label: "Last Travel-Day Update",
                  value: renderInsightValue(
                    activityInsights.lastTravelDayUpdate,
                    "No travel-day updates yet"
                  ),
                },
                {
                  label: "Last Suggestions",
                  value: renderInsightValue(
                    activityInsights.lastSuggestionsGenerated,
                    "No suggestions generated yet"
                  ),
                },
              ].map((item) => (
                <View key={item.label} style={styles.insightCard}>
                  <Text style={styles.insightLabel}>{item.label}</Text>

                  {typeof item.value === "string" ? (
                    <Text style={styles.insightFallback}>{item.value}</Text>
                  ) : (
                    <>
                      <Text style={styles.insightTitle}>{item.value.title}</Text>
                      <Text style={styles.insightDetails}>{item.value.details}</Text>
                      <Text style={styles.insightDate}>{item.value.date}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Trip Progress History"
              subtitle={`Latest ${visibleActivityHistory.length} recorded action${
                visibleActivityHistory.length === 1 ? "" : "s"
              } for this trip.`}
            />

            {activityHistory.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="This trip does not have any recorded history yet."
              />
            ) : (
              <>
                {groupedActivityHistory.map((group) => (
                  <View key={group.label} style={styles.activityGroup}>
                    <Text style={styles.activityGroupTitle}>{group.label}</Text>

                    {group.events.map((event, index) => {
                      const meta = getActivityEventMeta(event.event_type);

                      return (
                        <View key={event.id} style={styles.activityRow}>
                          <View style={styles.activityTimelineCol}>
                            <View
                              style={[
                                styles.activityDot,
                                meta.tone === "success"
                                  ? styles.activityDotSuccess
                                  : meta.tone === "warning"
                                  ? styles.activityDotWarning
                                  : meta.tone === "info"
                                  ? styles.activityDotInfo
                                  : styles.activityDotNeutral,
                              ]}
                            />
                            {index !== group.events.length - 1 ? (
                              <View style={styles.activityLine} />
                            ) : null}
                          </View>

                          <View style={styles.activityContent}>
                            <View style={styles.activityHeaderRow}>
                              <Text style={styles.activityTitle}>{meta.label}</Text>
                              <StatusBadge label={meta.label} tone={meta.tone} />
                            </View>

                            {event.details ? (
                              <Text style={styles.activityDetails}>
                                {prettifyActivityDetails(event.details)}
                              </Text>
                            ) : null}

                            <Text style={styles.activityDate}>
                              {formatActivityDate(event.created_at)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {activityHistory.length > 6 ? (
                  <AppButton
                    title={showAllActivity ? "Show Less" : "Show More"}
                    variant="secondary"
                    onPress={() => setShowAllActivity((prev) => !prev)}
                    style={styles.showMoreButton}
                  />
                ) : null}
              </>
            )}
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Smart Action Center"
              subtitle="The most important next step for this trip right now."
            />

            <Text style={styles.topActionText}>{topAction}</Text>

            <View style={styles.primaryActionsRow}>
              <AppButton
                title="Generate Suggestions"
                onPress={handleGenerateSuggestions}
                loading={generating}
              />

              <AppButton
                title="Calculate Trip"
                onPress={handleCalculateTrip}
                loading={calculating}
                variant="secondary"
              />
              <AppButton
                title="Manage Trip Items"
                onPress={() => navigation.navigate("TripItemsManagement", { tripId })}
              />
              <AppButton
                title="Save as Template"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("SaveTripAsTemplate", {
                    tripId,
                    tripName: trip?.trip_name,
                    travelType: trip?.travel_type,
                    weatherType: trip?.weather_type,
                  })
                }
              />
            </View>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Quick Navigation"
              subtitle="Jump directly into the trip areas you want to manage."
            />

            <View style={styles.quickGrid}>
              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripBags", { tripId })}
              >
                <Text style={styles.quickTitle}>Bags</Text>
                <Text style={styles.quickSubtitle}>Manage suitcases</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripItems", { tripId })}
              >
                <Text style={styles.quickTitle}>Items</Text>
                <Text style={styles.quickSubtitle}>Review and add items</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripChecklist", { tripId })}
              >
                <Text style={styles.quickTitle}>Checklist</Text>
                <Text style={styles.quickSubtitle}>Track packing progress</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripTravelDay", { tripId })}
              >
                <Text style={styles.quickTitle}>Travel Day</Text>
                <Text style={styles.quickSubtitle}>Wear and access plan</Text>
              </Pressable>

              <Pressable
                style={styles.quickCard}
                onPress={() => navigation.navigate("TripResults", { tripId })}
              >
                <Text style={styles.quickTitle}>Results</Text>
                <Text style={styles.quickSubtitle}>Fit and smart actions</Text>
              </Pressable>
            </View>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <SectionHeader
              title="Trip Details"
              subtitle="Context used for suggestions and calculation."
            />

            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Travel Type: </Text>
              {trip?.travel_type || "—"}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Weather: </Text>
              {trip?.weather_type || "—"}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Traveler Count: </Text>
              {trip?.traveler_count || 1}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Results Status: </Text>
              {overallStatus}
            </Text>
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
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
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
  heroTextBlock: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
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
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  sectionCard: {},
  snapshotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  snapshotCard: {
    width: "47%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  snapshotLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  snapshotValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  snapshotSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  topActionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    fontWeight: "600",
    marginBottom: spacing.lg,
  },
  primaryActionsRow: {
    gap: spacing.sm,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickCard: {
    width: "47%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  quickSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  detailText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  detailLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  readinessTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  readinessScore: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  readinessLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  readinessBarsWrap: {
    gap: spacing.sm,
  },
  readinessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  readinessRowLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  readinessRowValue: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "700",
  },
  readinessMissingWrap: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readinessMissingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  readinessMissingItem: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  readinessPerfectText: {
    fontSize: 14,
    color: colors.success,
    lineHeight: 22,
    fontWeight: "600",
  },
  copilotTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  copilotHeadline: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  copilotNextStep: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  copilotAlertsWrap: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  copilotAlertItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  copilotAlertBullet: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 20,
  },
  copilotAlertText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  timelineIntro: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  timelineFocusText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  timelineStepsWrap: {
    gap: spacing.md,
  },
  timelineStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 6,
  },
  timelineDotDone: {
    backgroundColor: colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary,
  },
  timelineDotUpcoming: {
    backgroundColor: "#cbd5e1",
  },
  timelineStepContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  timelineStepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: 8,
  },
  timelineStepTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  timelineStepDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  activityDetails: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 6,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  activityTimelineCol: {
    alignItems: "center",
    width: 18,
  },
  
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  
  activityDotSuccess: {
    backgroundColor: "#22c55e",
  },
  
  activityDotWarning: {
    backgroundColor: "#f59e0b",
  },
  
  activityDotInfo: {
    backgroundColor: "#3b82f6",
  },
  
  activityDotNeutral: {
    backgroundColor: "#94a3b8",
  },
  
  activityLine: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  
  activityContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  
  activityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: 8,
  },
  
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  
  activityGroup: {
    marginTop: spacing.md,
  },
  
  activityGroupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  
  showMoreButton: {
    marginTop: spacing.md,
  },

  insightsGrid: {
    gap: spacing.sm,
  },
  
  insightCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  
  insightLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  
  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  
  insightDetails: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 6,
  },
  
  insightDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  
  insightFallback: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },

});