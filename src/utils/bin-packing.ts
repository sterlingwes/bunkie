/**
 * Bin Packing Algorithm for Lumber Optimization
 *
 * Uses First-Fit Decreasing (FFD) algorithm to minimize waste when cutting
 * multiple pieces from standard lumber lengths.
 */

import type {
  BinPackingResult,
  Bin,
  PieceRequirement,
} from "../schemas/materials.schema";

/**
 * First-Fit Decreasing bin packing algorithm
 * Sorts pieces by length descending, then places each piece in the first
 * bin that has enough remaining capacity.
 *
 * @param pieces - Array of pieces to pack (with lengths in mm)
 * @param binCapacity - Length of the stock material in mm
 * @param productId - ID of the product being used for the bin
 * @returns BinPackingResult with bins and waste calculations
 */
export function binPackPieces(
  pieces: PieceRequirement[],
  binCapacity: number,
  productId: string,
): BinPackingResult {
  // Flatten pieces into individual cuts with their requirement IDs
  const cuts: { length: number; requirementId: string }[] = [];
  pieces.forEach((piece) => {
    for (let i = 0; i < piece.quantity; i++) {
      cuts.push({
        length: piece.length,
        requirementId: "", // Will be set by caller
      });
    }
  });

  // Sort by length descending (FFD algorithm)
  const sortedCuts = [...cuts].sort((a, b) => b.length - a.length);

  // Initialize bins
  const bins: Bin[] = [];

  // Place each cut
  for (const cut of sortedCuts) {
    // Check if cut fits in bin capacity
    if (cut.length > binCapacity) {
      console.warn(
        `Cut length ${cut.length}mm exceeds bin capacity ${binCapacity}mm`,
      );
      // Still create a new bin for it (will show as over-capacity)
      bins.push({
        productId,
        capacity: binCapacity,
        used: cut.length,
        items: [cut],
      });
      continue;
    }

    // Find first bin that can fit this cut
    let placed = false;
    for (const bin of bins) {
      if (bin.capacity - bin.used >= cut.length) {
        bin.items.push(cut);
        bin.used += cut.length;
        placed = true;
        break;
      }
    }

    // If no bin can fit, create new bin
    if (!placed) {
      bins.push({
        productId,
        capacity: binCapacity,
        used: cut.length,
        items: [cut],
      });
    }
  }

  // Calculate total waste
  const totalCapacity = bins.reduce((sum, bin) => sum + bin.capacity, 0);
  const totalUsed = bins.reduce((sum, bin) => sum + bin.used, 0);
  const totalWaste = totalCapacity - totalUsed;
  const wastePercentage =
    totalCapacity > 0 ? (totalWaste / totalCapacity) * 100 : 0;

  return {
    bins,
    totalWaste,
    wastePercentage,
  };
}

/**
 * Calculate the number of boards needed for a set of cuts
 * Simplified version that just counts bins
 *
 * @param pieces - Array of pieces to pack
 * @param stockLength - Length of the stock material in mm
 * @returns Number of boards needed
 */
export function calculateBoardsNeeded(
  pieces: PieceRequirement[],
  stockLength: number,
): number {
  const result = binPackPieces(pieces, stockLength, "");
  return result.bins.length;
}

/**
 * Calculate total length of all pieces
 *
 * @param pieces - Array of pieces
 * @returns Total length in mm
 */
export function calculateTotalLength(pieces: PieceRequirement[]): number {
  return pieces.reduce((sum, piece) => sum + piece.length * piece.quantity, 0);
}

/**
 * Calculate waste for sheet goods (area-based)
 *
 * @param totalAreaNeeded - Total area needed in m²
 * @param sheetArea - Area of one sheet in m²
 * @returns Object with sheets needed and waste
 */
export function calculateSheetGoods(
  totalAreaNeeded: number,
  sheetArea: number,
): { sheetsNeeded: number; waste: number; wastePercentage: number } {
  const sheetsNeeded = Math.ceil(totalAreaNeeded / sheetArea);
  const totalArea = sheetsNeeded * sheetArea;
  const waste = totalArea - totalAreaNeeded;
  const wastePercentage = (waste / totalArea) * 100;

  return {
    sheetsNeeded,
    waste: Math.round(waste * 100) / 100, // Round to 2 decimal places
    wastePercentage: Math.round(wastePercentage * 10) / 10,
  };
}

/**
 * Calculate count-based items (fasteners, etc.)
 *
 * @param quantityNeeded - Number of items needed
 * @param packageSize - Number of items per package
 * @returns Object with packages needed and waste
 */
export function calculateCountBased(
  quantityNeeded: number,
  packageSize: number,
): { packagesNeeded: number; waste: number; wastePercentage: number } {
  const packagesNeeded = Math.ceil(quantityNeeded / packageSize);
  const totalItems = packagesNeeded * packageSize;
  const waste = totalItems - quantityNeeded;
  const wastePercentage = (waste / totalItems) * 100;

  return {
    packagesNeeded,
    waste,
    wastePercentage: Math.round(wastePercentage * 10) / 10,
  };
}

/**
 * Group pieces by their source requirement for display
 *
 * @param bins - Array of bins from packing
 * @returns Map of requirement ID to pieces
 */
export function groupPiecesByRequirement(
  bins: Bin[],
): Map<string, { count: number; totalLength: number }> {
  const grouped = new Map<string, { count: number; totalLength: number }>();

  for (const bin of bins) {
    for (const item of bin.items) {
      if (item.requirementId) {
        const existing = grouped.get(item.requirementId) || {
          count: 0,
          totalLength: 0,
        };
        existing.count++;
        existing.totalLength += item.length;
        grouped.set(item.requirementId, existing);
      }
    }
  }

  return grouped;
}
