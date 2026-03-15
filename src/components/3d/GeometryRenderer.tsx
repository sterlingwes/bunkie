/**
 * 3D Geometry Renderer
 *
 * Renders geometry primitives using React Three Fiber.
 * Consumes the unified primitives from geometry/primitives.ts
 */

import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, BufferAttribute } from "three";
import type {
  GeometryPrimitive,
  BoxPrimitive,
  TrapezoidPrimitive,
} from "../../geometry/primitives";
import { MATERIAL_COLORS } from "../../geometry/primitives";
import { useBunkieStore } from "../../store/useBunkieStore";
import { generateWallGeometry } from "../../geometry/wall-factory";

// =============================================================================
// MAIN RENDERER
// =============================================================================

interface GeometryRendererProps {
  primitives: GeometryPrimitive[];
}

export function GeometryRenderer({ primitives }: GeometryRendererProps) {
  return (
    <group>
      {primitives.map((primitive) => (
        <PrimitiveMesh key={primitive.id} primitive={primitive} />
      ))}
    </group>
  );
}

// =============================================================================
// INDIVIDUAL PRIMITIVE RENDERER
// =============================================================================

interface PrimitiveMeshProps {
  primitive: GeometryPrimitive;
}

function PrimitiveMesh({ primitive }: PrimitiveMeshProps) {
  const {
    selectedComponentId,
    hoveredComponentId,
    hoverComponent,
    selectComponent,
  } = useBunkieStore();

  const isSelected = selectedComponentId === primitive.id;
  const isHovered = hoveredComponentId === primitive.id;

  const colors = MATERIAL_COLORS[primitive.material];
  const color = isSelected
    ? colors.selected
    : isHovered
      ? colors.hover
      : colors.primary;

  const handlePointerOver = () => {
    hoverComponent(primitive.id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    hoverComponent(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = () => {
    selectComponent(isSelected ? null : primitive.id);
  };

  switch (primitive.type) {
    case "box":
      return (
        <BoxMesh
          primitive={primitive}
          color={color}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      );
    case "trapezoid":
      return (
        <TrapezoidMesh
          primitive={primitive}
          color={color}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      );
    case "plane":
      return (
        <PlaneMesh
          primitive={primitive}
          color={color}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      );
    default:
      return null;
  }
}

// =============================================================================
// SHAPE-SPECIFIC RENDERERS
// =============================================================================

interface BoxMeshProps {
  primitive: BoxPrimitive;
  color: string;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

function BoxMesh({ primitive, color, ...handlers }: BoxMeshProps) {
  const { position, dimensions, rotation } = primitive;

  return (
    <mesh
      position={position}
      rotation={rotation || [0, 0, 0]}
      onPointerOver={handlers.onPointerOver}
      onPointerOut={handlers.onPointerOut}
      onClick={handlers.onClick}
    >
      <boxGeometry args={dimensions} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

interface TrapezoidMeshProps {
  primitive: TrapezoidPrimitive;
  color: string;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

function TrapezoidMesh({ primitive, color, ...handlers }: TrapezoidMeshProps) {
  const geometry = useMemo(
    () => createTrapezoidGeometry(primitive),
    [primitive],
  );

  return (
    <mesh
      geometry={geometry}
      position={primitive.position}
      onPointerOver={handlers.onPointerOver}
      onPointerOut={handlers.onPointerOut}
      onClick={handlers.onClick}
    >
      <meshStandardMaterial color={color} side={2} />{" "}
      {/* side={2} = DoubleSide */}
    </mesh>
  );
}

function createTrapezoidGeometry(trap: TrapezoidPrimitive): BufferGeometry {
  const { width, depth, heightLeft, heightRight } = trap;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  // Vertices for a trapezoidal prism
  const vertices = new Float32Array([
    // Front face (Z = +halfDepth)
    -halfWidth,
    0,
    halfDepth, // 0: bottom-left
    halfWidth,
    0,
    halfDepth, // 1: bottom-right
    halfWidth,
    heightRight,
    halfDepth, // 2: top-right
    -halfWidth,
    heightLeft,
    halfDepth, // 3: top-left

    // Back face (Z = -halfDepth)
    -halfWidth,
    0,
    -halfDepth,
    halfWidth,
    0,
    -halfDepth,
    halfWidth,
    heightRight,
    -halfDepth,
    -halfWidth,
    heightLeft,
    -halfDepth,
  ]);

  // Indices for the faces
  const indices = [
    // Front
    0, 1, 2, 0, 2, 3,
    // Back
    5, 4, 7, 5, 7, 6,
    // Top (trapezoid)
    3, 2, 6, 3, 6, 7,
    // Bottom
    4, 5, 1, 4, 1, 0,
    // Left (trapezoid)
    4, 0, 3, 4, 3, 7,
    // Right (trapezoid)
    1, 5, 6, 1, 6, 2,
  ];

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
  geometry.computeVertexNormals();

  return geometry;
}

interface PlaneMeshProps {
  primitive: GeometryPrimitive & { type: "plane" };
  color: string;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

function PlaneMesh({ primitive, color, ...handlers }: PlaneMeshProps) {
  const { position, dimensions, rotation } = primitive;

  return (
    <mesh
      position={position}
      rotation={rotation || [0, 0, 0]}
      onPointerOver={handlers.onPointerOver}
      onPointerOut={handlers.onPointerOut}
      onClick={handlers.onClick}
    >
      <boxGeometry args={dimensions} />
      <meshStandardMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// =============================================================================
// WALL-SPECIFIC COMPONENT (convenience wrapper)
// =============================================================================

interface WallGeometryProps {
  wallId: "west" | "east" | "north" | "south";
}

export function WallGeometry3D({ wallId }: WallGeometryProps) {
  const geometry = useMemo(() => generateWallGeometry(wallId), [wallId]);
  const primitives = geometry.segments.map((s) => s.primitive);

  return <GeometryRenderer primitives={primitives} />;
}
