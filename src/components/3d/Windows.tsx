import { useRef } from 'react';
import { Mesh } from 'three';
import type { Component } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';

interface WindowProps {
  component: Component;
}

export function Window({ component }: WindowProps) {
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
  const glassColor = isSelected ? '#93c5fd' : '#87ceeb';

  return (
    <group position={[component.position.x, component.position.y, component.position.z]}>
      {/* Window frame - vertical */}
      <mesh position={[-component.dimensions.width / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.02, component.dimensions.height, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>
      <mesh position={[component.dimensions.width / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.02, component.dimensions.height, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>

      {/* Window frame - horizontal */}
      <mesh position={[0, component.dimensions.height / 2, 0]} castShadow>
        <boxGeometry args={[component.dimensions.width + 0.04, 0.02, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>
      <mesh position={[0, -component.dimensions.height / 2, 0]} castShadow>
        <boxGeometry args={[component.dimensions.width + 0.04, 0.02, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>

      {/* Glass */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[component.dimensions.width, component.dimensions.height, 0.005]} />
        <meshStandardMaterial
          color={glassColor}
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Window divider (optional) */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.01, component.dimensions.height, 0.01]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} />
      </mesh>
    </group>
  );
}
