import React from "react";
import * as THREE from "three";

function cmToWorld(value) {
  return Number(value || 0) * 0.01;
}

function worldY(value) {
  return Number(value || 0) * 0.01 * 0.72;
}

function FloorDiagonalLines({ width, depth, y }) {
  const lines = [-0.36, -0.26, -0.16, -0.06, 0.04, 0.14, 0.24, 0.34];

  return (
    <group position={[width / 2, y, depth / 2]}>
      {lines.map((offset, index) => (
        <mesh
          key={`diag-line-${index}`}
          position={[width * offset, 0, 0]}
          rotation={[-Math.PI / 2, 0, -0.52]}
        >
          <planeGeometry args={[width * 0.05, depth * 1.15]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function SuitcaseShell3D({ bagInner }) {
  const width = cmToWorld(bagInner?.width || 30);
  const height = worldY(bagInner?.height || 20);
  const depth = cmToWorld(bagInner?.depth || 45);

  const centerX = width / 2;
  const centerY = height / 2;
  const centerZ = depth / 2;

  const floorThickness = 0.008;

  return (
    <group>
      {/* outer translucent volume */}
      <mesh position={[centerX, centerY, centerZ]} renderOrder={0}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#dbeafe"
          transparent
          opacity={0.06}
          roughness={0.95}
          metalness={0.02}
          depthWrite={false}
        />
      </mesh>

      {/* box edges */}
      <lineSegments position={[centerX, centerY, centerZ]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color="#f8fafc" />
      </lineSegments>

      {/* floor base */}
      <mesh position={[centerX, floorThickness / 2, centerZ]}>
        <boxGeometry args={[width, floorThickness, depth]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.95}
          metalness={0.03}
        />
      </mesh>

      {/* floor top surface */}
      <mesh
        position={[centerX, floorThickness + 0.001, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width * 0.94, depth * 0.92]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={1}
          metalness={0}
        />
      </mesh>

      <FloorDiagonalLines
        width={width * 0.94}
        depth={depth * 0.92}
        y={floorThickness + 0.0018}
      />

      {/* center strip */}
      <mesh
        position={[centerX, floorThickness + 0.0022, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width * 0.18, depth * 0.86]} />
        <meshStandardMaterial
          color="#475569"
          roughness={1}
          metalness={0}
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* faint side wall planes to help visually */}
      <mesh position={[0, centerY, centerZ]} renderOrder={0}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial
          color="#cbd5e1"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[width, centerY, centerZ]} rotation={[0, Math.PI, 0]} renderOrder={0}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial
          color="#cbd5e1"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={[centerX, centerY, 0]}
        rotation={[0, Math.PI, 0]}
        renderOrder={0}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#cbd5e1"
          transparent
          opacity={0.035}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[centerX, centerY, depth]} renderOrder={0}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#cbd5e1"
          transparent
          opacity={0.035}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}