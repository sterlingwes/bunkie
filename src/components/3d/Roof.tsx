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
  const rafterCount = Math.floor(roofDepth / rafterSpacing) + 1;
  const slope = 0.05; // 5 degree slope

  const frameColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#c4a574';
  const sheathingColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#d4a574';
  const shingleColor = '#4a4a4a';

  return (
    <group
      ref={groupRef}
      position={[component.position.x, component.position.y, component.position.z]}
      rotation={[slope, 0, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Rafters - 2x6 */}
      {Array.from({ length: rafterCount }).map((_, i) => (
        <mesh
          key={`rafter-${i}`}
          position={[0, -0.05, -roofDepth / 2 + i * rafterSpacing]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[roofWidth, 0.14, 0.038]} />
          <meshStandardMaterial color={frameColor} roughness={0.8} />
        </mesh>
      ))}

      {/* Ridge board */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[roofWidth, 0.14, 0.038]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* Roof sheathing - 5/8" plywood */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[roofWidth, 0.016, roofDepth]} />
        <meshStandardMaterial color={sheathingColor} roughness={0.7} />
      </mesh>

      {/* Shingles */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[roofWidth, 0.008, roofDepth]} />
        <meshStandardMaterial color={isSelected ? '#60a5fa' : shingleColor} roughness={0.9} />
      </mesh>

      {/* Fascia boards */}
      <mesh position={[0, 0, roofDepth / 2]} castShadow>
        <boxGeometry args={[roofWidth, 0.15, 0.019]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, -roofDepth / 2]} castShadow>
        <boxGeometry args={[roofWidth, 0.15, 0.019]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* Rake boards (sides) */}
      <mesh position={[roofWidth / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.019, 0.15, roofDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      <mesh position={[-roofWidth / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.019, 0.15, roofDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
    </group>
  );
}
