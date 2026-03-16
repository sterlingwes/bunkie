/**
 * PlanView
 *
 * Top-down 2D architectural drawing showing the bunkie floor plan.
 * Displays foundation piers, floor joists, wall positions, and openings.
 *
 * All dimensions come from constants/framing.ts
 *
 * IMPORTANT: The plan view follows standard architectural convention with North at TOP.
 * 3D Model coordinates: +Z = Front (West), -Z = Back (East), +X = South, -X = North
 * SVG coordinates (Y increases downward):
 * - SVG -Y direction (top) = North side of building = North wall (with window)
 * - SVG +Y direction (bottom) = South side of building = South wall (with window)
 * - SVG -X direction (left) = West side of building = Front wall (with door)
 * - SVG +X direction (right) = East side of building = Back wall (solid)
 *
 * Coordinate mapping (walls are hardcoded in plan-view space):
 * - SVG X range = FRONT_WALL_LENGTH (3.0m), SVG Y range = SIDE_WALL_LENGTH (3.28m)
 * - Pier/joist 3D coords map directly: SVG_x = 3D_x, SVG_y = 3D_z
 */

import {
  SIDE_WALL_LENGTH,
  FRONT_WALL_LENGTH,
  PIER_RADIUS,
  JOIST_WIDTH,
  STUD_WIDTH,
  DOOR_WIDTH,
  DOOR_SHIM_ALLOWANCE,
  WINDOW_WIDTH,
  WINDOW_SHIM_ALLOWANCE,
  SHEATHING_THICKNESS,
  SUBFLOOR_THICKNESS,
} from "../../../constants/framing";
import { DimensionLineSVG } from "./DimensionLine";
import { DRAWING_COLORS } from "../../../utils/drawing-utils";
import {
  UnitSystem,
  formatDimension,
  formatArea,
} from "../../../utils/unit-conversion";
import {
  getPierPositions,
  getJoistPositions,
} from "../../../utils/framing-calculator";

export interface PlanViewProps {
  showPiers?: boolean;
  showJoists?: boolean;
  showWalls?: boolean;
  showDimensions?: boolean;
  scale?: number;
  units?: UnitSystem;
}

/**
 * Get wall rectangles for plan view
 * Coordinate mapping: SVG_x = 3D_z, SVG_y = 3D_x
 * - West (3D +Z) -> SVG negative x (left)
 * - East (3D -Z) -> SVG positive x (right)
 * - North (3D -X) -> SVG negative y (top)
 * - South (3D +X) -> SVG positive y (bottom)
 */
