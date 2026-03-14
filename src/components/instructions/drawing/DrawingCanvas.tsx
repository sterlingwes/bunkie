/**
 * DrawingCanvas
 *
 * SVG viewport container for 2D architectural drawings.
 * Provides consistent viewBox and styling for all drawing views.
 */

import type { ReactNode } from "react";

export interface DrawingCanvasProps {
  children: ReactNode;
  width?: number;
  height?: number;
  viewBox?: string;
  className?: string;
  showGrid?: boolean;
}

export function DrawingCanvas({
  children,
  width = 600,
  height = 400,
  viewBox,
  className = "",
  showGrid = true,
}: DrawingCanvasProps) {
  const defaultViewBox = viewBox || `${-width / 2} ${-height / 2} ${width} ${height}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={defaultViewBox}
      className={`bg-white ${className}`}
      style={{ maxHeight: "100%" }}
    >
      {/* Grid pattern definition */}
      <defs>
        <pattern
          id="grid"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
          patternTransform="translate(-300, -200)"
        >
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      {/* Background grid */}
      {showGrid && (
        <rect x="-300" y="-200" width="600" height="400" fill="url(#grid)" />
      )}

      {/* Drawing content */}
      {children}
    </svg>
  );
}
