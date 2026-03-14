/**
 * Grid
 *
 * Background grid pattern for architectural drawings.
 */

export interface GridProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export function Grid({ size = 50, color = "#E5E7EB", opacity = 1 }: GridProps) {
  return (
    <defs>
      <pattern
        id="drawing-grid"
        width={size}
        height={size}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${size} 0 L 0 0 0 ${size}`}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity={opacity}
        />
      </pattern>
    </defs>
  );
}

export interface GridBackgroundProps {
  width?: number;
  height?: number;
  gridSize?: number;
  gridColor?: string;
}

export function GridBackground({
  width = 600,
  height = 400,
  gridSize = 50,
  gridColor = "#E5E7EB",
}: GridBackgroundProps) {
  return (
    <>
      <defs>
        <pattern
          id="grid-pattern"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke={gridColor}
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill="url(#grid-pattern)"
      />
    </>
  );
}
