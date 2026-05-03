//src/components/3d/StepCameraController.js

import { useFrame, useThree } from "@react-three/fiber/native";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

function cmToWorld(value) {
  return Number(value || 0) * 0.01;
}

function worldY(value) {
  return Number(value || 0) * 0.01 * 0.72;
}

function getBagCenter(bagInner) {
  const width = cmToWorld(bagInner?.width || 30);
  const height = worldY(bagInner?.height || 20);
  const depth = cmToWorld(bagInner?.depth || 45);

  return {
    width,
    height,
    depth,
    center: new THREE.Vector3(width / 2, height / 2, depth / 2),
  };
}

function buildPresetCamera(preset, bagInner) {
  const { width, height, depth, center } = getBagCenter(bagInner);

  switch (preset) {
    case "top":
      return {
        eye: new THREE.Vector3(
          center.x,
          height * 2.6,
          center.z + 0.001
        ),
        target: new THREE.Vector3(center.x, height * 0.25, center.z),
      };

      case "front":
        return {
          eye: new THREE.Vector3(
            width / 2,
            height * 0.52,
            depth * 3.35
          ),
          target: new THREE.Vector3(
            width / 2,
            height * 0.32,
            depth / 2
          ),
        };

    case "side":
      return {
        eye: new THREE.Vector3(
          width * 2.0,
          height * 1.0,
          center.z
        ),
        target: new THREE.Vector3(center.x, height * 0.45, center.z),
      };

    case "isometric":
    default:
      return {
        eye: new THREE.Vector3(
          width * 1.45,
          height * 1.55,
          depth * 1.65
        ),
        target: new THREE.Vector3(center.x, height * 0.4, center.z),
      };
  }
}

function buildGestureOrbitCamera(gestureOrbit, bagInner) {
  const { width, height, depth, center } = getBagCenter(bagInner);

  const target = new THREE.Vector3(center.x, height * 0.42, center.z);

  const radius = Math.max(0.35, Number(gestureOrbit?.radius || 1.2));
  const azimuth = Number(gestureOrbit?.azimuth || 0.8);
  const elevation = Number(gestureOrbit?.elevation || 0.5);

  const x = target.x + radius * Math.cos(elevation) * Math.sin(azimuth);
  const y = target.y + radius * Math.sin(elevation);
  const z = target.z + radius * Math.cos(elevation) * Math.cos(azimuth);

  return {
    eye: new THREE.Vector3(x, y, z),
    target,
  };
}

export default function StepCameraController({
  currentStep,
  bagInner,
  cameraPreset = "auto",
  gestureOrbit = null,
}) {
  const { camera } = useThree();

  const initializedRef = useRef(false);
  const lookAtRef = useRef(new THREE.Vector3());

  const targetCameraPosition = useMemo(() => {
    if (!bagInner) return new THREE.Vector3(0.8, 0.8, 1.2);

    if (gestureOrbit?.enabled) {
      return buildGestureOrbitCamera(gestureOrbit, bagInner).eye;
    }

    if (cameraPreset !== "auto") {
      return buildPresetCamera(cameraPreset, bagInner).eye;
    }

    return buildPresetCamera("isometric", bagInner).eye;
  }, [bagInner, cameraPreset, gestureOrbit, currentStep]);

  const targetLookAt = useMemo(() => {
    if (!bagInner) return new THREE.Vector3(0, 0, 0);

    if (gestureOrbit?.enabled) {
      return buildGestureOrbitCamera(gestureOrbit, bagInner).target;
    }

    if (cameraPreset !== "auto") {
      return buildPresetCamera(cameraPreset, bagInner).target;
    }

    return buildPresetCamera("isometric", bagInner).target;
  }, [bagInner, cameraPreset, gestureOrbit, currentStep]);

  useFrame(() => {
    if (!initializedRef.current) {
      camera.position.copy(targetCameraPosition);
      lookAtRef.current.copy(targetLookAt);
      camera.lookAt(lookAtRef.current);
      initializedRef.current = true;
      return;
    }

    camera.position.lerp(targetCameraPosition, 0.1);
    lookAtRef.current.lerp(targetLookAt, 0.1);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}

