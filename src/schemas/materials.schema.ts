// =============================================================================
// MATERIALS LIST SYSTEM TYPES
// =============================================================================

// Product categories for organizing the shopping list
export type ProductCategory =
  | "lumber"
  | "sheet-goods"
  | "insulation"
  | "windows-doors"
  | "foundation"
  | "roofing"
  | "weatherproofing"
  | "fasteners"
  | "hardware"
  | "appliances"
  | "finishing";

// Available product from a store
export interface Product {
  id: string; // "2x4-spf-8ft"
  name: string; // "2x4 SPF Lumber 8'"
  category: ProductCategory;
  subcategory?: string; // "studs", "plates", "rafters"
  dimensions: {
    length?: number; // mm
    width?: number; // mm
    thickness?: number; // mm
    area?: number; // m² (for sheet goods)
  };
  imperialDimensions?: string; // "8'" (display purposes)
  unit: string; // "pieces", "sheets", "linear m", "m²"
  price: number;
  currency: string; // "CAD"
  vendor?: string; // "Home Depot", "Local Lumber"
  sku?: string;
  notes?: string;
}

// A piece that needs to be cut from a product
export interface PieceRequirement {
  length: number; // mm
  width?: number; // mm
  quantity: number;
}

// A requirement extracted from bunkie-definition.json
export interface Requirement {
  id: string; // "stud-south-wall"
  name: string; // "2x4 Studs (South Wall)"
  category: ProductCategory;
  pieces: PieceRequirement[];
  totalLength?: number; // mm (for lumber)
  totalArea?: number; // m² (for sheet goods)
  sourceComponent: string; // component ID from bunkie-definition.json
  notes?: string;
}

// Allocation of a product to a requirement
export interface Allocation {
  requirementId: string;
  requirementName: string;
  piecesAllocated: number;
  lengthUsed?: number; // mm
}

// Item in the shopping list
export interface ShoppingItem {
  productId: string; // references products.json
  product: Product; // denormalized for display
  quantity: number; // how many to buy
  allocatedTo: Allocation[]; // which requirements this satisfies
  waste: number; // unused material
  wasteUnit: string; // "mm", "m²", "pieces"
  wastePercentage: number; // percentage of waste
  subtotal: number; // quantity × price
}

// The complete shopping list
export interface ShoppingList {
  generated: string; // ISO timestamp
  items: ShoppingItem[];
  totals: {
    estimatedCost: number;
    currency: string;
    totalWastePercentage: number;
  };
  byCategory: Record<ProductCategory, ShoppingItem[]>;
}

// Mapping from requirement type to product ID
export interface ProductMapping {
  requirementType: string; // "stud", "plate", "rafter", etc.
  productId: string; // product ID from products.json
  notes?: string;
}

// Collection of product mappings
export interface ProductMappings {
  mappings: ProductMapping[];
}

// Helper type for bin packing
export interface BinPackingResult {
  bins: Bin[];
  totalWaste: number;
  wastePercentage: number;
}

export interface Bin {
  productId: string;
  capacity: number; // mm
  used: number; // mm
  items: {
    length: number;
    requirementId: string;
  }[];
}

// Category display info
export const CATEGORY_INFO: Record<
  ProductCategory,
  { label: string; order: number }
> = {
  lumber: { label: "Lumber", order: 1 },
  "sheet-goods": { label: "Sheet Goods", order: 2 },
  insulation: { label: "Insulation", order: 3 },
  "windows-doors": { label: "Windows & Doors", order: 4 },
  foundation: { label: "Foundation", order: 5 },
  roofing: { label: "Roofing", order: 6 },
  weatherproofing: { label: "Weatherproofing", order: 7 },
  fasteners: { label: "Fasteners", order: 8 },
  hardware: { label: "Hardware", order: 9 },
  appliances: { label: "Appliances", order: 10 },
  finishing: { label: "Finishing", order: 11 },
};
