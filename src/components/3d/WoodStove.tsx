import { useRef } from "react";
import { Group, Mesh } from "three";
import type { Component } from "../../schemas/bunkie.schema";
import { useBunkieStore } from "../../store/useBunkieStore";

interface WoodStoveProps {
  component: Component;
  showClearance?: boolean;
}

export function WoodStove({ component, showClearance = true }: WoodStoveProps) {
  const groupRef = useRef<Group>(null);
  const {
    selectedComponentId,
    hoveredComponentId,
    hoverComponent,
    selectComponent,
    showClearances,
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

  const stoveColor = isSelected ? "#60a5fa" : isHovered ? "#93c5fd" : "#1f1f1f";
  const hearthColor = "#6b7280";

  return (
    <group
      ref={groupRef}
      position={[
        component.position.x,
        component.position.y,
        component.position.z,
      ]}
    >
      {/* Non-combustible hearth - 900mm x 900mm */}
      <mesh
        position={[0, -component.dimensions.height / 2 + 0.01, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.9, 0.02, 0.9]} />
        <meshStandardMaterial color={hearthColor} roughness={0.4} />
      </mesh>

      {/* Stove body */}
      <mesh
        position={[0, 0, 0]}
        castShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry
          args={[
            component.dimensions.width,
            component.dimensions.height,
            component.dimensions.depth,
          ]}
        />
        <meshStandardMaterial
          color={stoveColor}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Stove legs */}
      {[
        [
          -component.dimensions.width / 2 + 0.05,
          -component.dimensions.height / 2 + 0.03,
          -component.dimensions.depth / 2 + 0.05,
        ],
        [
          component.dimensions.width / 2 - 0.05,
          -component.dimensions.height / 2 + 0.03,
          -component.dimensions.depth / 2 + 0.05,
        ],
        [
          -component.dimensions.width / 2 + 0.05,
          -component.dimensions.height / 2 + 0.03,
          component.dimensions.depth / 2 - 0.05,
        ],
        [
          component.dimensions.width / 2 - 0.05,
          -component.dimensions.height / 2 + 0.03,
          component.dimensions.depth / 2 - 0.05,
        ],
      ].map((pos, i) => (
        <mesh
          key={`leg-${i}`}
          position={pos as [number, number, number]}
          castShadow
        >
          <boxGeometry args={[0.03, 0.06, 0.03]} />
          <meshStandardMaterial
            color={stoveColor}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Glass door */}
      <mesh position={[0, 0.05, component.dimensions.depth / 2 + 0.001]}>
        <boxGeometry
          args={[
            component.dimensions.width * 0.6,
            component.dimensions.height * 0.5,
            0.005,
          ]}
        />
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.6}
          roughness={0.1}
        />
      </mesh>

      {/* Flue collar */}
      <mesh position={[0, component.dimensions.height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.08, 16]} />
        <meshStandardMaterial
          color={stoveColor}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Chimney pipe (partial - through roof) */}
      <mesh position={[0, component.dimensions.height / 2 + 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 1.5, 16]} />
        <meshStandardMaterial color="#333" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Clearance zone - 18" (457mm) radius - CSA B365 */}
      {showClearance && showClearances && (
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.457, 0.457, 1.5, 32]} />
          <meshStandardMaterial
            color="#ef4444"
            transparent
            opacity={0.15}
            roughness={1}
          />
        </mesh>
      )}
    </group>
  );
}

interface ClearanceZoneProps {
  component: Component;
}

export function ClearanceZone({ component }: ClearanceZoneProps) {
  const meshRef = useRef<Mesh>(null);
  const { showClearances } = useBunkieStore();

  if (!showClearances) return null;

  return (
    <mesh
      ref={meshRef}
      position={[
        component.position.x,
        component.position.y,
        component.position.z,
      ]}
    >
      <boxGeometry
        args={[
          component.dimensions.width,
          component.dimensions.height,
          component.dimensions.depth,
        ]}
      />
      <meshStandardMaterial
        color="#ef4444"
        transparent
        opacity={0.1}
        roughness={1}
      />
    </mesh>
  );
}
