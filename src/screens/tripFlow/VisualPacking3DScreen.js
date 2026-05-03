// VisualPacking3DScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import AppScreen from "../../components/common/AppScreen";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import { getTripById, getTripSimulationScene, getTripResults } from "../../api/tripApi";
import PackingCanvas from "../../components/3d/PackingCanvas";



function getBagSceneId(bagScene) {
  return Number(bagScene?.bag?.bagId || bagScene?.bagId || 0);
}

function getBagSceneName(bagScene) {
  return bagScene?.bag?.name || bagScene?.name || "Bag";
}

const CAMERA_PRESETS = [
  { key: "auto", label: "Auto" },
  { key: "isometric", label: "Isometric" },
  { key: "top", label: "Top" },
  { key: "front", label: "Front" },
  { key: "side", label: "Side" },
];

function formatCompactNumber(value = 0) {
  const number = Number(value || 0);

  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
  return `${Math.round(number)}`;
}

function formatVolumeCm3(value = 0) {
  return `${formatCompactNumber(value)} cm³`;
}

function formatWeightG(value = 0) {
  const grams = Number(value || 0);
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${Math.round(grams)} g`;
}

function formatPercent(value = 0) {
  return `${Math.round(Number(value || 0))}%`;
}

function getPlacementQuality(score) {
  const numeric = Number(score || 0);
  if (numeric < 55) return "weak";
  if (numeric < 70) return "fair";
  return "good";
}

function formatScore(value) {
  if (value == null) return "—";
  return `${Math.round(Number(value))}`;
}

function getDisplayItemName(item) {
  if (!item?.name) return "No active item";
  return String(item.name).replace(/\s\d+$/, "");
}

export default function VisualPacking3DScreen({ route, navigation }) {
  const { tripId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [scenePayload, setScenePayload] = useState(null);
  const [tripResults, setTripResults] = useState(null);
  const [selectedBagId, setSelectedBagId] = useState(null);
  const [cameraPreset, setCameraPreset] = useState("auto");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isDeveloperView, setIsDeveloperView] = useState(false);
  const [showItemLabels, setShowItemLabels] = useState(false);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const hudPulse = useRef(new Animated.Value(0)).current;
  const hudShimmer = useRef(new Animated.Value(0)).current;
  const transportShimmer = useRef(new Animated.Value(0)).current;

  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [tripData, simulationData,resultsData] = await Promise.all([
          getTripById(tripId),
          getTripSimulationScene(tripId),
          getTripResults(tripId),
        ]);

        setTrip(tripData || null);
        setScenePayload(simulationData || null);
        setTripResults(resultsData || null);

        const loadedScene = simulationData?.scene || null;
        const bags = Array.isArray(loadedScene?.bags)
          ? loadedScene.bags
          : loadedScene?.primaryBag
            ? [loadedScene.primaryBag]
            : [];

        if (bags.length > 0) {
          const primaryId = getBagSceneId(loadedScene?.primaryBag || bags[0]);
          setSelectedBagId(primaryId);
        }
      } catch (err) {
        console.error("Load VisualPacking3DScreen error:", err);
        setError(
          err?.response?.data?.message || "Failed to load 3D packing scene."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hudPulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: false,
        }),
        Animated.timing(hudPulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: false,
        }),
      ])
    );
  
    loop.start();
  
    return () => {
      loop.stop();
    };
  }, [hudPulse]);

  useEffect(() => {
    const hudLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hudShimmer, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(hudShimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
      ])
    );
  
    const transportLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(transportShimmer, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(transportShimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ])
    );
  
    hudLoop.start();
    transportLoop.start();
  
    return () => {
      hudLoop.stop();
      transportLoop.stop();
    };
  }, [hudShimmer, transportShimmer]);

  const scene = useMemo(() => scenePayload?.scene || null, [scenePayload]);

  const allBags = useMemo(() => {
    if (!scene) return [];
    if (Array.isArray(scene.bags) && scene.bags.length > 0) return scene.bags;
    if (scene.primaryBag) return [scene.primaryBag];
    return [];
  }, [scene]);

  const selectedBagScene = useMemo(() => {
    if (!allBags.length) return null;
    return (
      allBags.find((bagScene) => getBagSceneId(bagScene) === Number(selectedBagId)) ||
      allBags[0]
    );
  }, [allBags, selectedBagId]);

  const selectedBagRealId = useMemo(() => {
    return getBagSceneId(selectedBagScene);
  }, [selectedBagScene]);

  const allSceneItems = useMemo(
    () => (Array.isArray(scene?.items) ? scene.items : []),
    [scene]
  );

  const allSceneSteps = useMemo(
    () => (Array.isArray(scene?.steps) ? scene.steps : []),
    [scene]
  );

  const bagItems = useMemo(() => {
    if (!selectedBagRealId) return [];
    return allSceneItems.filter(
      (item) => Number(item.bagId || 0) === Number(selectedBagRealId)
    );
  }, [allSceneItems, selectedBagRealId]);

  const bagSteps = useMemo(() => {
    if (!selectedBagRealId) return [];
    return allSceneSteps.filter(
      (step) => Number(step.bagId || 0) === Number(selectedBagRealId)
    );
  }, [allSceneSteps, selectedBagRealId]);

  const currentStep = useMemo(() => {
    if (!bagSteps.length) return null;
    return bagSteps[currentIndex] || null;
  }, [bagSteps, currentIndex]);

  const visibleItems = useMemo(() => {
    if (!currentStep) return [];
    return bagItems.filter(
      (item) => Number(item.stepNumber || 0) <= Number(currentStep.stepNumber || 0)
    );
  }, [bagItems, currentStep]);

  const highlightItemIds = useMemo(() => {
    return Array.isArray(currentStep?.highlightItemIds)
      ? currentStep.highlightItemIds
      : [];
  }, [currentStep]);

  const currentItem = useMemo(() => {
    if (!highlightItemIds.length) return null;
  
    return (
      bagItems.find((item) => {
        const itemKey = item.sceneItemId || String(item.tripItemId);
        return highlightItemIds.includes(itemKey);
      }) || null
    );
  }, [bagItems, highlightItemIds]);

  const currentItemScore = useMemo(() => {
    return currentItem?.placementScore ?? null;
  }, [currentItem]);

  const currentItemCompression = useMemo(() => {
    if (currentItem?.compressionAppliedRatio == null) return null;
    return Math.round(Number(currentItem.compressionAppliedRatio) * 100);
  }, [currentItem]);
  
  const currentItemSupport = useMemo(() => {
    return currentItem?.supportType || null;
  }, [currentItem]);
  
  const currentItemMaterial = useMemo(() => {
    return currentItem?.materialType || null;
  }, [currentItem]);
  
  const currentItemBreakdown = useMemo(() => {
    return currentItem?.placementScoreBreakdown || null;
  }, [currentItem]);

  const currentItemIssues = useMemo(() => {
    return Array.isArray(currentItem?.placementIssues)
      ? currentItem.placementIssues
      : [];
  }, [currentItem]);

  const cameraLabel = useMemo(() => {
    return CAMERA_PRESETS.find((preset) => preset.key === cameraPreset)?.label || "Auto";
  }, [cameraPreset]);

  const selectedBagSummary = useMemo(() => {
    return selectedBagScene?.summary || null;
  }, [selectedBagScene]);

  const totalPlacedItemsCount = useMemo(() => {
    return Array.isArray(scene?.items) ? scene.items.length : 0;
  }, [scene]);

  const totalOverflowCount = useMemo(() => {
    return Number(tripResults?.overflowItemCount || 0);
  }, [tripResults]);

  const currentBagPlacedItemsCount = useMemo(() => {
    return Array.isArray(bagItems) ? bagItems.length : 0;
  }, [bagItems]);

  const currentBagStepsCount = useMemo(() => {
    return Array.isArray(bagSteps) ? bagSteps.length : 0;
  }, [bagSteps]);

  const resultsOverflowCount = useMemo(() => {
    return Number(tripResults?.overflowItemCount || 0);
  }, [tripResults]);
  
  const overallFits = useMemo(() => {
    if (typeof tripResults?.overallFits === "boolean") {
      return tripResults.overallFits;
    }
    return resultsOverflowCount === 0;
  }, [tripResults, resultsOverflowCount]);
  
  const fitStateLabel = useMemo(() => {
    return overallFits ? "Fits" : "Needs Fix";
  }, [overallFits]);
  
  const fitStateTone = useMemo(() => {
    return overallFits ? "success" : "warning";
  }, [overallFits]);

  const hudGlowAnimatedStyle = {
    borderColor: hudPulse.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,255,255,0.14)", "rgba(96,165,250,0.38)"],
    }),
    shadowOpacity: hudPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.22, 0.38],
    }),
    transform: [
      {
        scale: hudPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.01],
        }),
      },
    ],
  };

  const hudShimmerTranslateX = hudShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 320],
  });
  
  const transportShimmerTranslateX = transportShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-260, 420],
  });

  useEffect(() => {
    setCurrentIndex(0);
    setAutoPlay(false);
    setResetViewSignal((prev) => prev + 1);
  }, [selectedBagRealId]);

  useEffect(() => {
    if (!autoPlay || bagSteps.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= bagSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [autoPlay, bagSteps.length]);

  useEffect(() => {
    if (currentIndex >= bagSteps.length - 1) {
      setAutoPlay(false);
    }
  }, [currentIndex, bagSteps.length]);

  const goPrevious = () => {
    if (currentIndex > 0) {
      setAutoPlay(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < bagSteps.length - 1) {
      setAutoPlay(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const toggleAutoPlay = () => {
    if (!bagSteps.length) return;
    if (currentIndex >= bagSteps.length - 1) {
      setCurrentIndex(0);
    }
    setAutoPlay((prev) => !prev);
  };

  const currentItemPlacementQuality = useMemo(() => {
    return getPlacementQuality(currentItem?.placementScore);
  }, [currentItem]);

  const currentItemSuggestions = useMemo(() => {
    return Array.isArray(currentItem?.placementSuggestions)
      ? currentItem.placementSuggestions
      : [];
  }, [currentItem]);

  const isPlaybackView = !isDeveloperView;

  const contentGapStyle = isPlaybackView
    ? styles.containerClean
    : styles.containerDebug;
  
  const heroHeaderStyle = isPlaybackView
    ? styles.heroHeaderClean
    : styles.heroHeaderDebug;
  
  const footerActionsStyle = isPlaybackView
    ? styles.footerActionsClean
    : styles.footerActionsDebug;


  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading 3D packing scene...</Text>
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, contentGapStyle]}>
          <View style={[styles.heroHeader, heroHeaderStyle]}>
            <View style={styles.heroHeaderText}>
              <Text style={styles.kicker}>PackSmart vNext</Text>
              <Text style={styles.title}>3D Packing Player</Text>
              <Text style={styles.subtitle}>
                {isPlaybackView
                ? `Immersive packing playback for ${trip?.trip_name || "your trip"}.`
                : `Immersive packing playback and simulation inspection for ${trip?.trip_name || "your trip"}.`}
              </Text>
            </View>



            <StatusBadge label={fitStateLabel} tone={fitStateTone} />
          </View>

          {!scene || !allBags.length || !selectedBagScene ? (
            <AppCard style={styles.softCard}>
              <EmptyState
                title="No 3D scene available"
                description="Calculate the trip first so the backend can generate a simulation scene."
              />
              <AppButton
                title="Back"
                onPress={() => navigation.goBack()}
                style={styles.topButton}
              />
            </AppCard>
          ) : (
            <>
              <AppCard style={styles.sceneHeroCard}>
                <View style={styles.sceneHeroTopRow}>
                  <View style={styles.sceneHeroTextWrap}>
                    <Text style={styles.sceneHeroEyebrow}>PackSmart Simulation</Text>

                    <Text style={styles.sceneHeroTitle}>
                      {getBagSceneName(selectedBagScene)}
                    </Text>

                    <Text style={styles.sceneHeroLead}>
                      {trip?.trip_name || "Unnamed Trip"}
                    </Text>

                    <Text style={styles.sceneHeroSubtitle}>
                      {currentItem
                       ? `Currently focusing on ${getDisplayItemName(currentItem)}.`
                       : "Ready to play the guided packing sequence."}
                    </Text>
                  </View>

                  <View style={styles.sceneHeroPills}>
                    <View style={styles.scenePill}>
                      <Text style={styles.scenePillLabel}>Step</Text>
                      <Text style={styles.scenePillValue}>
                        {bagSteps.length ? currentIndex + 1 : 0}/{bagSteps.length}
                      </Text>
                    </View>

                    <View style={styles.scenePill}>
                      <Text style={styles.scenePillLabel}>View</Text>
                      <Text style={styles.scenePillValue}>{cameraLabel}</Text>
                    </View>

                    <View style={styles.scenePill}>
                      <Text style={styles.scenePillLabel}>Status</Text>
                      <Text style={styles.scenePillValue}>{fitStateLabel}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sceneHeroDivider} />


                <View style={styles.sceneHeroViewToggleWrap}>
                  <Text style={styles.sceneHeroViewToggleLabel}>Experience Mode</Text>

                  <View style={styles.iosSegmentedControl}>
                    <View style={styles.iosSegmentItem}>
                      <AppButton
                        title="Playback View"
                        variant={isPlaybackView ? "primary" : "secondary"}
                        size="sm"
                        fullWidth
                        onPress={() => setIsDeveloperView(false)}
                        style={
                          isPlaybackView
                            ? styles.iosSegmentButtonActive
                            : styles.iosSegmentButton
                        }
                      />
                    </View>

                    <View style={styles.iosSegmentItem}>
                      <AppButton
                        title="Studio View"
                        variant={isDeveloperView ? "primary" : "secondary"}
                        size="sm"
                        fullWidth
                        onPress={() => setIsDeveloperView(true)}
                        style={
                          isDeveloperView
                            ? styles.iosSegmentButtonActive
                            : styles.iosSegmentButton
                        }
                      />
                    </View>
                  </View>
                </View>

                {allBags.length > 1 ? (
                  <View style={styles.sceneSectionBlock}>
                    <Text style={styles.sceneSectionLabel}>Bags</Text>

                    <View style={styles.sceneTabsWrap}>
                      {allBags.map((bagScene) => {
                        const bagId = getBagSceneId(bagScene);
                        const selected = Number(selectedBagId) === Number(bagId);

                        return (
                          <View key={bagId} style={styles.sceneTabItem}>
                            <AppButton
                              title={getBagSceneName(bagScene)}
                              variant={selected ? "primary" : "secondary"}
                              size="sm"
                              fullWidth
                              onPress={() => setSelectedBagId(bagId)}
                              style={
                                selected
                                  ? styles.sceneTabButtonActive
                                  : styles.sceneTabButton
                              }
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View style={styles.sceneSectionBlock}>
                  <Text style={styles.sceneSectionLabel}>Camera</Text>
                  <View style={styles.sceneTabsWrap}>
                    {CAMERA_PRESETS.map((preset) => {
                      const selected = cameraPreset === preset.key;

                      return (
                        <View key={preset.key} style={styles.sceneTabItem}>
                          <AppButton
                            title={preset.label}
                            variant={selected ? "primary" : "secondary"}
                            size="sm"
                            fullWidth
                            onPress={() => setCameraPreset(preset.key)}
                            style={
                              selected
                                ? styles.sceneTabButtonActive
                                : styles.sceneTabButton
                            }
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.canvasWrap}>
                  <PackingCanvas
                    scene={{
                      ...scene,
                      primaryBag: selectedBagScene,
                    }}
                    visibleItems={visibleItems}
                    currentStep={currentStep}
                    highlightItemIds={highlightItemIds}
                    cameraPreset={cameraPreset}
                    resetViewSignal={resetViewSignal}
                    debugMode={isDeveloperView}
                    showItemLabels={showItemLabels}
                  />

                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(2,6,23,0.72)", "rgba(2,6,23,0.28)", "transparent"]}
                    locations={[0, 0.45, 1]}
                    style={styles.topGradientOverlay}
                  />

                  <LinearGradient
                    pointerEvents="none"
                    colors={["transparent", "rgba(2,6,23,0.16)", "rgba(2,6,23,0.82)"]}
                    locations={[0, 0.35, 1]}
                    style={styles.bottomGradientOverlay}
                  />

                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(2,6,23,0.34)", "transparent"]}
                    locations={[0, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.leftVignetteOverlay}
                  />

                  <LinearGradient
                    pointerEvents="none"
                    colors={["transparent", "rgba(2,6,23,0.34)"]}
                    locations={[0, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.rightVignetteOverlay}
                  />

                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(2,6,23,0.18)", "transparent", "rgba(2,6,23,0.22)"]}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.centerVignetteSoftener}
                  />

                  <View pointerEvents="none" style={styles.sceneHudOverlay}>
                    <View style={styles.hudTopRow}>

                    <View style={styles.hudGlassPill}>
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.shimmerSweep,
                          styles.hudShimmerSweep,
                          { transform: [{ translateX: hudShimmerTranslateX }, { rotate: "-18deg" }] },
                        ]}
                      />
                      <Text style={styles.hudPillOverline}>Bag</Text>
                      <Text numberOfLines={1} style={styles.hudPillMain}>
                        {getBagSceneName(selectedBagScene)}
                      </Text>
                    </View>

                      <View style={styles.hudGlassPill}>
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.shimmerSweep,
                            styles.hudShimmerSweep,
                            { transform: [{ translateX: hudShimmerTranslateX }, { rotate: "-18deg" }] },
                          ]}
                        />
                        <Text style={styles.hudPillOverline}>Step</Text>
                        <Text style={styles.hudPillMain}>
                          {bagSteps.length ? currentIndex + 1 : 0}/{bagSteps.length}
                        </Text>
                      </View>

                      <View style={styles.hudGlassPill}>
                        <Animated.View
                            pointerEvents="none"
                            style={[
                              styles.shimmerSweep,
                              styles.hudShimmerSweep,
                              { transform: [{ translateX: hudShimmerTranslateX }, { rotate: "-18deg" }] },
                            ]}
                        />
                        <Text style={styles.hudPillOverline}>Mode</Text>
                        <Text style={styles.hudPillMain}>
                          {autoPlay ? "Playing" : "Manual"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.hudBottomWrap}>
                      <Animated.View style={[styles.hudNowPlayingCard, hudGlowAnimatedStyle]}>                        
                        <View style={styles.hudInnerGlow} />
                        <View style={styles.hudAccentBar} />
                        <Text style={styles.hudNowPackingLabel}>Now Packing</Text>

                        <Text numberOfLines={2} style={styles.hudHeroItemName}>
                          {getDisplayItemName(currentItem)}
                        </Text>

                        <Text style={styles.hudHeroSubline}>
                          {currentItem?.category
                            ? `${currentItem.category} item`
                            : "Current highlighted placement"}
                        </Text>

                        <View style={styles.hudMetaRow}>
                          <View style={styles.hudMiniTag}>
                            <Text style={styles.hudMiniTagText}>{cameraLabel}</Text>
                          </View>

                          <View style={styles.hudMiniTag}>
                            <Text style={styles.hudMiniTagText}>{fitStateLabel}</Text>
                          </View>

                          {currentItemMaterial ? (
                            <View style={styles.hudMiniTag}>
                              <Text style={styles.hudMiniTagText}>{currentItemMaterial}</Text>
                            </View>
                          ) : null}

                          {autoPlay ? (
                            <View style={styles.hudMiniTag}>
                              <Text style={styles.hudMiniTagText}>Auto</Text>
                            </View>
                          ) : (
                            <View style={styles.hudMiniTag}>
                              <Text style={styles.hudMiniTagText}>Manual</Text>
                            </View>
                          )}
                        </View>

                        {isDeveloperView && currentItemPlacementQuality !== "good" ? (
                          <View
                            style={[
                              styles.hudMiniTag,
                              currentItemPlacementQuality === "weak"
                                ? styles.hudMiniTagDanger
                                : styles.hudMiniTagWarning,
                            ]}
                          >
                            <Text
                              style={[
                                styles.hudMiniTagText,
                                currentItemPlacementQuality === "weak"
                                  ? styles.hudMiniTagTextDanger
                                  : styles.hudMiniTagTextWarning,
                              ]}
                            >
                              {currentItemPlacementQuality === "weak"
                                ? "Weak Placement"
                                : "Fair Placement"}
                            </Text>
                          </View>
                        ) : null}

                        {isDeveloperView && currentItemIssues.length > 0 ? (
                          <View style={[styles.hudMiniTag, styles.hudMiniTagDanger]}>
                            <Text style={[styles.hudMiniTagText, styles.hudMiniTagTextDanger]}>
                              {currentItemIssues.length} Issue{currentItemIssues.length > 1 ? "s" : ""}
                            </Text>
                          </View>
                        ) : null}

                        {isDeveloperView && currentItemSuggestions.length > 0 ? (
                          <View style={[styles.hudMiniTag, styles.hudMiniTagInfo]}>
                            <Text style={[styles.hudMiniTagText, styles.hudMiniTagTextInfo]}>
                              {currentItemSuggestions.length} Suggestion
                              {currentItemSuggestions.length > 1 ? "s" : ""}
                            </Text>
                          </View>
                        ) : null}

                        {isDeveloperView && currentStep?.instruction ? (
                          <View style={styles.hudInstructionBox}>
                            <Text style={styles.hudInstructionKicker}>Placement</Text>
                            <Text style={styles.hudInstructionText}>
                              {currentStep.instruction}
                            </Text>
                          </View>
                        ) : null}
                      </Animated.View>
                    </View>
                  </View>
                </View>

                <View style={styles.transportBarWrap}>
                  <View style={styles.transportBar}>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.shimmerSweep,
                        styles.transportShimmerSweep,
                        { transform: [{ translateX: transportShimmerTranslateX }, { rotate: "-16deg" }], },
                      ]}
                    />
                    <View style={styles.transportHeaderRow}>
                      <View style={styles.transportMeta}>
                        <Text style={styles.transportMetaOverline}>Playback</Text>
                        <Text style={styles.transportMetaMain}>
                          Step {bagSteps.length ? currentIndex + 1 : 0} of {bagSteps.length}
                        </Text>
                        <Text style={styles.transportMetaSub}>
                          {autoPlay ? "Auto playing sequence" : "Manual navigation"}
                        </Text>
                      </View>

                      <View style={styles.transportStatusPill}>
                        <Text style={styles.transportStatusText}>
                          {autoPlay ? "Playing" : "Paused"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transportControlsRow}>
                      <View style={styles.transportControlItem}>
                        <Text style={styles.transportControlLabel}>Prev</Text>
                        <AppButton
                          title="⏮"
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onPress={goPrevious}
                          disabled={currentIndex === 0 || !bagSteps.length}
                          style={styles.transportIconButton}
                        />
                      </View>

                      <View style={styles.transportControlItemPrimary}>
                        <Text style={styles.transportControlLabelPrimary}>Playback</Text>

                        <View style={styles.transportPlayButtonWrap}>
                          <AppButton
                            title={autoPlay ? "⏸ Pause" : "▶️ Play"}
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={toggleAutoPlay}
                            disabled={!bagSteps.length}
                            style={styles.transportPlayButton}
                          />
                        </View>
                      </View>

                      <View style={styles.transportControlItem}>
                        <Text style={styles.transportControlLabel}>Next</Text>
                        <AppButton
                          title="⏭"
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onPress={goNext}
                          disabled={!bagSteps.length || currentIndex === bagSteps.length - 1}
                          style={styles.transportIconButton}
                        />
                      </View>

                      <View style={styles.transportControlItem}>
                        <Text style={styles.transportControlLabel}>Reset</Text>
                        <AppButton
                          title="↺"
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onPress={() => setResetViewSignal((prev) => prev + 1)}
                          style={styles.transportIconButton}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </AppCard>
              {isDeveloperView ? (
                <AppCard style={styles.insightsCard}>
                  <View style={styles.analyticsStripHeader}>
                    <View style={styles.analyticsStripHeaderLeft}>
                      <Text style={styles.analyticsStripEyebrow}>Packing Insights</Text>
                      <Text style={styles.analyticsStripTitle}>
                        {getBagSceneName(selectedBagScene)}
                      </Text>
                      <Text style={styles.analyticsStripSubtitle}>
                        {currentBagPlacedItemsCount} items in current bag • {totalPlacedItemsCount} placed in trip
                      </Text>
                    </View>

                    <View style={styles.analyticsStripStatus}>
                      <StatusBadge label={fitStateLabel} tone={fitStateTone} />
                    </View>
                  </View>

                  <View style={styles.analyticsMetricsWrap}>
                    <View style={styles.analyticsMetricPill}>
                      <Text style={styles.analyticsMetricLabel}>Vol Used</Text>
                      <Text style={styles.analyticsMetricValue}>
                        {selectedBagSummary
                          ? formatVolumeCm3(selectedBagSummary.usedVolumeCm3)
                          : "—"}
                      </Text>
                      <Text style={styles.analyticsMetricMeta}>
                        {selectedBagSummary
                          ? formatPercent(selectedBagSummary.volumeUsagePercent)
                          : "No data"}
                      </Text>
                    </View>

                    <View style={styles.analyticsMetricPill}>
                      <Text style={styles.analyticsMetricLabel}>Vol Free</Text>
                      <Text style={styles.analyticsMetricValue}>
                        {selectedBagSummary
                          ? formatVolumeCm3(selectedBagSummary.remainingVolumeCm3)
                          : "—"}
                      </Text>
                      <Text style={styles.analyticsMetricMeta}>Remaining</Text>
                    </View>

                    <View style={styles.analyticsMetricPill}>
                      <Text style={styles.analyticsMetricLabel}>Wt Used</Text>
                      <Text style={styles.analyticsMetricValue}>
                        {selectedBagSummary
                          ? formatWeightG(selectedBagSummary.usedWeightG)
                          : "—"}
                      </Text>
                      <Text style={styles.analyticsMetricMeta}>
                        {selectedBagSummary
                          ? formatPercent(selectedBagSummary.weightUsagePercent)
                          : "No data"}
                      </Text>
                    </View>

                    <View style={styles.analyticsMetricPill}>
                      <Text style={styles.analyticsMetricLabel}>Wt Free</Text>
                      <Text style={styles.analyticsMetricValue}>
                        {selectedBagSummary
                          ? formatWeightG(selectedBagSummary.remainingWeightG)
                          : "—"}
                      </Text>
                      <Text style={styles.analyticsMetricMeta}>Remaining</Text>
                    </View>

                    <View style={styles.analyticsMetricPill}>
                      <Text style={styles.analyticsMetricLabel}>Steps</Text>
                      <Text style={styles.analyticsMetricValue}>{currentBagStepsCount}</Text>
                      <Text style={styles.analyticsMetricMeta}>Current bag</Text>
                    </View>

                    <View style={styles.analyticsMetricPill}>
                      <Text style={styles.analyticsMetricLabel}>Overflow</Text>
                      <Text style={styles.analyticsMetricValue}>{totalOverflowCount}</Text>
                      <Text style={styles.analyticsMetricMeta}>Needs attention</Text>
                    </View>
                  </View>

                  <View style={styles.analyticsFooterRow}>
                    <View style={styles.analyticsFooterPill}>
                      <Text style={styles.analyticsFooterLabel}>Playback</Text>
                      <Text style={styles.analyticsFooterValue}>
                        {bagSteps.length ? currentIndex + 1 : 0}/{bagSteps.length}
                      </Text>
                    </View>

                    <View style={styles.analyticsFooterPill}>
                      <Text style={styles.analyticsFooterLabel}>Camera</Text>
                      <Text style={styles.analyticsFooterValue}>{cameraLabel}</Text>
                    </View>

                    {isDeveloperView ? (
                      <View style={styles.analyticsFooterPill}>
                        <Text style={styles.analyticsFooterLabel}>Mode</Text>
                        <Text style={styles.analyticsFooterValue}>
                          {autoPlay ? "Auto" : "Manual"}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </AppCard>
              ) : null}  

              {isDeveloperView ? (
                <View style={styles.debugSectionWrap}>
                  <Text style={styles.debugSectionLabel}>Debug Panels</Text>

                  <AppCard style={styles.debugSubtleCard}>
                    <View style={styles.debugPanelHeader}>
                      <Text style={styles.debugPanelEyebrow}>Developer Tools</Text>
                      <Text style={styles.debugPanelTitle}>Visual Helpers</Text>
                      <Text style={styles.debugPanelSubtitle}>
                        Temporary development controls for scene inspection.
                      </Text>
                    </View>

                    <View style={styles.modeRow}>
                      <AppButton
                        title={showItemLabels ? "Hide Labels" : "Show Labels"}
                        variant={showItemLabels ? "primary" : "secondary"}
                        size="sm"
                        onPress={() => setShowItemLabels((prev) => !prev)}
                        style={styles.flexButton}
                      />
                    </View>
                  </AppCard>

                  <AppCard style={styles.debugSubtleCard}>
                    <View style={styles.debugPanelHeader}>
                      <Text style={styles.debugPanelEyebrow}>Developer Tools</Text>
                      <Text style={styles.debugPanelTitle}>Placement Physics</Text>
                      <Text style={styles.debugPanelSubtitle}>
                        Live scoring and physical placement data for the current highlighted item.
                      </Text>
                    </View>

                    <View style={styles.debugPhysicsGrid}>
                      <View style={styles.debugPhysicsMetric}>
                        <Text style={styles.debugPhysicsLabel}>Placement Score</Text>
                        <Text style={styles.debugPhysicsValue}>{formatScore(currentItemScore)}</Text>
                      </View>

                      <View style={styles.debugPhysicsMetric}>
                        <Text style={styles.debugPhysicsLabel}>Material</Text>
                        <Text style={styles.debugPhysicsValue}>{currentItemMaterial || "—"}</Text>
                      </View>

                      <View style={styles.debugPhysicsMetric}>
                        <Text style={styles.debugPhysicsLabel}>Compression</Text>
                        <Text style={styles.debugPhysicsValue}>
                          {currentItemCompression != null ? `${currentItemCompression}%` : "—"}
                        </Text>
                      </View>

                      <View style={styles.debugPhysicsMetric}>
                        <Text style={styles.debugPhysicsLabel}>Support</Text>
                        <Text style={styles.debugPhysicsValue}>{currentItemSupport || "—"}</Text>
                      </View>

                      <View style={styles.debugPhysicsMetric}>
                        <Text style={styles.debugPhysicsLabel}>Quality</Text>
                        <Text
                          style={[
                            styles.debugPhysicsValue,
                            currentItemPlacementQuality === "weak"
                              ? styles.debugPhysicsValueDanger
                              : currentItemPlacementQuality === "fair"
                              ? styles.debugPhysicsValueWarning
                              : null,
                          ]}
                        >
                          {currentItemPlacementQuality || "—"}
                        </Text>
                      </View>
                    </View>

                    {currentItemIssues.length > 0 ? (
                      <View style={styles.debugIssuesWrap}>
                        <Text style={styles.debugIssuesTitle}>Placement Issues</Text>

                        {currentItemIssues.map((issue, index) => (
                          <View
                            key={`${issue.code || "issue"}-${index}`}
                            style={[
                              styles.debugIssueRow,
                              issue.severity === "high"
                                ? styles.debugIssueRowHigh
                                : issue.severity === "medium"
                                ? styles.debugIssueRowMedium
                                : styles.debugIssueRowLow,
                            ]}
                          >
                            <Text
                              style={[
                                styles.debugIssueText,
                                issue.severity === "high"
                                  ? styles.debugIssueTextHigh
                                  : issue.severity === "medium"
                                  ? styles.debugIssueTextMedium
                                  : styles.debugIssueTextLow,
                              ]}
                            >
                              {issue.message}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.debugPanelSubtitle}>
                        No placement issues detected for the highlighted item.
                      </Text>
                    )}


                    {currentItemSuggestions.length > 0 ? (
                      <View style={styles.debugSuggestionsWrap}>
                        <Text style={styles.debugSuggestionsTitle}>Suggested Improvements</Text>

                        {currentItemSuggestions.map((suggestion, index) => (
                          <View
                            key={`${suggestion.code || "suggestion"}-${index}`}
                            style={[
                              styles.debugSuggestionRow,
                              suggestion.priority === "high"
                                ? styles.debugSuggestionRowHigh
                                : suggestion.priority === "medium"
                                ? styles.debugSuggestionRowMedium
                                : styles.debugSuggestionRowLow,
                            ]}
                          >
                            <Text
                              style={[
                                styles.debugSuggestionText,
                                suggestion.priority === "high"
                                  ? styles.debugSuggestionTextHigh
                                  : suggestion.priority === "medium"
                                  ? styles.debugSuggestionTextMedium
                                  : styles.debugSuggestionTextLow,
                              ]}
                            >
                              {suggestion.message}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}


                    {currentItemBreakdown ? (
                      <View style={styles.debugBreakdownList}>
                        <View style={styles.debugInfoRow}>
                          <Text style={styles.debugInfoKey}>Access</Text>
                          <Text style={styles.debugInfoValue}>
                            {formatScore(currentItemBreakdown.accessScore)}
                          </Text>
                        </View>

                        <View style={styles.debugInfoRow}>
                          <Text style={styles.debugInfoKey}>Stability</Text>
                          <Text style={styles.debugInfoValue}>
                            {formatScore(currentItemBreakdown.stabilityScore)}
                          </Text>
                        </View>

                        <View style={styles.debugInfoRow}>
                          <Text style={styles.debugInfoKey}>Support</Text>
                          <Text style={styles.debugInfoValue}>
                            {formatScore(currentItemBreakdown.supportScore)}
                          </Text>
                        </View>

                        <View style={styles.debugInfoRow}>
                          <Text style={styles.debugInfoKey}>Orientation</Text>
                          <Text style={styles.debugInfoValue}>
                            {formatScore(currentItemBreakdown.orientationScore)}
                          </Text>
                        </View>

                        <View style={styles.debugInfoRow}>
                          <Text style={styles.debugInfoKey}>Balance</Text>
                          <Text style={styles.debugInfoValue}>
                            {formatScore(currentItemBreakdown.balanceScore)}
                          </Text>
                        </View>

                        <View style={styles.debugInfoRow}>
                          <Text style={styles.debugInfoKey}>Compression Penalty</Text>
                          <Text style={styles.debugInfoValue}>
                            {formatScore(currentItemBreakdown.compressionPenalty)}
                          </Text>
                        </View>

                        <View style={styles.debugInfoRow}>
                          <Text style={styles.debugInfoKey}>Fragility Penalty</Text>
                          <Text style={styles.debugInfoValue}>
                            {formatScore(currentItemBreakdown.fragilityPenalty)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.debugPanelSubtitle}>No highlighted item scoring data yet.</Text>
                    )}
                  </AppCard>

                  <AppCard style={styles.debugSubtleCard}>
                    <View style={styles.debugPanelHeader}>
                      <Text style={styles.debugPanelEyebrow}>Developer Tools</Text>
                      <Text style={styles.debugPanelTitle}>Session Snapshot</Text>
                      <Text style={styles.debugPanelSubtitle}>
                        Internal scene context for development and validation.
                      </Text>
                    </View>

                    <View style={styles.debugInfoList}>
                      <View style={styles.debugInfoRow}>
                        <Text style={styles.debugInfoKey}>Trip</Text>
                        <Text style={styles.debugInfoValue}>
                          {trip?.trip_name || "Unnamed Trip"}
                        </Text>
                      </View>

                      <View style={styles.debugInfoRow}>
                        <Text style={styles.debugInfoKey}>Generated</Text>
                        <Text style={styles.debugInfoValue}>
                          {scenePayload?.generatedAt || "—"}
                        </Text>
                      </View>

                      <View style={styles.debugInfoRow}>
                        <Text style={styles.debugInfoKey}>Current Bag</Text>
                        <Text style={styles.debugInfoValue}>
                          {getBagSceneName(selectedBagScene)}
                        </Text>
                      </View>

                      <View style={styles.debugInfoRow}>
                        <Text style={styles.debugInfoKey}>Current Item</Text>
                        <Text style={styles.debugInfoValue}>
                          {currentItem ? getDisplayItemName(currentItem) : "—"}
                        </Text>
                      </View>

                      <View style={styles.debugInfoRow}>
                        <Text style={styles.debugInfoKey}>Current Step</Text>
                        <Text style={styles.debugInfoValue}>
                          {currentStep?.stepNumber || 0}
                        </Text>
                      </View>
                    </View>
                  </AppCard>
                </View>
              ) : null}

              <View style={[styles.footerActions, footerActionsStyle]}>
                <AppButton
                  title="Back to Simulation"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={() => navigation.goBack()}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl || 40,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
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
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  heroHeaderText: {
    flex: 1,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.secondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: 6,
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  softCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderColor: "#edf2f7",
  },
  sceneHeroCard: {
    borderRadius: 30,
    backgroundColor: "#f8fbff",
    borderColor: "#dbeafe",
    paddingTop: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingBottom: spacing.xl,
    marginHorizontal: -2,
  },
  sceneHeroDivider:{
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: spacing.md,
  },

  sceneHeroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sceneHeroTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  sceneHeroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  
  sceneHeroLead: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  sceneHeroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sceneHeroSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    maxWidth:"92%",
  },
  sceneHeroPills: {
    gap: spacing.sm,
    width:108,
  },
  scenePill: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 96,
  },
  scenePillLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing:0.9,
    marginBottom: 3,
  },
  scenePillValue: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
  },
  sceneSectionBlock: {
    marginBottom: spacing.md,
  },
  sceneSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sceneTabsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sceneTabItem: {
    minWidth: 84,
    flexGrow:1,
  },
  sceneTabButton: {
    minWidth: 84,
  },
  sceneTabButtonActive: {
    minWidth: 84,
  },
  canvasWrap: {
    height: 560,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#020617",
    position: "relative",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  topGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomGradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
  },

  leftVignetteOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "24%",
  },
  
  rightVignetteOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "24%",
  },
  
  centerVignetteSoftener: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  sceneHudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  hudTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  hudGlassPill: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.46)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  hudPillOverline: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(226,232,240,0.78)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  hudPillMain: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ffffff",
  },
  hudBottomWrap: {
    justifyContent: "flex-end",
  },
  insightsCard: {
    backgroundColor: "#ffffff",
    borderColor: "#eef2ff",
    borderRadius: 26,
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
  topButton: {
    marginTop: spacing.lg,
  },
  flexButton: {
    flex: 1,
  },
  footerActions: {
    marginTop: spacing.sm,
  },
  transportBarWrap: {
    marginTop: 10,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  
  transportBar: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
    borderRadius: 24,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    overflow: "hidden",
  },
  
  transportHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  
  transportMeta: {
    flex: 1,
  },
  
  transportMetaOverline: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  
  transportMetaMain: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 3,
  },
  
  transportMetaSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  
  transportStatusPill: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  
  transportStatusText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },
  
  transportControlsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  
  transportControlItem: {
    flex: 1,
  },
  
  transportControlItemPrimary: {
    flex: 1.45,
  },

  transportControlLabelPrimary: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  
  transportPlayButtonWrap: {
    borderRadius: 18,
    overflow: "hidden",
  },
  
  transportPlayButton: {
    minHeight: 56,
  },
  
  transportControlLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  
  transportIconButton: {
    minHeight: 48,
  },
  hudNowPlayingCard: {
    backgroundColor: "rgba(15, 23, 42, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    overflow: "hidden",
  },
  
  hudAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#60a5fa",
  },
  hudInnerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(96,165,250,0.05)",
  },
  hudNowPackingLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(191,219,254,0.96)",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  
  hudHeroItemName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 32,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  
  hudHeroSubline: {
    fontSize: 14,
    color: "rgba(226,232,240,0.82)",
    lineHeight: 20,
    marginBottom: 12,
  },
  
  hudMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  
  hudMiniTag: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  
  hudMiniTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#e2e8f0",
    textTransform: "capitalize",
  },
  
  hudInstructionBox: {
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: spacing.md,
  },
  
  hudInstructionKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(191,219,254,0.92)",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  
  hudInstructionText: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(226,232,240,0.96)",
  },

  shimmerSweep: {
    position: "absolute",
    top: -20,
    bottom: -20,
    width: 70,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
  },
  hudShimmerSweep: {
    opacity: 0.7,
  },
  transportShimmerSweep: {
    opacity: 0.55,
  },
  analyticsStripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  
  analyticsStripHeaderLeft: {
    flex: 1,
  },
  
  analyticsStripEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  
  analyticsStripTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  
  analyticsStripSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  
  analyticsStripStatus: {
    alignItems: "flex-end",
  },
  
  analyticsMetricsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  
  analyticsMetricPill: {
    width: "48%",
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#e6eefc",
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  
  analyticsMetricLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  
  analyticsMetricValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
  },
  
  analyticsMetricMeta: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  
  analyticsFooterRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  
  analyticsFooterPill: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  
  analyticsFooterLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  
  analyticsFooterValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  debugSubtleCard: {
    backgroundColor: "#fcfcfd",
    borderColor: "#f1f5f9",
    borderRadius: 18,
    opacity: 0.94,
  },
  
  debugPanelHeader: {
    marginBottom: spacing.md,
  },
  
  debugPanelEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  
  debugPanelTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 4,
  },
  
  debugPanelSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 19,
  },
  
  debugInfoList: {
    gap: 10,
  },
  
  debugInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  
  debugInfoKey: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    minWidth: 96,
  },
  
  debugInfoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  containerClean: {
    gap: spacing.lg,
  },
  
  containerDebug: {
    gap: spacing.md,
  },
  
  heroHeaderClean: {
    marginBottom: spacing.xs,
  },
  
  heroHeaderDebug: {
    marginBottom: 0,
  },
  
  debugSectionWrap: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  
  debugSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: spacing.xs,
  },
  
  footerActionsClean: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  
  footerActionsDebug: {
    marginTop: spacing.sm,
  },

  sceneHeroViewToggleWrap: {
    marginBottom: spacing.md,
    marginTop: 2,
  },
  
  sceneHeroViewToggleLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  iosSegmentedControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eef2f7",
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  
  iosSegmentItem: {
    flex: 1,
  },
  
  iosSegmentButton: {
    flex: 1,
    minHeight: 44,
  },
  
  iosSegmentButtonActive: {
    flex: 1,
    minHeight: 44,
  },

  debugPhysicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  
  debugPhysicsMetric: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#eef2f7",
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  
  debugPhysicsLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  
  debugPhysicsValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#334155",
  },
  
  debugBreakdownList: {
    gap: 6,
  },
  hudMiniTagDanger: {
    backgroundColor: "rgba(239,68,68,0.16)",
    borderColor: "rgba(239,68,68,0.28)",
  },
  
  hudMiniTagWarning: {
    backgroundColor: "rgba(245,158,11,0.16)",
    borderColor: "rgba(245,158,11,0.28)",
  },
  
  hudMiniTagTextDanger: {
    color: "#fecaca",
  },
  
  hudMiniTagTextWarning: {
    color: "#fde68a",
  },
  
  debugPhysicsValueDanger: {
    color: "#dc2626",
  },
  
  debugPhysicsValueWarning: {
    color: "#d97706",
  },

  debugIssuesWrap: {
    marginTop: spacing.md,
    gap: 8,
  },
  
  debugIssuesTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  
  debugIssueRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  
  debugIssueRowHigh: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  
  debugIssueRowMedium: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  
  debugIssueRowLow: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  
  debugIssueText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  
  debugIssueTextHigh: {
    color: "#b91c1c",
  },
  
  debugIssueTextMedium: {
    color: "#b45309",
  },
  
  debugIssueTextLow: {
    color: "#475569",
  },

  hudMiniTagInfo: {
    backgroundColor: "rgba(59,130,246,0.16)",
    borderColor: "rgba(59,130,246,0.26)",
  },
  
  hudMiniTagTextInfo: {
    color: "#bfdbfe",
  },
  
  debugSuggestionsWrap: {
    marginTop: spacing.md,
    gap: 8,
  },
  
  debugSuggestionsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  
  debugSuggestionRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  
  debugSuggestionRowHigh: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  
  debugSuggestionRowMedium: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  
  debugSuggestionRowLow: {
    backgroundColor: "#fcfcfd",
    borderColor: "#e2e8f0",
  },
  
  debugSuggestionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  
  debugSuggestionTextHigh: {
    color: "#1d4ed8",
  },
  
  debugSuggestionTextMedium: {
    color: "#334155",
  },
  
  debugSuggestionTextLow: {
    color: "#64748b",
  },
});

