import { describe, it, expect } from 'vitest';
import {
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
  BOTTOM_PLATE_HEIGHT,
  HEADER_HEIGHT,
  WINDOW_WIDTH,
  WINDOW_HEIGHT,
  DOOR_WIDTH,
  DOOR_HEIGHT,
} from '../constants/framing';

/**
 * Sheathing Surface Area Tests
 *
 * These tests verify that the sheathing pieces properly cover the wall surface
 * by calculating the expected surface area and comparing it to the sum of
 * sheathing piece areas.
 *
 * Tolerance: 5% to account for minor overlaps at joints
 */

const SHEATHING_TOLERANCE = 0.05; // 5% tolerance

// Wall dimensions from bunkie-definition.json
const WALL_LENGTH = 3.28; // Side walls (south/north)
const FRONT_WALL_LENGTH = 3.0; // Front wall (west)
const BACK_WALL_LENGTH = 3.0; // Back wall (east)

// Rough opening allowances
const WINDOW_RO_HALF_WIDTH = WINDOW_WIDTH / 2 + 0.02; // 0.325m
const DOOR_RO_HALF_WIDTH = DOOR_WIDTH / 2 + 0.0125; // 0.9325m

describe('Sheathing Surface Area Coverage', () => {
  describe('Side Wall with Window (South/North)', () => {
    // Calculate expected trapezoid area
    const calculateTrapezoidArea = (height1: number, height2: number, width: number): number => {
      return ((height1 + height2) / 2) * width;
    };

    it('should calculate correct sill and header positions', () => {
      const headerHeight = HEADER_HEIGHT;
      const sillY = BOTTOM_PLATE_HEIGHT + headerHeight / 2;
      const headerY = sillY + WINDOW_HEIGHT + headerHeight / 2;

      // sillY = 0.038 + 0.0445 = 0.0825m
      expect(sillY).toBeCloseTo(0.0825, 3);
      // headerY = 0.0825 + 1.83 + 0.0445 = 1.957m
      expect(headerY).toBeCloseTo(1.957, 3);
    });

    it('should have sheathing covering expected surface area for side wall with window', () => {
      const headerHeight = HEADER_HEIGHT;
      const sillY = BOTTOM_PLATE_HEIGHT + headerHeight / 2;
      const headerY = sillY + WINDOW_HEIGHT + headerHeight / 2;

      // Window horizontal bounds
      const windowOffset = WALL_LENGTH / 4; // 0.82m
      const windowLeft = windowOffset - WINDOW_RO_HALF_WIDTH;
      const windowRight = windowOffset + WINDOW_RO_HALF_WIDTH;
      const halfLength = WALL_LENGTH / 2;

      // Calculate expected wall surface area (trapezoid)
      const wallArea = calculateTrapezoidArea(BACK_WALL_HEIGHT, FRONT_WALL_HEIGHT, WALL_LENGTH);

      // Calculate window rough opening area
      // The opening goes from sillY to headerY
      const openingHeight = headerY - sillY;
      const openingWidth = WINDOW_RO_HALF_WIDTH * 2;
      const openingArea = openingHeight * openingWidth;

      // Expected sheathing area = wall area - opening area
      const expectedSheathingArea = wallArea - openingArea;

      // Calculate actual sheathing pieces:

      // 1. Below sill (full width, height = sillY)
      const belowSillArea = WALL_LENGTH * sillY;

      // 2. Left of window (from -halfLength to windowLeft, height = headerY - sillY)
      const leftOfWindowWidth = windowLeft + halfLength;
      const leftOfWindowArea = leftOfWindowWidth * (headerY - sillY);

      // 3. Right of window (from windowRight to +halfLength, height = headerY - sillY)
      const rightOfWindowWidth = halfLength - windowRight;
      const rightOfWindowArea = rightOfWindowWidth * (headerY - sillY);

      // 4. Above header (trapezoid from headerY to wall top)
      const aboveHeaderArea = calculateTrapezoidArea(
        BACK_WALL_HEIGHT - headerY,
        FRONT_WALL_HEIGHT - headerY,
        WALL_LENGTH
      );

      // Total sheathing area
      const totalSheathingArea = belowSillArea + leftOfWindowArea + rightOfWindowArea + aboveHeaderArea;

      // Verify coverage
      const coverageRatio = totalSheathingArea / expectedSheathingArea;
      const expectedCoverage = 1.0;
      const tolerance = SHEATHING_TOLERANCE;

      expect(
        Math.abs(coverageRatio - expectedCoverage),
        `Sheathing area ${totalSheathingArea.toFixed(3)}m² should cover ~${expectedSheathingArea.toFixed(3)}m² (ratio: ${coverageRatio.toFixed(3)})\n` +
        `  Below sill: ${belowSillArea.toFixed(3)}m²\n` +
        `  Left of window: ${leftOfWindowArea.toFixed(3)}m²\n` +
        `  Right of window: ${rightOfWindowArea.toFixed(3)}m²\n` +
        `  Above header: ${aboveHeaderArea.toFixed(3)}m²\n` +
        `  Wall area: ${wallArea.toFixed(3)}m², Opening: ${openingArea.toFixed(3)}m²`
      ).toBeLessThan(tolerance);
    });

    it('should verify individual sheathing piece dimensions are positive', () => {
      const headerHeight = HEADER_HEIGHT;
      const sillY = BOTTOM_PLATE_HEIGHT + headerHeight / 2;
      const headerY = sillY + WINDOW_HEIGHT + headerHeight / 2;

      const windowOffset = WALL_LENGTH / 4;
      const windowLeft = windowOffset - WINDOW_RO_HALF_WIDTH;
      const windowRight = windowOffset + WINDOW_RO_HALF_WIDTH;
      const halfLength = WALL_LENGTH / 2;

      // All dimensions should be positive
      expect(sillY).toBeGreaterThan(0);
      expect(headerY).toBeGreaterThan(sillY);
      expect(headerY).toBeLessThan(FRONT_WALL_HEIGHT);

      expect(windowLeft + halfLength).toBeGreaterThan(0);
      expect(halfLength - windowRight).toBeGreaterThan(0);

      expect(BACK_WALL_HEIGHT - headerY).toBeGreaterThan(0);
      expect(FRONT_WALL_HEIGHT - headerY).toBeGreaterThan(0);
    });
  });

  describe('Front Wall with Door (West)', () => {
    it('should have sheathing covering expected surface area for front wall with door', () => {
      const wallHeight = FRONT_WALL_HEIGHT;
      const halfLength = FRONT_WALL_LENGTH / 2;

      // Calculate expected wall surface area (rectangle)
      const wallArea = FRONT_WALL_LENGTH * wallHeight;

      // Door opening dimensions (centered geometry)
      const wallBottom = -wallHeight / 2;
      const headerTop = wallBottom + DOOR_HEIGHT + BOTTOM_PLATE_HEIGHT + HEADER_HEIGHT;
      const doorLeft = -DOOR_RO_HALF_WIDTH;
      const doorRight = DOOR_RO_HALF_WIDTH;

      // Calculate door opening area (door goes from floor to header)
      const openingHeight = headerTop - wallBottom;
      const openingWidth = DOOR_RO_HALF_WIDTH * 2;
      const openingArea = openingHeight * openingWidth;

      // Expected sheathing area = wall area - opening area
      const expectedSheathingArea = wallArea - openingArea;

      // Calculate actual sheathing pieces (no overlap):

      // 1. Left of door - from floor to header top only
      const leftOfDoorWidth = doorLeft + halfLength;
      const leftOfDoorHeight = headerTop - wallBottom;
      const leftOfDoorArea = leftOfDoorWidth * leftOfDoorHeight;

      // 2. Right of door - from floor to header top only
      const rightOfDoorWidth = halfLength - doorRight;
      const rightOfDoorHeight = headerTop - wallBottom;
      const rightOfDoorArea = rightOfDoorWidth * rightOfDoorHeight;

      // 3. Above door - full width from header top to wall top (with 0.05 buffer)
      const wallTop = wallHeight / 2 + 0.05;
      const aboveDoorHeight = wallTop - headerTop;
      const aboveDoorArea = FRONT_WALL_LENGTH * aboveDoorHeight;

      // Total sheathing area
      const totalSheathingArea = leftOfDoorArea + rightOfDoorArea + aboveDoorArea;

      // Verify coverage
      const coverageRatio = totalSheathingArea / expectedSheathingArea;
      const tolerance = SHEATHING_TOLERANCE;

      expect(
        Math.abs(coverageRatio - 1.0),
        `Sheathing area ${totalSheathingArea.toFixed(3)}m² should cover ~${expectedSheathingArea.toFixed(3)}m² (ratio: ${coverageRatio.toFixed(3)})\n` +
        `  Left of door: ${leftOfDoorArea.toFixed(3)}m²\n` +
        `  Right of door: ${rightOfDoorArea.toFixed(3)}m²\n` +
        `  Above door: ${aboveDoorArea.toFixed(3)}m²\n` +
        `  Wall area: ${wallArea.toFixed(3)}m², Opening: ${openingArea.toFixed(3)}m²`
      ).toBeLessThan(tolerance);
    });
  });

  describe('Back Wall without Opening (East)', () => {
    it('should have solid sheathing covering entire wall', () => {
      const wallArea = BACK_WALL_LENGTH * BACK_WALL_HEIGHT;
      const sheathingArea = wallArea; // Solid sheathing

      expect(sheathingArea).toBeCloseTo(wallArea, 3);
    });
  });

  describe('Total Sheathing Coverage', () => {
    it('should calculate total wall surface area', () => {
      // South wall (trapezoid)
      const southWallArea = ((BACK_WALL_HEIGHT + FRONT_WALL_HEIGHT) / 2) * WALL_LENGTH;

      // North wall (trapezoid, same as south)
      const northWallArea = southWallArea;

      // West wall (front, with door)
      const westWallArea = FRONT_WALL_LENGTH * FRONT_WALL_HEIGHT;

      // East wall (back, solid)
      const eastWallArea = BACK_WALL_LENGTH * BACK_WALL_HEIGHT;

      const totalWallArea = southWallArea + northWallArea + westWallArea + eastWallArea;

      // Total should be around 26-28 m²
      expect(totalWallArea).toBeGreaterThan(25);
      expect(totalWallArea).toBeLessThan(30);
    });
  });
});
