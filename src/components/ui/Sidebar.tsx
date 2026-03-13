import { useBunkieStore } from '../../store/useBunkieStore';
import { PhasesPanel } from './PhasesPanel';
import { ComponentDetails } from './ComponentDetails';
import type { BunkieDefinition } from '../../schemas/bunkie.schema';

interface SidebarProps {
  definition: BunkieDefinition;
}

export function Sidebar({ definition }: SidebarProps) {
  const { selectedComponentId, getComponentById } = useBunkieStore();
  const selectedComponent = selectedComponentId ? getComponentById(selectedComponentId) : null;

  return (
    <div className="w-80 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold text-white">{definition.meta.name}</h1>
        <p className="text-sm text-zinc-400 mt-1">{definition.meta.description}</p>
        <div className="flex gap-4 mt-3">
          <div className="text-sm">
            <span className="text-zinc-500">Area: </span>
            <span className="text-white font-medium">{definition.meta.totalArea} m²</span>
          </div>
          <div className="text-sm">
            <span className="text-zinc-500">Cost: </span>
            <span className="text-emerald-400 font-medium">${definition.meta.totalCost.toLocaleString()} {definition.meta.currency}</span>
          </div>
        </div>
      </div>

      {/* Phases Panel */}
      <PhasesPanel phases={definition.phases} />

      {/* Component Details */}
      {selectedComponent ? (
        <ComponentDetails component={selectedComponent} />
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-zinc-500 text-sm text-center">
            Click on a component in the 3D view to see details
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800 text-xs text-zinc-600">
        <div className="flex items-center justify-between">
          <span>Ontario Building Code</span>
          <span>CSA B365</span>
        </div>
      </div>
    </div>
  );
}
