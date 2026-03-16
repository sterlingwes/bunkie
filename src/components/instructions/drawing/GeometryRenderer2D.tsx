/**
 * 2D Geometry Renderer (SVG)
 *
 * Renders geometry primitives using SVG.
 * Consumes the SAME unified primitives as the 3D renderer.
 */

import { useMemo } from "react";
import type { GeometryPrimitive } from "../../../geometry/primitives";
import { MATERIAL_COLORS } from "../../../geometry/primitives";
import {
  primitiveToSVG,
  calculateViewBox,
  type ViewDirection,
  type SVGElementData,
} from "../../../geometry/projection";
import { getSegmentsForView } from "../../../geometry/wall-factory";

// =============================================================================
// MAIN RENDERER
// =============================================================================

interface GeometryRenderer2DProps {
  view: ViewDirection;
  showFraming?: boolean;
  showSheathing?: boolean;
  scale?: number;
  className?: string;
  wallId?: "west" | "east" | "north" | "south";
}

export function GeometryRenderer2D({
  view,
  showFraming = true,
  showSheathing = true,
  scale = 100,
  className,
  wallId,
}: GeometryRenderer2DProps) {
  // For now, only handle elevation views
  const isElevation = view !== "top";
  const segments = useMemo(() => {
    if (isElevation) {
      return getSegmentsForView(
        view as "front" | "back" | "left" | "right",
        wallId,
      );
    }
    return [];
  }, [view, isElevation, wallId]);

  // Extract primitives from segments
  const primitives = useMemo(
    () => segments.map((s) => s.primitive),
    [segments],
  );

  // Filter by visibility
  const visiblePrimitives = useMemo(() => {
    return primitives.filter((p) => {
      if (!showFraming && p.material === "framing") return false;
      if (!showSheathing && p.material === "sheathing") return false;
      return true;
    });
  }, [primitives, showFraming, showSheathing]);

  // Convert to SVG element data
  const svgElements = useMemo(() => {
    const elements: (SVGElementData & { primitive: GeometryPrimitive })[] = [];

    for (const primitive of visiblePrimitives) {
      const svgData = primitiveToSVG(primitive, view, scale);
      elements.push(...svgData.map((el) => ({ ...el, primitive })));
    }

    // Sort by z-order (back to front)
    return elements.sort((a, b) => a.zOrder - b.zOrder);
  }, [visiblePrimitives, view, scale]);

  // Calculate viewBox
  const viewBox = useMemo(
    () => calculateViewBox(visiblePrimitives, view, scale, 60),
    [visiblePrimitives, view, scale],
  );

  // Calculate max Y for proper rendering (floor at bottom)
  const maxY = useMemo(() => {
    let maxY = 0;
    for (const el of svgElements) {
      if (
        el.type === "rect" &&
        typeof el.props.y === "number" &&
        typeof el.props.height === "number"
      ) {
        maxY = Math.max(maxY, el.props.y / scale + el.props.height / scale);
      }
    }
    return maxY;
  }, [svgElements, scale]);

  return (
    <div className={className || "w-full h-full overflow-hidden bg-white"}>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* Transform to flip Y axis - moves floor to bottom of SVG */}
        <g transform={`translate(0, ${maxY * scale}) scale(1, -1)`}>
          {svgElements.map((el, i) => (
            <SVGElement key={el.props["data-id"] || i} element={el} />
          ))}
        </g>
      </svg>
    </div>
  );
}

// =============================================================================
// SVG ELEMENT RENDERER
// =============================================================================

interface SVGElementProps {
  element: SVGElementData & { primitive: GeometryPrimitive };
}

function SVGElement({ element }: SVGElementProps) {
  const { type, props, primitive } = element;
  const colors = MATERIAL_COLORS[primitive.material];

  // Material-specific styling
  const isOpening = primitive.material === "opening";
  const isSheathing = primitive.material === "sheathing";

  const strokeColor = isOpening
    ? "#87CEEB"
    : isSheathing
      ? "#D1D5DB"
      : "#374151";
  const strokeWidth = isSheathing ? 0.5 : 1.5;

  // Common props
  const commonProps = {
    fill: isOpening ? "rgba(135, 206, 235, 0.15)" : colors.primary,
    stroke: strokeColor,
    strokeWidth,
    ...(isOpening ? { strokeDasharray: "4 2" } : {}),
    ...props,
  };

  switch (type) {
    case "rect":
      return <rect {...commonProps} />;
    case "polygon":
      return <polygon {...commonProps} />;
    case "line":
      return <line {...commonProps} />;
    default:
      return null;
  }
}

// =============================================================================
// HELPER
// =============================================================================

// getMaxY logic is inlined in useMemo above

// =============================================================================
// CONVENIENCE COMPONENTS FOR SPECIFIC VIEWS
// =============================================================================

export function FrontElevation2D(props: Omit<GeometryRenderer2DProps, "view">) {
  return <GeometryRenderer2D view="front" {...props} />;
}

export function BackElevation2D(props: Omit<GeometryRenderer2DProps, "view">) {
  return <GeometryRenderer2D view="back" {...props} />;
}

export function LeftElevation2D(props: Omit<GeometryRenderer2DProps, "view">) {
  return <GeometryRenderer2D view="left" {...props} />;
}

export function RightElevation2D(props: Omit<GeometryRenderer2DProps, "view">) {
  return <GeometryRenderer2D view="right" {...props} />;
}
