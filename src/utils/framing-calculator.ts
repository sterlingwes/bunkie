/**
 * Framing Calculator
 *
 * Shared utility module for all framing layout calculations.
 * Both 3D and 2D views consume this module to ensure consistency.
 *
 * Source of truth for logic: The 3D Walls.tsx implementation.
 */

import {
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
  FRONT_WALL_LENGTH,
  SIDE_WALL_LENGTH,
  STUD_WIDTH,
  STUD_DEPTH,
  STUD_HALF_WIDTH,
  STUD_SPACING,
  BOTTOM_PLATE_HEIGHT,
  HEADER_HEIGHT,
  SILL_HEIGHT,
  DOOR_HEIGHT,
  DOOR_ROUGH_OPENING_WIDTH,
  WINDOW_HEIGHT,
  WINDOW_ROUGH_OPENING_WIDTH,
  PIER_EDGE_OFFSET,
  JOIST_WIDTH,
  JOIST_SPACING,
  STUD_POSITION_TOLERANCE,
  KING_STUD_POSITION_TOLERANCE,
} from "../constants/framing";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Opening types - minimal config, positions derived from constants
 */
export interface WallOpening {
  type: "door" | "window";
  position: "center" | "front-quarter" | "back-quarter"; // Position along wall
}

/**
 * Complete framing element for an opening
 */
export interface OpeningFraming {
  centerX: number; // Center X position of the opening
  roughOpeningWidth: number; // RO width (actual + shim allowance)
  roughOpeningHeight: number; // RO height
  sillY: number; // Y position of sill center (windows only)
  headerY: number; // Y position of header center
  headerWidth: number; // Width of header (RO + king stud widths)
}

/**
 * Stud position with type information
 */
export interface StudPosition {
  x: number; // Center position
  height: number; // Full height (varies for rake walls)
  type: "regular" | "king" | "jack";
  jackHeight?: number; // For jack studs, the height of the short stud
}

/**
 * Pier position for plan view
 */
export interface PierPosition {
  id: string;
  x: number;
  z: number;
  label: string;
}

/**
 * Joist position for plan view
 */
export interface JoistPosition {
  x: number; // Center position
  isRim: boolean;
}

/**
 * Wall configuration - minimal, derived values calculated by functions
 */
export interface WallConfig {
  id: "west" | "east" | "north" | "south";
  width: number;
  lowHeight: number; // For rake walls, the lower height
  highHeight: number; // For rake walls, the higher height (same as lowHeight for non-rake)
  opening?: WallOpening; // Optional opening
}

// =============================================================================
// OPENING POSITION CALCULATION
// =============================================================================

/**
 * Converts semantic position to actual X coordinate
 */
function getOpeningCenterX(
  position: WallOpening["position"],
  wallWidth: number,
): number {
  switch (position) {
    case "center":
      return 0;
    case "front-quarter":
      return wallWidth / 4; // Towards front (west)
    case "back-quarter":
      return -wallWidth / 4; // Towards back (east)
  }
}

// =============================================================================
// OPENING FRAMING CALCULATION
// =============================================================================

/**
 * Calculates all framing details for an opening
 */
export function getOpeningFraming(
  wallConfig: WallConfig,
): OpeningFraming | null {
  const { opening, width } = wallConfig;
  if (!opening) return null;

  const centerX = getOpeningCenterX(opening.position, width);

  if (opening.type === "door") {
    const roughOpeningWidth = DOOR_ROUGH_OPENING_WIDTH;
    // Header sits on jack studs which sit on bottom plate
    const headerY = BOTTOM_PLATE_HEIGHT + DOOR_HEIGHT + HEADER_HEIGHT / 2;

    return {
      centerX,
      roughOpeningWidth,
      roughOpeningHeight: DOOR_HEIGHT,
      sillY: 0, // No sill for door
      headerY,
      headerWidth: roughOpeningWidth + STUD_WIDTH * 2,
    };
  } else {
    // Window - positioned just above bottom plate (like door, not at typical sill height)
    const roughOpeningWidth = WINDOW_ROUGH_OPENING_WIDTH;
    const sillY = BOTTOM_PLATE_HEIGHT + SILL_HEIGHT / 2; // Center of sill, just above bottom plate
    const headerY = BOTTOM_PLATE_HEIGHT + WINDOW_HEIGHT + HEADER_HEIGHT / 2;

    return {
      centerX,
      roughOpeningWidth,
      roughOpeningHeight: WINDOW_HEIGHT,
      sillY,
      headerY,
      headerWidth: roughOpeningWidth + STUD_WIDTH * 2,
    };
  }
}

