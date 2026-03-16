/**
 * Projection Utilities
 *
 * Converts 3D geometry to 2D coordinates for SVG rendering.
 * Centralizes all coordinate transformation logic.
 */

import type { Point3, Point2, GeometryPrimitive, BBox } from "./primitives";

// =============================================================================
// VIEW DIRECTIONS
// =============================================================================

export type ViewDirection =
  | "front" // Looking from +Z (west wall exterior)
  | "back" // Looking from -Z (east wall exterior)
  | "left" // Looking from +X (north wall exterior)
  | "right" // Looking from -X (south wall exterior)
  | "top"; // Plan view from above

// =============================================================================
// 3D TO 2D PROJECTION
// =============================================================================

/**
 * Project a 3D point to 2D based on view direction.
 * Returns [x, y] in SVG coordinate space.
 *
 * Note: SVG y-axis increases downward, so we flip Y for elevation views.
 */
export function projectPoint(point: Point3, view: ViewDirection): Point2 {
  const [x, y, z] = point;

  switch (view) {
    case "front":
      // Looking from +Z: X maps to SVG x, Y maps to SVG y (inverted)
      // Back wall needs X mirrored for external view
      return [x, y];

    case "back":
      // Looking from -Z: X is mirrored for external view
      return [-x, y];

    case "left":
      // Looking from +X (north): Z maps to SVG x, Y to SVG y
      return [z, y];

    case "right":
      // Looking from -X (south): Z maps to SVG x, inverted
      return [-z, y];

    case "top":
      // Plan view: X to SVG x, Z to SVG y (inverted so north is up)
      return [x, -z];
  }
}

/**
 * Project a bounding box to 2D, returning the visible rect.
 */
export function projectBBox(
  bbox: BBox,
  view: ViewDirection,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const [minX, minY] = projectPoint(bbox.min, view);
  const [maxX, maxY] = projectPoint(bbox.max, view);

  return {
    x: Math.min(minX, maxX),
    y: Math.min(minY, maxY),
    width: Math.abs(maxX - minX),
    height: Math.abs(maxY - minY),
  };
}

// =============================================================================
// PRIMITIVE PROJECTION (for SVG rendering)
// =============================================================================

/** SVG element data for rendering */
export interface SVGElementData {
  type: "rect" | "polygon" | "line";
  props: Record<string, number | string>;
  zOrder: number; // For sorting (back to front)
}

/**
 * Project a geometry primitive to SVG element data.
 * Returns data suitable for creating SVG elements.
 */
export function primitiveToSVG(
  primitive: GeometryPrimitive,
  view: ViewDirection,
  scale: number = 100, // pixels per meter
): SVGElementData[] {
  const elements: SVGElementData[] = [];

  switch (primitive.type) {
    case "box":
      return projectBoxToSVG(primitive, view, scale);

    case "trapezoid":
      return projectTrapezoidToSVG(primitive, view, scale);

    case "plane":
      return projectPlaneToSVG(primitive, view, scale);
  }

  return elements;
}

function projectBoxToSVG(
  box: GeometryPrimitive & { type: "box" },
  view: ViewDirection,
  scale: number,
): SVGElementData[] {
  // Sheathing renders behind framing (lower zOrder)
  const zOrder = box.material === "sheathing" ? 0 : box.position[1];

  // If the box has rotation, render as a polygon from projected corners
  if (
    box.rotation &&
    (box.rotation[0] !== 0 || box.rotation[1] !== 0 || box.rotation[2] !== 0)
  ) {
    const corners = getCorners(box);
    const projected = corners.map((c) => projectPoint(c, view));

    // Deduplicate near-identical projected points and sort by angle from centroid
    const unique = deduplicateProjected(projected);
    const cx = unique.reduce((s, p) => s + p[0], 0) / unique.length;
    const cy = unique.reduce((s, p) => s + p[1], 0) / unique.length;
    unique.sort(
      (a, b) =>
        Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx),
    );

    const points = unique
      .map((p) => `${p[0] * scale},${p[1] * scale}`)
      .join(" ");

    return [
      {
        type: "polygon",
        props: {
          points,
          "data-id": box.id,
          "data-material": box.material,
          "data-group": box.group,
        },
        zOrder,
      },
    ];
  }

  // Non-rotated box: simple rect from bounding box
  const [x, y, z] = box.position;
  const [w, h, d] = box.dimensions;
  const rect = projectBBox(
    {
      min: [x - w / 2, y - h / 2, z - d / 2],
      max: [x + w / 2, y + h / 2, z + d / 2],
    },
    view,
  );

  return [
    {
      type: "rect",
      props: {
        x: rect.x * scale,
        y: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
        "data-id": box.id,
        "data-material": box.material,
        "data-group": box.group,
      },
      zOrder,
    },
  ];
}

