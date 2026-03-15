/**
 * Requirements Extraction Utility
 *
 * Parses bunkie-definition.json and extracts all materials needed,
 * converting them into cut lists organized by material type.
 */

import type { BunkieDefinition, MaterialRef } from "../schemas/bunkie.schema";
import type {
  Requirement,
  PieceRequirement,
  ProductCategory,
} from "../schemas/materials.schema";

// Map bunkie material units to product categories
const UNIT_TO_CATEGORY: Record<string, ProductCategory> = {
  pieces: "lumber",
  "linear m": "lumber",
  sheets: "sheet-goods",
  "m²": "insulation",
  unit: "windows-doors",
  kit: "windows-doors",
  roll: "weatherproofing",
  bags: "foundation",
  tubes: "weatherproofing",
  cans: "weatherproofing",
  boxes: "fasteners",
  bundles: "roofing",
  gallons: "finishing",
  sets: "foundation",
};

// Material ID prefixes that map to requirement types
const MATERIAL_TYPE_PATTERNS: Record<string, string> = {
  stud: "stud",
  plate: "plate",
  rafter: "rafter",
  joist: "floor-joist",
  "rim-joist": "rim-joist",
  header: "header",
  fascia: "fascia",
  rake: "rake",
  board: "siding-board",
  batten: "batten",
  sheathing: "wall-sheathing",
  subfloor: "subfloor",
  insulation: "insulation",
  "vapor-barrier": "vapor-barrier",
  tyvek: "housewrap",
  flashing: "flashing-tape",
  window: "window",
  door: "sliding-door",
  sonotube: "sonotube",
  concrete: "concrete",
  rebar: "rebar",
  shingles: "shingles",
  "drip-edge": "drip-edge",
  underlayment: "underlayment",
  nails: "fasteners",
  screws: "fasteners",
  hanger: "joist-hanger",
  stove: "wood-stove",
  chimney: "chimney",
  hearth: "hearth",
  trim: "trim",
  "tongue-groove": "tongue-groove",
  stain: "stain",
};

/**
 * Determine the requirement type from a material ID or name
 */
function getRequirementType(material: MaterialRef): string {
  const idLower = material.id.toLowerCase();
  const nameLower = material.name.toLowerCase();

  // Check ID first
  for (const [pattern, type] of Object.entries(MATERIAL_TYPE_PATTERNS)) {
    if (idLower.includes(pattern)) {
      return type;
    }
  }

  // Check name
  for (const [pattern, type] of Object.entries(MATERIAL_TYPE_PATTERNS)) {
    if (nameLower.includes(pattern)) {
      return type;
    }
  }

  return "misc";
}

/**
 * Determine product category from material
 */
function getProductCategory(material: MaterialRef): ProductCategory {
  // Special cases based on specs
  const specs = material.specs?.toLowerCase() || "";
  if (specs.includes("window") || material.id.includes("window")) {
    return "windows-doors";
  }
  if (specs.includes("door") || material.id.includes("door")) {
    return "windows-doors";
  }
  if (specs.includes("stove") || material.id.includes("stove")) {
    return "appliances";
  }
  if (specs.includes("r-") || material.id.includes("insulation")) {
    return "insulation";
  }
  if (specs.includes("sonotube") || material.id.includes("sonotube")) {
    return "foundation";
  }

  // Map by unit
  const category = UNIT_TO_CATEGORY[material.unit];
  if (category) {
    return category;
  }

  return "lumber"; // Default
}

/**
 * Extract pieces from a material reference
 * For lumber: convert linear meters to piece lengths
 * For sheet goods: convert sheets to area
 */
