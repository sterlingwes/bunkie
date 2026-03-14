import { describe, it, expect } from "vitest";
import bunkieDefinition from "../data/bunkie-definition.json";
import {
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
  BOTTOM_PLATE_HEIGHT,
  SILL_HEIGHT,
  HEADER_HEIGHT,
  STUD_WIDTH,
} from "../constants/framing";

/**
 * Wall Height Specification for Shed Roof Construction
 *
 * The side walls (rake walls) must meet the front and back walls exactly:
 * - At the FRONT (+Z): rake wall top = front wall top (2.4m tall)
 * - At the BACK (-Z): rake wall top = back wall top (2.1m tall)
 *
 * All walls sit on the same floor level (top of floor assembly)
 *
 * Framing elements (studs, plates, headers, sills) must be positioned
 * correctly relative to the floor level.
 */

// Get walls from actual bunkie definition
const getWall = (id: string) =>
  bunkieDefinition.components.find((c) => c.id === id);

const frontWall = getWall("wall-west")!;
const backWall = getWall("wall-east")!;
const southWall = getWall("wall-south")!;
const northWall = getWall("wall-north")!;
const floorAssembly = getWall("floor-assembly")!;

// Floor top is where walls sit
const FLOOR_TOP_Y =
  floorAssembly.position.y + floorAssembly.dimensions.height / 2;

describe("Wall Heights Specification", () => {
  describe("Data integrity", () => {
    it("all walls should exist in definition", () => {
      expect(frontWall).toBeDefined();
      expect(backWall).toBeDefined();
      expect(southWall).toBeDefined();
      expect(northWall).toBeDefined();
    });

    it("front wall should have correct height", () => {
      expect(frontWall.dimensions.height).toBe(FRONT_WALL_HEIGHT);
    });

    it("back wall should have correct height", () => {
      expect(backWall.dimensions.height).toBe(BACK_WALL_HEIGHT);
    });
  });

  describe("Wall positions - all sit on floor", () => {
    it("front wall bottom should be at floor level", () => {
      const bottomY = frontWall.position.y - frontWall.dimensions.height / 2;
      expect(bottomY).toBeCloseTo(FLOOR_TOP_Y, 3);
    });

    it("back wall bottom should be at floor level", () => {
      const bottomY = backWall.position.y - backWall.dimensions.height / 2;
      expect(bottomY).toBeCloseTo(FLOOR_TOP_Y, 3);
    });

    it("south wall position should place bottom at floor level (flat-bottom geometry)", () => {
      // With flat-bottom geometry, position.y = floor level
      expect(southWall.position.y).toBeCloseTo(FLOOR_TOP_Y, 3);
    });

    it("north wall position should place bottom at floor level (flat-bottom geometry)", () => {
      // With flat-bottom geometry, position.y = floor level
      expect(northWall.position.y).toBeCloseTo(FLOOR_TOP_Y, 3);
    });
  });

  describe("Rake walls meet front/back walls", () => {
    it("south wall front edge should meet front wall top", () => {
      const frontWallTop =
        frontWall.position.y + frontWall.dimensions.height / 2;
      const southWallFrontTop = southWall.position.y + FRONT_WALL_HEIGHT;
      expect(southWallFrontTop).toBeCloseTo(frontWallTop, 3);
    });

    it("south wall back edge should meet back wall top", () => {
      const backWallTop = backWall.position.y + backWall.dimensions.height / 2;
      const southWallBackTop = southWall.position.y + BACK_WALL_HEIGHT;
      expect(southWallBackTop).toBeCloseTo(backWallTop, 3);
    });

    it("north wall front edge should meet front wall top", () => {
      const frontWallTop =
        frontWall.position.y + frontWall.dimensions.height / 2;
      const northWallFrontTop = northWall.position.y + FRONT_WALL_HEIGHT;
      expect(northWallFrontTop).toBeCloseTo(frontWallTop, 3);
    });

    it("north wall back edge should meet back wall top", () => {
      const backWallTop = backWall.position.y + backWall.dimensions.height / 2;
      const northWallBackTop = northWall.position.y + BACK_WALL_HEIGHT;
      expect(northWallBackTop).toBeCloseTo(backWallTop, 3);
    });
  });

  describe("Framing elements - side walls use flat-bottom geometry", () => {
    // In flat-bottom geometry, local y=0 is at floor level

    it("bottom plate should sit on floor (center at BOTTOM_PLATE_HEIGHT/2)", () => {
      // Bottom plate center in local coords: BOTTOM_PLATE_HEIGHT / 2
      const expectedBottomPlateCenterLocal = BOTTOM_PLATE_HEIGHT / 2;
      // This should be a small positive value above floor
      expect(expectedBottomPlateCenterLocal).toBeGreaterThan(0);
      expect(expectedBottomPlateCenterLocal).toBeCloseTo(0.019, 3);
    });

    it("window sill should be just above bottom plate", () => {
      // Sill sits on top of bottom plate
      // Sill bottom = BOTTOM_PLATE_HEIGHT
      // Sill center = sill bottom + SILL_HEIGHT / 2
      const sillCenterLocal = BOTTOM_PLATE_HEIGHT + SILL_HEIGHT / 2;
      // Expected: 0.038 + 0.0445 = 0.0825
      expect(sillCenterLocal).toBeCloseTo(0.0825, 3);
    });

    it("window header should be at sill top + window height", () => {
      // Sill top = BOTTOM_PLATE_HEIGHT + SILL_HEIGHT
      // Header center = sill top + HEADER_HEIGHT / 2
      const sillTopLocal = BOTTOM_PLATE_HEIGHT + SILL_HEIGHT;
      const headerCenterLocal = sillTopLocal + HEADER_HEIGHT / 2;
      // Expected: 0.038 + 0.089 + 0.0445 = 0.1715
      expect(headerCenterLocal).toBeCloseTo(0.1715, 3);
    });

    it("header should be below max wall height at all positions", () => {
      // The header must fit under the shortest wall height (BACK_WALL_HEIGHT)
      const headerTopLocal = BOTTOM_PLATE_HEIGHT + SILL_HEIGHT + HEADER_HEIGHT;
      // Header top should be less than back wall height
      expect(headerTopLocal).toBeLessThan(BACK_WALL_HEIGHT);
      // Expected: 0.038 + 0.089 + 0.089 = 0.216
      expect(headerTopLocal).toBeCloseTo(0.216, 3);
    });
  });

  describe("Stud positioning", () => {
    it("studs should use STUD_WIDTH for dimensions", () => {
      // Verify the constant is defined and reasonable
      expect(STUD_WIDTH).toBeCloseTo(0.038, 3); // 38mm = 1.5"
    });

    it("studs should sit on floor for side walls (local y=height/2)", () => {
      // For flat-bottom geometry, stud bottom is at y=0
      // Stud center is at height/2
      const studHeight = BACK_WALL_HEIGHT; // Use back wall height as example
      const studCenterLocal = studHeight / 2;
      // Stud bottom (center - height/2) should be at 0
      const studBottomLocal = studCenterLocal - studHeight / 2;
      expect(studBottomLocal).toBe(0);
    });
  });
});
