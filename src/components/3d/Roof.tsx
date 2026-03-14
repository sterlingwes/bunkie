import { useRef } from "react";
import { Group } from "three";
import type { Component } from "../../schemas/bunkie.schema";
import { useBunkieStore } from "../../store/useBunkieStore";
import {
  RAFTER_HEIGHT,
  RAFTER_THICKNESS,
  RAFTER_SPACING,
  RAFTER_END_OFFSET,
  ROOF_SHEATHING_THICKNESS,
  ROOF_SHINGLE_THICKNESS,
  ROOF_SLOPE,
  FASCIA_THICKNESS,
  FASCIA_HEIGHT_FRONT,
  FASCIA_HEIGHT_BACK,
  FASCIA_HEIGHT_SIDE,
} from "../../constants/framing";

interface RoofProps {
  component: Component;
}

export function Roof({ component }: RoofProps) {
  const groupRef = useRef<Group>(null);
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

  const roofWidth = component.dimensions.width;
  const roofDepth = component.dimensions.depth;
  const rafterCount = Math.floor(roofWidth / RAFTER_SPACING) + 1;

  const frameColor = isSelected ? "#60a5fa" : isHovered ? "#93c5fd" : "#c4a574";
  const sheathingColor = isSelected
    ? "#60a5fa"
    : isHovered
      ? "#93c5fd"
      : "#d4a574";
  const shingleColor = "#4a4a4a"; // Gray shingles

  return (
    <group
      ref={groupRef}
      position={[
        component.position.x,
        component.position.y,
        component.position.z,
      ]}
      rotation={[ROOF_SLOPE, 0, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Rafters - running front to back (along Z axis) */}
      {Array.from({ length: rafterCount }).map((_, i) => {
        const xPos = -roofWidth / 2 + RAFTER_END_OFFSET + i * RAFTER_SPACING;
        return (
          <mesh
            key={`rafter-${i}`}
            position={[
              xPos,
              -RAFTER_HEIGHT / 2 + ROOF_SHEATHING_THICKNESS / 2,
              0,
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry
              args={[
                RAFTER_THICKNESS,
                RAFTER_HEIGHT,
                roofDepth - RAFTER_END_OFFSET,
              ]}
            />
            <meshStandardMaterial color={frameColor} roughness={0.8} />
          </mesh>
        );
      })}

      {/* Roof sheathing */}
      <mesh
        position={[
          0,
          ROOF_SHEATHING_THICKNESS / 2 +
            RAFTER_HEIGHT / 2 -
            ROOF_SHEATHING_THICKNESS / 2,
          0,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[roofWidth, ROOF_SHEATHING_THICKNESS, roofDepth]} />
        <meshStandardMaterial color={sheathingColor} roughness={0.7} />
      </mesh>

      {/* Shingles */}
      <mesh
        position={[
          0,
          ROOF_SHEATHING_THICKNESS +
            ROOF_SHINGLE_THICKNESS / 2 +
            RAFTER_HEIGHT / 2 -
            ROOF_SHEATHING_THICKNESS / 2,
          0,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[roofWidth, ROOF_SHINGLE_THICKNESS, roofDepth]} />
        <meshStandardMaterial
          color={isSelected ? "#60a5fa" : shingleColor}
          roughness={0.9}
        />
      </mesh>

      {/* Front fascia (at LOW side now with positive slope, +Z) */}
      <mesh
        position={[
          0,
          -RAFTER_HEIGHT / 2 + ROOF_SHEATHING_THICKNESS,
          roofDepth / 2 - FASCIA_THICKNESS / 2,
        ]}
        castShadow
      >
        <boxGeometry
          args={[roofWidth, FASCIA_HEIGHT_FRONT, FASCIA_THICKNESS]}
        />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* Back fascia (at HIGH side now, -Z) */}
      <mesh
        position={[
          0,
          -RAFTER_HEIGHT / 2,
          -roofDepth / 2 + FASCIA_THICKNESS / 2,
        ]}
        castShadow
      >
        <boxGeometry args={[roofWidth, FASCIA_HEIGHT_BACK, FASCIA_THICKNESS]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* Rake boards (sides) */}
      <mesh
        position={[
          roofWidth / 2 - FASCIA_THICKNESS / 2,
          ROOF_SHEATHING_THICKNESS,
          0,
        ]}
        castShadow
      >
        <boxGeometry args={[FASCIA_THICKNESS, FASCIA_HEIGHT_SIDE, roofDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      <mesh
        position={[
          -roofWidth / 2 + FASCIA_THICKNESS / 2,
          ROOF_SHEATHING_THICKNESS,
          0,
        ]}
        castShadow
      >
        <boxGeometry args={[FASCIA_THICKNESS, FASCIA_HEIGHT_SIDE, roofDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
    </group>
  );
}
