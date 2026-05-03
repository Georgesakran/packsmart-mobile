import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import { Text } from "@react-three/drei/native";

function getColor(category = "", isCurrent = false) {
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
    case "socks":
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

function getPlacementQuality(score) {
  const numeric = Number(score || 0);
  if (numeric < 55) return "weak";
  if (numeric < 70) return "fair";
  return "good";
}

function buildDebugLabel(item) {
  const score =
    item?.placementScore != null
      ? Math.round(Number(item.placementScore))
      : null;

  return [
    item?.name || "Item",
    score != null ? `Score ${score}` : null,
    item?.materialType || null,
    item?.supportType || null,
  ]
    .filter(Boolean)
    .join(" • ");
}

function CurrentItemHighlight({ worldSize = [0.1, 0.05, 0.08] }) {
  const ringRef = useRef(null);
  const glowRef = useRef(null);

  const radius = useMemo(() => {
    const [w, , d] = worldSize;
    return Math.max(w, d) * 0.75;
  }, [worldSize]);

  const yOffset = useMemo(() => {
    const [, h] = worldSize;
    return -h / 2 + 0.004;
  }, [worldSize]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = (Math.sin(t * 3.2) + 1) / 2;
    const scale = 1 + pulse * 0.08;
    const opacity = 0.18 + pulse * 0.18;
    const glowOpacity = 0.08 + pulse * 0.12;

    if (ringRef.current) {
      ringRef.current.scale.set(scale, scale, scale);
      if (ringRef.current.material) {
        ringRef.current.material.opacity = opacity;
      }
    }

    if (glowRef.current) {
      glowRef.current.scale.set(scale * 1.18, scale * 1.18, scale * 1.18);
      if (glowRef.current.material) {
        glowRef.current.material.opacity = glowOpacity;
      }
    }
  });

  return (
    <group position={[0, yOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={glowRef}>
        <ringGeometry args={[radius * 0.82, radius * 1.22, 48]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.12}
          side={2}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={ringRef}>
        <ringGeometry args={[radius * 0.94, radius, 64]} />
        <meshBasicMaterial
          color="#bfdbfe"
          transparent
          opacity={0.22}
          side={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function WeakPlacementWarning({ worldSize = [0.1, 0.05, 0.08], quality = "good" }) {
  const ringRef = useRef(null);

  const radius = useMemo(() => {
    const [w, , d] = worldSize;
    return Math.max(w, d) * 0.82;
  }, [worldSize]);

  const yOffset = useMemo(() => {
    const [, h] = worldSize;
    return -h / 2 + 0.006;
  }, [worldSize]);

  const color = quality === "weak" ? "#ef4444" : "#f59e0b";

  useFrame(({ clock }) => {
    if (!ringRef.current) return;

    const pulse = (Math.sin(clock.elapsedTime * 2.6) + 1) / 2;
    const scale = quality === "weak" ? 1 + pulse * 0.1 : 1 + pulse * 0.05;
    const opacity =
      quality === "weak"
        ? 0.18 + pulse * 0.18
        : 0.12 + pulse * 0.08;

    ringRef.current.scale.set(scale, scale, scale);
    if (ringRef.current.material) {
      ringRef.current.material.opacity = opacity;
    }
  });

  return (
    <group position={[0, yOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[radius * 0.94, radius, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          side={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function ItemShadowPlane({ worldSize = [0.1, 0.05, 0.08], isCurrent = false }) {
  const shadowRef = useRef(null);

  const shadowSize = useMemo(() => {
    const [w, , d] = worldSize;
    return {
      w: Math.max(w * 1.02, 0.03),
      d: Math.max(d * 1.02, 0.03),
    };
  }, [worldSize]);

  const yOffset = useMemo(() => {
    const [, h] = worldSize;
    return -h / 2 + 0.002;
  }, [worldSize]);

  useFrame(({ clock }) => {
    if (!shadowRef.current) return;

    if (isCurrent) {
      const pulse = (Math.sin(clock.elapsedTime * 3.2) + 1) / 2;
      if (shadowRef.current.material) {
        shadowRef.current.material.opacity = 0.11 + pulse * 0.06;
      }
      shadowRef.current.scale.set(1 + pulse * 0.04, 1 + pulse * 0.04, 1);
    } else {
      if (shadowRef.current.material) {
        shadowRef.current.material.opacity = 0.1;
      }
      shadowRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <mesh
      ref={shadowRef}
      position={[0, yOffset, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1}
    >
      <planeGeometry args={[shadowSize.w, shadowSize.d]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}

function DebugBox({ item, color }) {
  const size = item?.worldSize || [0.1, 0.05, 0.08];
  const placementQuality = getPlacementQuality(item?.placementScore);

  let edgeColor = "#e5e7eb";
  if (placementQuality === "weak") edgeColor = "#ef4444";
  if (placementQuality === "fair") edgeColor = "#f59e0b";
  if (item?.isCurrent) edgeColor = "#ffffff";

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={0.72}
          metalness={0.04}
          transparent
          opacity={0.92}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[undefined, 1]} />
      </lineSegments>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(size[0], size[1], size[2])]} />
        <lineBasicMaterial color={edgeColor} />
      </lineSegments>
    </group>
  );
}

import * as THREE from "three";

export default function PackedItemMesh({ item }) {
  const groupRef = useRef(null);

  const color = useMemo(
    () => getColor(item?.category, item?.isCurrent),
    [item]
  );

  const placementQuality = useMemo(
    () => getPlacementQuality(item?.placementScore),
    [item]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    if (item?.isCurrent) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.02;
      groupRef.current.scale.set(pulse, pulse, pulse);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={item.worldPosition}
      rotation={item.worldRotation}
    >
      <ItemShadowPlane worldSize={item.worldSize} isCurrent={item?.isCurrent} />

      <DebugBox item={item} color={color} />

      {item?.isCurrent ? (
        <CurrentItemHighlight worldSize={item.worldSize} />
      ) : null}

      {item?.debugMode && placementQuality !== "good" ? (
        <WeakPlacementWarning
          worldSize={item.worldSize}
          quality={placementQuality}
        />
      ) : null}

      {item?.showLabel ? (
        <Text
          position={[0, (item.worldSize?.[1] || 0.05) * 1.05, 0]}
          fontSize={0.022}
          color={
            placementQuality === "weak"
              ? "#fecaca"
              : placementQuality === "fair"
              ? "#fde68a"
              : item?.isCurrent
              ? "#ffffff"
              : "#e2e8f0"
          }
          anchorX="center"
          anchorY="middle"
          maxWidth={0.48}
        >
          {buildDebugLabel(item)}
        </Text>
      ) : null}
    </group>
  );
}