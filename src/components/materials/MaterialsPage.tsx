import { useMemo, useState } from "react";
import {
  ShoppingBag,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type {
  ShoppingList,
  ShoppingItem,
  ProductCategory,
} from "../../schemas/materials.schema";
import { CATEGORY_INFO } from "../../schemas/materials.schema";
import { generateShoppingList } from "../../utils/generate-shopping-list";
import bunkieDefinition from "../../data/bunkie-definition.json";
import type { BunkieDefinition } from "../../schemas/bunkie.schema";

/**
 * Format price in CAD
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Category section component
 */
function CategorySection({
  category,
  items,
  isExpanded,
  onToggle,
}: {
  category: ProductCategory;
  items: ShoppingItem[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const info = CATEGORY_INFO[category] || { label: category, order: 99 };
  const categoryTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown size={16} className="text-zinc-400" />
          ) : (
            <ChevronRight size={16} className="text-zinc-400" />
          )}
          <span className="font-medium text-white">{info.label}</span>
          <span className="text-zinc-400 text-sm">({items.length} items)</span>
        </div>
        <span className="text-amber-400 font-medium">
          {formatPrice(categoryTotal)}
        </span>
      </button>

      {isExpanded && (
        <div className="divide-y divide-zinc-700">
          {items.map((item) => (
            <ItemRow key={item.productId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual item row
 */
function ItemRow({ item }: { item: ShoppingItem }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-zinc-900">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 text-left">
            <div className="text-zinc-200">{item.product.name}</div>
            <div className="text-zinc-500 text-xs flex items-center gap-2">
              <span>
                {item.quantity} {item.product.unit}
              </span>
              {item.product.vendor && (
                <>
                  <span>•</span>
                  <span>{item.product.vendor}</span>
                </>
              )}
              {item.product.imperialDimensions && (
                <>
                  <span>•</span>
                  <span>{item.product.imperialDimensions}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-zinc-200">{formatPrice(item.subtotal)}</div>
          {item.wastePercentage > 0 && (
            <div className="text-zinc-500 text-xs">
              {item.wastePercentage.toFixed(1)}% waste
            </div>
          )}
        </div>
      </button>

      {showDetails && item.allocatedTo.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-zinc-700 bg-zinc-900">
          <div className="text-xs text-zinc-500 mb-2">Allocated to:</div>
          <div className="space-y-1">
            {item.allocatedTo.map((alloc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-zinc-400">{alloc.requirementName}</span>
                <span className="text-zinc-500">
                  {alloc.piecesAllocated} pcs
                  {alloc.lengthUsed
                    ? ` (${(alloc.lengthUsed / 304.8).toFixed(1)} ft)`
                    : ""}
                </span>
              </div>
            ))}
          </div>
          {item.product.notes && (
            <div className="mt-2 text-xs text-zinc-500 italic">
              {item.product.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Summary card component
 */
function SummaryCard({ list }: { list: ShoppingList }) {
  const totalItems = list.items.reduce((sum, item) => sum + item.quantity, 0);

  const categoriesWithItems = Object.keys(list.byCategory).filter(
    (cat) => list.byCategory[cat as ProductCategory]?.length > 0,
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-zinc-800 rounded-lg p-4">
        <div className="text-zinc-400 text-xs uppercase tracking-wide mb-1">
          Total Cost
        </div>
        <div className="text-2xl font-bold text-amber-400">
          {formatPrice(list.totals.estimatedCost)}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-4">
        <div className="text-zinc-400 text-xs uppercase tracking-wide mb-1">
          Line Items
        </div>
        <div className="text-2xl font-bold text-white">{list.items.length}</div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-4">
        <div className="text-zinc-400 text-xs uppercase tracking-wide mb-1">
          Total Units
        </div>
        <div className="text-2xl font-bold text-white">{totalItems}</div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-4">
        <div className="text-zinc-400 text-xs uppercase tracking-wide mb-1">
          Categories
        </div>
        <div className="text-2xl font-bold text-white">
          {categoriesWithItems}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Materials Page component
 */
export function MaterialsPage() {
  // Generate shopping list
  const shoppingList = useMemo(() => {
    return generateShoppingList(
      bunkieDefinition as unknown as BunkieDefinition,
    );
  }, []);

  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<
    Set<ProductCategory>
  >(
    new Set(["lumber", "sheet-goods", "insulation"]), // Default expanded
  );

  const toggleCategory = (category: ProductCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Get categories in order
  const categories = Object.entries(CATEGORY_INFO)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([cat]) => cat as ProductCategory)
    .filter(
      (cat) =>
        shoppingList.byCategory[cat] && shoppingList.byCategory[cat].length > 0,
    );

  return (
    <div className="w-full h-full bg-zinc-900 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="text-amber-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Materials List</h1>
            <p className="text-zinc-400 text-sm">
              Shopping list generated from bunkie definition
            </p>
          </div>
        </div>

        {/* Summary */}
        <SummaryCard list={shoppingList} />

        {/* Note about products */}
        <div className="flex items-start gap-2 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg mb-6">
          <AlertCircle
            className="text-amber-400 flex-shrink-0 mt-0.5"
            size={16}
          />
          <div className="text-sm text-amber-200">
            <strong>Note:</strong> Prices are estimates based on Home Depot and
            local lumber yard prices. Actual costs may vary. Products with
            "Special Order" may require longer lead times.
          </div>
        </div>

        {/* Category sections */}
        <div className="space-y-4">
          {categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              items={shoppingList.byCategory[category]}
              isExpanded={expandedCategories.has(category)}
              onToggle={() => toggleCategory(category)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-700 text-center text-zinc-500 text-xs">
          <p>Generated: {new Date(shoppingList.generated).toLocaleString()}</p>
          <p className="mt-1">
            Edit <code className="text-zinc-400">src/data/products.json</code>{" "}
            to update prices and products
          </p>
        </div>
      </div>
    </div>
  );
}
