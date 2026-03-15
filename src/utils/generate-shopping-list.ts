/**
 * Shopping List Generator
 *
 * Combines requirements extraction, product mapping, and bin packing
 * to generate an optimized shopping list with waste calculations.
 */

import type { BunkieDefinition } from "../schemas/bunkie.schema";
import type {
  Product,
  Requirement,
  ShoppingList,
  ShoppingItem,
  Allocation,
  ProductCategory,
  ProductMapping,
} from "../schemas/materials.schema";
import { CATEGORY_INFO } from "../schemas/materials.schema";
import { extractRequirements } from "./extract-requirements";
import { binPackPieces, calculateSheetGoods } from "./bin-packing";

// Import data files
import productsData from "../data/products.json";
import productMappingData from "../data/product-mapping.json";

// Cast products to have proper ProductCategory type
const products = productsData.products as unknown as Product[];

/**
 * Get product by ID from products catalog
 */
function getProductById(productId: string): Product | undefined {
  return products.find((p) => p.id === productId);
}

/**
 * Get product mapping for a requirement type
 */
function getProductMapping(
  requirementType: string,
): ProductMapping | undefined {
  return productMappingData.mappings.find(
    (m) => m.requirementType === requirementType,
  );
}

/**
 * Determine requirement type from requirement ID
 */
function getRequirementTypeFromId(requirementId: string): string {
  // Extract type from ID like "req-stud" -> "stud"
  const parts = requirementId.split("-");
  if (parts.length >= 2) {
    return parts.slice(1).join("-");
  }
  return requirementId;
}

/**
 * Calculate quantity needed for a requirement given a product
 */
function calculateQuantityNeeded(
  requirement: Requirement,
  product: Product,
): {
  quantity: number;
  waste: number;
  wasteUnit: string;
  wastePercentage: number;
  allocations: Allocation[];
} {
  const allocations: Allocation[] = [];

  // Handle different product types
  if (
    product.category === "lumber" &&
    product.dimensions.length &&
    requirement.pieces.some((p) => p.length > 0)
  ) {
    // Lumber - use bin packing
    const stockLength = product.dimensions.length;
    const result = binPackPieces(requirement.pieces, stockLength, product.id);

    // Create allocations from bins
    const groupedByReq = new Map<
      string,
      { count: number; totalLength: number }
    >();
    for (const bin of result.bins) {
      for (const item of bin.items) {
        const existing = groupedByReq.get(item.requirementId) || {
          count: 0,
          totalLength: 0,
        };
        existing.count++;
        existing.totalLength += item.length;
        groupedByReq.set(item.requirementId, existing);
      }
    }

    for (const [reqId, data] of groupedByReq) {
      allocations.push({
        requirementId: reqId || requirement.id,
        requirementName: requirement.name,
        piecesAllocated: data.count,
        lengthUsed: data.totalLength,
      });
    }

    // Add overall allocation if none created
    if (allocations.length === 0) {
      const totalPieces = requirement.pieces.reduce(
        (sum, p) => sum + p.quantity,
        0,
      );
      allocations.push({
        requirementId: requirement.id,
        requirementName: requirement.name,
        piecesAllocated: totalPieces,
        lengthUsed: requirement.totalLength || 0,
      });
    }

    return {
      quantity: result.bins.length,
      waste: result.totalWaste,
      wasteUnit: "mm",
      wastePercentage: result.wastePercentage,
      allocations,
    };
  }

  if (
    product.category === "sheet-goods" &&
    product.dimensions.area &&
    requirement.totalArea
  ) {
    // Sheet goods
    const result = calculateSheetGoods(
      requirement.totalArea,
      product.dimensions.area,
    );

    allocations.push({
      requirementId: requirement.id,
      requirementName: requirement.name,
      piecesAllocated: result.sheetsNeeded,
    });

    return {
      quantity: result.sheetsNeeded,
      waste: result.waste,
      wasteUnit: "m²",
      wastePercentage: result.wastePercentage,
      allocations,
    };
  }

  if (product.category === "insulation" && requirement.totalArea) {
    // Insulation (area-based)
    allocations.push({
      requirementId: requirement.id,
      requirementName: requirement.name,
      piecesAllocated: Math.ceil(requirement.totalArea),
    });

    return {
      quantity: Math.ceil(requirement.totalArea),
      waste: 0,
      wasteUnit: "m²",
      wastePercentage: 0,
      allocations,
    };
  }

  // Count-based items (fasteners, hardware, windows, doors, etc.)
  const totalQuantity = requirement.pieces.reduce(
    (sum, p) => sum + p.quantity,
    0,
  );

  allocations.push({
    requirementId: requirement.id,
    requirementName: requirement.name,
    piecesAllocated: totalQuantity,
  });

  return {
    quantity: totalQuantity,
    waste: 0,
    wasteUnit: "pieces",
    wastePercentage: 0,
    allocations,
  };
}

