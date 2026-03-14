/**
 * MaterialsList
 *
 * Displays materials required for a step, pulled from component
 * definitions in bunkie-definition.json.
 */

import { Package } from "lucide-react";
import type { Component } from "../../schemas/bunkie.schema";

export interface MaterialsListProps {
  components: Component[];
  componentIds: string[];
}

interface MaterialSummary {
  name: string;
  quantity: number;
  unit: string;
  totalQuantity: number;
}

/**
 * Aggregate materials from multiple components
 */
function aggregateMaterials(
  components: Component[],
  componentIds: string[],
): MaterialSummary[] {
  const materialMap = new Map<string, MaterialSummary>();

  // Create a map for quick component lookup by ID
  const componentMap = new Map<string, Component>();
  components.forEach((c) => componentMap.set(c.id, c));

  // Filter components by IDs
  const relevantComponents = components.filter((c) =>
    componentIds.some(
      (id) =>
        c.id === id || c.id.startsWith(`${id}-`) || id.startsWith(`${c.id}-`),
    ),
  );

  // Also include child components (recursively)
  const allComponents: Component[] = [...relevantComponents];
  const visited = new Set<string>();

  function addChildComponents(parent: Component) {
    if (parent.children) {
      parent.children.forEach((childId) => {
        if (!visited.has(childId)) {
          visited.add(childId);
          const childComponent = componentMap.get(childId);
          if (childComponent) {
            allComponents.push(childComponent);
            addChildComponents(childComponent);
          }
        }
      });
    }
  }
  relevantComponents.forEach((c) => {
    visited.add(c.id);
    addChildComponents(c);
  });

  // Aggregate materials
  allComponents.forEach((component) => {
    if (component.materials) {
      component.materials.forEach((material) => {
        const key = `${material.name}-${material.unit}`;
        const existing = materialMap.get(key);
        if (existing) {
          existing.totalQuantity += material.quantity;
        } else {
          materialMap.set(key, {
            name: material.name,
            quantity: material.quantity,
            unit: material.unit,
            totalQuantity: material.quantity,
          });
        }
      });
    }
  });

  return Array.from(materialMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function MaterialsList({
  components,
  componentIds,
}: MaterialsListProps) {
  const materials = aggregateMaterials(components, componentIds);

  if (materials.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
        <Package size={16} />
        Materials Needed
      </h3>
      <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1.5">
        {materials.map((material, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{material.name}</span>
            <span className="text-zinc-300 font-medium">
              {material.totalQuantity.toLocaleString()} {material.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MaterialsList;
