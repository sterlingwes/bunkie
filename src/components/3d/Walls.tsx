import { useRef, useMemo } from 'react';
import { Group, BufferGeometry, Float32BufferAttribute } from 'three';
import type { Component } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';

interface WallProps {
  component: Component;
  hasDoor?: boolean;
  hasWindow?: boolean;
  windowPosition?: 'front' | 'back';
}

// Wall heights for shed roof construction
// Back wall (east) is LOW, Front wall (west) is HIGH
// Side walls rake between these heights
const BACK_WALL_HEIGHT = 2.1;  // Low wall height (meters)
const FRONT_WALL_HEIGHT = 2.4; // High wall height (meters)

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

    // Check if this is a side wall (needs rake/angled top to match roof slope)
    const isSideWall = component.id === 'wall-south' || component.id === 'wall-north';
    const isSouthWall = component.id === 'wall-south';

    // For rake walls, the height varies from BACK_WALL_HEIGHT to FRONT_WALL_HEIGHT
    // wall-south: rotated -90°, so local +X = world +Z (front, taller)
    // wall-north: rotated +90°, so local +X = world -Z (back, shorter)
    const getWallHeightAtX = (xPos: number): number => {
        if (!isSideWall) return wallHeight;
        // Normalize position to 0-1 range
        const t = (xPos + wallLength / 2) / wallLength; // 0 at -X end, 1 at +X end

        if (isSouthWall) {
            // Local +X = world +Z (front), so higher t = taller
            return BACK_WALL_HEIGHT + t * (FRONT_WALL_HEIGHT - BACK_WALL_HEIGHT);
        } else {
            // wall-north: Local +X = world -Z (back), so higher t = shorter
            return FRONT_WALL_HEIGHT - t * (FRONT_WALL_HEIGHT - BACK_WALL_HEIGHT);
        }
    };

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

    // Create trapezoidal sheathing geometry for rake walls
    // The sheathing extends from the wall's bottom to top, following the rake angle
    const rakeSheathingGeometry = useMemo(() => {
        if (!isSideWall) return null;

        const sheathingThickness = 0.011;
        const halfLength = wallLength / 2;

        // Heights at each end based on wall direction
        // For south wall: +X is front (taller), for north wall: +X is back (shorter)
        const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
        const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

        // Create a trapezoidal prism (angled top, flat bottom)
        // The shape runs along X axis, Z is thickness
        const verticesWithX = new Float32Array([
            // Front face (X = +halfLength)
            +halfLength, -heightAtPlusX / 2, -sheathingThickness / 2,
            +halfLength, -heightAtPlusX / 2, +sheathingThickness / 2,
            +halfLength, +heightAtPlusX / 2, +sheathingThickness / 2,
            +halfLength, +heightAtPlusX / 2, -sheathingThickness / 2,

            // Back face (X = -halfLength)
            -halfLength, -heightAtMinusX / 2, -sheathingThickness / 2,
            -halfLength, -heightAtMinusX / 2, +sheathingThickness / 2,
            -halfLength, +heightAtMinusX / 2, +sheathingThickness / 2,
            -halfLength, +heightAtMinusX / 2, -sheathingThickness / 2,
        ]);

        const indices = [
            // Front face (X = +halfLength)
            0, 1, 2,  0, 2, 3,
            // Back face (X = -halfLength)
            5, 4, 7,  5, 7, 6,
            // Top face (angled)
            7, 6, 2,  7, 2, 3,
            // Bottom face
            4, 5, 1,  4, 1, 0,
            // Right face (+Z)
            1, 5, 6,  1, 6, 2,
            // Left face (-Z)
            4, 0, 3,  4, 3, 7,
        ];

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(verticesWithX, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }, [isSideWall, isSouthWall, wallLength]);

    // Create angled top plate geometry for rake walls
    const rakeTopPlateGeometry = useMemo(() => {
        if (!isSideWall) return null;

        const plateHeight = 0.076; // Double top plate
        const plateDepth = 0.089;
        const halfLength = wallLength / 2;

        // Heights at each end (top of wall, so we use the full heights)
        const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
        const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

        // Top plate sits on top of the studs
        // The plate itself has height, so we need to offset the top surface
        const vertices = new Float32Array([
            // Front end (X = +halfLength)
            +halfLength, heightAtPlusX / 2, -plateDepth / 2,
            +halfLength, heightAtPlusX / 2, +plateDepth / 2,
            +halfLength, heightAtPlusX / 2 + plateHeight, +plateDepth / 2,
            +halfLength, heightAtPlusX / 2 + plateHeight, -plateDepth / 2,

            // Back end (X = -halfLength)
            -halfLength, heightAtMinusX / 2, -plateDepth / 2,
            -halfLength, heightAtMinusX / 2, +plateDepth / 2,
            -halfLength, heightAtMinusX / 2 + plateHeight, +plateDepth / 2,
            -halfLength, heightAtMinusX / 2 + plateHeight, -plateDepth / 2,
        ]);

        const indices = [
            // Front face
            0, 1, 2,  0, 2, 3,
            // Back face
            5, 4, 7,  5, 7, 6,
            // Top face (angled)
            7, 6, 2,  7, 2, 3,
            // Bottom face (angled)
            4, 5, 1,  4, 1, 0,
            // Right face (+Z)
            1, 5, 6,  1, 6, 2,
            // Left face (-Z)
            4, 0, 3,  4, 3, 7,
        ];

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }, [isSideWall, isSouthWall, wallLength]);

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
            {isSideWall && rakeTopPlateGeometry ? (
                <mesh geometry={rakeTopPlateGeometry} castShadow receiveShadow>
                    <meshStandardMaterial color={frameColor} roughness={0.8} />
                </mesh>
            ) : (
                <mesh position={[0, wallHeight / 2 + 0.019, 0]} castShadow receiveShadow>
                    <boxGeometry args={[wallLength, 0.076, 0.089]} />
                    <meshStandardMaterial color={frameColor} roughness={0.8} />
                </mesh>
            )}

            {/* Studs */}
            {Array.from({ length: studCount }).map((_, i) => {
                const xPos = -wallLength / 2 + 0.089 / 2 + i * studSpacing;

                // Door opening framing (centered on wall)
                // Door dimensions: 1.84m x 2.03m (72.5" x 80")
                if (hasDoor) {
                    const doorWidth = 1.84;
                    const doorHeight = 2.03;
                    // Rough opening (RO) - slightly larger than door for shims (12.5mm each side)
                    const roHalfWidth = doorWidth / 2 + 0.0125; // 0.9325m
                    const studHalfWidth = 0.019; // half of 0.038m (2x4 actual width)

                    // King stud positions (at rough opening edges)
                    const kingStudLeftX = -roHalfWidth - studHalfWidth;
                    const kingStudRightX = roHalfWidth + studHalfWidth;

                    // Skip regular studs in the door opening area
                    if (Math.abs(xPos) < roHalfWidth) {
                        return null;
                    }

                    // Jack studs (short studs supporting header) at king stud positions
                    if (Math.abs(xPos - kingStudRightX) < 0.02 || Math.abs(xPos - kingStudLeftX) < 0.02) {
                        const jackStudHeight = doorHeight - 0.089; // door height minus sill/threshold
                        return (
                            <mesh key={`stud-${i}`} position={[xPos, -wallHeight / 2 + jackStudHeight / 2 + 0.038, 0]} castShadow receiveShadow>
                                <boxGeometry args={[0.038, jackStudHeight, 0.089]} />
                                <meshStandardMaterial color={frameColor} roughness={0.8} />
                            </mesh>
                        );
                    }
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

                const studHeight = isSideWall ? getWallHeightAtX(xPos) : wallHeight;
                // Position stud so bottom sits on top of bottom plate
                // Bottom plate top is at: -wallHeight/2 + 0.038
                const studY = isSideWall
                    ? -wallHeight / 2 + 0.038 + studHeight / 2
                    : 0;

                return (
                    <mesh key={`stud-${i}`} position={[xPos, studY, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.038, studHeight, 0.089]} />
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

                // For rake walls, get the height at each king stud position
                const leftKingStudHeight = isSideWall ? getWallHeightAtX(kingStudLeftX) : wallHeight;
                const rightKingStudHeight = isSideWall ? getWallHeightAtX(kingStudRightX) : wallHeight;

                // Position king studs so they sit on bottom plate
                const leftKingStudY = isSideWall
                    ? -wallHeight / 2 + 0.038 + leftKingStudHeight / 2
                    : 0;
                const rightKingStudY = isSideWall
                    ? -wallHeight / 2 + 0.038 + rightKingStudHeight / 2
                    : 0;

                return (
                    <>
                        {/* King studs at window edges - full height */}
                        <mesh position={[kingStudLeftX, leftKingStudY, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.038, leftKingStudHeight, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>
                        <mesh position={[kingStudRightX, rightKingStudY, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.038, rightKingStudHeight, 0.089]} />
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

            {/* Door framing - explicit king studs and header */}
            {hasDoor && (() => {
                // Door dimensions: 1.84m x 2.03m (72.5" x 80")
                const doorWidth = 1.84;
                const doorHeight = 2.03;
                // Rough opening (RO) - slightly larger than door for shims (12.5mm each side)
                const roHalfWidth = doorWidth / 2 + 0.0125; // 0.9325m

                // King stud positions (at rough opening edges)
                const studHalfWidth = 0.019; // half of 0.038m (2x4 actual width)
                const kingStudLeftX = -roHalfWidth - studHalfWidth;
                const kingStudRightX = roHalfWidth + studHalfWidth;

                // Header spans rough opening + king studs on each side
                const headerWidth = roHalfWidth * 2 + 0.038 * 2; // RO + one king stud width on each side

                // Header Y position (top of door opening)
                const headerY = -wallHeight / 2 + doorHeight + 0.038 + 0.089 / 2; // above bottom plate + door height

                return (
                    <>
                        {/* King studs at door edges - full height */}
                        <mesh position={[kingStudLeftX, 0, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.038, wallHeight, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>
                        <mesh position={[kingStudRightX, 0, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.038, wallHeight, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>

                        {/* Header - spans rough opening, sits on jack studs */}
                        <mesh position={[0, headerY, 0]} castShadow receiveShadow>
                            <boxGeometry args={[headerWidth, 0.089, 0.089]} />
                            <meshStandardMaterial color={frameColor} roughness={0.8} />
                        </mesh>
                    </>
                );
            })()}

            {/* OSB Sheathing- on EXTERIOR side (positive Z in local coords) */}
            {isSideWall && rakeSheathingGeometry ? (
                <mesh
                    geometry={rakeSheathingGeometry}
                    position={[0, 0, 0.048]}
                    castShadow
                    receiveShadow
                >
                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                </mesh>
            ) : (
                <mesh position={[0, 0, 0.048]} castShadow receiveShadow>
                    <boxGeometry args={[wallLength, wallHeight + 0.1, 0.011]} />
                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                </mesh>
            )}
        </group>
    );
}