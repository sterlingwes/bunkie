/**
 * ElevationView
 *
 * 2D architectural elevation drawings showing wall framing.
 * Displays studs, headers, sills, openings, and roof slope.
 *
 * All dimensions come from constants/framing.ts
 */

import {
  SIDE_WALL_LENGTH,
  FRONT_WALL_LENGTH,
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
  STUD_WIDTH,
  STUD_SPACING,
  BOTTOM_PLATE_HEIGHT,
  TOP_PLATE_HEIGHT,
  HEADER_HEIGHT,
  SILL_HEIGHT,
  DOOR_WIDTH,
  DOOR_HEIGHT,
  WINDOW_WIDTH,
  WINDOW_HEIGHT,
} from "../../../constants/framing";
import { DimensionLineSVG } from "./DimensionLine";
import { DRAWING_COLORS } from "../../../utils/drawing-utils";

export interface ElevationViewProps {
  direction: "front" | "back" | "side";
  showFraming?: boolean;
  showDimensions?: boolean;
  showOpenings?: boolean;
  showRoof?: boolean;
  scale?: number;
}

// Internal props for sub-components (without direction)
interface ElevationSubProps {
  showFraming?: boolean;
  showDimensions?: boolean;
  showOpenings?: boolean;
  showRoof?: boolean;
  scale: number; // Required in sub-components
}

/**
 * Calculate stud positions for a wall
 */
function getStudPositions(
  wallWidth: number,
  opening?: { x: number; width: number },
) {
  const studs: {
    x: number;
    height: number;
    isKing?: boolean;
    isCripple?: boolean;
  }[] = [];
  const startX = -wallWidth / 2;
  const endX = wallWidth / 2;

  // Add studs at regular spacing
  for (let x = startX; x <= endX + STUD_WIDTH / 2; x += STUD_SPACING) {
    // Skip studs that would be in an opening
    if (opening) {
      const openingLeft = opening.x - opening.width / 2;
      const openingRight = opening.x + opening.width / 2;

      // Check if this stud position is at the opening edge (king stud)
      if (Math.abs(x - openingLeft) < STUD_SPACING / 2) {
        studs.push({ x: openingLeft, height: BACK_WALL_HEIGHT, isKing: true });
        continue;
      }
      if (Math.abs(x - openingRight) < STUD_SPACING / 2) {
        studs.push({ x: openingRight, height: BACK_WALL_HEIGHT, isKing: true });
        continue;
      }

      // Skip studs inside the opening
      if (x > openingLeft && x < openingRight) {
        continue;
      }
    }

    studs.push({ x, height: BACK_WALL_HEIGHT });
  }

  return studs;
}

/**
 * Front Elevation (West wall with door)
 */
