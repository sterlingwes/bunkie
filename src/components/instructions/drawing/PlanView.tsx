/**
 * PlanView
 *
 * Top-down 2D architectural drawing showing the bunkie floor plan.
 * Displays foundation piers, floor joists, wall positions, and openings.
 *
 * All dimensions come from constants/framing.ts
 */

import {
  SIDE_WALL_LENGTH,
  FRONT_WALL_LENGTH,
  PIER_RADIUS,
  JOIST_WIDTH,
  JOIST_SPACING,
  STUD_WIDTH,
  DOOR_WIDTH,
  WINDOW_WIDTH,
} from "../../../constants/framing";
import { DimensionLineSVG } from "./DimensionLine";
import { DRAWING_COLORS } from "../../../utils/drawing-utils";

export interface PlanViewProps {
  showPiers?: boolean;
  showJoists?: boolean;
  showWalls?: boolean;
  showDimensions?: boolean;
  scale?: number;
}

/**
 * Calculate pier positions for plan view
 * 6 piers in 2 rows of 3
 */
function getPierPositions() {
  const halfDepth = SIDE_WALL_LENGTH / 2;

  // Piers are positioned near corners and midpoints
  // Aligned with joist layout
  const xSpacing = FRONT_WALL_LENGTH / 2;

  return [
    // Back row (south, negative Z)
    { id: "pier-bl", cx: -xSpacing + 0.15, cy: -halfDepth + 0.15, label: "BL" },
    { id: "pier-ml", cx: 0, cy: -halfDepth + 0.15, label: "ML" },
    { id: "pier-br", cx: xSpacing - 0.15, cy: -halfDepth + 0.15, label: "BR" },
    // Front row (north, positive Z)
    { id: "pier-fl", cx: -xSpacing + 0.15, cy: halfDepth - 0.15, label: "FL" },
    { id: "pier-mr", cx: 0, cy: halfDepth - 0.15, label: "MR" },
    { id: "pier-fr", cx: xSpacing - 0.15, cy: halfDepth - 0.15, label: "FR" },
  ];
}

/**
 * Calculate floor joist positions
 * Joists run along Z axis (front to back), spaced at 16" OC
 */
function getJoistPositions() {
  const joists: { x: number; isRim: boolean }[] = [];
  const halfWidth = FRONT_WALL_LENGTH / 2;

  // Rim joists at edges
  joists.push({ x: -halfWidth + JOIST_WIDTH / 2, isRim: true });
  joists.push({ x: halfWidth - JOIST_WIDTH / 2, isRim: true });

  // Interior joists at 16" OC
  let x = -halfWidth + JOIST_SPACING;
  while (x < halfWidth - JOIST_WIDTH) {
    joists.push({ x, isRim: false });
    x += JOIST_SPACING;
  }

  return joists;
}

/**
 * Get wall rectangles for plan view
 */
function getWalls() {
  const halfWidth = FRONT_WALL_LENGTH / 2;
  const halfDepth = SIDE_WALL_LENGTH / 2;
  const wallThickness = STUD_WIDTH * 2 + 0.011 * 2; // 2x4 + sheathing both sides

  return {
    // West wall (front) - has door
    west: {
      x: -halfWidth,
      y: halfDepth - wallThickness,
      width: FRONT_WALL_LENGTH,
      height: wallThickness,
      hasOpening: "door",
      openingWidth: DOOR_WIDTH,
    },
    // East wall (back) - solid
    east: {
      x: -halfWidth,
      y: -halfDepth,
      width: FRONT_WALL_LENGTH,
      height: wallThickness,
      hasOpening: null,
    },
    // South wall - has window
    south: {
      x: halfWidth - wallThickness,
      y: -halfDepth,
      width: wallThickness,
      height: SIDE_WALL_LENGTH,
      hasOpening: "window",
      openingWidth: WINDOW_WIDTH,
    },
    // North wall - has window
    north: {
      x: -halfWidth,
      y: -halfDepth,
      width: wallThickness,
      height: SIDE_WALL_LENGTH,
      hasOpening: "window",
      openingWidth: WINDOW_WIDTH,
    },
  };
}

