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
// DRAWING CONSTANTS
// =============================================================================

// Colors for drawings
export const DRAWING_COLORS = {
  outline: "#374151", // gray-700
  dimension: "#6B7280", // gray-500
  fill: "#E5E7EB", // gray-200
  highlight: "#3B82F6", // blue-500
  warning: "#EF4444", // red-500
  stud: "#9CA3AF", // gray-400
  jack: "#78716C", // stone-500 - slightly darker for jack studs
  joist: "#A1A1AA", // zinc-400
  pier: "#78716C", // stone-500
  grid: "#E5E7EB", // gray-200
} as const;
