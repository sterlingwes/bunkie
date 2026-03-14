/**
 * Framing Constants
 *
 * These constants define the standard framing dimensions used throughout
 * the bunkie construction. All measurements are in meters.
 *
 * Based on Ontario Building Code standard framing practices.
 */

// Wall heights for shed roof construction
// Back wall (east) is LOW, Front wall (west) is HIGH
export const BACK_WALL_HEIGHT = 2.1;   // Low wall height (meters)
export const FRONT_WALL_HEIGHT = 2.4;  // High wall height (+30cm rise for 5° pitch)

// Lumber actual dimensions (nominal vs actual)
// 2x4 actual: 38mm x 89mm
export const STUD_WIDTH = 0.038;      // 2x4 actual width: 38mm
export const STUD_DEPTH = 0.089;      // 2x4 actual depth: 89mm

// Plate dimensions
export const BOTTOM_PLATE_HEIGHT = 0.038;  // Single 2x4 bottom plate
export const TOP_PLATE_HEIGHT = 0.076;     // Double 2x4 top plate (2 × 38mm)

// Header dimensions (double 2x4 = 89mm height per 2x4)
export const HEADER_HEIGHT = 0.089;  // Double 2x4 header

// Sill dimensions
export const SILL_HEIGHT = 0.089;  // Single 2x4 sill

// Stud spacing
export const STUD_SPACING = 0.406;  // 16" OC in meters

// Window dimensions (24" x 72" window)
export const WINDOW_WIDTH = 0.61;
export const WINDOW_HEIGHT = 1.83;

// Door dimensions (72.5" x 80" sliding door)
export const DOOR_WIDTH = 1.84;
export const DOOR_HEIGHT = 2.03;