export function PlanView({
  showPiers = true,
  showJoists = true,
  showWalls = true,
  showDimensions = true,
  scale = 100, // 1m = 100px
}: PlanViewProps) {
  const halfWidth = FRONT_WALL_LENGTH / 2;
  const halfDepth = SIDE_WALL_LENGTH / 2;
  const wallThickness = STUD_WIDTH * 2 + 0.011 * 2;

  const piers = getPierPositions();
  const joists = getJoistPositions();
  const walls = getWalls();

  // ViewBox centered on floor plan
  const padding = 0.5; // 0.5m padding
  const viewBoxWidth = FRONT_WALL_LENGTH + padding * 2;
  const viewBoxHeight = SIDE_WALL_LENGTH + padding * 2;
  const viewBox = `${-viewBoxWidth / 2 * scale} ${-viewBoxHeight / 2 * scale} ${viewBoxWidth * scale} ${viewBoxHeight * scale}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      className="bg-white"
      style={{ maxHeight: "100%" }}
    >
      {/* Grid */}
      <defs>
        <pattern
          id="plan-grid"
          width={0.1 * scale}
          height={0.1 * scale}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${0.1 * scale} 0 L 0 0 0 ${0.1 * scale}`}
            fill="none"
            stroke={DRAWING_COLORS.grid}
            strokeWidth="0.3"
          />
        </pattern>
      </defs>
      <rect
        x={-viewBoxWidth / 2 * scale}
        y={-viewBoxHeight / 2 * scale}
        width={viewBoxWidth * scale}
        height={viewBoxHeight * scale}
        fill="url(#plan-grid)"
      />

      {/* Floor outline (subfloor) */}
      <rect
        x={(-halfWidth - 0.01) * scale}
        y={(-halfDepth - 0.01) * scale}
        width={(FRONT_WALL_LENGTH + 0.02) * scale}
        height={(SIDE_WALL_LENGTH + 0.02) * scale}
        fill="#FEF3C7"
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1"
      />

      {/* Floor joists */}
      {showJoists &&
        joists.map((joist, i) => (
          <rect
            key={`joist-${i}`}
            x={(joist.x - JOIST_WIDTH / 2) * scale}
            y={(-halfDepth + JOIST_WIDTH) * scale}
            width={JOIST_WIDTH * scale}
            height={(SIDE_WALL_LENGTH - JOIST_WIDTH * 2) * scale}
            fill={joist.isRim ? DRAWING_COLORS.joist : "#D1D5DB"}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
          />
        ))}

      {/* Foundation piers */}
      {showPiers &&
        piers.map((pier) => (
          <g key={pier.id}>
            <circle
              cx={pier.cx * scale}
              cy={pier.cy * scale}
              r={PIER_RADIUS * scale}
              fill={DRAWING_COLORS.pier}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />
            <text
              x={pier.cx * scale}
              y={pier.cy * scale + 4}
              textAnchor="middle"
              fontSize="8"
              fill="white"
              fontWeight="bold"
            >
              {pier.label}
            </text>
          </g>
        ))}

      {/* Walls */}
      {showWalls && (
        <g>
          {/* West wall (front) with door */}
          <rect
            x={walls.west.x * scale}
            y={walls.west.y * scale}
            width={walls.west.width * scale}
            height={walls.west.height * scale}
            fill={DRAWING_COLORS.fill}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          {/* Door opening */}
          <rect
            x={(-DOOR_WIDTH / 2 - 0.02) * scale}
            y={(halfDepth - wallThickness) * scale}
            width={(DOOR_WIDTH + 0.04) * scale}
            height={wallThickness * scale}
            fill="white"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
            strokeDasharray="3,2"
          />
          {/* Door swing arc */}
          <path
            d={`M 0 ${(halfDepth - wallThickness / 2) * scale} A ${0.6 * scale} ${0.6 * scale} 0 0 1 ${-0.6 * scale} ${(halfDepth - wallThickness / 2) * scale}`}
            fill="none"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {/* East wall (back) - solid */}
          <rect
            x={walls.east.x * scale}
            y={walls.east.y * scale}
            width={walls.east.width * scale}
            height={walls.east.height * scale}
            fill={DRAWING_COLORS.fill}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />

          {/* South wall with window */}
          <rect
            x={walls.south.x * scale}
            y={walls.south.y * scale}
            width={walls.south.width * scale}
            height={walls.south.height * scale}
            fill={DRAWING_COLORS.fill}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          {/* Window opening */}
          <rect
            x={(halfWidth - wallThickness) * scale}
            y={(-WINDOW_WIDTH / 2 - 0.02) * scale}
            width={wallThickness * scale}
            height={(WINDOW_WIDTH + 0.04) * scale}
            fill="white"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
            strokeDasharray="3,2"
          />

          {/* North wall with window */}
          <rect
            x={walls.north.x * scale}
            y={walls.north.y * scale}
            width={walls.north.width * scale}
            height={walls.north.height * scale}
            fill={DRAWING_COLORS.fill}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          {/* Window opening */}
          <rect
            x={(-halfWidth) * scale}
            y={(-WINDOW_WIDTH / 2 - 0.02) * scale}
            width={wallThickness * scale}
            height={(WINDOW_WIDTH + 0.04) * scale}
            fill="white"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
            strokeDasharray="3,2"
          />
        </g>
      )}

      {/* Dimension lines */}
      {showDimensions && (
        <g>
          {/* Width dimension (bottom) */}
          <DimensionLineSVG
            x1={-halfWidth * scale}
            y1={(halfDepth + 0.35) * scale}
            x2={halfWidth * scale}
            y2={(halfDepth + 0.35) * scale}
            label={`${(FRONT_WALL_LENGTH * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />

          {/* Depth dimension (right) */}
          <DimensionLineSVG
            x1={(halfWidth + 0.35) * scale}
            y1={-halfDepth * scale}
            x2={(halfWidth + 0.35) * scale}
            y2={halfDepth * scale}
            label={`${(SIDE_WALL_LENGTH * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />

          {/* Door width dimension */}
          <DimensionLineSVG
            x1={(-DOOR_WIDTH / 2) * scale}
            y1={(halfDepth + 0.2) * scale}
            x2={(DOOR_WIDTH / 2) * scale}
            y2={(halfDepth + 0.2) * scale}
            label={`${(DOOR_WIDTH * 1000).toFixed(0)}mm`}
            color="#9CA3AF"
          />

          {/* Total area label */}
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontSize="10"
            fill={DRAWING_COLORS.outline}
            fontWeight="bold"
          >
            {(FRONT_WALL_LENGTH * SIDE_WALL_LENGTH).toFixed(2)}m²
          </text>

          {/* Orientation labels */}
          <text
            x={0}
            y={(-halfDepth - 0.3) * scale}
            textAnchor="middle"
            fontSize="8"
            fill={DRAWING_COLORS.dimension}
          >
            East (Back)
          </text>
          <text
            x={0}
            y={(halfDepth + 0.55) * scale}
            textAnchor="middle"
            fontSize="8"
            fill={DRAWING_COLORS.dimension}
          >
            West (Front)
          </text>
          <text
            x={(-halfWidth - 0.25) * scale}
            y={4}
            textAnchor="middle"
            fontSize="8"
            fill={DRAWING_COLORS.dimension}
            transform={`rotate(-90 ${(-halfWidth - 0.25) * scale},4)`}
          >
            South
          </text>
          <text
            x={(halfWidth + 0.25) * scale}
            y={4}
            textAnchor="middle"
            fontSize="8"
            fill={DRAWING_COLORS.dimension}
            transform={`rotate(90 ${(halfWidth + 0.25) * scale},4)`}
          >
            North
          </text>
        </g>
      )}

      {/* Legend */}
      <g transform={`translate(${(-viewBoxWidth / 2 + 0.05) * scale}, ${(viewBoxHeight / 2 - 0.05) * scale})`}>
        <rect x="0" y="-50" width="70" height="50" fill="white" stroke={DRAWING_COLORS.outline} strokeWidth="0.5" rx="2" />
        <circle cx="10" cy="-40" r="5" fill={DRAWING_COLORS.pier} />
        <text x="20" y="-37" fontSize="6" fill={DRAWING_COLORS.outline}>Pier</text>
        <rect x="5" y="-28" width="10" height="4" fill="#D1D5DB" stroke={DRAWING_COLORS.outline} strokeWidth="0.3" />
        <text x="20" y="-24" fontSize="6" fill={DRAWING_COLORS.outline}>Joist</text>
        <rect x="5" y="-16" width="10" height="4" fill={DRAWING_COLORS.fill} stroke={DRAWING_COLORS.outline} strokeWidth="0.3" />
        <text x="20" y="-12" fontSize="6" fill={DRAWING_COLORS.outline}>Wall</text>
      </g>
    </svg>
  );
}

export default PlanView;
