import { describe, it, expect } from "vitest";
import {
  getStudPositions,
  getWallHeightAtPosition,
  getOpeningFraming,
  getPierPositions,
  getJoistPositions,
  getWallConfigs,
} from "../utils/framing-calculator";
import {
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
  SILL_HEIGHT,
  SIDE_WALL_LENGTH,
  FRONT_WALL_LENGTH,
  DOOR_HEIGHT,
  STUD_DEPTH,
  WINDOW_ROUGH_OPENING_WIDTH,
  DOOR_ROUGH_OPENING_WIDTH,
  STUD_WIDTH,
  BOTTOM_PLATE_HEIGHT,
} from "../constants/framing";

describe("framing-calculator", () => {
  describe("getWallConfigs", () => {
    it("should return configs for all four walls", () => {
      const configs = getWallConfigs();
      expect(configs.west).toBeDefined();
      expect(configs.east).toBeDefined();
      expect(configs.south).toBeDefined();
      expect(configs.north).toBeDefined();
    });

    it("should have correct dimensions for front wall", () => {
      const config = getWallConfigs().west;
      expect(config.width).toBe(FRONT_WALL_LENGTH);
      expect(config.lowHeight).toBe(FRONT_WALL_HEIGHT);
      expect(config.highHeight).toBe(FRONT_WALL_HEIGHT);
    });

    it("should have correct dimensions for back wall", () => {
      const config = getWallConfigs().east;
      expect(config.width).toBe(FRONT_WALL_LENGTH);
      expect(config.lowHeight).toBe(BACK_WALL_HEIGHT);
      expect(config.highHeight).toBe(BACK_WALL_HEIGHT);
    });

    it("should have correct dimensions for side walls", () => {
      const southConfig = getWallConfigs().south;
      expect(southConfig.width).toBe(SIDE_WALL_LENGTH);
      expect(southConfig.lowHeight).toBe(BACK_WALL_HEIGHT);
      expect(southConfig.highHeight).toBe(FRONT_WALL_HEIGHT);
    });
  });

  describe("getOpeningFraming", () => {
    it("should return null for walls without openings", () => {
      const config = getWallConfigs().east;
      const framing = getOpeningFraming(config);
      expect(framing).toBeNull();
    });

    it("should calculate door framing for west wall", () => {
      const config = getWallConfigs().west;
      const framing = getOpeningFraming(config);
      expect(framing).not.toBeNull();
      expect(framing?.centerX).toBe(0); // Centered
      expect(framing?.roughOpeningWidth).toBe(DOOR_ROUGH_OPENING_WIDTH);
      expect(framing?.roughOpeningHeight).toBe(DOOR_HEIGHT);
    });

    it("should calculate window framing for south wall", () => {
      const config = getWallConfigs().south;
      const framing = getOpeningFraming(config);
      expect(framing).not.toBeNull();
      expect(framing?.centerX).toBe(config.width / 4); // Front-quarter
      expect(framing?.roughOpeningWidth).toBe(WINDOW_ROUGH_OPENING_WIDTH);
    });

    it("should calculate window at front-quarter position for south wall", () => {
      const config = getWallConfigs().south;
      const framing = getOpeningFraming(config);
      expect(framing?.centerX).toBe(config.width / 4);
    });

    it("should calculate window at back-quarter position for north wall", () => {
      const config = getWallConfigs().north;
      const framing = getOpeningFraming(config);
      expect(framing?.centerX).toBe(-config.width / 4);
    });

    it("should calculate sill Y from bottom plate height", () => {
      const config = getWallConfigs().south;
      const framing = getOpeningFraming(config);
      // Sill sits just above bottom plate
      expect(framing?.sillY).toBeCloseTo(BOTTOM_PLATE_HEIGHT + SILL_HEIGHT / 2);
    });
  });

  describe("getWallHeightAtPosition", () => {
    it("should return constant height for front wall", () => {
      const config = getWallConfigs().west;
      const height1 = getWallHeightAtPosition(-0.5, config);
      const height2 = getWallHeightAtPosition(0.5, config);
      expect(height1).toBe(FRONT_WALL_HEIGHT);
      expect(height2).toBe(FRONT_WALL_HEIGHT);
    });

    it("should return constant height for back wall", () => {
      const config = getWallConfigs().east;
      const height1 = getWallHeightAtPosition(-0.5, config);
      const height2 = getWallHeightAtPosition(0.5, config);
      expect(height1).toBe(BACK_WALL_HEIGHT);
      expect(height2).toBe(BACK_WALL_HEIGHT);
    });

    it("should return varying height for south wall (rake)", () => {
      const config = getWallConfigs().south;
      const heightAtBack = getWallHeightAtPosition(-config.width / 2, config);
      const heightAtFront = getWallHeightAtPosition(config.width / 2, config);
      expect(heightAtBack).toBe(BACK_WALL_HEIGHT);
      expect(heightAtFront).toBe(FRONT_WALL_HEIGHT);
    });

    it("should return varying height for north wall (rake)", () => {
      const config = getWallConfigs().north;
      // For north wall (rotated +90°): local -X = world +Z = front (high), local +X = world -Z = back (low)
      // At x = -width/2: front (west) = high
      // At x = +width/2: back (east) = low
      const heightAtFront = getWallHeightAtPosition(-config.width / 2, config);
      const heightAtBack = getWallHeightAtPosition(config.width / 2, config);
      expect(heightAtFront).toBe(FRONT_WALL_HEIGHT);
      expect(heightAtBack).toBe(BACK_WALL_HEIGHT);
    });
  });

  describe("getStudPositions", () => {
    it("should calculate correct number of studs for west wall", () => {
      const config = getWallConfigs().west;
      const studs = getStudPositions(config);
      expect(studs.length).toBeGreaterThan(0);
    });

    it("should place king studs at opening edges", () => {
      const config = getWallConfigs().west; // Has door
      const studs = getStudPositions(config);
      const kingStuds = studs.filter((s) => s.type === "king");
      expect(kingStuds.length).toBe(2);
    });

    it("should include jack studs for doors", () => {
      const config = getWallConfigs().west; // Has door
      const studs = getStudPositions(config);
      const jackStuds = studs.filter((s) => s.type === "jack");
      expect(jackStuds.length).toBe(2);
      expect(jackStuds[0].jackHeight).toBeDefined();
      expect(jackStuds[0].jackHeight).toBe(DOOR_HEIGHT - STUD_DEPTH);
    });

    it("should not include jack studs for windows", () => {
      const config = getWallConfigs().south; // Has window
      const studs = getStudPositions(config);
      const jackStuds = studs.filter((s) => s.type === "jack");
      expect(jackStuds.length).toBe(0);
    });

    it("should have king studs for windows", () => {
      const config = getWallConfigs().south; // Has window
      const studs = getStudPositions(config);
      const kingStuds = studs.filter((s) => s.type === "king");
      expect(kingStuds.length).toBe(2);
    });

    it("should calculate correct stud heights for rake walls", () => {
      const config = getWallConfigs().south;
      const studs = getStudPositions(config);

      // Find regular studs near the edges (not king studs)
      const regularStuds = studs.filter((s) => s.type === "regular");
      const leftStud = regularStuds.find((s) => s.x < -config.width / 2 + 0.1);
      const rightStud = regularStuds.find((s) => s.x > config.width / 2 - 0.1);

      // South wall: left (back) is low, right (front) is high
      expect(leftStud?.height).toBeCloseTo(BACK_WALL_HEIGHT, 1);
      expect(rightStud?.height).toBeCloseTo(FRONT_WALL_HEIGHT, 1);
    });
  });

  describe("getPierPositions", () => {
    it("should calculate correct pier positions", () => {
      const piers = getPierPositions();
      expect(piers.length).toBe(6);
    });

    it("should include all pier labels", () => {
      const piers = getPierPositions();
      const labels = piers.map((p) => p.label);
      expect(labels).toContain("FL");
      expect(labels).toContain("ML");
      expect(labels).toContain("BL");
      expect(labels).toContain("FR");
      expect(labels).toContain("MR");
      expect(labels).toContain("BR");
    });

    it("should have correct row structure", () => {
      const piers = getPierPositions();
      const leftRow = piers.filter((p) => p.x < 0);
      const rightRow = piers.filter((p) => p.x > 0);
      expect(leftRow.length).toBe(3);
      expect(rightRow.length).toBe(3);
    });
  });

  describe("getJoistPositions", () => {
    it("should calculate correct joist positions", () => {
      const joists = getJoistPositions();
      expect(joists.length).toBeGreaterThan(0);
    });

    it("should have rim joists at edges", () => {
      const joists = getJoistPositions();
      const rimJoists = joists.filter((j) => j.isRim);
      expect(rimJoists.length).toBe(2);
    });

    it("should have interior joists", () => {
      const joists = getJoistPositions();
      const interiorJoists = joists.filter((j) => !j.isRim);
      expect(interiorJoists.length).toBeGreaterThan(0);
    });
  });

  describe("consistency checks", () => {
    it("should produce consistent window positions with 3D view", () => {
      // In 3D, windows are at ±wallLength/4
      const southConfig = getWallConfigs().south;
      const southFraming = getOpeningFraming(southConfig);
      expect(southFraming?.centerX).toBe(SIDE_WALL_LENGTH / 4);

      const northConfig = getWallConfigs().north;
      const northFraming = getOpeningFraming(northConfig);
      expect(northFraming?.centerX).toBe(-SIDE_WALL_LENGTH / 4);
    });

    it("should produce consistent king stud positions with 3D view", () => {
      // In 3D, king studs are at RO edge + half stud width
      const config = getWallConfigs().west;
      const studs = getStudPositions(config);
      const framing = getOpeningFraming(config);

      const kingStuds = studs.filter((s) => s.type === "king");
      const roHalfWidth = framing!.roughOpeningWidth / 2;

      const expectedLeftX = -roHalfWidth - STUD_WIDTH / 2;
      const expectedRightX = roHalfWidth + STUD_WIDTH / 2;

      expect(kingStuds[0].x).toBeCloseTo(expectedLeftX, 2);
      expect(kingStuds[1].x).toBeCloseTo(expectedRightX, 2);
    });
  });
});
