/**
 * Drawing Utilities
 *
 * Utility functions for projecting 3D components to 2D drawings
 * for the architectural instruction manual.
 *
 * All dimensions come from constants/framing.ts - the single source of truth.
 */

import type {
  Dimensions3D,
  Position3D,
  DimensionLine2D,
} from "../schemas/bunkie.schema";
import {
  SIDE_WALL_LENGTH,
  FRONT_WALL_LENGTH,
  STUD_SPACING,
  JOIST_SPACING,
  STUD_WIDTH,
  JOIST_WIDTH,
  PIER_RADIUS,
} from "../constants/framing";

// =============================================================================
// SCALE CONVERSION
// =============================================================================

/**
 * Convert meters to pixels at a given scale
 * @param meters - measurement in meters
 * @param pixelsPerMeter - scale factor (e.g., 100 = 1m = 100px)
 */
export function metersToPixels(meters: number, pixelsPerMeter: number): number {
  return meters * pixelsPerMeter;
}

/**
 * Convert pixels to meters at a given scale
 */
export function pixelsToMeters(pixels: number, pixelsPerMeter: number): number {
  return pixels / pixelsPerMeter;
}

// =============================================================================
// PROJECTION FUNCTIONS
// =============================================================================

/**
 * Project a 3D component to a 2D plan view (top-down, X-Z plane)
 */
export function projectToPlan(component: {
  position: Position3D;
  dimensions: Dimensions3D;
}) {
  const { position, dimensions } = component;
  return {
    x: position.x,
    y: position.z, // Z becomes Y in 2D
    width: dimensions.width,
    height: dimensions.depth, // Depth becomes height in 2D
    // Bounding box corners
    left: position.x - dimensions.width / 2,
    right: position.x + dimensions.width / 2,
    top: position.z - dimensions.depth / 2,
    bottom: position.z + dimensions.depth / 2,
  };
}

/**
 * Project a 3D component to a 2D elevation view (X-Y or Z-Y plane)
 * @param direction - "front" (X-Y), "back" (X-Y mirrored), "side" (Z-Y)
 */
export function projectToElevation(
  component: {
    position: Position3D;
    dimensions: Dimensions3D;
  },
  direction: "front" | "back" | "side",
) {
  const { position, dimensions } = component;

  switch (direction) {
    case "front":
      // West elevation - view from front (west side looking east)
      return {
        x: position.x,
        y: position.y,
        width: dimensions.width,
        height: dimensions.height,
        left: position.x - dimensions.width / 2,
        right: position.x + dimensions.width / 2,
        bottom: position.y - dimensions.height / 2,
        top: position.y + dimensions.height / 2,
      };
    case "back":
      // East elevation - view from back (east side looking west, mirrored X)
      return {
        x: -position.x, // Mirror X
        y: position.y,
        width: dimensions.width,
        height: dimensions.height,
        left: -position.x - dimensions.width / 2,
        right: -position.x + dimensions.width / 2,
        bottom: position.y - dimensions.height / 2,
        top: position.y + dimensions.height / 2,
      };
    case "side":
      // South/North elevation - Z becomes X in 2D
      return {
        x: position.z,
        y: position.y,
        width: dimensions.depth,
        height: dimensions.height,
        left: position.z - dimensions.depth / 2,
        right: position.z + dimensions.depth / 2,
        bottom: position.y - dimensions.height / 2,
        top: position.y + dimensions.height / 2,
      };
  }
}

// =============================================================================
// DIMENSION LINE GENERATION
// =============================================================================