function projectTrapezoidToSVG(
  trap: GeometryPrimitive & { type: "trapezoid" },
  view: ViewDirection,
  scale: number,
): SVGElementData[] {
  // For elevation views, show trapezoid as a polygon
  if (view === "top") {
    // Plan view: just a rectangle
    const rect = projectBBox(
      {
        min: [
          trap.position[0] - trap.width / 2,
          0,
          trap.position[2] - trap.depth / 2,
        ],
        max: [
          trap.position[0] + trap.width / 2,
          0,
          trap.position[2] + trap.depth / 2,
        ],
      },
      view,
    );
    return [
      {
        type: "rect",
        props: {
          x: rect.x * scale,
          y: rect.y * scale,
          width: rect.width * scale,
          height: rect.height * scale,
          "data-id": trap.id,
          "data-material": trap.material,
        },
        zOrder: 0,
      },
    ];
  }

  // Elevation view: trapezoid shape
  const [cx, cy, cz] = trap.position;
  const halfWidth = trap.width / 2;

  // Define corners based on which axis the width runs along
  let corners: Point3[];

  if (trap.widthAxis === "x") {
    // Width along X axis (front/back walls viewed from front/back)
    corners = [
      [cx - halfWidth, cy, cz], // bottom-left
      [cx + halfWidth, cy, cz], // bottom-right
      [cx + halfWidth, cy + trap.heightRight, cz], // top-right
      [cx - halfWidth, cy + trap.heightLeft, cz], // top-left
    ];
  } else {
    // Width along Z axis (side walls viewed from left/right)
    corners = [
      [cx, cy, cz - halfWidth], // bottom-left (in view space)
      [cx, cy, cz + halfWidth], // bottom-right
      [cx, cy + trap.heightRight, cz + halfWidth], // top-right
      [cx, cy + trap.heightLeft, cz - halfWidth], // top-left
    ];
  }

  const projected = corners.map((c) => projectPoint(c, view));
  const points = projected
    .map((p) => `${p[0] * scale},${p[1] * scale}`)
    .join(" ");

  // Sheathing renders behind framing (lower zOrder)
  const zOrder = trap.material === "sheathing" ? 0 : trap.position[1];

  return [
    {
      type: "polygon",
      props: {
        points,
        "data-id": trap.id,
        "data-material": trap.material,
        "data-group": trap.group,
      },
      zOrder,
    },
  ];
}

function projectPlaneToSVG(
  plane: GeometryPrimitive & { type: "plane" },
  view: ViewDirection,
  scale: number,
): SVGElementData[] {
  // Planes render as rectangles in 2D
  const bbox = {
    min: [
      plane.position[0] - plane.dimensions[0] / 2,
      plane.position[1] - plane.dimensions[1] / 2,
      plane.position[2] - plane.dimensions[2] / 2,
    ] as Point3,
    max: [
      plane.position[0] + plane.dimensions[0] / 2,
      plane.position[1] + plane.dimensions[1] / 2,
      plane.position[2] + plane.dimensions[2] / 2,
    ] as Point3,
  };

  const rect = projectBBox(bbox, view);

  return [
    {
      type: "rect",
      props: {
        x: rect.x * scale,
        y: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
        "data-id": plane.id,
        "data-material": plane.material,
        "data-group": plane.group,
      },
      zOrder: plane.position[1],
    },
  ];
}

// =============================================================================
// VIEW TRANSFORM (for SVG viewBox)
// =============================================================================

/**
 * Calculate the SVG viewBox for a given set of primitives and view direction.
 */
