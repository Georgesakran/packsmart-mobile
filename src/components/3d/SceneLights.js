import React from "react";

export default function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.36} color="#dbeafe" />

      <hemisphereLight args={["#cfe7ff", "#0f172a", 0.58]} />

      <directionalLight
        castShadow
        position={[1.6, 2.2, 2.0]}
        intensity={0.9}
        color="#ffffff"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={10}
        shadow-bias={-0.00015}
      />

      <directionalLight
        position={[-1.4, 1.2, 1.4]}
        intensity={0.34}
        color="#bfdbfe"
      />

      <directionalLight
        position={[0.2, 1.5, -2.0]}
        intensity={0.24}
        color="#93c5fd"
      />

      <pointLight
        position={[0.8, 2.2, 1.1]}
        intensity={0.24}
        distance={8}
        decay={2}
        color="#ffffff"
      />
    </>
  );
}