//PackingCanvas.js
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import { Canvas } from "@react-three/fiber/native";

import SuitcaseShell3D from "./SuitcaseShell3D";
import PackedItemMesh from "./PackedItemMesh";
import StepCameraController from "./StepCameraController";
import SceneLights from "./SceneLights";
import ZoneHelpers3D from "./ZoneHelpers3D";

function cmToWorld(value) {
  return Number(value || 0) * 0.01;
}

function worldY(value) {
  return Number(value || 0) * 0.01 * 0.72;
}

function getInitialOrbitFromPreset(cameraPreset, bagInner) {
  const width = cmToWorld(bagInner?.width || 30);
  const height = worldY(bagInner?.height || 50);
  const depth = cmToWorld(bagInner?.depth || 20);

  const radiusBase = Math.max(width, height, depth) * 2.4;

  switch (cameraPreset) {
    case "top":
      return {
        enabled: false,
        radius: radiusBase,
        azimuth: 0.001,
        elevation: 1.45,
      };
    case "front":
      return {
        enabled: false,
        radius: radiusBase * 1.18,
        azimuth: 0,
        elevation: 0.18,
      };
    case "side":
      return {
        enabled: false,
        radius: radiusBase,
        azimuth: 1.57,
        elevation: 0.35,
      };
    case "isometric":
    case "auto":
    default:
      return {
        enabled: false,
        radius: radiusBase,
        azimuth: 0.75,
        elevation: 0.55,
      };
  }
}

export default function PackingCanvas({
  scene,
  visibleItems = [],
  currentStep,
  highlightItemIds = [],
  cameraPreset = "auto",
  resetViewSignal = 0,
  debugMode = false,
  showItemLabels = false,
}) {
  const primaryBagScene = useMemo(() => {
    if (!scene) return null;
    return scene?.primaryBag || scene?.bags?.[0] || null;
  }, [scene]);

  const bagMeta = useMemo(() => {
    if (!primaryBagScene) return null;
    return primaryBagScene?.bag || primaryBagScene || null;
  }, [primaryBagScene]);

  const bagInner = useMemo(() => {
    return bagMeta?.innerDimensionsCm || scene?.bag?.innerDimensionsCm || null;
  }, [bagMeta, scene]);

  const zones = useMemo(() => {
    if (Array.isArray(primaryBagScene?.zones)) return primaryBagScene.zones;
    if (Array.isArray(scene?.zones)) return scene.zones;
    return [];
  }, [primaryBagScene, scene]);

  const sceneItems = useMemo(() => {
    return visibleItems.map((item) => {
      const position = item.positionCm || {};
      const size = item.sizeCm || {};
      const rotationDeg = item.rotationDeg || { x: 0, y: 0, z: 0 };
      const itemKey = item.sceneItemId || String(item.tripItemId);

      return {
        ...item,
        sceneItemId: itemKey,
        worldPosition: [
          cmToWorld(position.x) + cmToWorld(size.w) / 2,
          worldY(position.y) + worldY(size.h) / 2,
          cmToWorld(position.z) + cmToWorld(size.d) / 2,
        ],
        worldSize: [
          cmToWorld(size.w),
          worldY(size.h),
          cmToWorld(size.d),
        ],
        worldRotation: [0, 0, 0],
        isCurrent: highlightItemIds.includes(itemKey),
        debugMode,
        showLabel: debugMode && showItemLabels,
        materialType: item.materialType,
        rigidityScore: item.rigidityScore,
        compressionAppliedRatio: item.compressionAppliedRatio,
        placementScore: item.placementScore,
        supportType: item.supportType,
        supportCoverageRatio: item.supportCoverageRatio,
        placementScoreBreakdown: item.placementScoreBreakdown,
        placementIssues: Array.isArray(item.placementIssues) ? item.placementIssues : [],
        placementSuggestions: Array.isArray(item.placementSuggestions)
          ? item.placementSuggestions
          : [],
        placementQuality:
          Number(item.placementScore || 0) < 55
            ? "weak"
            : Number(item.placementScore || 0) < 70
            ? "fair"
            : "good",
      };
    });
  }, [visibleItems, highlightItemIds, debugMode, showItemLabels]);

  const [gestureOrbit, setGestureOrbit] = useState(() =>
    bagInner
      ? getInitialOrbitFromPreset(cameraPreset, bagInner)
      : {
          enabled: false,
          radius: 1.2,
          azimuth: 0.75,
          elevation: 0.55,
        }
  );

  const gestureStartRef = useRef({
    azimuth: 0.75,
    elevation: 0.55,
    radius: 1.2,
  });

  useEffect(() => {
    if (!bagInner) return;
    setGestureOrbit(getInitialOrbitFromPreset(cameraPreset, bagInner));
  }, [cameraPreset, bagInner, resetViewSignal]);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        gestureStartRef.current = {
          azimuth: gestureOrbit.azimuth,
          elevation: gestureOrbit.elevation,
          radius: gestureOrbit.radius,
        };
      },
      onPanResponderMove: (_, gestureState) => {
        const touchCount = gestureState.numberActiveTouches || 1;

        if (touchCount >= 2) {
          const nextRadius = Math.max(
            0.35,
            Math.min(4.5, gestureStartRef.current.radius - gestureState.dy * 0.01)
          );

          setGestureOrbit((prev) => ({
            ...prev,
            enabled: true,
            radius: nextRadius,
          }));
          return;
        }

        const nextAzimuth =
          gestureStartRef.current.azimuth - gestureState.dx * 0.01;
        const nextElevation = Math.max(
          -0.15,
          Math.min(1.45, gestureStartRef.current.elevation + gestureState.dy * 0.008)
        );

        setGestureOrbit((prev) => ({
          ...prev,
          enabled: true,
          azimuth: nextAzimuth,
          elevation: nextElevation,
        }));
      },
    });
  }, [gestureOrbit]);

  if (!scene || !bagInner || !bagMeta) {
    return <View style={styles.empty} />;
  }


  // console.log("BAG INNER:", bagInner);
  // console.log(
  //   "SCENE ITEMS DEBUG:",
  //   sceneItems.slice(0, 10).map((item) => ({
  //     name: item.name,
  //     sceneItemId: item.sceneItemId,
  //     worldPosition: item.worldPosition,
  //     worldSize: item.worldSize,
  //     worldRotation: item.worldRotation,
  //     category: item.category,
  //   }))
  // );

  

  return (
    <View style={styles.wrapper} {...panResponder.panHandlers}>
      <Canvas shadows={{ fov: 28, near: 0.01, far: 100, position: [0.8, 0.9, 1.4] }}>
        <color attach="background" args={["#08111f"]} />
        <fog attach="fog" args={["#08111f", 1.8, 4.8]} />

        <Suspense fallback={null}>
          <SceneLights />

          <StepCameraController
            currentStep={currentStep}
            bagInner={bagInner}
            cameraPreset={cameraPreset}
            gestureOrbit={gestureOrbit}
          />

          {debugMode ? <ZoneHelpers3D zones={zones} /> : null}

          <SuitcaseShell3D bagInner={bagInner} />

          {sceneItems.map((item) => (
            <PackedItemMesh
              key={item.sceneItemId || `${item.tripItemId}-${item.stepNumber || 0}`}
              item={item}
            />
          ))}
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  empty: {
    flex: 1,
    backgroundColor: "#08111f",
  },
});