// =============================================================================
// WALL HEIGHT CALCULATION (for rake walls)
// =============================================================================

/**
 * Calculates wall height at a given X position (for rake walls)
 */
export function getWallHeightAtPosition(
  xPosition: number,
  wallConfig: WallConfig,
): number {
  const { width, lowHeight, highHeight, id } = wallConfig;

  // Front (west) and back (east) walls have constant height
  if (id === "west" || id === "east") {
    return lowHeight; // or highHeight, they're the same for these walls
  }

  // Rake walls (north/south) have sloped top
  const t = (xPosition + width / 2) / width;

  if (id === "south") {
    // South wall: rises from back (low) to front (high)
    return lowHeight + t * (highHeight - lowHeight);
  } else {
    // North wall: falls from front (high) to back (low)
    return highHeight - t * (highHeight - lowHeight);
  }
}

// =============================================================================
// STUD POSITION CALCULATION
// =============================================================================

/**
 * Calculates all stud positions for a wall, including king and jack studs
 */
export function getStudPositions(wallConfig: WallConfig): StudPosition[] {
  const studs: StudPosition[] = [];
  const { width, opening } = wallConfig;
  const openingFraming = getOpeningFraming(wallConfig);

  // If there's an opening, add king studs first (they are NOT regular studs)
  if (openingFraming && opening) {
    const roLeft =
      openingFraming.centerX - openingFraming.roughOpeningWidth / 2;
    const roRight =
      openingFraming.centerX + openingFraming.roughOpeningWidth / 2;

    // King stud positions (centered at RO edge)
    const kingLeftX = roLeft - STUD_HALF_WIDTH;
    const kingRightX = roRight + STUD_HALF_WIDTH;

    const leftKingHeight = getWallHeightAtPosition(kingLeftX, wallConfig);
    const rightKingHeight = getWallHeightAtPosition(kingRightX, wallConfig);

    // Add king studs
    studs.push({ x: kingLeftX, height: leftKingHeight, type: "king" });
    studs.push({ x: kingRightX, height: rightKingHeight, type: "king" });

    // For doors, add jack studs (short studs that support the header)
    if (opening.type === "door") {
      studs.push({
        x: kingLeftX,
        height: leftKingHeight,
        type: "jack",
        jackHeight: DOOR_HEIGHT - STUD_DEPTH,
      });
      studs.push({
        x: kingRightX,
        height: rightKingHeight,
        type: "jack",
        jackHeight: DOOR_HEIGHT - STUD_DEPTH,
      });
    }
  }

  // Calculate regular stud positions
  const studCount = Math.floor(width / STUD_SPACING) + 1;

  for (let i = 0; i < studCount; i++) {
    const x = -width / 2 + STUD_DEPTH / 2 + i * STUD_SPACING;
    const height = getWallHeightAtPosition(x, wallConfig);

    // Check if stud falls within opening
    if (openingFraming) {
      const roLeft =
        openingFraming.centerX - openingFraming.roughOpeningWidth / 2;
      const roRight =
        openingFraming.centerX + openingFraming.roughOpeningWidth / 2;

      // Skip studs inside opening (use tolerance to avoid edge cases)
      if (
        x > roLeft + STUD_POSITION_TOLERANCE &&
        x < roRight - STUD_POSITION_TOLERANCE
      ) {
        continue;
      }

      // Also skip if this position is too close to a king stud position
      const kingLeftX = roLeft - STUD_HALF_WIDTH;
      const kingRightX = roRight + STUD_HALF_WIDTH;
      if (
        Math.abs(x - kingLeftX) < KING_STUD_POSITION_TOLERANCE ||
        Math.abs(x - kingRightX) < KING_STUD_POSITION_TOLERANCE
      ) {
        continue;
      }
    }

    studs.push({ x, height, type: "regular" });
  }

  return studs;
}

