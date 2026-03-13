import { useRef } from 'react';
import { Group } from 'three';
import type { Component } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';

interface RoofProps {
  component: Component;
}

export function Roof({ component }: RoofProps) {
  const groupRef = useRef<Group>(null);
  const { selectedComponentId, hoveredComponentId, hoverComponent, selectComponent } = useBunkieStore();

  const isSelected = selectedComponentId === component.id;
  const isHovered = hoveredComponentId === component.id;

  const handlePointerOver = () => {
    hoverComponent(component.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    hoverComponent(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = () => {
    selectComponent(isSelected ? null : component.id);
  };

  const roofWidth = component.dimensions.width;
  const roofDepth = component.dimensions.depth;
  const rafterSpacing = 0.406; // 16" OC
  const rafterCount = Math.floor(roofWidth / rafterSpacing) + 1;
  const rafterHeight = 0.14; // 2x6 actual: 140mm
  const rafterThickness = 0.038; // 1.5" actual: 38mm

  // Shed roof: front (west, +Z) is HIGH, back (east, -Z) is LOW
  // In Three.js: positive X rotation makes +Z go DOWN, -Z go UP
  // We want front (+Z) HIGH, back (-Z) LOW, so use NEGATIVE slope
  const slope = -0.09; // ~-5.2 degrees

  const frameColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#c4a574';
  const sheathingColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#d4a574';
  const shingleColor = '#4a4a4a'; // Gray shingles

  return (
  <group
    ref={groupRef}
    position={[component.position.x, component.position.y, component.position.z]}
    rotation={[slope, 0, 0]}
    onPointerOver={handlePointerOver}
    onPointerOut={handlePointerOut}
    onClick={handleClick}
  >
    {/* Rafters - 5x6 running front to back (along Z axis) */}
    {Array.from({ length: rafterCount }).map((_, i) => {
      const xPos = -roofWidth / 2 + 0.05 + i * rafterSpacing;
      return (
        <mesh
          key={`rafter-${i}`}
          position={[xPos, -rafterHeight / 2 + 0.02, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[rafterThickness, rafterHeight, roofDepth - 0.05]} />
          <meshStandardMaterial color={frameColor} roughness={0.8} />
        </mesh>
      );
    })}

    {/* Roof sheathing */}
    <mesh position={[0, 0.018, 0]} castShadow receiveShadow>
      <boxGeometry args={[roofWidth, 0.016, roofDepth]} />
      <meshStandardMaterial color={sheathingColor} roughness={0.7} />
    </mesh>

    {/* Shingles */}
    <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
      <boxGeometry args={[roofWidth, 0.01, roofDepth]} />
      <meshStandardMaterial color={isSelected ? '#60a5fa' : shingleColor} roughness={0.9} />
    </mesh>

    {/* Front fascia (at LOW side now with positive slope, +Z) */}
    <mesh position={[0, -0.02, roofDepth / 2 - 0.012]} castShadow>
      <boxGeometry args={[roofWidth, 0.18, 0.025]} />
      <meshStandardMaterial color={frameColor} roughness={0.8} />
    </mesh>

    {/* Back fascia (at HIGH side now, -Z) */}
    <mesh position={[0, -0.05, -roofDepth / 2 + 0.012]} castShadow>
      <boxGeometry args={[roofWidth, 0.12, 0.025]} />
      <meshStandardMaterial color={frameColor} roughness={0.8} />
    </mesh>

    {/* Rake boards (sides) */}
    <mesh position={[roofWidth / 2 - 0.012, 0.01, 0]} castShadow>
      <boxGeometry args={[0.025, 0.1, roofDepth]} />
      <meshStandardMaterial color={frameColor} roughness={0.8} />
    </mesh>
    <mesh position={[-roofWidth / 2 + 0.012, 0.01, 0]} castShadow>
      <boxGeometry args={[0.025, 0.1, roofDepth]} />
      <meshStandardMaterial color={frameColor} roughness={0.8} />
    </mesh>
  </group>
);
}