export function calculateViewBox(
  primitives: GeometryPrimitive[],
  view: ViewDirection,
  scale: number = 100,
  padding: number = 60,
): string {
  if (primitives.length === 0) {
    return `${-padding} ${-padding} ${padding * 2} ${padding * 2}`;
  }

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (const p of primitives) {
    const bbox = getBBoxForView(p, view);
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  }

  return `${minX * scale - padding} ${minY * scale - padding} ${(maxX - minX) * scale + padding * 2} ${(maxY - minY) * scale + padding * 2}`;
}

function getBBoxForView(
  p: GeometryPrimitive,
  view: ViewDirection,
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  // Get all corners and project them
  const corners = getCorners(p);
  const projected = corners.map((c) => projectPoint(c, view));

  const xs = projected.map((c) => c[0]);
  const ys = projected.map((c) => c[1]);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/** Apply Euler rotation (XYZ order) to a point */
function applyRotation(point: Point3, rotation: Point3): Point3 {
  let [x, y, z] = point;
  const [rx, ry, rz] = rotation;

  if (rx !== 0) {
    const cos = Math.cos(rx),
      sin = Math.sin(rx);
    const y1 = y * cos - z * sin;
    const z1 = y * sin + z * cos;
    y = y1;
    z = z1;
  }
  if (ry !== 0) {
    const cos = Math.cos(ry),
      sin = Math.sin(ry);
    const x1 = x * cos + z * sin;
    const z1 = -x * sin + z * cos;
    x = x1;
    z = z1;
  }
  if (rz !== 0) {
    const cos = Math.cos(rz),
      sin = Math.sin(rz);
    const x1 = x * cos - y * sin;
    const y1 = x * sin + y * cos;
    x = x1;
    y = y1;
  }

  return [x, y, z];
}

/** Deduplicate projected 2D points that are within a small epsilon */
function deduplicateProjected(points: Point2[], epsilon = 0.001): Point2[] {
  const result: Point2[] = [];
  for (const p of points) {
    if (
      !result.some(
        (r) =>
          Math.abs(r[0] - p[0]) < epsilon && Math.abs(r[1] - p[1]) < epsilon,
      )
    ) {
      result.push(p);
    }
  }
  return result;
}

function getCorners(p: GeometryPrimitive): Point3[] {
  switch (p.type) {
    case "box": {
      const [x, y, z] = p.position;
      const [w, h, d] = p.dimensions;
      const offsets: Point3[] = [
        [-w / 2, -h / 2, -d / 2],
        [+w / 2, -h / 2, -d / 2],
        [-w / 2, +h / 2, -d / 2],
        [+w / 2, +h / 2, -d / 2],
        [-w / 2, -h / 2, +d / 2],
        [+w / 2, -h / 2, +d / 2],
        [-w / 2, +h / 2, +d / 2],
        [+w / 2, +h / 2, +d / 2],
      ];
      if (
        p.rotation &&
        (p.rotation[0] !== 0 || p.rotation[1] !== 0 || p.rotation[2] !== 0)
      ) {
        return offsets.map((o) => {
          const [ox, oy, oz] = applyRotation(o, p.rotation!);
          return [x + ox, y + oy, z + oz] as Point3;
        });
      }
      return offsets.map(([ox, oy, oz]) => [x + ox, y + oy, z + oz] as Point3);
    }
    case "trapezoid": {
      const [x, y, z] = p.position;
      if (p.widthAxis === "z") {
        // Width along Z axis (side walls)
        return [
          [x, y, z - p.width / 2],
          [x, y, z + p.width / 2],
          [x, y + p.heightLeft, z - p.width / 2],
          [x, y + p.heightRight, z + p.width / 2],
        ];
      } else {
        // Width along X axis (front/back walls)
        return [
          [x - p.width / 2, y, z],
          [x + p.width / 2, y, z],
          [x - p.width / 2, y + p.heightLeft, z],
          [x + p.width / 2, y + p.heightRight, z],
        ];
      }
    }
    case "plane": {
      const [x, y, z] = p.position;
      const [w, h] = p.dimensions;
      return [
        [x - w / 2, y - h / 2, z],
        [x + w / 2, y - h / 2, z],
        [x - w / 2, y + h / 2, z],
        [x + w / 2, y + h / 2, z],
      ];
    }
  }
}
