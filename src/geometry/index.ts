/**
 * Geometry Module
 *
 * Unified geometry system for 2D and 3D rendering.
 * Separates "what to draw" from "how to draw it".
 */

// Core primitives and types
export type {
  Point3,
  Point2,
  BBox,
  BoxPrimitive,
  TrapezoidPrimitive,
  PlanePrimitive,
  GeometryPrimitive,
  MaterialCategory,
} from "./primitives";

export {
  MATERIAL_COLORS,
  createBox,
  createTrapezoid,
  getBBox,
} from "./primitives";

// Projection utilities
export type { ViewDirection, SVGElementData } from "./projection";
export {
  projectPoint,
  projectBBox,
  primitiveToSVG,
  calculateViewBox,
} from "./projection";

// Wall geometry factory
export type { WallSegment, WallGeometry } from "./wall-factory";
export {
  generateWallGeometry,
  generateAllWallGeometry,
  getSegmentsForView,
} from "./wall-factory";
