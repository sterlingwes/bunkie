import { Layers, Check } from 'lucide-react';
import { useBunkieStore } from '../../store/useBunkieStore';
import type { BuildPhase, PhaseDefinition } from '../../schemas/bunkie.schema';

interface PhasesPanelProps {
  phases: Record<BuildPhase, PhaseDefinition>;
}

const phaseColors: Record<BuildPhase, string> = {
  foundation: 'bg-amber-600',
  framing: 'bg-orange-600',
  envelope: 'bg-blue-600',
  finishing: 'bg-emerald-600',
};

const phaseOrder: BuildPhase[] = ['foundation', 'framing', 'envelope', 'finishing'];

export function PhasesPanel({ phases }: PhasesPanelProps) {
  const { visiblePhases, togglePhase } = useBunkieStore();

  return (
    <div className="border-b border-zinc-800">
      <div className="p-3 flex items-center gap-2 border-b border-zinc-800">
        <Layers size={16} className="text-zinc-400" />
        <span className="text-sm font-medium text-zinc-300">Build Phases</span>
      </div>
      <div className="p-2 space-y-1">
        {phaseOrder.map((phaseKey) => {
          const phase = phases[phaseKey];
          const isVisible = visiblePhases.includes(phaseKey);

          return (
            <button
              key={phaseKey}
              onClick={() => togglePhase(phaseKey)}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                isVisible
                  ? 'bg-zinc-800 text-white'
                  : 'bg-transparent text-zinc-500 hover:bg-zinc-800/50'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${phaseColors[phaseKey]} ${!isVisible && 'opacity-30'}`} />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{phase.name}</div>
                <div className="text-xs text-zinc-500">
                  {phase.components.length} components
                  {phase.estimatedHours && ` · ~${phase.estimatedHours}h`}
                </div>
              </div>
              {isVisible && <Check size={14} className="text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