function FrontElevation({
  showFraming = true,
  showDimensions = true,
  showOpenings = true,
  showRoof = true,
  scale,
}: ElevationSubProps) {
  const wallWidth = FRONT_WALL_LENGTH;
  const wallHeight = FRONT_WALL_HEIGHT;
  const halfWidth = wallWidth / 2;

  // Door opening (centered)
  const doorOpening = {
    x: 0,
    width: DOOR_WIDTH,
    height: DOOR_HEIGHT,
    sillHeight: 0,
  };

  const studs = getStudPositions(wallWidth, doorOpening);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-halfWidth * scale - 50} ${-50} ${wallWidth * scale + 100} ${wallHeight * scale + 100}`}
      className="bg-white"
    >
      {/* Grid */}
      <defs>
        <pattern
          id="elevation-grid-front"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke={DRAWING_COLORS.grid}
            strokeWidth="0.3"
          />
        </pattern>
      </defs>

      {/* Wall outline */}
      <rect
        x={-halfWidth * scale}
        y={0}
        width={wallWidth * scale}
        height={wallHeight * scale}
        fill="#FEF3C7"
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1.5"
      />

      {/* Bottom plate */}
      <rect
        x={-halfWidth * scale}
        y={0}
        width={wallWidth * scale}
        height={BOTTOM_PLATE_HEIGHT * scale}
        fill={DRAWING_COLORS.stud}
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1"
      />

      {/* Top plates (double) */}
      <rect
        x={-halfWidth * scale}
        y={(wallHeight - TOP_PLATE_HEIGHT) * scale}
        width={wallWidth * scale}
        height={TOP_PLATE_HEIGHT * scale}
        fill={DRAWING_COLORS.stud}
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1"
      />

      {/* Studs */}
      {showFraming &&
        studs.map((stud, i) => (
          <rect
            key={`stud-${i}`}
            x={(stud.x - STUD_WIDTH / 2) * scale}
            y={BOTTOM_PLATE_HEIGHT * scale}
            width={STUD_WIDTH * scale}
            height={
              (stud.height - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) * scale
            }
            fill={stud.isKing ? DRAWING_COLORS.highlight : DRAWING_COLORS.stud}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
          />
        ))}

      {/* Door opening */}
      {showOpenings && (
        <g>
          {/* Header */}
          <rect
            x={(-DOOR_WIDTH / 2 - STUD_WIDTH) * scale}
            y={(doorOpening.sillHeight + doorOpening.height) * scale}
            width={(DOOR_WIDTH + STUD_WIDTH * 2) * scale}
            height={HEADER_HEIGHT * scale}
            fill={DRAWING_COLORS.stud}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          {/* King studs (highlighted) */}
          <rect
            x={(-DOOR_WIDTH / 2 - STUD_WIDTH * 1.5) * scale}
            y={BOTTOM_PLATE_HEIGHT * scale}
            width={STUD_WIDTH * scale}
            height={
              (wallHeight - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) * scale
            }
            fill={DRAWING_COLORS.highlight}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          <rect
            x={(DOOR_WIDTH / 2 + STUD_WIDTH * 0.5) * scale}
            y={BOTTOM_PLATE_HEIGHT * scale}
            width={STUD_WIDTH * scale}
            height={
              (wallHeight - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) * scale
            }
            fill={DRAWING_COLORS.highlight}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          {/* Door opening (clear) */}
          <rect
            x={(-DOOR_WIDTH / 2) * scale}
            y={doorOpening.sillHeight * scale}
            width={DOOR_WIDTH * scale}
            height={doorOpening.height * scale}
            fill="white"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
            strokeDasharray="4,2"
          />
          {/* Door swing indicator */}
          <line
            x1={0}
            y1={doorOpening.sillHeight * scale}
            x2={0}
            y2={(doorOpening.sillHeight + doorOpening.height) * scale}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </g>
      )}

      {/* Roof line */}
      {showRoof && (
        <g>
          {/* Roof slope line */}
          <line
            x1={(-halfWidth - 0.1) * scale}
            y1={(BACK_WALL_HEIGHT + TOP_PLATE_HEIGHT) * scale}
            x2={(halfWidth + 0.1) * scale}
            y2={(FRONT_WALL_HEIGHT + TOP_PLATE_HEIGHT) * scale}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="2"
          />
          {/* Roof sheathing indication */}
          <line
            x1={(-halfWidth - 0.1) * scale}
            y1={(BACK_WALL_HEIGHT + TOP_PLATE_HEIGHT + 0.05) * scale}
            x2={(halfWidth + 0.1) * scale}
            y2={(FRONT_WALL_HEIGHT + TOP_PLATE_HEIGHT + 0.05) * scale}
            stroke="#9CA3AF"
            strokeWidth="6"
          />
        </g>
      )}

      {/* Dimensions */}
      {showDimensions && (
        <g>
          {/* Wall width */}
          <DimensionLineSVG
            x1={-halfWidth * scale}
            y1={(wallHeight + 25) * scale}
            x2={halfWidth * scale}
            y2={(wallHeight + 25) * scale}
            label={`${(wallWidth * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />

          {/* Wall height */}
          <DimensionLineSVG
            x1={(-halfWidth - 25) * scale}
            y1={0}
            x2={(-halfWidth - 25) * scale}
            y2={wallHeight * scale}
            label={`${(wallHeight * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />

          {/* Door width */}
          {showOpenings && (
            <DimensionLineSVG
              x1={(-DOOR_WIDTH / 2) * scale}
              y1={(doorOpening.height + 15) * scale}
              x2={(DOOR_WIDTH / 2) * scale}
              y2={(doorOpening.height + 15) * scale}
              label={`${(DOOR_WIDTH * 1000).toFixed(0)}mm`}
              color="#9CA3AF"
            />
          )}

          {/* Door height */}
          {showOpenings && (
            <DimensionLineSVG
              x1={(halfWidth + 15) * scale}
              y1={0}
              x2={(halfWidth + 15) * scale}
              y2={doorOpening.height * scale}
              label={`${(DOOR_HEIGHT * 1000).toFixed(0)}mm`}
              color="#9CA3AF"
            />
          )}
        </g>
      )}

      {/* Labels */}
      <text
        x={0}
        y={-15}
        textAnchor="middle"
        fontSize="12"
        fill={DRAWING_COLORS.outline}
        fontWeight="bold"
      >
        Front Elevation (West)
      </text>
      <text
        x={0}
        y={-3}
        textAnchor="middle"
        fontSize="8"
        fill={DRAWING_COLORS.dimension}
      >
        High Wall - {wallHeight}m
      </text>

      {/* Legend */}
      <g
        transform={`translate(${-halfWidth * scale + 5}, ${wallHeight * scale - 45})`}
      >
        <rect
          x="0"
          y="0"
          width="65"
          height="42"
          fill="white"
          stroke={DRAWING_COLORS.outline}
          strokeWidth="0.5"
          rx="2"
        />
        <rect x="5" y="8" width="8" height="4" fill={DRAWING_COLORS.stud} />
        <text x="18" y="12" fontSize="6" fill={DRAWING_COLORS.outline}>
          Stud
        </text>
        <rect
          x="5"
          y="18"
          width="8"
          height="4"
          fill={DRAWING_COLORS.highlight}
        />
        <text x="18" y="22" fontSize="6" fill={DRAWING_COLORS.outline}>
          King Stud
        </text>
        <rect
          x="5"
          y="28"
          width="8"
          height="4"
          fill={DRAWING_COLORS.fill}
          stroke={DRAWING_COLORS.outline}
          strokeWidth="0.3"
        />
        <text x="18" y="32" fontSize="6" fill={DRAWING_COLORS.outline}>
          Opening
        </text>
      </g>
    </svg>
  );
}

/**
 * Back Elevation (East wall - solid)
 */
function BackElevation({
  showFraming,
  showDimensions,
  showRoof,
  scale,
}: ElevationSubProps) {
  const wallWidth = FRONT_WALL_LENGTH;
  const wallHeight = BACK_WALL_HEIGHT;
  const halfWidth = wallWidth / 2;

  const studs = getStudPositions(wallWidth);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-halfWidth * scale - 50} ${-50} ${wallWidth * scale + 100} ${wallHeight * scale + 100}`}
      className="bg-white"
    >
      {/* Wall outline */}
      <rect
        x={-halfWidth * scale}
        y={0}
        width={wallWidth * scale}
        height={wallHeight * scale}
        fill="#FEF3C7"
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1.5"
      />

      {/* Bottom plate */}
      <rect
        x={-halfWidth * scale}
        y={0}
        width={wallWidth * scale}
        height={BOTTOM_PLATE_HEIGHT * scale}
        fill={DRAWING_COLORS.stud}
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1"
      />

      {/* Top plates */}
      <rect
        x={-halfWidth * scale}
        y={(wallHeight - TOP_PLATE_HEIGHT) * scale}
        width={wallWidth * scale}
        height={TOP_PLATE_HEIGHT * scale}
        fill={DRAWING_COLORS.stud}
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1"
      />

      {/* Studs */}
      {showFraming &&
        studs.map((stud, i) => (
          <rect
            key={`stud-${i}`}
            x={(stud.x - STUD_WIDTH / 2) * scale}
            y={BOTTOM_PLATE_HEIGHT * scale}
            width={STUD_WIDTH * scale}
            height={
              (stud.height - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) * scale
            }
            fill={DRAWING_COLORS.stud}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="0.5"
          />
        ))}

      {/* Roof line */}
      {showRoof && (
        <g>
          <line
            x1={(-halfWidth - 0.1) * scale}
            y1={(BACK_WALL_HEIGHT + TOP_PLATE_HEIGHT) * scale}
            x2={(halfWidth + 0.1) * scale}
            y2={(FRONT_WALL_HEIGHT + TOP_PLATE_HEIGHT) * scale}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="2"
          />
        </g>
      )}

      {/* Dimensions */}
      {showDimensions && (
        <g>
          <DimensionLineSVG
            x1={-halfWidth * scale}
            y1={(wallHeight + 25) * scale}
            x2={halfWidth * scale}
            y2={(wallHeight + 25) * scale}
            label={`${(wallWidth * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />
          <DimensionLineSVG
            x1={(-halfWidth - 25) * scale}
            y1={0}
            x2={(-halfWidth - 25) * scale}
            y2={wallHeight * scale}
            label={`${(wallHeight * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />
        </g>
      )}

      {/* Labels */}
      <text
        x={0}
        y={-15}
        textAnchor="middle"
        fontSize="12"
        fill={DRAWING_COLORS.outline}
        fontWeight="bold"
      >
        Back Elevation (East)
      </text>
      <text
        x={0}
        y={-3}
        textAnchor="middle"
        fontSize="8"
        fill={DRAWING_COLORS.dimension}
      >
        Low Wall - {wallHeight}m
      </text>
    </svg>
  );
}

/**
 * Side Elevation (South/North wall with window)
 */
function SideElevation({
  showFraming,
  showDimensions,
  showOpenings,
  showRoof,
  scale,
}: ElevationSubProps) {
  const wallWidth = SIDE_WALL_LENGTH;
  const lowHeight = BACK_WALL_HEIGHT;
  const highHeight = FRONT_WALL_HEIGHT;
  const halfWidth = wallWidth / 2;

  // Window opening (centered)
  const windowOpening = {
    x: 0,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    sillHeight: 0.9, // Typical sill height
  };

  const studs = getStudPositions(wallWidth, windowOpening);

  // Calculate rake angle for shed roof
  const roofRise = highHeight - lowHeight;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-halfWidth * scale - 50} ${-50} ${wallWidth * scale + 100} ${highHeight * scale + 100}`}
      className="bg-white"
    >
      {/* Rake wall outline (trapezoid) */}
      <polygon
        points={`
          ${-halfWidth * scale},${0}
          ${halfWidth * scale},${0}
          ${halfWidth * scale},${highHeight * scale}
          ${-halfWidth * scale},${lowHeight * scale}
        `}
        fill="#FEF3C7"
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1.5"
      />

      {/* Bottom plate */}
      <polygon
        points={`
          ${-halfWidth * scale},${0}
          ${halfWidth * scale},${0}
          ${halfWidth * scale},${BOTTOM_PLATE_HEIGHT * scale}
          ${-halfWidth * scale},${BOTTOM_PLATE_HEIGHT * scale}
        `}
        fill={DRAWING_COLORS.stud}
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1"
      />

      {/* Top plates (following rake) */}
      <polygon
        points={`
          ${-halfWidth * scale},${(lowHeight - TOP_PLATE_HEIGHT) * scale}
          ${halfWidth * scale},${(highHeight - TOP_PLATE_HEIGHT) * scale}
          ${halfWidth * scale},${highHeight * scale}
          ${-halfWidth * scale},${lowHeight * scale}
        `}
        fill={DRAWING_COLORS.stud}
        stroke={DRAWING_COLORS.outline}
        strokeWidth="1"
      />

      {/* Studs (varying heights for rake) */}
      {showFraming &&
        studs.map((stud, i) => {
          // Calculate stud height based on position (rake wall)
          const studHeight =
            lowHeight + ((stud.x + halfWidth) / wallWidth) * roofRise;
          return (
            <rect
              key={`stud-${i}`}
              x={(stud.x - STUD_WIDTH / 2) * scale}
              y={BOTTOM_PLATE_HEIGHT * scale}
              width={STUD_WIDTH * scale}
              height={
                (studHeight - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) * scale
              }
              fill={
                stud.isKing ? DRAWING_COLORS.highlight : DRAWING_COLORS.stud
              }
              stroke={DRAWING_COLORS.outline}
              strokeWidth="0.5"
            />
          );
        })}

      {/* Window opening */}
      {showOpenings && (
        <g>
          {/* Header */}
          <rect
            x={(-WINDOW_WIDTH / 2 - STUD_WIDTH) * scale}
            y={(windowOpening.sillHeight + windowOpening.height) * scale}
            width={(WINDOW_WIDTH + STUD_WIDTH * 2) * scale}
            height={HEADER_HEIGHT * scale}
            fill={DRAWING_COLORS.stud}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          {/* Sill */}
          <rect
            x={(-WINDOW_WIDTH / 2) * scale}
            y={windowOpening.sillHeight * scale}
            width={WINDOW_WIDTH * scale}
            height={SILL_HEIGHT * scale}
            fill={DRAWING_COLORS.stud}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          {/* Window opening (clear) */}
          <rect
            x={(-WINDOW_WIDTH / 2) * scale}
            y={(windowOpening.sillHeight + SILL_HEIGHT) * scale}
            width={WINDOW_WIDTH * scale}
            height={(windowOpening.height - HEADER_HEIGHT) * scale}
            fill="white"
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
            strokeDasharray="4,2"
          />
          {/* King studs */}
          <rect
            x={(-WINDOW_WIDTH / 2 - STUD_WIDTH * 1.5) * scale}
            y={BOTTOM_PLATE_HEIGHT * scale}
            width={STUD_WIDTH * scale}
            height={
              (highHeight - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) * scale
            }
            fill={DRAWING_COLORS.highlight}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
          <rect
            x={(WINDOW_WIDTH / 2 + STUD_WIDTH * 0.5) * scale}
            y={BOTTOM_PLATE_HEIGHT * scale}
            width={STUD_WIDTH * scale}
            height={
              (highHeight - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) * scale
            }
            fill={DRAWING_COLORS.highlight}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="1"
          />
        </g>
      )}

      {/* Roof line */}
      {showRoof && (
        <g>
          <line
            x1={(-halfWidth - 0.1) * scale}
            y1={lowHeight * scale}
            x2={(halfWidth + 0.1) * scale}
            y2={highHeight * scale}
            stroke={DRAWING_COLORS.outline}
            strokeWidth="2"
          />
          {/* Roof overhang indication */}
          <line
            x1={(-halfWidth - 0.15) * scale}
            y1={(lowHeight - 0.05) * scale}
            x2={(halfWidth + 0.15) * scale}
            y2={(highHeight + 0.05) * scale}
            stroke="#9CA3AF"
            strokeWidth="8"
          />
        </g>
      )}

      {/* Dimensions */}
      {showDimensions && (
        <g>
          {/* Wall width */}
          <DimensionLineSVG
            x1={-halfWidth * scale}
            y1={(highHeight + 25) * scale}
            x2={halfWidth * scale}
            y2={(highHeight + 25) * scale}
            label={`${(wallWidth * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />

          {/* Low wall height */}
          <DimensionLineSVG
            x1={(-halfWidth - 25) * scale}
            y1={0}
            x2={(-halfWidth - 25) * scale}
            y2={lowHeight * scale}
            label={`${(lowHeight * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />

          {/* High wall height */}
          <DimensionLineSVG
            x1={(halfWidth + 25) * scale}
            y1={0}
            x2={(halfWidth + 25) * scale}
            y2={highHeight * scale}
            label={`${(highHeight * 1000).toFixed(0)}mm`}
            color={DRAWING_COLORS.dimension}
          />

          {/* Roof rise */}
          <DimensionLineSVG
            x1={(halfWidth + 40) * scale}
            y1={lowHeight * scale}
            x2={(halfWidth + 40) * scale}
            y2={highHeight * scale}
            label={`+${((highHeight - lowHeight) * 1000).toFixed(0)}mm`}
            color="#9CA3AF"
          />
        </g>
      )}

      {/* Labels */}
      <text
        x={0}
        y={-15}
        textAnchor="middle"
        fontSize="12"
        fill={DRAWING_COLORS.outline}
        fontWeight="bold"
      >
        Side Elevation (South/North)
      </text>
      <text
        x={0}
        y={-3}
        textAnchor="middle"
        fontSize="8"
        fill={DRAWING_COLORS.dimension}
      >
        Rake Wall - {lowHeight}m to {highHeight}m (
        {((highHeight - lowHeight) * 1000).toFixed(0)}mm rise)
      </text>
    </svg>
  );
}

/**
 * Main ElevationView component
 */
export function ElevationView({
  direction,
  showFraming = true,
  showDimensions = true,
  showOpenings = true,
  showRoof = true,
  scale = 100,
}: ElevationViewProps) {
  switch (direction) {
    case "front":
      return (
        <FrontElevation
          showFraming={showFraming}
          showDimensions={showDimensions}
          showOpenings={showOpenings}
          showRoof={showRoof}
          scale={scale}
        />
      );
    case "back":
      return (
        <BackElevation
          showFraming={showFraming}
          showDimensions={showDimensions}
          showRoof={showRoof}
          scale={scale}
        />
      );
    case "side":
      return (
        <SideElevation
          showFraming={showFraming}
          showDimensions={showDimensions}
          showOpenings={showOpenings}
          showRoof={showRoof}
          scale={scale}
        />
      );
  }
}

export default ElevationView;
