/**
 * Geometry Comparison Tests
 *
 * Compares the new unified geometry renderer output.
 * Run with: npm test -- geometry-comparison
 */

import { describe, it, expect } from "vitest";
import { generateWallGeometry, getSegmentsForView } from "../wall-factory";
import { primitiveToSVG } from "../projection";

describe("Geometry Comparison", () => {
  describe("Front Wall (West)", () => {
    it("generates correct segment count", () => {
      const geometry = generateWallGeometry("west");

      console.log("\n=== FRONT WALL SEGMENTS ===");
      geometry.segments.forEach((s) => {
        console.log(`${s.label}: ${s.primitive.type}`);
      });

      // Should have plates, studs, header, sheathing
      expect(geometry.segments.some((s) => s.label === "Bottom Plate")).toBe(
        true,
      );
      expect(
        geometry.segments.some((s) => s.label === "Double Top Plate"),
      ).toBe(true);
      expect(
        geometry.segments.filter((s) => s.label === "Stud").length,
      ).toBeGreaterThan(0);
      expect(geometry.segments.some((s) => s.label === "Header")).toBe(true);
      expect(
        geometry.segments.some((s) => s.label.startsWith("Wall Sheathing")),
      ).toBe(true);
    });

    it("projects to SVG with correct dimensions", () => {
      const segments = getSegmentsForView("front");
      const bottomPlate = segments.find((s) => s.label === "Bottom Plate");
      const topPlate = segments.find((s) => s.label === "Double Top Plate");
      const sheathingSegments = segments.filter((s) =>
        s.label.startsWith("Wall Sheathing"),
      );

      // Get SVG data
      const plateSVG = primitiveToSVG(bottomPlate!.primitive, "front", 100);
      const sheathingSVG = primitiveToSVG(
        sheathingSegments[0]!.primitive,
        "front",
        100,
      );

      console.log("\n=== FRONT WALL SVG OUTPUT ===");
      console.log("Bottom plate:", plateSVG[0].props);
      console.log(
        "Top plate:",
        primitiveToSVG(topPlate!.primitive, "front", 100)[0].props,
      );
      console.log("Sheathing:", sheathingSVG[0].props);

      // Bottom plate should span full width (3m = 300px at scale 100)
      expect(plateSVG[0].props.width).toBe(300);
      expect(plateSVG[0].props.height).toBeCloseTo(3.8); // 38mm
    });
  });

  describe("Back Wall (East)", () => {
    it("has no openings", () => {
      const geometry = generateWallGeometry("east");

      // No header or sill
      expect(geometry.segments.some((s) => s.label === "Header")).toBe(false);
      expect(geometry.segments.some((s) => s.label === "Sill")).toBe(false);

      // But has studs and plates
      expect(
        geometry.segments.filter((s) => s.label === "Stud").length,
      ).toBeGreaterThan(0);
    });
  });

  describe("Side Wall (South)", () => {
    it("has split sheathing around window opening", () => {
      const geometry = generateWallGeometry("south");
      const sheathingSegments = geometry.segments.filter((s) =>
        s.label.startsWith("Wall Sheathing"),
      );

      // Should have multiple sheathing pieces (left, right, below, above)
      expect(sheathingSegments.length).toBeGreaterThanOrEqual(3);

      // Left and right pieces should be trapezoids (rake wall)
      const leftPiece = sheathingSegments.find((s) =>
        s.label.includes("left"),
      );
      expect(leftPiece).toBeDefined();
      expect(leftPiece!.primitive.type).toBe("trapezoid");

      if (leftPiece!.primitive.type === "trapezoid") {
        const trap = leftPiece!.primitive;
        console.log("\n=== SIDE WALL SHEATHING (LEFT) ===");
        console.log("Height left:", trap.heightLeft);
        console.log("Height right:", trap.heightRight);
        console.log("Width axis:", trap.widthAxis);

        // Width should be along Z for side walls
        expect(trap.widthAxis).toBe("z");
      }
    });

    it("has window opening framing", () => {
      const geometry = generateWallGeometry("south");

      expect(geometry.segments.some((s) => s.label === "Header")).toBe(true);
      expect(geometry.segments.some((s) => s.label === "Sill")).toBe(true);
    });

    it("projects studs correctly for side wall", () => {
      const segments = getSegmentsForView("right");
      const studs = segments.filter((s) => s.label === "Stud");

      console.log("\n=== SIDE WALL STUD POSITIONS ===");
      studs.forEach((s) => {
        if (s.primitive.type === "box") {
          console.log(
            `${s.label}: x=${s.primitive.position[0]}, z=${s.primitive.position[2]}`,
          );
          // All studs should be at x=0 (side wall center)
          expect(Math.abs(s.primitive.position[0])).toBeLessThan(0.1);
        }
      });

      // Get SVG output
      const firstStud = studs[0];
      const studSVG = primitiveToSVG(firstStud.primitive, "right", 100);

      console.log("\nFirst stud SVG:", studSVG[0].props);

      // Stud should be positioned along Z (projected to X in "right" view)
      expect(studSVG[0].type).toBe("rect");
      expect(typeof studSVG[0].props.x).toBe("number");
    });
  });

  describe("SVG Snapshots", () => {
    it("front wall SVG snapshot", () => {
      const segments = getSegmentsForView("front");
      const allSVG = segments.flatMap((s) =>
        primitiveToSVG(s.primitive, "front", 100),
      );

      const svgData = allSVG.map((data, i) => ({
        label: segments[i]?.label || "unknown",
        type: data.type,
        props: Object.fromEntries(
          Object.entries(data.props).filter(([k]) => !k.startsWith("data-")),
        ),
      }));

      console.log("\n=== FRONT WALL SVG SNAPSHOT ===");
      console.log(JSON.stringify(svgData, null, 2));

      expect(svgData).toMatchSnapshot();
    });

    it("side wall SVG snapshot", () => {
      const segments = getSegmentsForView("right");
      const allSVG = segments.flatMap((s) =>
        primitiveToSVG(s.primitive, "right", 100),
      );

      const svgData = allSVG.map((data, i) => ({
        label: segments[i]?.label || "unknown",
        type: data.type,
        props: Object.fromEntries(
          Object.entries(data.props).filter(([k]) => !k.startsWith("data-")),
        ),
      }));

      console.log("\n=== SIDE WALL SVG SNAPSHOT ===");
      console.log(JSON.stringify(svgData, null, 2));

      expect(svgData).toMatchSnapshot();
    });
  });
});
