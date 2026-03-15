/**
 * ElevationView
 *
 * 2D architectural elevation drawings showing wall framing.
 * Displays studs, headers, sills, openings, and roof slope.
 *
 * All dimensions come from constants/framing.ts
 *
 * IMPORTANT: These show EXTERNAL views (as seen from outside the building).
 * For the back wall (East), this means the view is mirrored compared to
 * the internal framing view.
 */

import {
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
import {
  UnitSystem,
  formatDimension,
  formatImperial,
} from "../../../utils/unit-conversion";
import {
  getStudPositions,
  getWallConfigs,
  getOpeningFraming,
} from "../../../utils/framing-calculator";

export interface ElevationViewProps {
  direction: "front" | "back" | "side";
  showFraming?: boolean;
  showDimensions?: boolean;
  showOpenings?: boolean;
  showRoof?: boolean;
  scale?: number;
  units?: UnitSystem;
}

// Internal props for sub-components (without direction)
interface ElevationSubProps {
  showFraming?: boolean;
  showDimensions?: boolean;
  showOpenings?: boolean;
  showRoof?: boolean;
  scale: number; // Required in sub-components
  units: UnitSystem; // Required in sub-components
}

/**
 * Front Elevation (West wall with door)
 * External view - looking at the front of the building from outside
 */
function FrontElevation({
  showFraming = true,
  showDimensions = true,
  showOpenings = true,
  showRoof = true,
  scale,
  units,
}: ElevationSubProps) {
  const wallConfig = getWallConfigs().west;
  const wallWidth = wallConfig.width;
  const wallHeight = wallConfig.lowHeight;
  const halfWidth = wallWidth / 2;

  const studs = getStudPositions(wallConfig);
  const openingFraming = getOpeningFraming(wallConfig);

  // Helper for dimension labels
  const dimLabel = (meters: number) => formatDimension(meters, units);

  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <svg
        viewBox={`${-halfWidth * scale - 60} ${-60} ${wallWidth * scale + 120} ${wallHeight * scale + 120}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* Transform group to flip Y axis - SVG y=0 is at TOP, but we want wall floor at BOTTOM */}
        <g transform={`scale(1,-1) translate(0,${-(wallHeight * scale)})`}>
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

        {/* Wall outline - FLOOR at y=0, TOP at wallHeight */}
        <rect
          x={-halfWidth * scale}
          y={0}
          width={wallWidth * scale}
          height={wallHeight * scale}
          fill="#FEF3C7"
          stroke={DRAWING_COLORS.outline}
          strokeWidth="1.5"
        />

        {/* Bottom plate - at floor level (y=0) */}
        <rect
          x={-halfWidth * scale}
          y={0}
          width={wallWidth * scale}
          height={BOTTOM_PLATE_HEIGHT * scale}
          fill={DRAWING_COLORS.stud}
          stroke={DRAWING_COLORS.outline}
          strokeWidth="1"
        />

        {/* Top plates (double) - at top of wall */}
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
          studs
            .filter((stud) => stud.type === "regular")
            .map((stud, i) => (
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

        {/* Door opening */}
        {showOpenings && openingFraming && (
          <g>
            {/* Header */}
            <rect
              x={
                (openingFraming.centerX - openingFraming.headerWidth / 2) *
                scale
              }
              y={openingFraming.headerY * scale}
              width={openingFraming.headerWidth * scale}
              height={HEADER_HEIGHT * scale}
              fill={DRAWING_COLORS.stud}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />
            {/* King studs (highlighted) - get from stud positions */}
            {studs
              .filter((s) => s.type === "king")
              .map((stud, i) => (
                <rect
                  key={`king-stud-${i}`}
                  x={(stud.x - STUD_WIDTH / 2) * scale}
                  y={BOTTOM_PLATE_HEIGHT * scale}
                  width={STUD_WIDTH * scale}
                  height={
                    (wallHeight - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT) *
                    scale
                  }
                  fill={DRAWING_COLORS.highlight}
                  stroke={DRAWING_COLORS.outline}
                  strokeWidth="1"
                />
              ))}
            {/* Jack studs (shorter) */}
            {studs
              .filter((s) => s.type === "jack")
              .map((stud, i) => (
                <rect
                  key={`jack-stud-${i}`}
                  x={(stud.x - STUD_WIDTH / 2) * scale}
                  y={BOTTOM_PLATE_HEIGHT * scale}
                  width={STUD_WIDTH * scale}
                  height={(stud.jackHeight ?? 0) * scale}
                  fill={DRAWING_COLORS.jack ?? DRAWING_COLORS.stud}
                  stroke={DRAWING_COLORS.outline}
                  strokeWidth="1"
                />
              ))}
            {/* Door opening (clear) */}
            <rect
              x={
                (openingFraming.centerX -
                  openingFraming.roughOpeningWidth / 2) *
                scale
              }
              y={0}
              width={openingFraming.roughOpeningWidth * scale}
              height={openingFraming.roughOpeningHeight * scale}
              fill="white"
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
              strokeDasharray="4,2"
            />
            {/* Door swing indicator */}
            <line
              x1={openingFraming.centerX * scale}
              y1={0}
              x2={openingFraming.centerX * scale}
              y2={openingFraming.roughOpeningHeight * scale}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </g>
        )}

        {/* Roof line - sits ON TOP of the wall (at wall height, not above top plate) */}
        {showRoof && (
          <g>
            {/* Roof slope line */}
            <line
              x1={(-halfWidth - 0.1) * scale}
              y1={BACK_WALL_HEIGHT * scale}
              x2={(halfWidth + 0.1) * scale}
              y2={FRONT_WALL_HEIGHT * scale}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="2"
            />
            {/* Roof sheathing indication */}
            <line
              x1={(-halfWidth - 0.1) * scale}
              y1={(BACK_WALL_HEIGHT + 0.05) * scale}
              x2={(halfWidth + 0.1) * scale}
              y2={(FRONT_WALL_HEIGHT + 0.05) * scale}
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
              y1={(wallHeight + 30) * scale}
              x2={halfWidth * scale}
              y2={(wallHeight + 30) * scale}
              label={dimLabel(wallWidth)}
              color={DRAWING_COLORS.dimension}
              flipped
            />

            {/* Wall height */}
            <DimensionLineSVG
              x1={(-halfWidth - 30) * scale}
              y1={0}
              x2={(-halfWidth - 30) * scale}
              y2={wallHeight * scale}
              label={dimLabel(wallHeight)}
              color={DRAWING_COLORS.dimension}
              flipped
            />

            {/* Stud spacing indicator - counter-transform for flipped Y */}
            <text
              x={(-halfWidth + STUD_SPACING / 2) * scale}
              y={(BOTTOM_PLATE_HEIGHT + 0.15) * scale}
              textAnchor="middle"
              fontSize="6"
              fill={DRAWING_COLORS.dimension}
              transform={`scale(1,-1)`}
            >
              {dimLabel(STUD_SPACING)}
            </text>

            {/* Door width */}
            {showOpenings && openingFraming && (
              <DimensionLineSVG
                x1={
                  (openingFraming.centerX -
                    openingFraming.roughOpeningWidth / 2) *
                  scale
                }
                y1={(openingFraming.roughOpeningHeight + 0.2) * scale}
                x2={
                  (openingFraming.centerX +
                    openingFraming.roughOpeningWidth / 2) *
                  scale
                }
                y2={(openingFraming.roughOpeningHeight + 0.2) * scale}
                label={dimLabel(DOOR_WIDTH)}
                color="#9CA3AF"
                flipped
              />
            )}

            {/* Door height */}
            {showOpenings && openingFraming && (
              <DimensionLineSVG
                x1={(halfWidth + 20) * scale}
                y1={0}
                x2={(halfWidth + 20) * scale}
                y2={openingFraming.roughOpeningHeight * scale}
                label={dimLabel(DOOR_HEIGHT)}
                color="#9CA3AF"
                flipped
              />
            )}
          </g>
        )}
      </g>
      {/* End transform group for Y-axis flip */}

      {/* Labels - outside transform so text is right-side-up */}
      <text
        x={0}
        y={-20}
        textAnchor="middle"
        fontSize="12"
        fill={DRAWING_COLORS.outline}
        fontWeight="bold"
      >
        Front Wall (West) - External View
      </text>
      <text
        x={0}
        y={-6}
        textAnchor="middle"
        fontSize="9"
        fill={DRAWING_COLORS.dimension}
      >
        High Wall - {formatImperial(wallHeight)} (
        {(wallHeight * 1000).toFixed(0)}mm)
      </text>

      {/* Legend - Y coord inverted for untransformed space */}
      <g transform={`translate(${-halfWidth * scale + 5}, 5)`}>
        <rect
          x="0"
          y="0"
          width="70"
          height="48"
          fill="white"
          stroke={DRAWING_COLORS.outline}
          strokeWidth="0.5"
          rx="2"
        />
        <rect x="5" y="8" width="8" height="4" fill={DRAWING_COLORS.stud} />
        <text x="18" y="12" fontSize="6" fill={DRAWING_COLORS.outline}>
          Stud (2×4)
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
        <text x="5" y="42" fontSize="5" fill={DRAWING_COLORS.dimension}>
          16" OC spacing
        </text>
      </g>
      </svg>
    </div>
  );
}

/**
 * Back Elevation (East wall - solid)
 *
 * EXTERNAL VIEW: Looking at the back wall from outside the building.
 * This means we're facing WEST, so the left side of our view is the SOUTH
 * side of the building (where the side wall is SHORTER), and the right
 * side is NORTH (where the side wall is TALLER).
 *
 * This is MIRRORED from the internal framing view!
 */
function BackElevation({
  showFraming,
  showDimensions,
  showRoof,
  scale,
  units,
}: ElevationSubProps) {
  const wallConfig = getWallConfigs().east;
  const wallWidth = wallConfig.width;
  const wallHeight = wallConfig.lowHeight;
  const halfWidth = wallWidth / 2;

  // Get stud positions for internal view
  const internalStuds = getStudPositions(wallConfig);

  // For EXTERNAL view, we need to mirror the X coordinates
  // When looking at the back wall from outside:
  // - Left side of view = South side of building = SHORTER rake
  // - Right side of view = North side of building = TALLER rake
  // So we flip the stud positions (multiply x by -1)
  const studs = internalStuds.map((stud) => ({
    ...stud,
    x: -stud.x, // Mirror for external view
  }));

  // Helper for dimension labels
  const dimLabel = (meters: number) => formatDimension(meters, units);

  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <svg
        viewBox={`${-halfWidth * scale - 60} ${-60} ${wallWidth * scale + 120} ${wallHeight * scale + 120}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* Transform group to flip Y axis - SVG y=0 is at TOP, but we want wall floor at BOTTOM */}
        <g transform={`scale(1,-1) translate(0,${-(wallHeight * scale)})`}>
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

        {/* Studs - mirrored for external view */}
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
              fill={
                stud.type === "king"
                  ? DRAWING_COLORS.highlight
                  : DRAWING_COLORS.stud
              }
              stroke={DRAWING_COLORS.outline}
              strokeWidth="0.5"
            />
          ))}

        {/* Roof line - sits at wall height
            For external back view: left (South) is LOW, right (North) is HIGH */}
        {showRoof && (
          <g>
            <line
              x1={(-halfWidth - 0.1) * scale}
              y1={BACK_WALL_HEIGHT * scale}
              x2={(halfWidth + 0.1) * scale}
              y2={FRONT_WALL_HEIGHT * scale}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="2"
            />
            {/* Roof sheathing indication */}
            <line
              x1={(-halfWidth - 0.15) * scale}
              y1={(BACK_WALL_HEIGHT + 0.05) * scale}
              x2={(halfWidth + 0.15) * scale}
              y2={(FRONT_WALL_HEIGHT + 0.05) * scale}
              stroke="#9CA3AF"
              strokeWidth="8"
            />
          </g>
        )}

        {/* Dimensions */}
        {showDimensions && (
          <g>
            <DimensionLineSVG
              x1={-halfWidth * scale}
              y1={(wallHeight + 30) * scale}
              x2={halfWidth * scale}
              y2={(wallHeight + 30) * scale}
              label={dimLabel(wallWidth)}
              color={DRAWING_COLORS.dimension}
              flipped
            />
            <DimensionLineSVG
              x1={(-halfWidth - 30) * scale}
              y1={0}
              x2={(-halfWidth - 30) * scale}
              y2={wallHeight * scale}
              label={dimLabel(wallHeight)}
              color={DRAWING_COLORS.dimension}
              flipped
            />
            {/* Stud spacing indicator - counter-transform for flipped Y */}
            <text
              x={(-halfWidth + STUD_SPACING / 2) * scale}
              y={(BOTTOM_PLATE_HEIGHT + 0.15) * scale}
              textAnchor="middle"
              fontSize="6"
              fill={DRAWING_COLORS.dimension}
              transform="scale(1,-1)"
            >
              {dimLabel(STUD_SPACING)}
            </text>
          </g>
        )}
      </g>
      {/* End transform group for Y-axis flip */}

      {/* Labels - outside transform so text is right-side-up */}
      <text
        x={0}
        y={-35}
        textAnchor="middle"
        fontSize="12"
        fill={DRAWING_COLORS.outline}
        fontWeight="bold"
      >
        Back Wall (East) - External View
      </text>
      <text
        x={0}
        y={-20}
        textAnchor="middle"
        fontSize="9"
        fill={DRAWING_COLORS.dimension}
      >
        Low Wall - {formatImperial(wallHeight)} (
        {(wallHeight * 1000).toFixed(0)}mm)
      </text>

      {/* Roof direction indicator - outside transform */}
      {showRoof && (
        <text
          x={0}
          y={(FRONT_WALL_HEIGHT - BACK_WALL_HEIGHT + 15) * scale}
          textAnchor="middle"
          fontSize="7"
          fill={DRAWING_COLORS.dimension}
        >
          Roof slopes up → (towards front)
        </text>
      )}

      {/* Side labels to show orientation - Y adjusted for untransformed space */}
      <text
        x={(-halfWidth - 5) * scale}
        y={(wallHeight / 2) * scale}
        textAnchor="end"
        fontSize="7"
        fill={DRAWING_COLORS.dimension}
        transform={`rotate(-90 ${(-halfWidth - 5) * scale}, ${(wallHeight / 2) * scale})`}
      >
        ← South side
      </text>
      <text
        x={(halfWidth + 5) * scale}
        y={(wallHeight / 2) * scale}
        textAnchor="start"
        fontSize="7"
        fill={DRAWING_COLORS.dimension}
        transform={`rotate(90 ${(halfWidth + 5) * scale}, ${(wallHeight / 2) * scale})`}
      >
        North side →
      </text>

      {/* Legend - Y adjusted for untransformed space */}
      <g transform={`translate(${-halfWidth * scale + 5}, 5)`}>
        <rect
          x="0"
          y="0"
          width="70"
          height="40"
          fill="white"
          stroke={DRAWING_COLORS.outline}
          strokeWidth="0.5"
          rx="2"
        />
        <rect x="5" y="8" width="8" height="4" fill={DRAWING_COLORS.stud} />
        <text x="18" y="12" fontSize="6" fill={DRAWING_COLORS.outline}>
          Stud (2×4)
        </text>
        <text x="5" y="24" fontSize="5" fill={DRAWING_COLORS.dimension}>
          16" OC spacing
        </text>
        <text x="5" y="34" fontSize="5" fill={DRAWING_COLORS.dimension}>
          Solid wall (no openings)
        </text>
      </g>
      </svg>
    </div>
  );
}