function getWalls() {
  const halfNorthSouth = SIDE_WALL_LENGTH / 2; // SVG Y extent
  const halfWestEast = FRONT_WALL_LENGTH / 2; // SVG X extent
  const wallThickness = STUD_WIDTH * 2 + SHEATHING_THICKNESS * 2; // 2x4 + sheathing both sides

  return {
    // West wall (front) - has door - at SVG left (negative x)
    west: {
      x: -halfWestEast,
      y: -halfNorthSouth,
      width: wallThickness,
      height: SIDE_WALL_LENGTH,
      hasOpening: "door",
      openingWidth: DOOR_WIDTH,
    },
    // East wall (back) - solid - at SVG right (positive x)
    east: {
      x: halfWestEast - wallThickness,
      y: -halfNorthSouth,
      width: wallThickness,
      height: SIDE_WALL_LENGTH,
      hasOpening: null,
    },
    // South wall - has window - at SVG bottom (positive y)
    south: {
      x: -halfWestEast,
      y: halfNorthSouth - wallThickness,
      width: FRONT_WALL_LENGTH,
      height: wallThickness,
      hasOpening: "window",
      openingWidth: WINDOW_WIDTH,
    },
    // North wall - has window - at SVG top (negative y)
    north: {
      x: -halfWestEast,
      y: -halfNorthSouth,
      width: FRONT_WALL_LENGTH,
      height: wallThickness,
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
  units = "imperial",
}: PlanViewProps) {
  const halfNorthSouth = SIDE_WALL_LENGTH / 2; // SVG Y extent (North-South)
  const halfWestEast = FRONT_WALL_LENGTH / 2; // SVG X extent (West-East)
  const wallThickness = STUD_WIDTH * 2 + SHEATHING_THICKNESS * 2;

  // Get pier and joist positions from calculator
  // Note: Calculator returns 3D coordinates (x, z) which map directly to SVG (cx, cy)
  const piers3D = getPierPositions();
  const joists3D = getJoistPositions();

  // Transform 3D pier positions to SVG coordinates
  // 3D x maps to SVG x (across building width), 3D z maps to SVG y (along building depth)
  const piers = piers3D.map((p) => ({
    id: p.id,
    cx: p.x,
    cy: p.z,
    label: p.label,
  }));

  // Joists are already in the correct coordinate system
  const joists = joists3D;

  const walls = getWalls();

  // ViewBox centered on floor plan
  // Width = West-East extent, Height = North-South extent
  const padding = 0.5; // 0.5m padding
  const viewBoxWidth = FRONT_WALL_LENGTH + padding * 2;
  const viewBoxHeight = SIDE_WALL_LENGTH + padding * 2;
  const viewBox = `${(-viewBoxWidth / 2) * scale} ${(-viewBoxHeight / 2) * scale} ${viewBoxWidth * scale} ${viewBoxHeight * scale}`;

  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
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
          x={(-viewBoxWidth / 2) * scale}
          y={(-viewBoxHeight / 2) * scale}
          width={viewBoxWidth * scale}
          height={viewBoxHeight * scale}
          fill="url(#plan-grid)"
        />

        {/* Floor outline (subfloor) */}
        <rect
          x={(-halfWestEast - SUBFLOOR_THICKNESS) * scale}
          y={(-halfNorthSouth - SUBFLOOR_THICKNESS) * scale}
          width={(FRONT_WALL_LENGTH + SUBFLOOR_THICKNESS * 2) * scale}
          height={(SIDE_WALL_LENGTH + SUBFLOOR_THICKNESS * 2) * scale}
          fill="#FEF3C7"
          stroke={DRAWING_COLORS.outline}
          strokeWidth="1"
        />

        {/* Floor joists - vertical rectangles running North-South */}
        {showJoists &&
          joists.map((joist, i) => (
            <rect
              key={`joist-${i}`}
              x={(joist.x - JOIST_WIDTH / 2) * scale}
              y={(-halfNorthSouth + JOIST_WIDTH) * scale}
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
            {/* West wall (front) with door - at left */}
            <rect
              x={walls.west.x * scale}
              y={walls.west.y * scale}
              width={walls.west.width * scale}
              height={walls.west.height * scale}
              fill={DRAWING_COLORS.fill}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />
            {/* Door opening - centered in West wall */}
            <rect
              x={(-wallThickness / 2) * scale}
              y={(-DOOR_WIDTH / 2 - DOOR_SHIM_ALLOWANCE) * scale}
              width={wallThickness * scale}
              height={(DOOR_WIDTH + DOOR_SHIM_ALLOWANCE * 2) * scale}
              fill="white"
              stroke={DRAWING_COLORS.outline}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            {/* Door swing arc - opens to the right (East) */}
            <path
              d={`M ${(-wallThickness / 2) * scale} 0 A ${0.6 * scale} ${0.6 * scale} 0 0 0 ${(-wallThickness / 2) * scale} ${0.6 * scale}`}
              fill="none"
              stroke={DRAWING_COLORS.outline}
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />

            {/* East wall (back) - solid - at right */}
            <rect
              x={walls.east.x * scale}
              y={walls.east.y * scale}
              width={walls.east.width * scale}
              height={walls.east.height * scale}
              fill={DRAWING_COLORS.fill}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />

            {/* South wall with window - at bottom */}
            <rect
              x={walls.south.x * scale}
              y={walls.south.y * scale}
              width={walls.south.width * scale}
              height={walls.south.height * scale}
              fill={DRAWING_COLORS.fill}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />
            {/* Window opening - centered in South wall */}
            <rect
              x={(-WINDOW_WIDTH / 2 - WINDOW_SHIM_ALLOWANCE) * scale}
              y={(halfNorthSouth - wallThickness) * scale}
              width={(WINDOW_WIDTH + WINDOW_SHIM_ALLOWANCE * 2) * scale}
              height={wallThickness * scale}
              fill="white"
              stroke={DRAWING_COLORS.outline}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />

            {/* North wall with window - at top */}
            <rect
              x={walls.north.x * scale}
              y={walls.north.y * scale}
              width={walls.north.width * scale}
              height={walls.north.height * scale}
              fill={DRAWING_COLORS.fill}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />
            {/* Window opening - centered in North wall */}
            <rect
              x={(-WINDOW_WIDTH / 2 - WINDOW_SHIM_ALLOWANCE) * scale}
              y={-halfNorthSouth * scale}
              width={(WINDOW_WIDTH + WINDOW_SHIM_ALLOWANCE * 2) * scale}
              height={wallThickness * scale}
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
            {/* Width dimension (bottom) - West to East */}
            <DimensionLineSVG
              x1={-halfWestEast * scale}
              y1={(halfNorthSouth + 0.35) * scale}
              x2={halfWestEast * scale}
              y2={(halfNorthSouth + 0.35) * scale}
              label={formatDimension(FRONT_WALL_LENGTH, units)}
              color={DRAWING_COLORS.dimension}
            />

            {/* Depth dimension (right) - North to South */}
            <DimensionLineSVG
              x1={(halfWestEast + 0.35) * scale}
              y1={-halfNorthSouth * scale}
              x2={(halfWestEast + 0.35) * scale}
              y2={halfNorthSouth * scale}
              label={formatDimension(SIDE_WALL_LENGTH, units)}
              color={DRAWING_COLORS.dimension}
            />

            {/* Door width dimension - on West side */}
            <DimensionLineSVG
              x1={(-halfWestEast - 0.2) * scale}
              y1={(-DOOR_WIDTH / 2) * scale}
              x2={(-halfWestEast - 0.2) * scale}
              y2={(DOOR_WIDTH / 2) * scale}
              label={formatDimension(DOOR_WIDTH, units, {
                showInchesOnly: true,
              })}
              color="#9CA3AF"
            />

            {/* Window width dimensions - on South side */}
            <DimensionLineSVG
              x1={(-WINDOW_WIDTH / 2) * scale}
              y1={(halfNorthSouth + 0.2) * scale}
              x2={(WINDOW_WIDTH / 2) * scale}
              y2={(halfNorthSouth + 0.2) * scale}
              label={formatDimension(WINDOW_WIDTH, units, {
                showInchesOnly: true,
              })}
              color="#9CA3AF"
            />

            {/* Pier spacing dimension (vertical, at East side) */}
            <DimensionLineSVG
              x1={(halfWestEast - 0.15) * scale}
              y1={-halfNorthSouth * scale}
              x2={(halfWestEast - 0.15) * scale}
              y2={0}
              label={formatDimension(SIDE_WALL_LENGTH / 2, units)}
              color={DRAWING_COLORS.pier}
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
              {formatArea(FRONT_WALL_LENGTH * SIDE_WALL_LENGTH, units)}
            </text>

            {/* Orientation labels */}
            {/* North at top */}
            <text
              x={0}
              y={(-halfNorthSouth - 0.3) * scale}
              textAnchor="middle"
              fontSize="8"
              fill={DRAWING_COLORS.dimension}
            >
              North
            </text>
            {/* South at bottom */}
            <text
              x={0}
              y={(halfNorthSouth + 0.55) * scale}
              textAnchor="middle"
              fontSize="8"
              fill={DRAWING_COLORS.dimension}
            >
              South
            </text>
            {/* West at left */}
            <text
              x={(-halfWestEast - 0.25) * scale}
              y={4}
              textAnchor="middle"
              fontSize="8"
              fill={DRAWING_COLORS.dimension}
              transform={`rotate(-90 ${(-halfWestEast - 0.25) * scale},4)`}
            >
              West (Front)
            </text>
            {/* East at right */}
            <text
              x={(halfWestEast + 0.25) * scale}
              y={4}
              textAnchor="middle"
              fontSize="8"
              fill={DRAWING_COLORS.dimension}
              transform={`rotate(90 ${(halfWestEast + 0.25) * scale},4)`}
            >
              East (Back)
            </text>
          </g>
        )}

        {/* Legend */}
        <g
          transform={`translate(${(-viewBoxWidth / 2 + 0.05) * scale}, ${(viewBoxHeight / 2 - 0.05) * scale})`}
        >
          <rect
            x="0"
            y="-50"
            width="70"
            height="50"
            fill="white"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
            rx="2"
          />
          <circle cx="10" cy="-40" r="5" fill={DRAWING_COLORS.pier} />
          <text x="20" y="-37" fontSize="6" fill={DRAWING_COLORS.outline}>
            Pier
          </text>
          <rect
            x="5"
            y="-28"
            width="10"
            height="4"
            fill="#D1D5DB"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.3"
          />
          <text x="20" y="-24" fontSize="6" fill={DRAWING_COLORS.outline}>
            Joist
          </text>
          <rect
            x="5"
            y="-16"
            width="10"
            height="4"
            fill={DRAWING_COLORS.fill}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.3"
          />
          <text x="20" y="-12" fontSize="6" fill={DRAWING_COLORS.outline}>
            Wall
          </text>
        </g>
      </svg>
    </div>
  );
}

export default PlanView;
