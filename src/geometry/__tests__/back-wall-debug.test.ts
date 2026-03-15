/**
 * Debug test for back wall issue
 */

import { describe, it } from "vitest";
import { generateWallGeometry, getSegmentsForView } from "../wall-factory";
import { primitiveToSVG } from "../projection";

describe("Back Wall Debug", () => {
  it("shows what segments are generated for back wall", () => {
    const geometry = generateWallGeometry("east");

    console.log("\n=== BACK WALL (EAST) SEGMENTS ===");
    console.log("Total segments:", geometry.segments.length);

    geometry.segments.forEach((s) => {
      console.log(`\n${s.label}:`);
      console.log("  Type:", s.primitive.type);
      console.log("  Material:", s.primitive.material);
      if (s.primitive.type === "box") {
        console.log("  Position:", s.primitive.position);
        console.log("  Dimensions:", s.primitive.dimensions);
      }
    });

    // Should have studs
    const studs = geometry.segments.filter((s) => s.label.includes("Stud"));
    console.log("\n=== STUD COUNT ===");
    console.log("Studs:", studs.length);
  });

  it("shows what getSegmentsForView returns for back view", () => {
    const segments = getSegmentsForView("back");

    console.log("\n=== getSegmentsForView('back') ===");
    console.log("Total segments:", segments.length);

    segments.forEach((s) => {
      console.log(
        `- ${s.label} (${s.primitive.type}, ${s.primitive.material})`,
      );
    });

    // Should have studs
    const studs = segments.filter((s) => s.label.includes("Stud"));
    console.log("\nStuds found:", studs.length);
  });

  it("projects back wall studs to SVG", () => {
    const segments = getSegmentsForView("back");
    const studs = segments.filter((s) => s.label.includes("Stud"));

    console.log("\n=== BACK WALL STUD SVG OUTPUT ===");

    studs.slice(0, 3).forEach((stud) => {
      const svg = primitiveToSVG(stud.primitive, "back", 100);
      console.log(`\n${stud.label}:`);
      console.log("  SVG:", svg[0]);
    });
  });

  it("shows all SVG elements for back wall", () => {
    const segments = getSegmentsForView("back");

    console.log("\n=== ALL BACK WALL SVG ELEMENTS ===");

    segments.forEach((s) => {
      const svg = primitiveToSVG(s.primitive, "back", 100);
      svg.forEach((data) => {
        console.log(`\n${s.label}:`);
        console.log("  Type:", data.type);
        console.log("  Props:", JSON.stringify(data.props, null, 2));
      });
    });
  });
});