/**
 * Side Elevation (South/North wall with window)
 * External view - looking at the side of the building from outside
 *
 * Shows the trapezoidal rake wall with window opening.
 * The wall rises from BACK_WALL_HEIGHT (back/east) to FRONT_WALL_HEIGHT (front/west).
 */
function SideElevation({
  showFraming,
  showDimensions,
  showOpenings,
  showRoof,
  scale,
  units,
}: ElevationSubProps) {
  // Use south wall config (represents a typical side wall with window)
  const wallConfig = getWallConfigs().south;
  const wallWidth = wallConfig.width;
  const lowHeight = wallConfig.lowHeight;
  const highHeight = wallConfig.highHeight;
  const halfWidth = wallWidth / 2;

  const studs = getStudPositions(wallConfig);
  const openingFraming = getOpeningFraming(wallConfig);

  // Calculate rake angle for shed roof
  const roofRise = highHeight - lowHeight;

  // Helper for dimension labels
  const dimLabel = (meters: number) => formatDimension(meters, units);

  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <svg
        viewBox={`${-halfWidth * scale - 60} ${-60} ${wallWidth * scale + 120} ${highHeight * scale + 120}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* Transform group to flip Y axis - SVG y=0 is at TOP, but we want wall floor at BOTTOM */}
        <g transform={`scale(1,-1) translate(0,${-(highHeight * scale)})`}>
          {/* Rake wall outline (trapezoid) - FLOOR at y=0, TOP at varying heights */}
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
          studs
            .filter((stud) => stud.type === "regular")
            .map((stud, i) => {
              // Stud height is already calculated by the calculator
              const studVisibleHeight =
                stud.height - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT;

              // Skip if height is invalid (negative or too small)
              if (studVisibleHeight <= 0) return null;

              return (
                <rect
                  key={`stud-${i}`}
                  x={(stud.x - STUD_WIDTH / 2) * scale}
                  y={BOTTOM_PLATE_HEIGHT * scale}
                  width={STUD_WIDTH * scale}
                  height={studVisibleHeight * scale}
                  fill={DRAWING_COLORS.stud}
                  stroke={DRAWING_COLORS.outline}
                  strokeWidth="0.5"
                />
              );
            })}

        {/* Window opening */}
        {showOpenings && openingFraming && (
          <g>
            {/* Header */}
            <rect
              x={
                (openingFraming.centerX - openingFraming.headerWidth / 2) *
                scale
              }
              y={openingFraming.headerY * scale}
              width={openingFraming.headerWidth * scale}
              height={HEADER_HEIGHT * scale}
              fill={DRAWING_COLORS.stud}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />
            {/* Sill */}
            <rect
              x={
                (openingFraming.centerX -
                  openingFraming.roughOpeningWidth / 2) *
                scale
              }
              y={(openingFraming.sillY - SILL_HEIGHT / 2) * scale}
              width={openingFraming.roughOpeningWidth * scale}
              height={SILL_HEIGHT * scale}
              fill={DRAWING_COLORS.stud}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
            />
            {/* Window opening (clear) */}
            <rect
              x={(openingFraming.centerX - WINDOW_WIDTH / 2) * scale}
              y={(openingFraming.sillY + SILL_HEIGHT / 2) * scale}
              width={WINDOW_WIDTH * scale}
              height={WINDOW_HEIGHT * scale}
              fill="white"
              stroke={DRAWING_COLORS.outline}
              strokeWidth="1"
              strokeDasharray="4,2"
            />
            {/* King studs - get from stud positions */}
            {studs
              .filter((s) => s.type === "king")
              .map((stud, i) => {
                // Calculate visible height for this king stud (varies with rake)
                const studVisibleHeight =
                  stud.height - BOTTOM_PLATE_HEIGHT - TOP_PLATE_HEIGHT;
                return (
                  <rect
                    key={`king-stud-${i}`}
                    x={(stud.x - STUD_WIDTH / 2) * scale}
                    y={BOTTOM_PLATE_HEIGHT * scale}
                    width={STUD_WIDTH * scale}
                    height={studVisibleHeight * scale}
                    fill={DRAWING_COLORS.highlight}
                    stroke={DRAWING_COLORS.outline}
                    strokeWidth="1"
                  />
                );
              })}
          </g>
        )}

        {/* Roof line - sits at TOP of wall (along the angled rake) */}
        {showRoof && (
          <g>
            {/* Roof slope line - follows the top of the trapezoid */}
            <line
              x1={(-halfWidth - 0.1) * scale}
              y1={lowHeight * scale}
              x2={(halfWidth + 0.1) * scale}
              y2={highHeight * scale}
              stroke={DRAWING_COLORS.outline}
              strokeWidth="2"
            />
            {/* Roof sheathing indication - ABOVE the wall line, following the same slope */}
            <line
              x1={(-halfWidth - 0.15) * scale}
              y1={(lowHeight + 0.05) * scale}
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
              y1={(highHeight + 30) * scale}
              x2={halfWidth * scale}
              y2={(highHeight + 30) * scale}
              label={dimLabel(wallWidth)}
              color={DRAWING_COLORS.dimension}
              flipped
            />

            {/* Low wall height (left side - back) */}
            <DimensionLineSVG
              x1={(-halfWidth - 30) * scale}
              y1={0}
              x2={(-halfWidth - 30) * scale}
              y2={lowHeight * scale}
              label={dimLabel(lowHeight)}
              color={DRAWING_COLORS.dimension}
              flipped
            />

            {/* High wall height (right side - front) */}
            <DimensionLineSVG
              x1={(halfWidth + 30) * scale}
              y1={0}
              x2={(halfWidth + 30) * scale}
              y2={highHeight * scale}
              label={dimLabel(highHeight)}
              color={DRAWING_COLORS.dimension}
              flipped
            />

            {/* Roof rise */}
            <DimensionLineSVG
              x1={(halfWidth + 45) * scale}
              y1={lowHeight * scale}
              x2={(halfWidth + 45) * scale}
              y2={highHeight * scale}
              label={`+${dimLabel(roofRise)}`}
              color="#9CA3AF"
              flipped
            />

            {/* Window dimensions */}
            {showOpenings && openingFraming && (
              <>
                {/* Window width */}
                <DimensionLineSVG
                  x1={(openingFraming.centerX - WINDOW_WIDTH / 2) * scale}
                  y1={(openingFraming.sillY - 0.15) * scale}
                  x2={(openingFraming.centerX + WINDOW_WIDTH / 2) * scale}
                  y2={(openingFraming.sillY - 0.15) * scale}
                  label={dimLabel(WINDOW_WIDTH)}
                  color="#9CA3AF"
                  flipped
                />
                {/* Window height */}
                <DimensionLineSVG
                  x1={(-halfWidth - 50) * scale}
                  y1={(openingFraming.sillY - SILL_HEIGHT / 2) * scale}
                  x2={(-halfWidth - 50) * scale}
                  y2={
                    (openingFraming.sillY - SILL_HEIGHT / 2 + WINDOW_HEIGHT) *
                    scale
                  }
                  label={dimLabel(WINDOW_HEIGHT)}
                  color="#9CA3AF"
                  flipped
                />
                {/* Sill height - counter-transform for flipped Y */}
                <text
                  x={(-halfWidth - 55) * scale}
                  y={(openingFraming.sillY / 2) * scale}
                  textAnchor="end"
                  fontSize="6"
                  fill={DRAWING_COLORS.dimension}
                  transform={`scale(1,-1) translate(0,${-openingFraming.sillY * scale})`}
                >
                  {dimLabel(openingFraming.sillY - SILL_HEIGHT / 2)} sill
                </text>
              </>
            )}

            {/* Stud spacing indicator */}
            <text
              x={(-halfWidth + STUD_SPACING / 2) * scale}
              y={(BOTTOM_PLATE_HEIGHT + 0.15) * scale}
              textAnchor="middle"
              fontSize="6"
              fill={DRAWING_COLORS.dimension}
              transform={`scale(1,-1)`}
            >
              {dimLabel(STUD_SPACING)} OC
            </text>
          </g>
        )}
      </g>
      {/* End transform group for Y-axis flip */}

      {/* Labels - outside transform so text is right-side-up */}
      <text
        x={0}
        y={-35}
        textAnchor="middle"
        fontSize="12"
        fill={DRAWING_COLORS.outline}
        fontWeight="bold"
      >
        Side Walls (South/North) - External View
      </text>
      <text
        x={0}
        y={-20}
        textAnchor="middle"
        fontSize="9"
        fill={DRAWING_COLORS.dimension}
      >
        Rake Wall - {formatImperial(lowHeight)} to {formatImperial(highHeight)}{" "}
        ({formatImperial(roofRise)} rise)
      </text>

      {/* Side orientation labels - Y coords inverted for untransformed space */}
      <text
        x={(-halfWidth - 5) * scale}
        y={(highHeight - lowHeight - 10) * scale}
        textAnchor="end"
        fontSize="7"
        fill={DRAWING_COLORS.dimension}
      >
        ← Back (low)
      </text>
      <text
        x={(halfWidth + 5) * scale}
        y={-10}
        textAnchor="start"
        fontSize="7"
        fill={DRAWING_COLORS.dimension}
      >
        Front (high) →
      </text>

      {/* Legend - Y coord inverted for untransformed space */}
      <g transform={`translate(${-halfWidth * scale + 5}, 5)`}>
        <rect
          x="0"
          y="0"
          width="75"
          height="52"
          fill="white"
          stroke={DRAWING_COLORS.outline}
          strokeWidth="0.5"
          rx="2"
        />
        <rect x="5" y="8" width="8" height="4" fill={DRAWING_COLORS.stud} />
        <text x="18" y="12" fontSize="6" fill={DRAWING_COLORS.outline}>
          Stud (2×4)
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
          Window
        </text>
        <text x="5" y="42" fontSize="5" fill={DRAWING_COLORS.dimension}>
          16" OC spacing
        </text>
        <text x="5" y="50" fontSize="5" fill={DRAWING_COLORS.dimension}>
          24"×72" window
        </text>
      </g>
      </svg>
    </div>
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
  units = "imperial",
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
          units={units}
        />
      );
    case "back":
      return (
        <BackElevation
          showFraming={showFraming}
          showDimensions={showDimensions}
          showRoof={showRoof}
          scale={scale}
          units={units}
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
          units={units}
        />
      );
  }
}

export default ElevationView;
