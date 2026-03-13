import { useRef } from 'react';
import { Group } from 'three';
import type { Component } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';

interface FloorProps {
  component: Component;
}

export function Floor({ component }: FloorProps) {
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

  const joistCount = Math.floor(component.dimensions.depth / 0.4) + 1; // ~16" OC
  const joistSpacing = component.dimensions.depth / (joistCount - 1);

  return (
    <group
      ref={groupRef}
      position={[component.position.x, component.position.y, component.position.z]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Floor joists - 2x8 (actual: 1.5" x 7.25" = 38mm x 184mm) */}
      {Array.from({ length: joistCount }).map((_, i) => (
        <mesh
          key={`joist-${i}`}
          position={[0, -0.05, -component.dimensions.depth / 2 + i * joistSpacing]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[component.dimensions.width, 0.184, 0.038]} />
          <meshStandardMaterial color={isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#c4a574'} roughness={0.8} />
        </mesh>
      ))}

      {/* Rim joists - front and back */}
      <mesh position={[0, -0.05, component.dimensions.depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[component.dimensions.width, 0.184, 0.038]} />
        <meshStandardMaterial color={isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#b8956e'} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.05, -component.dimensions.depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[component.dimensions.width, 0.184, 0.038]} />
        <meshStandardMaterial color={isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#b8956e'} roughness={0.8} />
      </mesh>

      {/* Rim joists - sides */}
      <mesh position={[component.dimensions.width / 2, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.038, 0.184, component.dimensions.depth]} />
        <meshStandardMaterial color={isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#b8956e'} roughness={0.8} />
      </mesh>
      <mesh position={[-component.dimensions.width / 2, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.038, 0.184, component.dimensions.depth]} />
        <meshStandardMaterial color={isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#b8956e'} roughness={0.8} />
      </mesh>

      {/* Subfloor - 5/8" plywood (16mm) */}
      <mesh position={[0, 0.008, 0]} castShadow receiveShadow>
        <boxGeometry args={[component.dimensions.width, 0.016, component.dimensions.depth]} />
        <meshStandardMaterial color={isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#d4a574'} roughness={0.7} />
      </mesh>
    </group>
  );
}