export interface BoundingBox2D {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Calculate dimension lines for a bounding box
 * @param bounds - 2D bounding box
 * @param offset - how far outside the bounds to place dimension lines
 */
export function calculateDimensionLines(
  bounds: BoundingBox2D,
  offset: number = 0.2,
): DimensionLine2D[] {
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;

  return [
    // Bottom dimension (width)
    {
      start: { x: bounds.left, y: bounds.bottom + offset },
      end: { x: bounds.right, y: bounds.bottom + offset },
      label: `${(width * 1000).toFixed(0)}mm`,
      offset,
    },
    // Left dimension (height)
    {
      start: { x: bounds.left - offset, y: bounds.top },
      end: { x: bounds.left - offset, y: bounds.bottom },
      label: `${(height * 1000).toFixed(0)}mm`,
      offset,
    },
  ];
}

// =============================================================================
// FOUNDATION DRAWING HELPERS
// =============================================================================

export interface PierLayout {
  id: string;
  cx: number; // center X in plan view
  cy: number; // center Y in plan view (Z in 3D)
  radius: number;
  label: string;
}

/**
 * Generate pier layout positions for plan view
 * Piers are arranged in 2 rows of 3
 */
export function generatePierLayout(): PierLayout[] {
  // Calculate pier positions based on floor dimensions
  const floorWidth = FRONT_WALL_LENGTH; // 3.0m (X axis)
  const floorDepth = SIDE_WALL_LENGTH; // 3.28m (Z axis)

  // 3 piers per side, evenly spaced
  const xPositions = [
    -floorWidth / 2 + 0.15, // Front left area
    0, // Center
    floorWidth / 2 - 0.15, // Front right area
  ];

  const zPositions = [
    -floorDepth / 2 + 0.15, // Back row
    floorDepth / 2 - 0.15, // Front row
  ];

  const labels = ["FL", "ML", "BL", "FR", "MR", "BR"];
  const piers: PierLayout[] = [];

  let labelIndex = 0;
  // Back row (negative Z)
  for (const x of xPositions) {
    piers.push({
      id: `pier-${labels[labelIndex].toLowerCase()}`,
      cx: x,
      cy: zPositions[0],
      radius: PIER_RADIUS,
      label: labels[labelIndex],
    });
    labelIndex++;
  }

  // Front row (positive Z)
  for (const x of xPositions) {
    piers.push({
      id: `pier-${labels[labelIndex].toLowerCase()}`,
      cx: x,
      cy: zPositions[1],
      radius: PIER_RADIUS,
      label: labels[labelIndex],
    });
    labelIndex++;
  }

  return piers;
}

// =============================================================================
// FLOOR FRAMING HELPERS
// =============================================================================

export interface JoistLayout {
  x: number; // center position
  length: number;
  thickness: number;
}

/**
 * Generate floor joist positions for plan view
 * Joists run along Z axis, spaced at 16" OC
 */
export function generateJoistLayout(): JoistLayout[] {
  const joists: JoistLayout[] = [];
  const floorWidth = FRONT_WALL_LENGTH;
  const floorDepth = SIDE_WALL_LENGTH;

  // Rim joists on edges
  joists.push({
    x: -floorWidth / 2,
    length: floorDepth,
    thickness: JOIST_WIDTH,
  });
  joists.push({
    x: floorWidth / 2,
    length: floorDepth,
    thickness: JOIST_WIDTH,
  });

  // Interior joists at 16" OC
  const startX = -floorWidth / 2 + JOIST_WIDTH;
  const endX = floorWidth / 2 - JOIST_WIDTH;

  for (let x = startX; x <= endX; x += JOIST_SPACING) {
    joists.push({
      x,
      length: floorDepth,
      thickness: JOIST_WIDTH,
    });
  }

  return joists;
}

// =============================================================================
// WALL FRAMING HELPERS
// =============================================================================

export interface StudLayout {
  x: number; // position along wall
  height: number;
  width: number;
  isKing?: boolean; // marks king studs at openings
}

/**
 * Generate wall stud positions for elevation view
 */
export function generateStudLayout(
  wallWidth: number,
  wallHeight: number,
  opening?: {
    centerX: number;
    width: number;
  },
): StudLayout[] {
  const studs: StudLayout[] = [];
  const startX = -wallWidth / 2;
  const endX = wallWidth / 2;

  for (let x = startX; x <= endX; x += STUD_SPACING) {
    // Check if this stud is at opening edge (king stud)
    let isKing = false;
    if (opening) {
      const openingLeft = opening.centerX - opening.width / 2;
      const openingRight = opening.centerX + opening.width / 2;
      isKing =
        Math.abs(x - openingLeft) < STUD_WIDTH ||
        Math.abs(x - openingRight) < STUD_WIDTH;
    }

    studs.push({
      x,
      height: wallHeight,
      width: STUD_WIDTH,
      isKing,
    });
  }

  return studs;
}

// =============================================================================
// DRAWING CONSTANTS
// =============================================================================

// Standard scale for drawings (1m = 200px at 100% zoom)
export const DEFAULT_SCALE = 200;

// Colors for drawings
export const DRAWING_COLORS = {
  outline: "#374151", // gray-700
  dimension: "#6B7280", // gray-500
  fill: "#E5E7EB", // gray-200
  highlight: "#3B82F6", // blue-500
  warning: "#EF4444", // red-500
  stud: "#9CA3AF", // gray-400
  joist: "#A1A1AA", // zinc-400
  pier: "#78716C", // stone-500
  grid: "#E5E7EB", // gray-200
} as const;
