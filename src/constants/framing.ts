/**
 * Framing Constants
 *
 * These constants define the standard framing dimensions used throughout
 * the bunkie construction. All measurements are in meters.
 *
 * Based on Ontario Building Code standard framing practices.
 */

// =============================================================================
// WALL HEIGHTS & LENGTHS
// =============================================================================

// Wall heights for shed roof construction
// Back wall (east) is LOW, Front wall (west) is HIGH
export const BACK_WALL_HEIGHT = 2.1;   // Low wall height (meters)
export const FRONT_WALL_HEIGHT = 2.4;  // High wall height (+30cm rise for 5° pitch)

// Wall lengths (from bunkie floor dimensions)
export const SIDE_WALL_LENGTH = 3.28;  // South and North walls (along Z axis)
export const FRONT_WALL_LENGTH = 3.0;  // West wall (front, +Z)
export const BACK_WALL_LENGTH = 3.0;   // East wall (back, -Z)

// =============================================================================
// LUMBER DIMENSIONS (actual vs nominal)
// =============================================================================

// 2x4 actual: 38mm x 89mm
export const STUD_WIDTH = 0.038;      // 2x4 actual width: 38mm
export const STUD_DEPTH = 0.089;      // 2x4 actual depth: 89mm
export const STUD_HALF_WIDTH = 0.019; // Half of 2x4 width

// 2x6 actual: 38mm x 140mm
export const RAFTER_HEIGHT = 0.14;    // 2x6 actual depth: 140mm
export const RAFTER_THICKNESS = 0.038; // 2x6 actual thickness: 38mm

// 2x8 actual: 38mm x 184mm
export const JOIST_HEIGHT = 0.184;    // 2x8 actual depth: 184mm
export const JOIST_WIDTH = 0.038;     // 2x8 actual thickness: 38mm

// =============================================================================
// PLATE DIMENSIONS
// =============================================================================

export const BOTTOM_PLATE_HEIGHT = 0.038;  // Single 2x4 bottom plate
export const TOP_PLATE_HEIGHT = 0.076;     // Double 2x4 top plate (2 × 38mm)
export const PLATE_DEPTH = 0.089;          // Standard 2x4 depth

// =============================================================================
// HEADER & SILL DIMENSIONS
// =============================================================================

export const HEADER_HEIGHT = 0.089;  // Double 2x4 header
export const SILL_HEIGHT = 0.089;    // Single 2x4 sill

// =============================================================================
// SPACING
// =============================================================================

export const STUD_SPACING = 0.406;   // 16" OC in meters
export const RAFTER_SPACING = 0.406; // 16" OC in meters
export const JOIST_SPACING = 0.4;    // ~16" OC for floor joists

// =============================================================================
// WINDOW DIMENSIONS (24" x 72" window)
// =============================================================================

export const WINDOW_WIDTH = 0.61;
export const WINDOW_HEIGHT = 1.83;
export const WINDOW_SHIM_ALLOWANCE = 0.02; // 20mm shim allowance each side
export const WINDOW_RO_HALF_WIDTH = WINDOW_WIDTH / 2 + WINDOW_SHIM_ALLOWANCE; // Rough opening half-width

// Window frame dimensions
export const WINDOW_FRAME_WIDTH = 0.02;
export const WINDOW_FRAME_DEPTH = 0.05;
export const WINDOW_GLASS_THICKNESS = 0.005;
export const WINDOW_GLASS_OPACITY = 0.4;

// =============================================================================
// DOOR DIMENSIONS (72.5" x 80" sliding door)
// =============================================================================

export const DOOR_WIDTH = 1.84;
export const DOOR_HEIGHT = 2.03;
export const DOOR_SHIM_ALLOWANCE = 0.0125; // 12.5mm shim allowance each side
export const DOOR_RO_HALF_WIDTH = DOOR_WIDTH / 2 + DOOR_SHIM_ALLOWANCE; // Rough opening half-width

