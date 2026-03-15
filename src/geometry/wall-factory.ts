/**
 * Wall Segment Factory
 *
 * Generates renderable geometry primitives from wall configurations.
 * Single source of truth for wall framing - consumed by both 2D and 3D renderers.
 */

import type { GeometryPrimitive, MaterialCategory } from "./primitives";
import { createBox, createTrapezoid } from "./primitives";
import {
  getWallConfigs,
  getStudPositions,
  getOpeningFraming,
  type WallConfig,
} from "../utils/framing-calculator";
import {
  STUD_WIDTH,
  STUD_DEPTH,
  BOTTOM_PLATE_HEIGHT,
  TOP_PLATE_HEIGHT,
  PLATE_DEPTH,
  HEADER_HEIGHT,
  SILL_HEIGHT,
  SHEATHING_THICKNESS,
  SHEATHING_OFFSET,
} from "../constants/framing";

// =============================================================================
// TYPES
// =============================================================================

/** A segment is a primitive with additional metadata */
export interface WallSegment {
  /** The underlying geometry primitive */
  primitive: GeometryPrimitive;
  /** Human-readable label for the segment */
  label: string;
  /** OBC code reference if applicable */
  codeRef?: string;
}

/** Complete wall geometry for a single wall */
export interface WallGeometry {
  wallId: string;
  segments: WallSegment[];
  bounds: {
    width: number;
    height: number;
  };
}

// =============================================================================
// HELPER TO CREATE SEGMENTS
// =============================================================================

function makeSegment(
  primitive: GeometryPrimitive,
  label: string,
  codeRef?: string,
): WallSegment {
  return { primitive, label, codeRef };
}

// =============================================================================
// MAIN FACTORY FUNCTION
// =============================================================================

/**
 * Generate all geometry primitives for a wall.
 * This is the single source of truth for wall rendering.
 */
export function generateWallGeometry(
  wallId: "west" | "east" | "north" | "south",
): WallGeometry {
  const wallConfigs = getWallConfigs();
  const config = wallConfigs[wallId];

  const segments: WallSegment[] = [];
  const isRakeWall = wallId === "north" || wallId === "south";

  // 1. Bottom plate
  segments.push(...generateBottomPlate(config));

  // 2. Top plate(s)
  segments.push(...generateTopPlate(config));

  // 3. Studs (regular, king, jack)
  segments.push(...generateStuds(config));

  // 4. Opening framing (header, sill)
  segments.push(...generateOpeningFraming(config));

  // 5. Sheathing
  if (isRakeWall) {
    segments.push(...generateRakeSheathing(config));
  } else {
    segments.push(...generateFlatSheathing(config));
  }

  return {
    wallId,
    segments,
    bounds: {
      width: config.width,
      height: config.highHeight,
    },
  };
}

// =============================================================================
// SEGMENT GENERATORS
// =============================================================================

function generateBottomPlate(config: WallConfig): WallSegment[] {
  const zPos = getWallZPosition(config.id);

  return [
    makeSegment(
      createBox(
        `${config.id}-bottom-plate`,
        [0, BOTTOM_PLATE_HEIGHT / 2, zPos],
        [config.width, BOTTOM_PLATE_HEIGHT, PLATE_DEPTH],
        "framing",
        config.id,
      ),
      "Bottom Plate",
      "OBC 9.23.10.2",
    ),
  ];
}

function generateTopPlate(config: WallConfig): WallSegment[] {
  const isRakeWall = config.id === "north" || config.id === "south";
  const zPos = getWallZPosition(config.id);

  if (isRakeWall) {
    // For rake walls, top plate follows the roof slope
    const heightLeft =
      config.id === "south" ? config.lowHeight : config.highHeight;

    // Side walls have width along Z axis
    const widthAxis =
      config.id === "north" || config.id === "south" ? "z" : "x";

    return [
      makeSegment(
        createTrapezoid(
          `${config.id}-top-plate`,
          [0, heightLeft - TOP_PLATE_HEIGHT, zPos],
          config.width,
          PLATE_DEPTH,
          TOP_PLATE_HEIGHT,
          TOP_PLATE_HEIGHT,
          "framing",
          config.id,
          widthAxis,
        ),
        "Double Top Plate",
        "OBC 9.23.10.3",
      ),
    ];
  }

  // Flat wall - simple box
  return [
    makeSegment(
      createBox(
        `${config.id}-top-plate`,
        [0, config.lowHeight - TOP_PLATE_HEIGHT / 2, zPos],
        [config.width, TOP_PLATE_HEIGHT, PLATE_DEPTH],
        "framing",
        config.id,
      ),
      "Double Top Plate",
      "OBC 9.23.10.3",
    ),
  ];
}

