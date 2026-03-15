/**
 * Geometry Primitives
 *
 * Abstract, renderer-agnostic geometry definitions.
 * Both 2D (SVG) and 3D (R3F) renderers consume these.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/** 3D point */
export type Point3 = [number, number, number];

/** 2D point for projected views */
export type Point2 = [number, number];

/** Axis-aligned bounding box */
export interface BBox {
  min: Point3;
  max: Point3;
}

// =============================================================================
// PRIMITIVE SHAPES
// =============================================================================

/** A rectangular box (stud, plate, header, etc.) */
export interface BoxPrimitive {
  type: "box";
  id: string;
  /** Center position */
  position: Point3;
  /** Dimensions: [width, height, depth] */
  dimensions: Point3;
  /** Euler rotation in radians (optional, default [0,0,0]) */
  rotation?: Point3;
  /** Material category for styling */
  material: MaterialCategory;
  /** Logical group (e.g., wall ID) */
  group: string;
}

/** A trapezoidal prism (rake wall sheathing, etc.) */
export interface TrapezoidPrimitive {
  type: "trapezoid";
  id: string;
  /** Base position (center of bottom face) */
  position: Point3;
  /** Width along the primary axis */
  width: number;
  /** Depth perpendicular to the primary axis */
  depth: number;
  /** Height at the start of the primary axis */
  heightLeft: number;
  /** Height at the end of the primary axis */
  heightRight: number;
  /** Which axis the width runs along */
  widthAxis: "x" | "z";
  /** Material category for styling */
  material: MaterialCategory;
  /** Logical group */
  group: string;
}

/** A flat rectangular surface (simplified sheathing, floor, etc.) */
export interface PlanePrimitive {
  type: "plane";
  id: string;
  position: Point3;
  dimensions: Point3; // width, height, depth (depth is thickness)
  rotation?: Point3;
  material: MaterialCategory;
  group: string;
}

/** Union of all primitives */
export type GeometryPrimitive =
  | BoxPrimitive
  | TrapezoidPrimitive
  | PlanePrimitive;

// =============================================================================
// MATERIALS & STYLING
// =============================================================================

export type MaterialCategory =
  | "framing" // Studs, plates, headers, sills
  | "sheathing" // OSB/plywood panels
  | "opening" // Window/door frames
  | "glass" // Window/door glass
  | "foundation" // Piers, concrete
  | "floor" // Joists, subfloor
  | "roof"; // Rafters, sheathing, shingles

/** Unified color palette - single source of truth for both 2D and 3D */
export const MATERIAL_COLORS: Record<
  MaterialCategory,
  {
    primary: string;
    hover: string;
    selected: string;
  }
> = {
  framing: {
    primary: "#9CA3AF", // gray-400 - matches legacy DRAWING_COLORS.stud
    hover: "#93c5fd",
    selected: "#60a5fa",
  },
  sheathing: {
    primary: "#FEF3C7", // light yellow/cream - wall background
    hover: "#93c5fd",
    selected: "#60a5fa",
  },
  opening: {
    primary: "#78716C", // stone-500 - matches legacy jack stud color
    hover: "#93c5fd",
    selected: "#60a5fa",
  },
  glass: {
    primary: "#87ceeb",
    hover: "#93c5fd",
    selected: "#60a5fa",
  },
  foundation: {
    primary: "#78716C", // stone-500
    hover: "#93c5fd",
    selected: "#60a5fa",
  },
  floor: {
    primary: "#A1A1AA", // zinc-400 - matches legacy joist color
    hover: "#93c5fd",
    selected: "#60a5fa",
  },
  roof: {
    primary: "#696969",
    hover: "#93c5fd",
    selected: "#60a5fa",
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Create a box primitive */
export function createBox(
  id: string,
  position: Point3,
  dimensions: Point3,
  material: MaterialCategory,
  group: string,
  rotation?: Point3,
): BoxPrimitive {
  return { type: "box", id, position, dimensions, rotation, material, group };
}

/** Create a trapezoid primitive */
export function createTrapezoid(
  id: string,
  position: Point3,
  width: number,
  depth: number,
  heightLeft: number,
  heightRight: number,
  material: MaterialCategory,
  group: string,
  widthAxis: "x" | "z" = "x",
): TrapezoidPrimitive {
  return {
    type: "trapezoid",
    id,
    position,
    width,
    depth,
    heightLeft,
    heightRight,
    widthAxis,
    material,
    group,
  };
}

/** Get bounding box for any primitive */
export function getBBox(primitive: GeometryPrimitive): BBox {
  switch (primitive.type) {
    case "box": {
      const [w, h, d] = primitive.dimensions;
      const [x, y, z] = primitive.position;
      return {
        min: [x - w / 2, y - h / 2, z - d / 2],
        max: [x + w / 2, y + h / 2, z + d / 2],
      };
    }
    case "trapezoid": {
      const { position, width, depth, heightLeft, heightRight, widthAxis } =
        primitive;
      const [x, y, z] = position;
      const maxHeight = Math.max(heightLeft, heightRight);

      if (widthAxis === "z") {
        // Width along Z axis
        return {
          min: [x - depth / 2, y, z - width / 2],
          max: [x + depth / 2, y + maxHeight, z + width / 2],
        };
      } else {
        // Width along X axis
        return {
          min: [x - width / 2, y, z - depth / 2],
          max: [x + width / 2, y + maxHeight, z + depth / 2],
        };
      }
    }
    case "plane": {
      const [w, h, d] = primitive.dimensions;
      const [x, y, z] = primitive.position;
      return {
        min: [x - w / 2, y - h / 2, z - d / 2],
        max: [x + w / 2, y + h / 2, z + d / 2],
      };
    }
  }
}
