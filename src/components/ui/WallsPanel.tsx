import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useBunkieStore } from '../../store/useBunkieStore';
import { CollapsiblePanel } from './CollapsiblePanel';

interface WallInfo {
  id: string;
  name: string;
  description: string;
}

const walls: WallInfo[] = [
  { id: 'wall-west', name: 'Front (West)', description: 'Door wall - sunset view' },
  { id: 'wall-east', name: 'Back (East)', description: 'No windows - privacy' },
  { id: 'wall-south', name: 'Right (South)', description: 'Window wall' },
  { id: 'wall-north', name: 'Left (North)', description: 'Window wall' },
];

export function WallsPanel() {
  const { hiddenWalls, toggleWall, showAllWalls } = useBunkieStore();

  const hiddenCount = hiddenWalls.length;
  const visibleCount = walls.length - hiddenCount;
  const hasHiddenWalls = hiddenCount > 0;

  return (
    <CollapsiblePanel
      title="Wall Visibility"
      icon={<Eye size={16} className="text-zinc-400" />}
      badge={`${visibleCount}/${walls.length}`}
    >
      <>
        {hasHiddenWalls && (
          <div className="px-2 pt-1 pb-1 flex justify-end">
            <button
              onClick={showAllWalls}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Show all walls"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        )}
        <div className="p-2 space-y-1">
          {walls.map((wall) => {
            const isHidden = hiddenWalls.includes(wall.id);

            return (
              <button
                key={wall.id}
                onClick={() => toggleWall(wall.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                  !isHidden
                    ? 'bg-zinc-800 text-white'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {isHidden ? (
                    <EyeOff size={16} className="text-zinc-600" />
                  ) : (
                    <Eye size={16} className="text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{wall.name}</div>
                  <div className="text-xs text-zinc-500">{wall.description}</div>
                </div>
              </button>
            );
          })}
        </div>
        {hasHiddenWalls && (
          <div className="px-2 pb-2">
            <div className="text-xs text-zinc-500 bg-zinc-800/50 rounded p-2">
              Hidden walls are invisible for interior inspection.
            </div>
          </div>
        )}
      </>
    </CollapsiblePanel>
  );
}