function extractPieces(material: MaterialRef): PieceRequirement[] {
  const pieces: PieceRequirement[] = [];

  // Handle different unit types
  switch (material.unit) {
    case "pieces": {
      // Each piece is a separate item - use a standard length estimate
      // For studs/plates, assume 8' (2438mm) unless specified
      const length = 2438; // Default to 8' studs
      pieces.push({
        length,
        quantity: material.quantity,
      });
      break;
    }

    case "linear m": {
      // Convert linear meters to individual pieces
      // For rafters/joists, estimate actual piece length from component
      const totalMm = material.quantity * 1000;
      // Estimate based on material type
      let pieceLength = 3658; // Default 12'
      const type = getRequirementType(material);
      if (type === "rafter") {
        pieceLength = 3880; // Rafter length with overhang
      } else if (type === "rim-joist") {
        pieceLength = 3280; // Side wall length
      } else if (type === "floor-joist") {
        pieceLength = 3000; // Floor joist span
      }
      const numPieces = Math.ceil(totalMm / pieceLength);
      pieces.push({
        length: pieceLength,
        quantity: numPieces,
      });
      break;
    }

    case "sheets": {
      // Sheet goods - store as area
      pieces.push({
        length: 0, // Not applicable for sheets
        quantity: material.quantity,
      });
      break;
    }

    case "m²": {
      // Area-based materials (insulation)
      pieces.push({
        length: 0, // Not applicable
        quantity: material.quantity,
      });
      break;
    }

    case "unit":
    case "kit":
    case "roll":
    case "bags":
    case "tubes":
    case "cans":
    case "boxes":
    case "bundles":
    case "gallons":
    case "sets":
    case "lot": {
      // Count-based items
      pieces.push({
        length: 0,
        quantity: Math.ceil(material.quantity),
      });
      break;
    }

    default:
      // Unknown unit - treat as count
      pieces.push({
        length: 0,
        quantity: Math.ceil(material.quantity),
      });
  }

  return pieces;
}

/**
 * Extract all requirements from a bunkie definition
 */
export function extractRequirements(
  definition: BunkieDefinition,
): Requirement[] {
  const requirements: Requirement[] = [];
  const requirementMap = new Map<string, Requirement>();

  // Process each component
  for (const component of definition.components) {
    for (const material of component.materials) {
      const requirementType = getRequirementType(material);
      const category = getProductCategory(material);

      // Create a unique ID for this requirement
      // Group similar materials by type
      const reqId = `req-${requirementType}`;

      // Check if we already have this requirement
      const existing = requirementMap.get(reqId);

      if (existing) {
        // Add pieces to existing requirement
        const newPieces = extractPieces(material);
        newPieces.forEach((newPiece) => {
          // Find matching piece length
          const matchingPiece = existing.pieces.find(
            (p) => p.length === newPiece.length,
          );
          if (matchingPiece) {
            matchingPiece.quantity += newPiece.quantity;
          } else {
            existing.pieces.push(newPiece);
          }
        });

        // Update totals
        if (category === "lumber" || category === "roofing") {
          existing.totalLength =
            (existing.totalLength || 0) +
            material.quantity * (material.unit === "linear m" ? 1000 : 2438);
        }
        if (category === "sheet-goods" || category === "insulation") {
          existing.totalArea = (existing.totalArea || 0) + material.quantity;
        }
      } else {
        // Create new requirement
        const requirement: Requirement = {
          id: reqId,
          name: material.name,
          category,
          pieces: extractPieces(material),
          totalLength:
            category === "lumber" || category === "roofing"
              ? material.quantity * (material.unit === "linear m" ? 1000 : 2438)
              : undefined,
          totalArea:
            category === "sheet-goods" || category === "insulation"
              ? material.quantity
              : undefined,
          sourceComponent: component.id,
          notes: material.specs,
        };
        requirementMap.set(reqId, requirement);
      }
    }
  }

  // Convert map to array
  for (const requirement of requirementMap.values()) {
    requirements.push(requirement);
  }

  // Sort by category then name
  requirements.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  return requirements;
}

/**
 * Get a summary of requirements by category
 */
export function getRequirementsSummary(
  requirements: Requirement[],
): Record<ProductCategory, { count: number; totalCost: number }> {
  const summary: Record<string, { count: number; totalCost: number }> = {};

  for (const req of requirements) {
    if (!summary[req.category]) {
      summary[req.category] = { count: 0, totalCost: 0 };
    }
    summary[req.category].count += req.pieces.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );
  }

  return summary;
}