// =============================================================================
// PIER POSITION CALCULATION
// =============================================================================

/**
 * Calculates pier positions for plan view
 * 6 piers in 2 rows of 3
 */
export function getPierPositions(): PierPosition[] {
  const halfLength = FRONT_WALL_LENGTH / 2;
  const halfDepth = SIDE_WALL_LENGTH / 2;

  return [
    // Front row (West, +Z in 3D)
    {
      id: "pier-fl",
      x: -halfLength + PIER_EDGE_OFFSET,
      z: halfDepth - PIER_EDGE_OFFSET,
      label: "FL",
    },
    { id: "pier-ml", x: -halfLength + PIER_EDGE_OFFSET, z: 0, label: "ML" },
    {
      id: "pier-bl",
      x: -halfLength + PIER_EDGE_OFFSET,
      z: -halfDepth + PIER_EDGE_OFFSET,
      label: "BL",
    },
    // Back row (East, -Z in 3D)
    {
      id: "pier-fr",
      x: halfLength - PIER_EDGE_OFFSET,
      z: halfDepth - PIER_EDGE_OFFSET,
      label: "FR",
    },
    { id: "pier-mr", x: halfLength - PIER_EDGE_OFFSET, z: 0, label: "MR" },
    {
      id: "pier-br",
      x: halfLength - PIER_EDGE_OFFSET,
      z: -halfDepth + PIER_EDGE_OFFSET,
      label: "BR",
    },
  ];
}

// =============================================================================
// JOIST POSITION CALCULATION
// =============================================================================

/**
 * Calculates floor joist positions
 * Joists run along Z axis (West to East), spaced at 16" OC
 */
export function getJoistPositions(): JoistPosition[] {
  const joists: JoistPosition[] = [];
  const halfWidth = FRONT_WALL_LENGTH / 2;

  // Rim joists at edges
  joists.push({ x: -halfWidth + JOIST_WIDTH / 2, isRim: true });
  joists.push({ x: halfWidth - JOIST_WIDTH / 2, isRim: true });

  // Interior joists at spacing
  let x = -halfWidth + JOIST_SPACING;
  while (x < halfWidth - JOIST_WIDTH / 2) {
    joists.push({ x, isRim: false });
    x += JOIST_SPACING;
  }

  return joists;
}

// =============================================================================
// WALL CONFIGURATIONS
// =============================================================================

/**
 * Returns pre-built wall configurations for all four walls
 */
export function getWallConfigs(): Record<string, WallConfig> {
  return {
    west: {
      id: "west",
      width: FRONT_WALL_LENGTH,
      lowHeight: FRONT_WALL_HEIGHT,
      highHeight: FRONT_WALL_HEIGHT,
      opening: {
        type: "door",
        position: "center", // Door is centered
      },
    },
    east: {
      id: "east",
      width: FRONT_WALL_LENGTH,
      lowHeight: BACK_WALL_HEIGHT,
      highHeight: BACK_WALL_HEIGHT,
      // No opening
    },
    south: {
      id: "south",
      width: SIDE_WALL_LENGTH,
      lowHeight: BACK_WALL_HEIGHT,
      highHeight: FRONT_WALL_HEIGHT,
      opening: {
        type: "window",
        position: "front-quarter", // Window towards front
      },
    },
    north: {
      id: "north",
      width: SIDE_WALL_LENGTH,
      lowHeight: BACK_WALL_HEIGHT,
      highHeight: FRONT_WALL_HEIGHT,
      opening: {
        type: "window",
        position: "back-quarter", // Window towards back
      },
    },
  };
}
