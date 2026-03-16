/**
 * Geometry Snapshot Tests
 *
 * Tests that capture and verify the geometry output for debugging.
 * Run with: npm test -- geometry-snapshot
 */

import { describe, it, expect } from "vitest";
import {
  generateWallGeometry,
  generateAllWallGeometry,
  getSegmentsForView,
} from "../wall-factory";
import {
  primitiveToSVG,
  projectPoint,
  calculateViewBox,
  type ViewDirection,
} from "../projection";
import { getBBox } from "../primitives";

// =============================================================================
// WALL GEOMETRY GENERATION TESTS
// =============================================================================

describe("Wall Geometry Generation", () => {
  it("generates front wall (west) geometry", () => {
    const geometry = generateWallGeometry("west");

    console.log("\n=== FRONT WALL (WEST) ===");
    console.log("Bounds:", geometry.bounds);
    console.log("Segment count:", geometry.segments.length);

    geometry.segments.forEach((seg) => {
      const p = seg.primitive;
      console.log(`\n${seg.label} (${p.type}):`);
      console.log("  ID:", p.id);
      console.log("  Material:", p.material);

      if (p.type === "box") {
        console.log("  Position:", p.position);
        console.log("  Dimensions:", p.dimensions);
      } else if (p.type === "trapezoid") {
        console.log("  Position:", p.position);
        console.log("  Width:", p.width, "Depth:", p.depth);
        console.log("  Height L/R:", p.heightLeft, p.heightRight);
      }
    });

    expect(geometry.segments.length).toBeGreaterThan(0);
    expect(geometry.bounds.width).toBe(3.0);
  });

  it("generates side wall (south) geometry with split sheathing", () => {
    const geometry = generateWallGeometry("south");

    console.log("\n=== SIDE WALL (SOUTH) ===");
    console.log("Bounds:", geometry.bounds);
    console.log("Segment count:", geometry.segments.length);

    // Find sheathing pieces (split around window opening)
    const sheathingPieces = geometry.segments.filter((s) =>
      s.label.startsWith("Wall Sheathing"),
    );
    expect(sheathingPieces.length).toBeGreaterThanOrEqual(3);

    sheathingPieces.forEach((s) => {
      console.log(`\n${s.label} (${s.primitive.type}):`);
      if (s.primitive.type === "trapezoid") {
        console.log("  Height left:", s.primitive.heightLeft);
        console.log("  Height right:", s.primitive.heightRight);
      }
    });
  });

  it("generates all walls", () => {
    const all = generateAllWallGeometry();

    console.log("\n=== ALL WALLS ===");
    Object.entries(all).forEach(([wallId, geometry]) => {
      console.log(`${wallId}: ${geometry.segments.length} segments`);
    });

    expect(Object.keys(all)).toHaveLength(4);
  });
});

// =============================================================================
// PROJECTION TESTS
// =============================================================================

describe("3D to 2D Projection", () => {
  it("projects front wall segments to SVG", () => {
    const segments = getSegmentsForView("front");

    console.log("\n=== FRONT VIEW PROJECTION ===");
    console.log("Segments:", segments.length);

    segments.forEach((seg) => {
      const p = seg.primitive;
      const svgData = primitiveToSVG(p, "front", 100);

      console.log(`\n${seg.label}:`);
      console.log("  Primitive type:", p.type);

      if (p.type === "box") {
        // Show 3D position and 2D projection
        const projectedPos = projectPoint(p.position, "front");
        console.log("  3D position:", p.position);
        console.log("  2D projected:", projectedPos);
        console.log("  Dimensions:", p.dimensions);
      }

      svgData.forEach((data) => {
        console.log(
          "  SVG output:",
          data.type,
          JSON.stringify(data.props, null, 2),
        );
      });
    });

    expect(segments.length).toBeGreaterThan(0);
  });

  it("calculates view box for front view", () => {
    const segments = getSegmentsForView("front");
    const primitives = segments.map((s) => s.primitive);

    const viewBox = calculateViewBox(primitives, "front", 100, 60);
    console.log("\n=== FRONT VIEW BOX ===");
    console.log("ViewBox:", viewBox);

    expect(viewBox).toBeDefined();
  });

  it("shows coordinate mapping for key elements", () => {
    const segments = getSegmentsForView("front");

    console.log("\n=== COORDINATE MAPPING ===");

    // Find bottom plate
    const bottomPlate = segments.find((s) => s.label === "Bottom Plate");
    if (bottomPlate && bottomPlate.primitive.type === "box") {
      const p = bottomPlate.primitive;
      console.log("\nBottom Plate:");
      console.log("  3D center:", p.position);
      console.log("  3D dims:", p.dimensions);

      const bbox = getBBox(p);
      console.log("  BBox min:", bbox.min);
      console.log("  BBox max:", bbox.max);

      // Project corners
      const corners = [
        bbox.min,
        [bbox.max[0], bbox.min[1], bbox.min[2]],
        [bbox.min[0], bbox.max[1], bbox.max[2]],
        bbox.max,
      ];
      console.log(
        "  Projected corners:",
        corners.map((c) =>
          projectPoint(c as [number, number, number], "front"),
        ),
      );
    }

    // Find a stud
    const stud = segments.find((s) => s.label === "Stud");
    if (stud && stud.primitive.type === "box") {
      const p = stud.primitive;
      console.log("\nFirst Stud:");
      console.log("  3D center:", p.position);
      console.log("  3D dims:", p.dimensions);
    }
  });
});

// =============================================================================
// SVG OUTPUT SNAPSHOT
// =============================================================================