// Door frame dimensions
export const DOOR_FRAME_WIDTH = 0.04;
export const DOOR_FRAME_DEPTH = 0.08;
export const DOOR_GLASS_THICKNESS = 0.005;
export const DOOR_GLASS_OPACITY = 0.4;

// Door handle dimensions
export const DOOR_HANDLE_WIDTH = 0.03;
export const DOOR_HANDLE_HEIGHT = 0.15;
export const DOOR_HANDLE_DEPTH = 0.02;
export const DOOR_HANDLE_OFFSET = 0.15;

// =============================================================================
// SHEATHING DIMENSIONS
// =============================================================================

export const SHEATHING_THICKNESS = 0.011; // 7/16" OSB (11mm)
export const SHEATHING_OFFSET = 0.048;    // Offset from wall center to exterior
export const SHEATHING_TOP_BUFFER = 0.05; // Extra height at top for coverage

// =============================================================================
// ROOF DIMENSIONS
// =============================================================================

export const ROOF_SHEATHING_THICKNESS = 0.016; // 5/8" plywood
export const ROOF_SHINGLE_THICKNESS = 0.01;
export const ROOF_SLOPE = -0.09; // ~-5.2 degrees

// Fascia dimensions
export const FASCIA_THICKNESS = 0.025;
export const FASCIA_HEIGHT_FRONT = 0.18;
export const FASCIA_HEIGHT_BACK = 0.12;
export const FASCIA_HEIGHT_SIDE = 0.1;

// Rafter positioning
export const RAFTER_END_OFFSET = 0.05; // Distance from roof edge to first/last rafter

// =============================================================================
// FLOOR DIMENSIONS
// =============================================================================

export const SUBFLOOR_THICKNESS = 0.016; // 5/8" plywood
export const FLOOR_JOIST_OFFSET = 0.05;  // Vertical offset for joists

// =============================================================================
// FOUNDATION DIMENSIONS
// =============================================================================

export const PIER_RADIUS = 0.08;
export const PIER_HEIGHT = 0.04;
export const SKID_HEIGHT = 0.2;
export const SKID_WIDTH = 0.1;
export const CONCRETE_PAD_OVERHANG = 0.1;
export const CONCRETE_PAD_THICKNESS = 0.02;
export const PIER_BASE_Y_OFFSET = 0.22;

// =============================================================================
// WOOD STOVE DIMENSIONS
// =============================================================================

export const HEARTH_SIZE = 0.9;
export const HEARTH_THICKNESS = 0.02;
export const STOVE_LEG_SIZE = 0.03;
export const STOVE_LEG_HEIGHT = 0.06;
export const STOVE_LEG_OFFSET = 0.05;
export const STOVE_WINDOW_THICKNESS = 0.005;
export const STOVE_CHIMNEY_RADIUS = 0.075;
export const STOVE_CHIMNEY_HEIGHT = 1.5;
export const STOVE_CHIMNEY_CLEAR_RADIUS = 0.457;
export const STOVE_CHIMNEY_CLEAR_HEIGHT = 1.5;

// =============================================================================
// ANNOTATION DIMENSIONS
// =============================================================================

export const ANNOTATION_FONT_SIZE = 0.08;
export const ANNOTATION_FONT_SIZE_LARGE = 0.1;
export const ANNOTATION_OUTLINE_WIDTH = 0.01;
export const ANNOTATION_OFFSET = 0.2;
export const ANNOTATION_LINE_EXTENT = 0.05;
export const ANNOTATION_POINT_OFFSET = 0.15;

// =============================================================================
// CAMERA CONTROLS
// =============================================================================

export const CAMERA_MOVE_SPEED = 0.05;
export const CAMERA_DAMPING_FACTOR = 0.05;

// =============================================================================
// GRID HELPER
// =============================================================================

export const GRID_CELL_SIZE = 0.5;
export const GRID_CELL_THICKNESS = 0.5;

// =============================================================================
// TOLERANCES & THRESHOLDS
// =============================================================================

export const STUD_POSITION_TOLERANCE = 0.02; // Tolerance for detecting stud positions
export const KING_STUD_POSITION_TOLERANCE = 0.02;
