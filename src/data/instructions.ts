/**
 * Instruction Steps Data
 *
 * Step-by-step building instructions for the bunkie.
 * All dimensions reference constants from framing.ts.
 */

import type { InstructionStep } from "../schemas/bunkie.schema";

export const instructionSteps: InstructionStep[] = [
  // =============================================================================
  // FOUNDATION PHASE
  // =============================================================================
  {
    id: "step-foundation-1",
    phase: "foundation",
    order: 1,
    title: "Site Preparation & Layout",
    description:
      "Clear the building site and establish the pier layout. Mark the corners and center points for all 6 sonotube piers on the bedrock surface.",
    views: ["plan"],
    componentIds: [
      "foundation-group",
      "pier-fl",
      "pier-ml",
      "pier-bl",
      "pier-fr",
      "pier-mr",
      "pier-br",
    ],
    tips: [
      "Use batter boards and string lines to establish square corners",
      "Verify diagonal measurements are equal for square layout",
      "Mark pier centers with spray paint on bedrock",
    ],
    warnings: [
      "Ensure site is level within 50mm across the building footprint",
      "Verify bedrock is solid and not fractured at pier locations",
    ],
  },
  {
    id: "step-foundation-2",
    phase: "foundation",
    order: 2,
    title: "Drill Bedrock & Install Anchors",
    description:
      'Drill 1/2" holes 6" deep into bedrock at each pier location. Install epoxy-set rebar pins to anchor the sonotubes to the bedrock.',
    views: ["plan", "side-view-side"],
    componentIds: [
      "pier-fl",
      "pier-ml",
      "pier-bl",
      "pier-fr",
      "pier-mr",
      "pier-br",
    ],
    tips: [
      "Use a rotary hammer drill with carbide masonry bit",
      "Clean dust from holes with compressed air before epoxy",
      "Allow epoxy to cure fully before proceeding",
    ],
    warnings: [
      "Wear eye protection and dust mask when drilling",
      "Follow epoxy manufacturer's cure time requirements",
    ],
  },
  {
    id: "step-foundation-3",
    phase: "foundation",
    order: 3,
    title: "Set Sonotube Forms",
    description:
      "Cut sonotubes to length (~400mm above grade) and position over rebar pins. Brace forms plumb and level at the top.",
    views: ["plan", "side-view-front", "side-view-side"],
    componentIds: [
      "pier-fl",
      "pier-ml",
      "pier-bl",
      "pier-fr",
      "pier-mr",
      "pier-br",
    ],
    tips: [
      "Top of all piers must be level within 3mm",
      "Use a laser level for accurate height setting",
      "Backfill around tubes to prevent movement during pour",
    ],
    warnings: [
      "Ensure sonotubes are securely braced - concrete pressure can shift forms",
    ],
  },
  {
    id: "step-foundation-4",
    phase: "foundation",
    order: 4,
    title: "Pour Concrete & Set Post Bases",
    description:
      "Pour concrete into sonotubes, vibrating to remove air pockets. Install post base connectors while concrete is still wet, aligned with the floor joist layout.",
    views: ["plan"],
    componentIds: [
      "pier-fl",
      "pier-ml",
      "pier-bl",
      "pier-fr",
      "pier-mr",
      "pier-br",
    ],
    tips: [
      "Use 4000 PSI concrete mix rated for exterior exposure",
      "Screed tops of piers smooth and level",
      "Post bases must align with rim joist positions",
    ],
    warnings: [
      "Do not add excess water to concrete - weakens the mix",
      "Ensure post bases are properly embedded but not buried",
    ],
  },
  {
    id: "step-foundation-5",
    phase: "foundation",
    order: 5,
    title: "Cure & Attach Rim Joist",
    description:
      "Allow concrete to cure minimum 7 days before loading. Attach pressure-treated rim joist to post base connectors.",
    views: ["plan", "side-view-front"],
    componentIds: ["floor-assembly"],
    tips: [
      "Keep concrete moist during cure for maximum strength",
      "Use hot-dipped galvanized connectors for corrosion resistance",
      "Rim joist must be level before proceeding to floor framing",
    ],
    warnings: ["Do not backfill against piers until concrete is fully cured"],
  },

  // =============================================================================
  // FRAMING PHASE - FLOOR
  // =============================================================================
  {
    id: "step-framing-1",
    phase: "framing",
    order: 6,
    title: "Install Floor Joists",
    description:
      'Cut and install 2x8 floor joists at 16" OC spacing between rim joists. Crown all lumber up and secure with joist hangers.',
    views: ["plan"],
    componentIds: ["floor-assembly"],
    tips: [
      "Mark joist layout on rim joists before installation",
      "Use a framing square to ensure joists are perpendicular",
      "Stagger joints if using multiple pieces",
    ],
    warnings: ['Verify joist spacing does not exceed 16" OC per OBC'],
  },
  {
    id: "step-framing-2",
    phase: "framing",
    order: 7,
    title: "Apply Subfloor",
    description:
      'Glue and screw 5/8" plywood subfloor to joists. Stagger seams and leave 1/8" gap between sheets for expansion.',
    views: ["plan"],
    componentIds: ["floor-assembly"],
    tips: [
      "Apply construction adhesive to joists before laying plywood",
      "Use deck screws, not nails, for better hold",
      "Cut subfloor flush with exterior of rim joist",
    ],
    warnings: ["Do not allow glue to skin over before placing plywood"],
  },

  // =============================================================================
  // FRAMING PHASE - WALLS
  // =============================================================================
  {
    id: "step-framing-3",
    phase: "framing",
    order: 8,
    title: "Frame Back Wall (East)",
    description:
      'Frame the back wall flat on the subfloor using 2x4 studs at 16" OC. This is the low wall at 2.1m height with no openings.',
    views: ["side-view-back", "plan"],
    componentIds: ["wall-east"],
    tips: [
      "Use a framing jig or chalk lines for consistent stud placement",
      "Install double top plate with staggered joints",
      "Square the wall before sheathing",
    ],
    warnings: ["Verify wall height matches plan - affects roof slope"],
  },
  {
    id: "step-framing-4",
    phase: "framing",
    order: 9,
    title: "Frame Front Wall (West) with Door",
    description:
      "Frame the front wall with opening for the sliding patio door. Use double king studs at the opening and proper header.",
    views: ["side-view-front", "plan"],
    componentIds: ["wall-west", "sliding-door"],
    tips: [
      "Header must be sized for the 1.84m door opening span",
      "Rough opening should be 12.5mm wider than door unit",
      'Install cripple studs above header at 16" OC',
    ],
    warnings: ["Verify header is adequately sized per OBC span tables"],
  },
  {
    id: "step-framing-5",
    phase: "framing",
    order: 10,
    title: "Frame Side Walls (South & North)",
    description:
      "Frame the rake walls with increasing height from back to front. Include window openings in both walls.",
    views: ["side-view-side", "plan"],
    componentIds: ["wall-south", "wall-north", "window-south", "window-north"],
    tips: [
      "Top plate follows roof slope - cut at 5° angle",
      "Window rough opening: 610mm + 40mm shim allowance",
      "Use full-height king studs at window openings",
    ],
    warnings: ["Rake angle must match roof slope exactly"],
  },
  {
    id: "step-framing-6",
    phase: "framing",
    order: 11,
    title: "Raise & Brace Walls",
    description:
      "Raise all walls into position, brace plumb, and temporarily secure. Verify square by measuring diagonals.",
    views: ["plan", "side-view-front"],
    componentIds: ["wall-west", "wall-east", "wall-south", "wall-north"],
    tips: [
      "Use temporary braces at 45° angles",
      "Check plumb at each corner and midpoint",
      "Diagonal measurements must be equal",
    ],
    warnings: ["Never work under a raised but unbraced wall"],
  },

  // =============================================================================
  // FRAMING PHASE - ROOF
  // =============================================================================
  {
    id: "step-framing-7",
    phase: "framing",
    order: 12,
    title: "Cut & Install Rafters",
    description:
      'Cut 2x6 rafters with birdsmouth notches to sit on wall top plates. Install at 16" OC matching wall stud positions.',
    views: ["side-view-side"],
    componentIds: ["roof-assembly"],
    tips: [
      "Make a pattern rafter first, test fit before cutting all",
      "Birdsmouth cut should not exceed 1/3 of rafter depth",
      "Use hurricane ties at rafter-to-wall connections",
    ],
    warnings: ["Verify rafter length accounts for overhang"],
  },
  {
    id: "step-framing-8",
    phase: "framing",
    order: 13,
    title: "Apply Roof Sheathing",
    description:
      'Install 5/8" plywood roof sheathing perpendicular to rafters. Stagger joints and use H-clips at unsupported edges.',
    views: ["plan", "side-view-side"],
    componentIds: ["roof-assembly"],
    tips: [
      "Start from bottom edge and work up",
      'Nail at 6" OC on edges, 12" OC in field',
      "Leave gap at ridge for ridge vent if using",
    ],
    warnings: ['Do not exceed 24" unsupported span for 5/8" plywood'],
  },
  {
    id: "step-framing-9",
    phase: "framing",
    order: 14,
    title: "Install Fascia",
    description:
      "Attach fascia boards to rafter ends. Front fascia is deeper (180mm) to accommodate gutter.",
    views: ["side-view-front", "side-view-side"],
    componentIds: ["roof-assembly"],
    tips: [
      "Fascia tops should align with roof sheathing",
      "Use exterior-grade lumber (cedar or pressure-treated)",
      "Pre-drill to avoid splitting",
    ],
    warnings: [],
  },

  // =============================================================================
  // ENVELOPE PHASE
  // =============================================================================
  {
    id: "step-envelope-1",
    phase: "envelope",
    order: 15,
    title: "Apply Housewrap",
    description:
      'Cover exterior walls with Tyvek or similar housewrap. Lap joints 6" and tape all seams.',
    views: ["side-view-front", "side-view-side"],
    componentIds: ["wall-west", "wall-east", "wall-south", "wall-north"],
    tips: [
      "Work from bottom up for proper lapping",
      "Seal around all penetrations",
      "Use cap nails for attachment",
    ],
    warnings: ["Do not leave housewrap exposed for extended periods"],
  },
  {
    id: "step-envelope-2",
    phase: "envelope",
    order: 16,
    title: "Flash & Install Windows",
    description:
      "Apply self-adhesive flashing to window rough openings (sill, jambs, head). Install windows plumb and square.",
    views: ["side-view-side"],
    componentIds: ["window-south", "window-north"],
    tips: [
      "Sill flashing goes first, then jambs, then head",
      "Shim windows at corners and midpoint",
      "Check operation before final fastening",
    ],
    warnings: ["Improper flashing is a leading cause of water damage"],
  },
  {
    id: "step-envelope-3",
    phase: "envelope",
    order: 17,
    title: "Install Sliding Door",
    description:
      "Install sliding patio door with proper drainage. Ensure threshold is level and properly sealed.",
    views: ["side-view-front", "side-view-side"],
    componentIds: ["sliding-door"],
    tips: [
      "Use sill pan flashing under threshold",
      "Ensure weep holes are not blocked",
      "Adjust rollers for smooth operation",
    ],
    warnings: ["Door must be installed level for proper drainage"],
  },
  {
    id: "step-envelope-4",
    phase: "envelope",
    order: 18,
    title: "Install Roofing",
    description:
      "Apply drip edge, underlayment, and architectural shingles. Install ridge cap at peak.",
    views: ["plan", "side-view-side"],
    componentIds: ["roof-assembly"],
    tips: [
      "Apply drip edge before underlayment on eaves",
      "Starter strip goes first, then shingles from bottom up",
      "Use proper nail placement in shingle nailing strip",
    ],
    warnings: ["Do not install shingles in high winds or extreme cold"],
  },

  // =============================================================================
  // FINISHING PHASE
  // =============================================================================
  {
    id: "step-finishing-1",
    phase: "finishing",
    order: 19,
    title: "Install Exterior Insulation",
    description:
      "Apply R-5 rigid foam insulation over housewrap. Tape all seams and corners.",
    views: ["side-view-front", "side-view-side"],
    componentIds: ["exterior-siding"],
    tips: [
      'Use 1" XPS or polyiso for R-5',
      "Seal all gaps with tape or spray foam",
      "Extend foam down to cover rim joist",
    ],
    warnings: ["Rigid foam is flammable - check local codes"],
  },
  {
    id: "step-finishing-2",
    phase: "finishing",
    order: 20,
    title: "Install Board & Batten Siding",
    description:
      "Apply vertical board and batten siding over rigid foam. Use rainscreen gap if required by local code.",
    views: ["side-view-front", "side-view-side"],
    componentIds: ["exterior-siding"],
    tips: [
      "Prime all sides of boards before installation",
      'Space boards 1/4" for expansion',
      "Fasten into studs, not just sheathing",
    ],
    warnings: ['Maintain clearance from ground (min 6")'],
  },
  {
    id: "step-finishing-3",
    phase: "finishing",
    order: 21,
    title: "Install Wall Insulation",
    description:
      "Install R-20 fiberglass batts in wall cavities between studs. Cut to fit around outlets and framing.",
    views: ["side-view-side"],
    componentIds: ["insulation-walls"],
    tips: [
      "Friction fit - no gaps or compression",
      "Use unfaced batts if exterior foam is present",
      "Cut batts with utility knife, not scissors",
    ],
    warnings: ["Wear long sleeves, gloves, and dust mask"],
  },
  {
    id: "step-finishing-4",
    phase: "finishing",
    order: 22,
    title: "Install Ceiling Insulation",
    description:
      "Install R-40 fiberglass batts in ceiling/roof cavity. Support with insulation supports.",
    views: ["side-view-side"],
    componentIds: ["insulation-ceiling"],
    tips: [
      "Higher R-value required for ceiling",
      "Do not block ventilation if using vented roof",
      "Use faced batts with vapor barrier toward interior",
    ],
    warnings: ["Do not compress insulation - reduces R-value"],
  },
  {
    id: "step-finishing-5",
    phase: "finishing",
    order: 23,
    title: "Install Vapor Barrier",
    description:
      "Apply 6mil polyethylene vapor barrier on warm side of insulation. Seal all edges and penetrations.",
    views: ["side-view-side"],
    componentIds: ["insulation-walls", "insulation-ceiling"],
    tips: [
      "Use acoustic sealant at all edges",
      'Overlap seams by 12" and tape',
      "Seal around electrical boxes with special boxes or tape",
    ],
    warnings: ["Vapor barrier must be continuous - no gaps"],
  },
  {
    id: "step-finishing-6",
    phase: "finishing",
    order: 24,
    title: "Install Interior Finish",
    description:
      "Apply tongue & groove pine to walls and ceiling. Install trim around windows and door.",
    views: ["side-view-front", "side-view-side"],
    componentIds: ["interior-finish"],
    tips: [
      "Acclimate wood in space for 1 week before installing",
      "Blind nail through tongue for invisible fastening",
      "Use construction adhesive on ceiling for extra hold",
    ],
    warnings: [],
  },
  {
    id: "step-finishing-7",
    phase: "finishing",
    order: 25,
    title: "Build Wood Stove Hearth",
    description:
      "Construct non-combustible hearth (900mm x 900mm minimum) at stove location. Extend under stove and in front of door.",
    views: ["plan"],
    componentIds: ["stove-hearth", "wood-stove"],
    tips: [
      "Use ceramic tile or stone on cement board substrate",
      "Hearth must extend 450mm in front of stove door",
      "Check stove manufacturer requirements",
    ],
    warnings: ["Hearth must be non-combustible per CSA B365"],
  },
  {
    id: "step-finishing-8",
    phase: "finishing",
    order: 26,
    title: "Install Wood Stove & Chimney",
    description:
      "Install EPA-certified wood stove per manufacturer instructions. Install chimney with proper clearances and flashing.",
    views: ["plan", "side-view-side"],
    componentIds: ["wood-stove", "stove-clearance"],
    tips: [
      "Maintain required clearances to combustibles",
      "Use double-wall chimney pipe through occupied space",
      "Install CO detector in same room",
    ],
    warnings: [
      "Improper installation is a fire hazard - follow CSA B365",
      "Have installation inspected by qualified professional",
    ],
  },
  {
    id: "step-finishing-9",
    phase: "finishing",
    order: 27,
    title: "Final Inspection & Cleanup",
    description:
      "Conduct final inspection of all work. Install CO detector, clean up site, and document the build.",
    views: ["plan"],
    componentIds: [],
    tips: [
      "Test all windows and doors for proper operation",
      "Check for any gaps in exterior sealing",
      "Document with photos for future reference",
    ],
    warnings: ["Keep CO detector at least 5m from stove for accurate reading"],
  },
];

export default instructionSteps;
