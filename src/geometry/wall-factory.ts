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
  SIDE_WALL_LENGTH,
  WINDOW_HEIGHT,
  DOOR_HEIGHT,
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
  return generateWallGeometryInternal(wallId, false);
}

/**
 * Generate wall geometry in wall-local coordinates.
 * - All framing at Z=0, sheathing at Z=SHEATHING_OFFSET
 * - Side walls use width along local X axis (not Z)
 * - Suitable for 3D rendering with per-wall group transforms
 */
export function generateWallGeometryLocal(
  wallId: "west" | "east" | "north" | "south",
): WallGeometry {
  return generateWallGeometryInternal(wallId, true);
}

function generateWallGeometryInternal(
  wallId: "west" | "east" | "north" | "south",
  local: boolean,
): WallGeometry {
  const wallConfigs = getWallConfigs();
  const config = wallConfigs[wallId];

  const segments: WallSegment[] = [];
  const isRakeWall = wallId === "north" || wallId === "south";

  // 1. Bottom plate
  segments.push(...generateBottomPlate(config, local));

  // 2. Top plate(s)
  segments.push(...generateTopPlate(config, local));

  // 3. Studs (regular, king, jack)
  segments.push(...generateStuds(config, local));

  // 4. Opening framing (header, sill)
  segments.push(...generateOpeningFraming(config, local));

  // 5. Sheathing
  if (isRakeWall) {
    segments.push(...generateRakeSheathing(config, local));
  } else {
    segments.push(...generateFlatSheathing(config, local));
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

function generateBottomPlate(config: WallConfig, local = false): WallSegment[] {
  const zPos = local ? 0 : getWallZPosition(config.id);

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

function generateTopPlate(config: WallConfig, local = false): WallSegment[] {
  const isRakeWall = config.id === "north" || config.id === "south";
  const zPos = local ? 0 : getWallZPosition(config.id);

  if (isRakeWall) {
    // Heights at each end of the wall (left = -halfWidth, right = +halfWidth in local X)
    const heightAtLeft =
      config.id === "south" ? config.lowHeight : config.highHeight;
    const heightAtRight =
      config.id === "south" ? config.highHeight : config.lowHeight;

    // Use a rotated box that follows the roof slope
    const heightDiff = heightAtRight - heightAtLeft;
    const slopeAngle = Math.atan2(heightDiff, config.width);
    const slopeLength = Math.sqrt(
      config.width * config.width + heightDiff * heightDiff,
    );
    const centerY = (heightAtLeft + heightAtRight) / 2 - TOP_PLATE_HEIGHT / 2;

    // In local coords, slope is along X; in world coords for side walls, along Z
    const rotation: [number, number, number] = local
      ? [0, 0, slopeAngle]
      : [slopeAngle, 0, 0];

    return [
      makeSegment(
        createBox(
          `${config.id}-top-plate`,
          [0, centerY, zPos],
          [
            local ? slopeLength : PLATE_DEPTH,
            TOP_PLATE_HEIGHT,
            local ? PLATE_DEPTH : slopeLength,
          ],
          "framing",
          config.id,
          rotation,
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

function generateStuds(config: WallConfig, local = false): WallSegment[] {
  const segments: WallSegment[] = [];
  const studPositions = getStudPositions(config);
  const zPos = local ? 0 : getWallZPosition(config.id);
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

    // In local coords, all walls use the same orientation: X=along wall, Z=depth
    // In world coords, side walls swap X↔Z
    const position: [number, number, number] =
      isSideWall && !local
        ? [0, yCenter, stud.x] // Side wall world coords: stud.x is Z position
        : [stud.x, yCenter, zPos]; // Local or front/back: stud.x is X position

    const dimensions: [number, number, number] =
      isSideWall && !local
        ? [STUD_DEPTH, studHeight, STUD_WIDTH] // Side wall world coords: swapped
        : [STUD_WIDTH, studHeight, STUD_DEPTH]; // Local or front/back: standard

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

function generateOpeningFraming(
  config: WallConfig,
  local = false,
): WallSegment[] {
  const segments: WallSegment[] = [];
  const opening = getOpeningFraming(config);

  if (!opening) return segments;

  const zPos = local ? 0 : getWallZPosition(config.id);

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
          [opening.roughOpeningWidth, SILL_HEIGHT, STUD_DEPTH],
          "framing",
          config.id,
        ),
        "Sill",
        "OBC 9.23.10.8",
      ),
    );
  }

  // Opening indicator (rough opening rectangle)
  const openingBottom =
    config.opening?.type === "door"
      ? BOTTOM_PLATE_HEIGHT
      : BOTTOM_PLATE_HEIGHT + SILL_HEIGHT;
  const openingHeight =
    config.opening?.type === "door" ? DOOR_HEIGHT : WINDOW_HEIGHT;
  segments.push(
    makeSegment(
      createBox(
        `${config.id}-opening`,
        [opening.centerX, openingBottom + openingHeight / 2, zPos],
        [opening.roughOpeningWidth, openingHeight, STUD_DEPTH],
        "opening",
        config.id,
      ),
      config.opening?.type === "door" ? "Door Opening" : "Window Opening",
    ),
  );

  return segments;
}

function generateFlatSheathing(
  config: WallConfig,
  local = false,
): WallSegment[] {
  const zPos = local
    ? SHEATHING_OFFSET
    : getWallZPosition(config.id) + SHEATHING_OFFSET;
  const opening = getOpeningFraming(config);

  // No opening — monolithic panel
  if (!opening) {
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

  const segments: WallSegment[] = [];
  const roLeft = opening.centerX - opening.roughOpeningWidth / 2;
  const roRight = opening.centerX + opening.roughOpeningWidth / 2;
  const halfWidth = config.width / 2;

  if (config.opening?.type === "door") {
    // Door: left of door, right of door, above door
    const doorTop = BOTTOM_PLATE_HEIGHT + DOOR_HEIGHT + HEADER_HEIGHT;

    // Left of door
    const leftWidth = roLeft + halfWidth;
    if (leftWidth > 0) {
      segments.push(
        makeSegment(
          createBox(
            `${config.id}-sheathing-left`,
            [-halfWidth + leftWidth / 2, config.lowHeight / 2, zPos],
            [leftWidth, config.lowHeight, SHEATHING_THICKNESS],
            "sheathing",
            config.id,
          ),
          "Wall Sheathing (left of door)",
          "OBC 9.23.13",
        ),
      );
    }

    // Right of door
    const rightWidth = halfWidth - roRight;
    if (rightWidth > 0) {
      segments.push(
        makeSegment(
          createBox(
            `${config.id}-sheathing-right`,
            [halfWidth - rightWidth / 2, config.lowHeight / 2, zPos],
            [rightWidth, config.lowHeight, SHEATHING_THICKNESS],
            "sheathing",
            config.id,
          ),
          "Wall Sheathing (right of door)",
          "OBC 9.23.13",
        ),
      );
    }

    // Above door
    const aboveHeight = config.lowHeight - doorTop;
    if (aboveHeight > 0) {
      segments.push(
        makeSegment(
          createBox(
            `${config.id}-sheathing-above`,
            [opening.centerX, doorTop + aboveHeight / 2, zPos],
            [opening.roughOpeningWidth, aboveHeight, SHEATHING_THICKNESS],
            "sheathing",
            config.id,
          ),
          "Wall Sheathing (above door)",
          "OBC 9.23.13",
        ),
      );
    }
  } else {
    // Window: left, right, below sill, above header
    const windowBottom = BOTTOM_PLATE_HEIGHT;
    const windowTop = BOTTOM_PLATE_HEIGHT + WINDOW_HEIGHT + HEADER_HEIGHT;

    // Left of window
    const leftWidth = roLeft + halfWidth;
    if (leftWidth > 0) {
      segments.push(
        makeSegment(
          createBox(
            `${config.id}-sheathing-left`,
            [-halfWidth + leftWidth / 2, config.lowHeight / 2, zPos],
            [leftWidth, config.lowHeight, SHEATHING_THICKNESS],
            "sheathing",
            config.id,
          ),
          "Wall Sheathing (left of window)",
          "OBC 9.23.13",
        ),
      );
    }

    // Right of window
    const rightWidth = halfWidth - roRight;
    if (rightWidth > 0) {
      segments.push(
        makeSegment(
          createBox(
            `${config.id}-sheathing-right`,
            [halfWidth - rightWidth / 2, config.lowHeight / 2, zPos],
            [rightWidth, config.lowHeight, SHEATHING_THICKNESS],
            "sheathing",
            config.id,
          ),
          "Wall Sheathing (right of window)",
          "OBC 9.23.13",
        ),
      );
    }

    // Below sill
    if (windowBottom > 0) {
      segments.push(
        makeSegment(
          createBox(
            `${config.id}-sheathing-below`,
            [opening.centerX, windowBottom / 2, zPos],
            [opening.roughOpeningWidth, windowBottom, SHEATHING_THICKNESS],
            "sheathing",
            config.id,
          ),
          "Wall Sheathing (below window)",
          "OBC 9.23.13",
        ),
      );
    }

    // Above header
    const aboveHeight = config.lowHeight - windowTop;
    if (aboveHeight > 0) {
      segments.push(
        makeSegment(
          createBox(
            `${config.id}-sheathing-above`,
            [opening.centerX, windowTop + aboveHeight / 2, zPos],
            [opening.roughOpeningWidth, aboveHeight, SHEATHING_THICKNESS],
            "sheathing",
            config.id,
          ),
          "Wall Sheathing (above window)",
          "OBC 9.23.13",
        ),
      );
    }
  }

  return segments;
}

function generateRakeSheathing(
  config: WallConfig,
  local = false,
): WallSegment[] {
  const zPos = local
    ? SHEATHING_OFFSET
    : getWallZPosition(config.id) + SHEATHING_OFFSET;
  const opening = getOpeningFraming(config);

  // In local coords, width always runs along X; in world coords, side walls use Z
  const widthAxis = local ? "x" : "z";

  const heightLeft =
    config.id === "south" ? config.lowHeight : config.highHeight;
  const heightRight =
    config.id === "south" ? config.highHeight : config.lowHeight;

  // No opening — monolithic trapezoid
  if (!opening) {
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

  // Window opening — split into 4 pieces: left, right, below sill, above header
  const segments: WallSegment[] = [];
  const halfWidth = config.width / 2;
  const roLeft = opening.centerX - opening.roughOpeningWidth / 2;
  const roRight = opening.centerX + opening.roughOpeningWidth / 2;
  const windowBottom = BOTTOM_PLATE_HEIGHT;
  const windowTop = BOTTOM_PLATE_HEIGHT + WINDOW_HEIGHT + HEADER_HEIGHT;

  // Helper: get height at a position along the wall (in wall-local coords where 0=center)
  const heightAt = (pos: number): number => {
    const t = (pos + halfWidth) / config.width;
    return heightLeft + t * (heightRight - heightLeft);
  };

  // Helper: build position for a sub-trapezoid centered at `centerLocal` (wall-local)
  const trapPos = (centerLocal: number, y: number): [number, number, number] =>
    widthAxis === "z" ? [0, y, zPos + centerLocal] : [centerLocal, y, zPos];

  // Left of window (trapezoid from wall start to roLeft)
  const leftWidth = roLeft + halfWidth;
  if (leftWidth > 0) {
    const leftCenter = (-halfWidth + roLeft) / 2;
    segments.push(
      makeSegment(
        createTrapezoid(
          `${config.id}-sheathing-left`,
          trapPos(leftCenter, 0),
          leftWidth,
          SHEATHING_THICKNESS,
          heightAt(-halfWidth),
          heightAt(roLeft),
          "sheathing",
          config.id,
          widthAxis,
        ),
        "Wall Sheathing (left of window)",
        "OBC 9.23.13",
      ),
    );
  }

  // Right of window (trapezoid from roRight to wall end)
  const rightWidth = halfWidth - roRight;
  if (rightWidth > 0) {
    const rightCenter = (roRight + halfWidth) / 2;
    segments.push(
      makeSegment(
        createTrapezoid(
          `${config.id}-sheathing-right`,
          trapPos(rightCenter, 0),
          rightWidth,
          SHEATHING_THICKNESS,
          heightAt(roRight),
          heightAt(halfWidth),
          "sheathing",
          config.id,
          widthAxis,
        ),
        "Wall Sheathing (right of window)",
        "OBC 9.23.13",
      ),
    );
  }

  // Below sill (box spanning the rough opening width)
  if (windowBottom > 0) {
    segments.push(
      makeSegment(
        createBox(
          `${config.id}-sheathing-below`,
          trapPos(opening.centerX, windowBottom / 2),
          widthAxis === "z"
            ? [SHEATHING_THICKNESS, windowBottom, opening.roughOpeningWidth]
            : [opening.roughOpeningWidth, windowBottom, SHEATHING_THICKNESS],
          "sheathing",
          config.id,
        ),
        "Wall Sheathing (below window)",
        "OBC 9.23.13",
      ),
    );
  }

  // Above header (trapezoid spanning the rough opening width)
  const hAboveLeft = heightAt(roLeft) - windowTop;
  const hAboveRight = heightAt(roRight) - windowTop;
  if (hAboveLeft > 0 || hAboveRight > 0) {
    segments.push(
      makeSegment(
        createTrapezoid(
          `${config.id}-sheathing-above`,
          trapPos(opening.centerX, windowTop),
          opening.roughOpeningWidth,
          SHEATHING_THICKNESS,
          Math.max(0, hAboveLeft),
          Math.max(0, hAboveRight),
          "sheathing",
          config.id,
          widthAxis,
        ),
        "Wall Sheathing (above window)",
        "OBC 9.23.13",
      ),
    );
  }

  return segments;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get Z position for wall based on its ID.
 * This determines where the wall sits in 3D space.
 */
function getWallZPosition(wallId: string): number {
  const halfDepth = SIDE_WALL_LENGTH / 2;
  switch (wallId) {
    case "west":
      return halfDepth; // Front wall at +Z
    case "east":
      return -halfDepth; // Back wall at -Z
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

/** Get all segments for a specific view direction, optionally overriding which wall to show */
export function getSegmentsForView(
  view: "front" | "back" | "left" | "right",
  wallId?: "west" | "east" | "north" | "south",
): WallSegment[] {
  const defaultWallMap: Record<string, "front" | "back" | "left" | "right"> = {
    west: "front",
    east: "back",
    north: "left",
    south: "right",
  };

  const targetWall =
    wallId ??
    (Object.entries(defaultWallMap).find(([, v]) => v === view)?.[0] as
      | "west"
      | "east"
      | "north"
      | "south"
      | undefined);

  if (!targetWall) return [];

  const geometry = generateWallGeometry(targetWall);
  return geometry.segments;
}
