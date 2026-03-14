import { useMemo } from 'react';
import { Grid } from '@react-three/drei';
import type { BunkieDefinition, Component, BuildPhase } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';
import { Foundation } from './Foundation';
import { Floor } from './Floor';
import { Wall } from './Walls';
import { Window } from './Windows';
import { Door } from './Door';
import { Roof } from './Roof';
import { WoodStove, ClearanceZone } from './WoodStove';
import { Annotations } from './Annotations';

interface BunkieProps {
  definition: BunkieDefinition;
}

export function Bunkie({ definition }: BunkieProps) {
  const { visiblePhases, hiddenWalls, selectedComponentId } = useBunkieStore();

  // Group components by category and phase
  const components = useMemo(() => {
    const grouped: Record<string, Component[]> = {
      foundation: [],
      floor: [],
      wall: [],
      window: [],
      door: [],
      roof: [],
      appliance: [],
    };

    definition.components.forEach((component) => {
      if (grouped[component.category]) {
        grouped[component.category].push(component);
      }
    });

    return grouped;
  }, [definition.components]);

  // Check if a phase is visible
  const isPhaseVisible = (phase: BuildPhase) => visiblePhases.includes(phase);

  // Get foundation piers
  const foundationGroup = components.foundation.find((c) => c.id === 'foundation-group');
  const piers = components.foundation.filter((c) => c.id !== 'foundation-group');

  // Get floor assembly
  const floorAssembly = components.floor.find((c) => c.id === 'floor-assembly');

  // Get walls
  const walls = components.wall.filter((c) =>
    ['wall-west', 'wall-east', 'wall-north', 'wall-south'].includes(c.id)
  );

  // Get windows and door
  const windows = components.window;
  const door = components.door.find((c) => c.id === 'sliding-door');

  // Get roof
  const roof = components.roof.find((c) => c.id === 'roof-assembly');

  // Get wood stove and clearance zone
  const woodStove = components.appliance.find((c) => c.id === 'wood-stove');
  const clearanceZone = components.appliance.find((c) => c.id === 'stove-clearance');

  // Collect all annotations
  const allAnnotations = useMemo(() => {
    return definition.components.flatMap((c) => c.annotations);
  }, [definition.components]);

  return (
    <group>
      {/* Ground grid */}
      <Grid
        position={[0, -0.41, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={15}
        fadeStrength={1}
        followCamera={false}
      />

      {/* Foundation phase */}
      {isPhaseVisible('foundation') && foundationGroup && (
        <Foundation component={foundationGroup} piers={piers} />
      )}

      {/* Framing phase */}
      {isPhaseVisible('framing') && (
        <>
          {floorAssembly && <Floor component={floorAssembly} />}
          {walls.map((wall) => {
            const hasDoor = wall.id === 'wall-west';
            const hasWindow = wall.id === 'wall-south' || wall.id === 'wall-north';
            const windowPosition = wall.id === 'wall-south' ? 'front' : 'back';
            const isHidden = hiddenWalls.includes(wall.id);

            if (isHidden) return null;

            return (
              <Wall
                key={wall.id}
                component={wall}
                hasDoor={hasDoor}
                hasWindow={hasWindow}
                windowPosition={windowPosition}
              />
            );
          })}
          {roof && <Roof component={roof} />}
        </>
      )}

      {/* Envelope phase */}
      {isPhaseVisible('envelope') && (
        <>
          {windows.map((win) => (
            <Window key={win.id} component={win} />
          ))}
          {door && <Door component={door} />}
        </>
      )}

      {/* Finishing phase */}
      {isPhaseVisible('finishing') && (
        <>
          {woodStove && <WoodStove component={woodStove} />}
          {clearanceZone && <ClearanceZone component={clearanceZone} />}
        </>
      )}

      {/* Annotations */}
      <Annotations annotations={allAnnotations} />

      {/* Overall dimensions - using DimensionLine from Annotations component */}

      {/* Selection indicator */}
      {selectedComponentId && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
