import { useRef } from 'react';
import { Group, Mesh } from 'three';
import type { Component } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';

interface DoorProps {
  component: Component;
}

export function Door({ component }: DoorProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
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

  const frameColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#f5f5f4';
  const glassColor = '#87ceeb';

  // Door is on the west wall (front), which faces +Z
  // Rotate 180° to face outward (+Z direction)
  const rotation: [number, number, number] = [0, Math.PI, 0];

  return (
    <group
      ref={groupRef}
      position={[component.position.x, component.position.y, component.position.z]}
      rotation={rotation}
    >
      {/* Door frame - vertical */}
      <mesh position={[-component.dimensions.width / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.04, component.dimensions.height, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>
      <mesh position={[component.dimensions.width / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.04, component.dimensions.height, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>

      {/* Door frame - top */}
      <mesh position={[0, component.dimensions.height / 2, 0]} castShadow>
        <boxGeometry args={[component.dimensions.width + 0.08, 0.04, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>

      {/* Door panels - left side (fixed) - glass */}
      <mesh
        ref={meshRef}
        position={[-component.dimensions.width / 4, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
      >
        <boxGeometry args={[component.dimensions.width / 2 - 0.02, component.dimensions.height - 0.04, 0.005]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.4} roughness={0.1} />
      </mesh>

      {/* Door panels - right side (sliding) - glass */}
      <mesh position={[component.dimensions.width / 4, 0, 0.01]} castShadow>
        <boxGeometry args={[component.dimensions.width / 2 - 0.02, component.dimensions.height - 0.04, 0.005]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.4} roughness={0.1} />
      </mesh>

      {/* Handle */}
      <mesh position={[component.dimensions.width / 4 - 0.15, 0, 0.04]}>
        <boxGeometry args={[0.03, 0.15, 0.02]} />
        <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
