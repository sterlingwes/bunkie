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
  MaterialCategory,
} from "../../geometry/primitives";
import { MATERIAL_COLORS_3D } from "../../geometry/primitives";
import { useBunkieStore } from "../../store/useBunkieStore";

// =============================================================================
// MAIN RENDERER
// =============================================================================

interface GeometryRendererProps {
  primitives: GeometryPrimitive[];
  /** When set, all primitives use this ID for hover/select instead of their own */
  groupId?: string;
  /** Filter out primitives with these material categories */
  excludeMaterials?: MaterialCategory[];
}

export function GeometryRenderer({
  primitives,
  groupId,
  excludeMaterials,
}: GeometryRendererProps) {
  const filtered = excludeMaterials
    ? primitives.filter((p) => !excludeMaterials.includes(p.material))
    : primitives;

  return (
    <group>
      {filtered.map((primitive) => (
        <PrimitiveMesh
          key={primitive.id}
          primitive={primitive}
          groupId={groupId}
        />
      ))}
    </group>
  );
}

// =============================================================================
// INDIVIDUAL PRIMITIVE RENDERER
// =============================================================================

interface PrimitiveMeshProps {
  primitive: GeometryPrimitive;
  groupId?: string;
}

function PrimitiveMesh({ primitive, groupId }: PrimitiveMeshProps) {
  const {
    selectedComponentId,
    hoveredComponentId,
    hoverComponent,
    selectComponent,
  } = useBunkieStore();

  const interactionId = groupId ?? primitive.id;
  const isSelected = selectedComponentId === interactionId;
  const isHovered = hoveredComponentId === interactionId;

  const colors = MATERIAL_COLORS_3D[primitive.material];
  const color = isSelected
    ? colors.selected
    : isHovered
      ? colors.hover
      : colors.primary;

  const handlePointerOver = () => {
    hoverComponent(interactionId);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    hoverComponent(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = () => {
    selectComponent(isSelected ? null : interactionId);
  };

  switch (primitive.type) {
    case "box":
      return (
        <BoxMesh
          primitive={primitive}
          color={color}
          roughness={colors.roughness}
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
          roughness={colors.roughness}
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
          roughness={colors.roughness}
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
  roughness: number;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

function BoxMesh({ primitive, color, roughness, ...handlers }: BoxMeshProps) {
  const { position, dimensions, rotation } = primitive;

  return (
    <mesh
      position={position}
      rotation={rotation || [0, 0, 0]}
      castShadow
      receiveShadow
      onPointerOver={handlers.onPointerOver}
      onPointerOut={handlers.onPointerOut}
      onClick={handlers.onClick}
    >
      <boxGeometry args={dimensions} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

interface TrapezoidMeshProps {
  primitive: TrapezoidPrimitive;
  color: string;
  roughness: number;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

function TrapezoidMesh({
  primitive,
  color,
  roughness,
  ...handlers
}: TrapezoidMeshProps) {
  const geometry = useMemo(
    () => createTrapezoidGeometry(primitive),
    [primitive],
  );

  return (
    <mesh
      geometry={geometry}
      position={primitive.position}
      castShadow
      receiveShadow
      onPointerOver={handlers.onPointerOver}
      onPointerOut={handlers.onPointerOut}
      onClick={handlers.onClick}
    >
      <meshStandardMaterial color={color} roughness={roughness} side={2} />
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
  roughness: number;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

function PlaneMesh({
  primitive,
  color,
  roughness,
  ...handlers
}: PlaneMeshProps) {
  const { position, dimensions, rotation } = primitive;

  return (
    <mesh
      position={position}
      rotation={rotation || [0, 0, 0]}
      castShadow
      receiveShadow
      onPointerOver={handlers.onPointerOver}
      onPointerOut={handlers.onPointerOut}
      onClick={handlers.onClick}
    >
      <boxGeometry args={dimensions} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
