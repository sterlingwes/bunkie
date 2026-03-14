import { useRef } from "react";
import { Mesh } from "three";
import type { Component } from "../../schemas/bunkie.schema";
import { useBunkieStore } from "../../store/useBunkieStore";

interface FoundationProps {
  component: Component;
  piers: Component[];
}

export function Foundation({ component, piers }: FoundationProps) {
  const groupRef = useRef(null);
  const {
    selectedComponentId,
    hoveredComponentId,
    hoverComponent,
    selectComponent,
  } = useBunkieStore();

  const isSelected = selectedComponentId === component.id;
  const isHovered = hoveredComponentId === component.id;

  const handlePointerOver = () => {
    hoverComponent(component.id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    hoverComponent(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = () => {
    selectComponent(isSelected ? null : component.id);
  };

  return (
    <group
      ref={groupRef}
      position={[
        component.position.x,
        component.position.y,
        component.position.z,
      ]}
    >
      {/* Main foundation group highlight */}
      <mesh
        visible={isSelected || isHovered}
        position={[0, 0.2, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry
          args={[
            component.dimensions.width + 0.1,
            0.02,
            component.dimensions.depth + 0.1,
          ]}
        />
        <meshStandardMaterial
          color={isSelected ? "#3b82f6" : "#60a5fa"}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Sonotube piers */}
      {piers.map((pier) => (
        <Pier key={pier.id} pier={pier} />
      ))}

      {/* Post base connectors */}
      {piers.map((pier) => (
        <mesh
          key={`postbase-${pier.id}`}
          position={[
            pier.position.x - component.position.x,
            pier.position.y - component.position.y + 0.22,
            pier.position.z - component.position.z,
          ]}
        >
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial
            color="#71717a"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

interface PierProps {
  pier: Component;
}

function Pier({ pier }: PierProps) {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={[
        pier.position.x,
        pier.position.y + pier.dimensions.height / 2,
        pier.position.z,
      ]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry
        args={[
          pier.dimensions.width / 2,
          pier.dimensions.width / 2,
          pier.dimensions.height,
          16,
        ]}
      />
      <meshStandardMaterial color="#a8a29e" roughness={0.9} />
    </mesh>
  );
}