function generateStuds(config: WallConfig): WallSegment[] {
  const segments: WallSegment[] = [];
  const studPositions = getStudPositions(config);
  const zPos = getWallZPosition(config.id);
  const isSideWall = config.id === "north" || config.id === "south";

  for (const stud of studPositions) {
    const studHeight =
      stud.type === "jack" && stud.jackHeight
        ? stud.jackHeight
        : stud.height - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT;

    const yCenter =
      stud.type === "jack" && stud.jackHeight
        ? BOTTOM_PLATE_HEIGHT + stud.jackHeight / 2
        : BOTTOM_PLATE_HEIGHT + studHeight / 2;

    const material: MaterialCategory = "framing";

    const label =
      stud.type === "king"
        ? "King Stud"
        : stud.type === "jack"
          ? "Jack Stud"
          : "Stud";

    // For side walls, studs run along Z axis; for front/back walls, along X axis
    const position: [number, number, number] = isSideWall
      ? [0, yCenter, stud.x] // Side wall: stud.x is Z position
      : [stud.x, yCenter, zPos]; // Front/back wall: stud.x is X position

    // For side walls, stud dimensions are [depth, height, width]; for front/back, [width, height, depth]
    const dimensions: [number, number, number] = isSideWall
      ? [STUD_DEPTH, studHeight, STUD_WIDTH]
      : [STUD_WIDTH, studHeight, STUD_DEPTH];

    segments.push(
      makeSegment(
        createBox(
          `${config.id}-stud-${stud.x.toFixed(3)}-${stud.type}`,
          position,
          dimensions,
          material,
          config.id,
        ),
        label,
        "OBC 9.23.6",
      ),
    );
  }

  return segments;
}

function generateOpeningFraming(config: WallConfig): WallSegment[] {
  const segments: WallSegment[] = [];
  const opening = getOpeningFraming(config);

  if (!opening) return segments;

  const zPos = getWallZPosition(config.id);

  // Header
  segments.push(
    makeSegment(
      createBox(
        `${config.id}-header`,
        [opening.centerX, opening.headerY, zPos],
        [opening.headerWidth, HEADER_HEIGHT, STUD_DEPTH],
        "framing",
        config.id,
      ),
      "Header",
      "OBC 9.23.10.7",
    ),
  );

  // Sill (windows only)
  if (config.opening?.type === "window") {
    segments.push(
      makeSegment(
        createBox(
          `${config.id}-sill`,
          [opening.centerX, opening.sillY, zPos],
          [opening.roughOpeningWidth + STUD_WIDTH, SILL_HEIGHT, STUD_DEPTH],
          "framing",
          config.id,
        ),
        "Sill",
        "OBC 9.23.10.8",
      ),
    );
  }

  return segments;
}

function generateFlatSheathing(config: WallConfig): WallSegment[] {
  const zPos = getWallZPosition(config.id) + SHEATHING_OFFSET;
  // Center sheathing at half wall height (covers from y=0 to y=lowHeight)
  const yCenter = config.lowHeight / 2;

  return [
    makeSegment(
      createBox(
        `${config.id}-sheathing`,
        [0, yCenter, zPos],
        [config.width, config.lowHeight, SHEATHING_THICKNESS],
        "sheathing",
        config.id,
      ),
      "Wall Sheathing",
      "OBC 9.23.13",
    ),
  ];
}

function generateRakeSheathing(config: WallConfig): WallSegment[] {
  const zPos = getWallZPosition(config.id) + SHEATHING_OFFSET;

  // Rake wall sheathing is trapezoidal
  const heightLeft =
    config.id === "south" ? config.lowHeight : config.highHeight;
  const heightRight =
    config.id === "south" ? config.highHeight : config.lowHeight;

  // Side walls (north/south) have their width along Z axis
  const widthAxis = config.id === "north" || config.id === "south" ? "z" : "x";

  return [
    makeSegment(
      createTrapezoid(
        `${config.id}-sheathing`,
        [0, 0, zPos],
        config.width,
        SHEATHING_THICKNESS,
        heightLeft,
        heightRight,
        "sheathing",
        config.id,
        widthAxis,
      ),
      "Wall Sheathing",
      "OBC 9.23.13",
    ),
  ];
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get Z position for wall based on its ID.
 * This determines where the wall sits in 3D space.
 */
function getWallZPosition(wallId: string): number {
  switch (wallId) {
    case "west":
      return 1.64; // Front wall at +Z
    case "east":
      return -1.64; // Back wall at -Z
    case "south":
      return 0; // Side wall at +X, centered on Z
    case "north":
      return 0; // Side wall at -X, centered on Z
    default:
      return 0;
  }
}

// =============================================================================
// BATCH GENERATION
// =============================================================================

/** Generate geometry for all walls */
export function generateAllWallGeometry(): Record<string, WallGeometry> {
  return {
    west: generateWallGeometry("west"),
    east: generateWallGeometry("east"),
    north: generateWallGeometry("north"),
    south: generateWallGeometry("south"),
  };
}

/** Get all segments for a specific view direction */
export function getSegmentsForView(
  view: "front" | "back" | "left" | "right",
): WallSegment[] {
  const wallMap: Record<string, "front" | "back" | "left" | "right"> = {
    west: "front",
    east: "back",
    north: "left",
    south: "right",
  };

  const targetWall = Object.entries(wallMap).find(([, v]) => v === view)?.[0];

  if (!targetWall) return [];

  const geometry = generateWallGeometry(
    targetWall as "west" | "east" | "north" | "south",
  );
  return geometry.segments;
}
