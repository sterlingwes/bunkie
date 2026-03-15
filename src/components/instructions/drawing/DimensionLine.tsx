/**
 * DimensionLine
 *
 * Reusable SVG component for dimension lines with arrows and labels.
 */

import type { DimensionLine2D } from "../../../schemas/bunkie.schema";

export interface DimensionLineProps {
  dimension: DimensionLine2D;
  scale?: number;
  color?: string;
  fontSize?: number;
}

export function DimensionLine({
  dimension,
  scale = 1,
  color = "#6B7280",
  fontSize = 10,
}: DimensionLineProps) {
  const { start, end, label } = dimension;

  // Calculate line properties
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Midpoint for label
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Arrow marker size
  const arrowSize = 6;

  // Determine if horizontal or vertical for label offset
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  const labelOffset = isHorizontal ? -15 : 15;

  return (
    <g className="dimension-line">
      {/* Main dimension line */}
      <line
        x1={start.x * scale}
        y1={start.y * scale}
        x2={end.x * scale}
        y2={end.y * scale}
        stroke={color}
        strokeWidth="1"
      />

      {/* Extension lines */}
      <line
        x1={start.x * scale}
        y1={start.y * scale - (isHorizontal ? 5 : 0)}
        x2={start.x * scale}
        y2={start.y * scale + (isHorizontal ? 5 : 0)}
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      <line
        x1={end.x * scale}
        y1={end.y * scale - (isHorizontal ? 5 : 0)}
        x2={end.x * scale}
        y2={end.y * scale + (isHorizontal ? 5 : 0)}
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />

      {/* Start arrow */}
      <polygon
        points={`
          ${start.x * scale},${start.y * scale}
          ${start.x * scale + (isHorizontal ? arrowSize : -arrowSize / 2)},${start.y * scale - arrowSize / 2}
          ${start.x * scale + (isHorizontal ? arrowSize : arrowSize / 2)},${start.y * scale + arrowSize / 2}
        `}
        fill={color}
      />

      {/* End arrow */}
      <polygon
        points={`
          ${end.x * scale},${end.y * scale}
          ${end.x * scale - (isHorizontal ? arrowSize : -arrowSize / 2)},${end.y * scale - arrowSize / 2}
          ${end.x * scale - (isHorizontal ? arrowSize : arrowSize / 2)},${end.y * scale + arrowSize / 2}
        `}
        fill={color}
      />

      {/* Label */}
      <text
        x={midX * scale}
        y={midY * scale + labelOffset}
        textAnchor="middle"
        fontSize={fontSize}
        fill={color}
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * DimensionLineSVG
 *
 * A simpler dimension line that takes raw coordinates
 */
export interface DimensionLineSVGProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  color?: string;
  offset?: number;
  flipped?: boolean; // Set to true when inside a Y-flipped transform group
}

export function DimensionLineSVG({
  x1,
  y1,
  x2,
  y2,
  label,
  color = "#6B7280",
  flipped = false,
}: DimensionLineSVGProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const isHorizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);

  // Counter-transform for text when inside a Y-flipped group
  const textTransform = flipped ? "scale(1,-1)" : undefined;

  return (
    <g className="dimension-line-svg">
      {/* Main line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" />

      {/* End ticks */}
      {!isHorizontal && (
        <>
          <line
            x1={x1 - 4}
            y1={y1}
            x2={x1 + 4}
            y2={y1}
            stroke={color}
            strokeWidth="1"
          />
          <line
            x1={x2 - 4}
            y1={y2}
            x2={x2 + 4}
            y2={y2}
            stroke={color}
            strokeWidth="1"
          />
        </>
      )}
      {isHorizontal && (
        <>
          <line
            x1={x1}
            y1={y1 - 4}
            x2={x1}
            y2={y1 + 4}
            stroke={color}
            strokeWidth="1"
          />
          <line
            x1={x2}
            y1={y2 - 4}
            x2={x2}
            y2={y2 + 4}
            stroke={color}
            strokeWidth="1"
          />
        </>
      )}

      {/* Label background and text - with counter-transform if flipped */}
      <g transform={textTransform}>
        {/* Label background */}
        <rect
          x={midX - 25}
          y={midY - 8}
          width="50"
          height="16"
          fill="white"
          rx="2"
        />

        {/* Label text */}
        <text
          x={midX}
          y={midY + 4}
          textAnchor="middle"
          fontSize="10"
          fill={color}
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      </g>
    </g>
  );
}
