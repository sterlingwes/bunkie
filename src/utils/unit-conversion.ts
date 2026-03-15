/**
 * Unit Conversion Utilities
 *
 * Converts between metric (meters, mm) and imperial (feet, inches) units.
 * Canadian construction typically uses imperial for lumber and dimensions.
 */

export type UnitSystem = "metric" | "imperial";

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Convert meters to inches
 */
export function metersToInches(meters: number): number {
  return meters * 39.3701;
}

/**
 * Convert meters to feet and inches object
 */
export function metersToFeetInches(meters: number): {
  feet: number;
  inches: number;
} {
  const totalInches = metersToInches(meters);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

/**
 * Format meters as feet and inches string
 * Examples:
 *   3.0m -> "9' 10\""
 *   2.1m -> "6' 10½\""
 *   0.61m -> "24\""
 */
export function formatImperial(
  meters: number,
  options?: { showInchesOnly?: boolean },
): string {
  const { feet, inches } = metersToFeetInches(meters);

  // For dimensions under 1 foot, show only inches
  if (feet === 0 || options?.showInchesOnly) {
    const totalInches = metersToInches(meters);
    // Round to nearest 1/4 inch
    const roundedInches = Math.round(totalInches * 4) / 4;
    return formatInches(roundedInches);
  }

  // Format as feet and inches
  const roundedInches = Math.round(inches * 2) / 2; // Round to nearest 1/2 inch
  if (roundedInches === 0) {
    return `${feet}'`;
  }
  return `${feet}' ${formatInches(roundedInches)}`;
}

/**
 * Format inches with fraction support
 * Examples: 24, 10½, 6¼, 8¾
 */
function formatInches(inches: number): string {
  const whole = Math.floor(inches);
  const fraction = inches - whole;

  let fractionStr = "";
  if (Math.abs(fraction - 0.25) < 0.01) {
    fractionStr = "¼";
  } else if (Math.abs(fraction - 0.5) < 0.01) {
    fractionStr = "½";
  } else if (Math.abs(fraction - 0.75) < 0.01) {
    fractionStr = "¾";
  }

  return `${whole}${fractionStr}"`;
}

/**
 * Format dimension with unit system toggle
 * @param meters - The dimension in meters
 * @param unitSystem - The unit system to use
 * @param options - Formatting options
 */
export function formatDimension(
  meters: number,
  unitSystem: UnitSystem,
  options?: { showMm?: boolean; showInchesOnly?: boolean },
): string {
  if (unitSystem === "imperial") {
    return formatImperial(meters, options);
  }

  // Metric - show mm or m based on size and options
  if (options?.showMm || meters < 1) {
    return `${Math.round(meters * 1000)}mm`;
  }
  return `${meters.toFixed(2)}m`;
}

/**
 * Format area in square feet or square meters
 */
export function formatArea(sqMeters: number, unitSystem: UnitSystem): string {
  if (unitSystem === "imperial") {
    const sqFeet = sqMeters * 10.7639;
    return `${sqFeet.toFixed(1)} sq ft`;
  }
  return `${sqMeters.toFixed(2)} m²`;
}

/**
 * Format length with both units (for reference)
 * Example: "9' 10\" (3.0m)"
 */
export function formatDualUnits(meters: number): string {
  return `${formatImperial(meters)} (${(meters * 1000).toFixed(0)}mm)`;
}

/**
 * Common lumber size conversions (nominal vs actual)
 */
export const LUMBER_SIZES = {
  "2x4": { width: 0.038, depth: 0.089, label: "2×4" },
  "2x6": { width: 0.038, depth: 0.14, label: "2×6" },
  "2x8": { width: 0.038, depth: 0.184, label: "2×8" },
} as const;

/**
 * Get lumber label with actual dimensions
 */
export function getLumberLabel(
  size: keyof typeof LUMBER_SIZES,
  unitSystem: UnitSystem,
): string {
  const lumber = LUMBER_SIZES[size];
  if (unitSystem === "imperial") {
    return lumber.label; // Just show nominal size
  }
  return `${lumber.label} (${(lumber.width * 1000).toFixed(0)}×${(lumber.depth * 1000).toFixed(0)}mm)`;
}