/**
 * Merge items with the same product to avoid duplicates
 */
function mergeItems(items: ShoppingItem[]): ShoppingItem[] {
  const merged = new Map<string, ShoppingItem>();

  for (const item of items) {
    const existing = merged.get(item.productId);
    if (existing) {
      // Add to existing item
      existing.quantity += item.quantity;
      existing.subtotal += item.subtotal;
      existing.waste += item.waste;
      existing.allocatedTo.push(...item.allocatedTo);

      // Recalculate waste percentage
      const totalMaterial =
        existing.quantity *
        (existing.product.dimensions.length ||
          existing.product.dimensions.area ||
          1);
      existing.wastePercentage =
        totalMaterial > 0 ? (existing.waste / totalMaterial) * 100 : 0;
    } else {
      merged.set(item.productId, { ...item });
    }
  }

  return Array.from(merged.values());
}

/**
 * Generate a complete shopping list from a bunkie definition
 */
export function generateShoppingList(
  definition: BunkieDefinition,
): ShoppingList {
  // Extract requirements
  const requirements = extractRequirements(definition);

  // Generate shopping items
  const items: ShoppingItem[] = [];

  for (const requirement of requirements) {
    // Get requirement type
    const reqType = getRequirementTypeFromId(requirement.id);

    // Find product mapping
    const mapping = getProductMapping(reqType);
    if (!mapping) {
      console.warn(`No product mapping found for requirement type: ${reqType}`);
      continue;
    }

    // Get product
    const product = getProductById(mapping.productId);
    if (!product) {
      console.warn(`Product not found: ${mapping.productId}`);
      continue;
    }

    // Calculate quantity needed
    const calc = calculateQuantityNeeded(requirement, product);

    // Create shopping item
    const item: ShoppingItem = {
      productId: product.id,
      product,
      quantity: calc.quantity,
      allocatedTo: calc.allocations,
      waste: calc.waste,
      wasteUnit: calc.wasteUnit,
      wastePercentage: calc.wastePercentage,
      subtotal: calc.quantity * product.price,
    };

    items.push(item);
  }

  // Merge duplicate items
  const mergedItems = mergeItems(items);

  // Sort by category order
  mergedItems.sort((a, b) => {
    const orderA = CATEGORY_INFO[a.product.category]?.order || 99;
    const orderB = CATEGORY_INFO[b.product.category]?.order || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.product.name.localeCompare(b.product.name);
  });

  // Group by category
  const byCategory: Record<ProductCategory, ShoppingItem[]> = {} as Record<
    ProductCategory,
    ShoppingItem[]
  >;
  for (const item of mergedItems) {
    if (!byCategory[item.product.category]) {
      byCategory[item.product.category] = [];
    }
    byCategory[item.product.category].push(item);
  }

  // Calculate totals
  const estimatedCost = mergedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  const totalWastePercentage =
    mergedItems.length > 0
      ? mergedItems.reduce((sum, item) => sum + item.wastePercentage, 0) /
        mergedItems.length
      : 0;

  return {
    generated: new Date().toISOString(),
    items: mergedItems,
    totals: {
      estimatedCost,
      currency: "CAD",
      totalWastePercentage: Math.round(totalWastePercentage * 10) / 10,
    },
    byCategory,
  };
}

/**
 * Get all unique products from the catalog
 */
export function getAllProducts(): Product[] {
  return products;
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}
