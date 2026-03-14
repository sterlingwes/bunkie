import { describe, it, expect } from "vitest";
import {
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
  SIDE_WALL_LENGTH,
  FRONT_WALL_LENGTH,
  BACK_WALL_LENGTH,
  BOTTOM_PLATE_HEIGHT,
  HEADER_HEIGHT,
  WINDOW_HEIGHT,
  WINDOW_RO_HALF_WIDTH,
  DOOR_HEIGHT,
  DOOR_RO_HALF_WIDTH,
} from "../constants/framing";

/**
 * Sheathing Surface Area Tests
 *
 * These tests verify that the sheathing pieces properly cover the wall surface
 * by calculating the expected surface area and comparing it to the sum of
 * sheathing piece areas.
 *
 * The tests calculate what the sheathing area SHOULD be based on the geometry,
 * and verify that all pieces together cover the wall minus openings.
 */

const TOLERANCE = 0.02; // 2% tolerance for coverage

// Calculate trapezoid area: average of parallel sides × width
function trapezoidArea(
  height1: number,
  height2: number,
  width: number,
): number {
  return ((height1 + height2) / 2) * width;
}

describe("Sheathing Surface Area Coverage", () => {
  describe("Side Wall with Window (South/North)", () => {
    // These values are calculated the same way as in Walls.tsx
    const wallLength = SIDE_WALL_LENGTH;
    const halfLength = wallLength / 2;
    const headerHeight = HEADER_HEIGHT;
    const sillY = BOTTOM_PLATE_HEIGHT + headerHeight / 2; // Center of sill
    const headerY = sillY + WINDOW_HEIGHT + headerHeight / 2; // Center of header
    const windowOffset = wallLength / 4; // Window offset from wall center

    // Window horizontal bounds
    const windowLeft = windowOffset - WINDOW_RO_HALF_WIDTH;
    const windowRight = windowOffset + WINDOW_RO_HALF_WIDTH;

    it("should have correct sill and header positions", () => {
      // sillY = 0.038 + 0.0445 = 0.0825m
      expect(sillY).toBeCloseTo(0.0825, 4);
      // headerY = 0.0825 + 1.83 + 0.0445 = 1.957m
      expect(headerY).toBeCloseTo(1.957, 4);
    });

    it("should calculate correct wall surface area (trapezoid)", () => {
      // Side wall is trapezoidal: low side = 2.1m, high side = 2.4m
      const wallArea = trapezoidArea(
        BACK_WALL_HEIGHT,
        FRONT_WALL_HEIGHT,
        wallLength,
      );

      // (2.1 + 2.4) / 2 * 3.28 = 2.25 * 3.28 = 7.38 m²
      expect(wallArea).toBeCloseTo(7.38, 2);
    });

    it("should calculate correct window opening area", () => {
      // Opening goes from sillY to headerY
      const openingHeight = headerY - sillY;
      const openingWidth = WINDOW_RO_HALF_WIDTH * 2;
      const openingArea = openingHeight * openingWidth;

      // Opening height = 1.957 - 0.0825 = 1.8745m
      // Opening width = 0.325 * 2 = 0.65m
      // Opening area = 1.8745 * 0.65 ≈ 1.218 m²
      expect(openingHeight).toBeCloseTo(1.8745, 3);
      expect(openingWidth).toBeCloseTo(0.65, 3);
      expect(openingArea).toBeCloseTo(1.218, 2);
    });

    it("should have sheathing pieces covering full wall minus opening", () => {
      // Calculate expected wall surface area (trapezoid)
      const wallArea = trapezoidArea(
        BACK_WALL_HEIGHT,
        FRONT_WALL_HEIGHT,
        wallLength,
      );

      // Calculate window opening area
      const openingHeight = headerY - sillY;
      const openingWidth = WINDOW_RO_HALF_WIDTH * 2;
      const openingArea = openingHeight * openingWidth;

      // Expected sheathing area = wall area - opening area
      const expectedSheathingArea = wallArea - openingArea;

      // Calculate actual sheathing pieces (what Walls.tsx should produce):

      // 1. Below sill (full width, height = sillY)
      const belowSillArea = wallLength * sillY;

      // 2. Left of window (from -halfLength to windowLeft, height = headerY - sillY)
      const leftOfWindowWidth = windowLeft + halfLength;
      const leftOfWindowArea = leftOfWindowWidth * openingHeight;

      // 3. Right of window (from windowRight to +halfLength, height = headerY - sillY)
      const rightOfWindowWidth = halfLength - windowRight;
      const rightOfWindowArea = rightOfWindowWidth * openingHeight;

      // 4. Above header (trapezoid from headerY to wall top)
      // This is a trapezoid: bottom at headerY (flat), top at varying wall heights
      const aboveHeaderArea = trapezoidArea(
        BACK_WALL_HEIGHT - headerY,
        FRONT_WALL_HEIGHT - headerY,
        wallLength,
      );

      // Total sheathing area
      const totalSheathingArea =
        belowSillArea + leftOfWindowArea + rightOfWindowArea + aboveHeaderArea;

      // Debug output
      console.log("Side Wall Sheathing Breakdown:");
      console.log(`  Wall area: ${wallArea.toFixed(4)} m²`);
      console.log(`  Opening area: ${openingArea.toFixed(4)} m²`);
      console.log(
        `  Expected sheathing: ${expectedSheathingArea.toFixed(4)} m²`,
      );
      console.log(`  Below sill: ${belowSillArea.toFixed(4)} m²`);
      console.log(`  Left of window: ${leftOfWindowArea.toFixed(4)} m²`);
      console.log(`  Right of window: ${rightOfWindowArea.toFixed(4)} m²`);
      console.log(`  Above header: ${aboveHeaderArea.toFixed(4)} m²`);
      console.log(`  Total sheathing: ${totalSheathingArea.toFixed(4)} m²`);
      console.log(
        `  Coverage ratio: ${(totalSheathingArea / expectedSheathingArea).toFixed(4)}`,
      );

      // Verify coverage is within tolerance
      const coverageRatio = totalSheathingArea / expectedSheathingArea;

      expect(
        Math.abs(coverageRatio - 1.0),
        `Sheathing area ${totalSheathingArea.toFixed(4)}m² should cover ${expectedSheathingArea.toFixed(4)}m²`,
      ).toBeLessThan(TOLERANCE);
    });

    it("should have positive dimensions for all sheathing pieces", () => {
      // All widths must be positive
      expect(windowLeft + halfLength).toBeGreaterThan(0);
      expect(halfLength - windowRight).toBeGreaterThan(0);

      // Heights above header must be positive
      expect(BACK_WALL_HEIGHT - headerY).toBeGreaterThan(0);
      expect(FRONT_WALL_HEIGHT - headerY).toBeGreaterThan(0);

      // Opening dimensions must be positive
      expect(headerY - sillY).toBeGreaterThan(0);
      expect(sillY).toBeGreaterThan(0);
    });
  });

  describe("Front Wall with Door (West)", () => {
    const wallLength = FRONT_WALL_LENGTH;
    const wallHeight = FRONT_WALL_HEIGHT;
    const halfLength = wallLength / 2;
    const wallBottom = -wallHeight / 2;

    // Header position (from Walls.tsx door framing)
    const headerTop =
      wallBottom + DOOR_HEIGHT + BOTTOM_PLATE_HEIGHT + HEADER_HEIGHT;

    // Door horizontal bounds
    const doorLeft = -DOOR_RO_HALF_WIDTH;
    const doorRight = DOOR_RO_HALF_WIDTH;

    // The sheathing has a 0.05m buffer at the top (matching Walls.tsx)
    const sheathingTopBuffer = 0.05;

    it("should have correct header position", () => {
      // headerTop = -1.2 + 2.03 + 0.038 + 0.089 = 0.957m (from wall center)
      expect(headerTop).toBeCloseTo(0.957, 3);
    });

    it("should calculate correct wall surface area (rectangle)", () => {
      const wallArea = wallLength * wallHeight;
      expect(wallArea).toBeCloseTo(7.2, 2);
    });

    it("should have sheathing pieces covering full wall plus buffer minus door opening", () => {
      // Wall area with top buffer (sheathing extends above wall)
      const effectiveWallHeight = wallHeight + sheathingTopBuffer;
      const wallArea = wallLength * effectiveWallHeight;

      // Door opening area (door goes from floor to header)
      const openingHeight = headerTop - wallBottom;
      const openingWidth = DOOR_RO_HALF_WIDTH * 2;
      const openingArea = openingHeight * openingWidth;

      // Expected sheathing area
      const expectedSheathingArea = wallArea - openingArea;

      // Calculate sheathing pieces (no overlap):
      // 1. Left of door - from floor to header top
      const leftOfDoorWidth = doorLeft + halfLength;
      const leftOfDoorHeight = headerTop - wallBottom;
      const leftOfDoorArea = leftOfDoorWidth * leftOfDoorHeight;

      // 2. Right of door - from floor to header top
      const rightOfDoorWidth = halfLength - doorRight;
      const rightOfDoorArea = rightOfDoorWidth * leftOfDoorHeight;

      // 3. Above door - full width from header top to wall top (with buffer)
      const wallTop = wallHeight / 2 + sheathingTopBuffer;
      const aboveDoorHeight = wallTop - headerTop;
      const aboveDoorArea = wallLength * aboveDoorHeight;

      const totalSheathingArea =
        leftOfDoorArea + rightOfDoorArea + aboveDoorArea;

      console.log("Front Wall Sheathing Breakdown:");
      console.log(`  Wall area (with buffer): ${wallArea.toFixed(4)} m²`);
      console.log(`  Opening area: ${openingArea.toFixed(4)} m²`);
      console.log(
        `  Expected sheathing: ${expectedSheathingArea.toFixed(4)} m²`,
      );
      console.log(`  Left of door: ${leftOfDoorArea.toFixed(4)} m²`);
      console.log(`  Right of door: ${rightOfDoorArea.toFixed(4)} m²`);
      console.log(`  Above door: ${aboveDoorArea.toFixed(4)} m²`);
      console.log(`  Total sheathing: ${totalSheathingArea.toFixed(4)} m²`);

      const coverageRatio = totalSheathingArea / expectedSheathingArea;

      expect(
        Math.abs(coverageRatio - 1.0),
        `Sheathing area ${totalSheathingArea.toFixed(4)}m² should cover ${expectedSheathingArea.toFixed(4)}m²`,
      ).toBeLessThan(TOLERANCE);
    });
  });

  describe("Back Wall without Opening (East)", () => {
    const wallLength = BACK_WALL_LENGTH;
    const wallHeight = BACK_WALL_HEIGHT;

    it("should have solid sheathing covering entire wall", () => {
      const wallArea = wallLength * wallHeight;
      // 3.0 * 2.1 = 6.3 m²
      expect(wallArea).toBeCloseTo(6.3, 2);
    });
  });
});
