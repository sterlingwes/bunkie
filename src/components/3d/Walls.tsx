import { useRef } from 'react';
import { Group } from 'three';
import type { Component } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';

interface WallProps {
  component: Component;
  hasDoor?: boolean;
  hasWindow?: boolean;
  windowPosition?: 'front' | 'back';
}

export function Wall({ component, hasDoor, hasWindow, windowPosition }: WallProps) {
  const groupRef = useRef<Group>(null);
  const { selectedComponentId, hoveredComponentId, hoverComponent, selectComponent } = useBunkieStore();

  const isSelected = selectedComponentId === component.id;
  const isHovered = hoveredComponentId === component.id;

  const handlePointerOver = () => {
    hoverComponent(component.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    hoverComponent(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = () => {
    selectComponent(isSelected ? null : component.id);
  };

  // Determine wall orientation based on ID
  // West/East walls run along X axis (width is along X)
  // North/South walls run along Z axis (depth is along Z)
  const isXAxis = component.id === 'wall-west' || component.id === 'wall-east';

  // Wall dimensions
  const wallLength = isXAxis ? component.dimensions.depth : component.dimensions.width;
  const wallHeight = component.dimensions.height;
  const studSpacing = 0.406; // 16" OC in meters
  const studCount = Math.floor(wallLength / studSpacing) + 1;

  // Rotation: X-axis walls need no rotation, Z-axis walls need 90 degree Y rotation
  const rotation: [number, number, number] = isXAxis ? [0, 0, 0] : [0, Math.PI / 2, 0];

  // Wall color based on selection state
  const frameColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#c4a574';
  const sheathingColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#d4b896';

  return (
    <group
      ref={groupRef}
      position={[component.position.x, component.position.y, component.position.z]}
      rotation={rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Bottom plate */}
      <mesh position={[0, -wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallLength, 0.038, 0.089]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* Top plate (double) */}
      <mesh position={[0, wallHeight / 2 + 0.019, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallLength, 0.076, 0.089]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* Studs */}
      {Array.from({ length: studCount }).map((_, i) => {
        const xPos = -wallLength / 2 + 0.089 / 2 + i * studSpacing;

        // Skip studs where door opening is (centered on wall)
        if (hasDoor && Math.abs(xPos) < 0.95) {
          // Door header
          if (i === Math.floor(studCount / 2) - 1 || i === Math.floor(studCount / 2)) {
            return (
              <mesh key={`stud-${i}`} position={[xPos, wallHeight / 2 - 0.3, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.038, 0.089, 0.089]} />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>
            );
          }
          // Door jack studs
          if (Math.abs(xPos - 0.95) < 0.05 || Math.abs(xPos + 0.95) < 0.05) {
            return (
              <mesh key={`stud-${i}`} position={[xPos, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.038, wallHeight - 0.6, 0.089]} />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>
            );
          }
          return null;
        }

        // Skip studs where window opening is
        if (hasWindow) {
          const windowX = windowPosition === 'front' ? wallLength / 4 : -wallLength / 4;
          if (Math.abs(xPos - windowX) < 0.3) {
            // Window header
            if (Math.abs(xPos - windowX) < 0.05) {
              return (
                <mesh key={`stud-${i}`} position={[xPos, wallHeight / 2 - 0.4, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.038, 0.089, 0.089]} />
                  <meshStandardMaterial color={frameColor} roughness={0.8} />
                </mesh>
              );
            }
            return null;
          }
        }

        return (
          <mesh key={`stud-${i}`} position={[xPos, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.038, wallHeight, 0.089]} />
            <meshStandardMaterial color={frameColor} roughness={0.8} />
          </mesh>
        );
      })}

      {/* OSB Sheathing */}
      <mesh position={[0, 0, -0.048]} castShadow receiveShadow>
        <boxGeometry args={[wallLength, wallHeight + 0.1, 0.011]} />
        <meshStandardMaterial color={sheathingColor} roughness={0.9} />
      </mesh>
    </group>
  );
}
