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

    // Wall dimensions - width is the length along the wall
    const wallLength = component.dimensions.width;
    const wallHeight = component.dimensions.height;

    // Rotation based on wall ID:
    // - wall-west (front, +Z): exterior faces +Z, rotate 180° to face outward
    // - wall-east (back, -Z): exterior faces -Z, no rotation (default)
    // - wall-south (+X): exterior faces +X, rotate -90° to face +X
    // - wall-north (-X): exterior faces -X, rotate +90° to face -X
    let rotation: [number, number, number];
    switch (component.id) {
        case 'wall-west':
            rotation = [0, Math.PI, 0]; // 180° - face +Z (front/exterior)
            break;
        case 'wall-east':
            rotation = [0, 0, 0]; // 0° - face -Z (back/exterior)
            break;
        case 'wall-south':
            rotation = [0, -Math.PI / 2, 0]; // -90° - face +X (right/exterior)
            break;
        case 'wall-north':
            rotation = [0, Math.PI / 2, 0]; // +90° - face -X (left/exterior)
            break;
        default:
            rotation = [0, 0, 0];
    }

    const studSpacing = 0.406; // 16" OC in meters
    const studCount = Math.floor(wallLength / studSpacing) + 1;

    // Wall color based on selection state
    const frameColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#c4a574';
    const sheathingColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : '#d4b896';

    // Window opening position along wall
    const windowOffset = windowPosition === 'front' ? wallLength / 4 : -wallLength / 4;

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

                // Window opening - skip regular studs in the rough opening area
                if (hasWindow) {
                    // Window dimensions: 0.61m x 1.83m (24" x 72")
                    const windowWidth = 0.61;
                    const windowHalfWidth = windowWidth / 2; // 0.305m
                    // Rough opening (RO) - slightly larger than window for shims (20mm each side)
                    const roHalfWidth = windowHalfWidth + 0.02; // 0.325m

                    // Skip regular studs in the window opening area (RO + half stud width)
                    if (Math.abs(xPos - windowOffset) < roHalfWidth + 0.03) {
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

            {/* Window framing - explicit king studs, header, and sill */}
            {hasWindow && (() => {
                // Window dimensions: 0.61m x 1.83m (24" x 72")
                const windowWidth = 0.61;
                const windowHeight = 1.83;
                const windowHalfWidth = windowWidth / 2; // 0.305m

                // Rough opening (RO) - slightly larger than window for shims (20mm each side)
                const roHalfWidth = windowHalfWidth + 0.02; // 0.325m

                // King stud positions (centered at rough opening edges)
                const studHalfWidth = 0.019; // half of 0.038m (2x4 actual width)
                const kingStudLeftX = windowOffset - roHalfWidth - studHalfWidth;
                const kingStudRightX = windowOffset + roHalfWidth + studHalfWidth;

                // Header spans rough opening + king studs on each side
                const headerWidth = roHalfWidth * 2 + 0.038 * 2; // RO + one king stud width on each side

                // Header and sill Y positions
                // Sill at floor level (bottom of wall + sill height)
                const sillY = -wallHeight / 2 + 0.089 / 2 + 0.038; // just above bottom plate
                // Header at top of window opening
                const headerY = sillY + windowHeight + 0.089; // sill + window height + header height

                return (
                    <>
                        {/* King studs at window edges - full height */}
                        <mesh position={[kingStudLeftX, 0, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.038, wallHeight, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>
                        <mesh position={[kingStudRightX, 0, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.038, wallHeight, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>

                        {/* Header - spans rough opening, sits on king studs */}
                        <mesh position={[windowOffset, headerY, 0]} castShadow receiveShadow>
                            <boxGeometry args={[headerWidth, 0.089, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>

                        {/* Sill - bottom of rough opening */}
                        <mesh position={[windowOffset, sillY, 0]} castShadow receiveShadow>
                            <boxGeometry args={[roHalfWidth * 2, 0.089, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>
                    </>
                );
            })()}

            {/* OSB Sheathing- on EXTERIOR side (positive Z in local coords) */}
            <mesh position={[0, 0, 0.048]} castShadow receiveShadow>
                <boxGeometry args={[wallLength, wallHeight + 0.1, 0.011]} />
                <meshStandardMaterial color={sheathingColor} roughness={0.9} />
            </mesh>
        </group>
    );
}