describe("SVG Output Snapshot", () => {
  it("generates SVG element data for front wall", () => {
    const segments = getSegmentsForView("front");
    const allSvgData: Array<{
      label: string;
      type: string;
      props: Record<string, number | string>;
    }> = [];

    segments.forEach((seg) => {
      const svgData = primitiveToSVG(seg.primitive, "front", 100);
      svgData.forEach((data) => {
        allSvgData.push({
          label: seg.label,
          type: data.type,
          props: data.props,
        });
      });
    });

    // Sort by zOrder for consistent output
    // (already done in renderer, but let's see the raw data)

    console.log("\n=== SVG OUTPUT FOR FRONT WALL ===");
    console.log(JSON.stringify(allSvgData, null, 2));

    // Snapshot the output
    expect(allSvgData).toMatchSnapshot("front-wall-svg-data");
  });

  it("generates SVG element data for side wall", () => {
    const segments = getSegmentsForView("right"); // South wall
    const allSvgData: Array<{
      label: string;
      type: string;
      props: Record<string, number | string>;
    }> = [];

    segments.forEach((seg) => {
      const svgData = primitiveToSVG(seg.primitive, "right", 100);
      svgData.forEach((data) => {
        allSvgData.push({
          label: seg.label,
          type: data.type,
          props: data.props,
        });
      });
    });

    console.log("\n=== SVG OUTPUT FOR SIDE WALL ===");
    console.log(JSON.stringify(allSvgData, null, 2));

    expect(allSvgData).toMatchSnapshot("side-wall-svg-data");
  });
});

// =============================================================================
// DEBUG: PROJECTION MAPPING
// =============================================================================

describe("Projection Mapping Debug", () => {
  it("shows how 3D coordinates map to 2D for each view", () => {
    // A point at the center of the south wall (right view)
    const southWallCenter: [number, number, number] = [1.5, 1.2, 0]; // X=1.5 (front of bunkie), Y=1.2m height, Z=0

    console.log("\n=== PROJECTION MAPPING ===");
    console.log("3D point:", southWallCenter);
    console.log("");

    const views: ViewDirection[] = ["front", "back", "left", "right", "top"];
    views.forEach((view) => {
      const projected = projectPoint(southWallCenter, view);
      console.log(
        `${view} view: [${projected[0].toFixed(2)}, ${projected[1].toFixed(2)}]`,
      );
    });

    // For south wall viewed from "right":
    // - We're looking from -X direction
    // - Z should become the horizontal (x) coordinate
    // - Y should stay as vertical (y) coordinate
    const rightView = projectPoint(southWallCenter, "right");
    console.log(
      "\nExpected for right view: Z=0 should map to x=0, Y=1.2 should stay y=1.2",
    );
    console.log("Actual:", rightView);
  });

  it("shows trapezoid corner projection for side wall", () => {
    // South wall sheathing trapezoid
    const trap = {
      position: [0, 0, 0.048] as [number, number, number],
      width: 3.28,
      heightLeft: 2.1,
      heightRight: 2.4,
    };

    console.log("\n=== TRAPEZOID CORNERS ===");
    console.log("Trapezoid position:", trap.position);
    console.log("Width:", trap.width);
    console.log("Heights L/R:", trap.heightLeft, trap.heightRight);

    // Corners as currently defined
    const corners: [number, number, number][] = [
      [trap.position[0] - trap.width / 2, trap.position[1], trap.position[2]],
      [trap.position[0] + trap.width / 2, trap.position[1], trap.position[2]],
      [
        trap.position[0] + trap.width / 2,
        trap.position[1] + trap.heightRight,
        trap.position[2],
      ],
      [
        trap.position[0] - trap.width / 2,
        trap.position[1] + trap.heightLeft,
        trap.position[2],
      ],
    ];

    console.log("\n3D corners:");
    corners.forEach((c, i) => console.log(`  ${i}: [${c.join(", ")}]`));

    console.log("\nProjected to 'right' view:");
    corners.forEach((c, i) => {
      const p = projectPoint(c, "right");
      console.log(`  ${i}: [${p[0].toFixed(2)}, ${p[1].toFixed(2)}]`);
    });

    // The issue: all X values are different, but for "right" view
    // we project X to... what?
    console.log("\n--- THE BUG ---");
    console.log("For 'right' view: projectPoint maps Z to x, Y to y");
    console.log("But trapezoid corners all have the SAME Z (0.048)!");
    console.log("The width should be along Z for side walls, not X.");
  });
});

// =============================================================================
// DEBUG: RAW SVG STRING
// =============================================================================

describe("Raw SVG String Generation", () => {
  it("generates a simple SVG string for front wall", () => {
    const segments = getSegmentsForView("front");
    const primitives = segments.map((s) => s.primitive);

    const viewBox = calculateViewBox(primitives, "front", 100, 60);

    let svgString = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">\n`;

    segments.forEach((seg) => {
      const svgData = primitiveToSVG(seg.primitive, "front", 100);

      svgData.forEach((data) => {
        const props = Object.entries(data.props)
          .filter(([key]) => !key.startsWith("data-"))
          .map(([key, val]) => `${key}="${val}"`)
          .join(" ");

        if (data.type === "rect") {
          svgString += `  <rect ${props} />\n`;
        } else if (data.type === "polygon") {
          svgString += `  <polygon ${props} />\n`;
        }
      });
    });

    svgString += "</svg>";

    console.log("\n=== GENERATED SVG ===");
    console.log(svgString);

    expect(svgString).toContain("<svg");
    expect(svgString).toContain("</svg>");
  });
});
