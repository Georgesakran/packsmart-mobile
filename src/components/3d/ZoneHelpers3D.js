//src/components/3d/ZoneHelpers3D.js
import React from "react";

function cmToWorld(value) {
  return Number(value || 0) * 0.01;
}

function getZoneTint(zoneKey = "") {
  switch (zoneKey) {
    case "bottom_base":
      return "#14532d";
    case "middle_core":
      return "#1d4ed8";
    case "top_layer":
      return "#b45309";
    case "quick_access":
      return "#6d28d9";
    default:
      return "#475569";
  }
}

export default function ZoneHelpers3D({ zones = [] }) {
  return (
    <group>
      {zones.map((zone) => {
        const bounds = zone.boundsCm || {};

        const w = cmToWorld(bounds.w || 0);
        const h = cmToWorld(bounds.h || 0);
        const d = cmToWorld(bounds.d || 0);

        const x = cmToWorld(bounds.x || 0) + w / 2;
        const y = cmToWorld(bounds.y || 0) + h / 2;
        const z = cmToWorld(bounds.z || 0) + d / 2;

        return (
          <mesh key={zone.zoneKey} position={[x, y, z]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
              color={getZoneTint(zone.zoneKey)}
              transparent
              opacity={0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
}