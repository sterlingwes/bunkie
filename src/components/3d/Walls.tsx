import { useRef, useMemo } from 'react';
import { Group, BufferGeometry, Float32BufferAttribute } from 'three';
import type { Component } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';
import {
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
} from '../../constants/framing';

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
    // IMPORTANT: Bottom is FLAT (all at y=0), only top is angled
    // This ensures the wall sits level on the floor
    const rakeSheathingGeometry = useMemo(() => {
        if (!isSideWall) return null;

        const sheathingThickness = 0.011;
        const halfLength = wallLength / 2;

        // Heights at each end based on wall direction
        // For south wall: +X is front (taller), for north wall: +X is back (shorter)
        const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
        const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

        // Create a trapezoidal prism with FLAT BOTTOM (y=0) and ANGLED TOP
        const vertices = new Float32Array([
            // Front face (X = +halfLength) - bottom at y=0, top at heightAtPlusX
            +halfLength, 0, -sheathingThickness / 2,
            +halfLength, 0, +sheathingThickness / 2,
            +halfLength, heightAtPlusX, +sheathingThickness / 2,
            +halfLength, heightAtPlusX, -sheathingThickness / 2,

            // Back face (X = -halfLength) - bottom at y=0, top at heightAtMinusX
            -halfLength, 0, -sheathingThickness / 2,
            -halfLength, 0, +sheathingThickness / 2,
            -halfLength, heightAtMinusX, +sheathingThickness / 2,
            -halfLength, heightAtMinusX, -sheathingThickness / 2,
        ]);

        const indices = [
            // Front face (X = +halfLength)
            0, 1, 2,  0, 2, 3,
            // Back face (X = -halfLength)
            5, 4, 7,  5, 7, 6,
            // Top face (angled)
            7, 6, 2,  7, 2, 3,
            // Bottom face (flat)
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

    // Create angled top plate geometry for rake walls
    // IMPORTANT: Like the sheathing, bottom is FLAT, top follows the rake
    const rakeTopPlateGeometry = useMemo(() => {
        if (!isSideWall) return null;

        const plateHeight = 0.076; // Double top plate
        const plateDepth = 0.089;
        const halfLength = wallLength / 2;

        // Heights at each end (top of wall, so we use the full heights)
        const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
        const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

        // Top plate sits on top of the studs
        // Bottom of plate is at wall height, top is at wall height + plate height
        const vertices = new Float32Array([
            // Front end (X = +halfLength)
            +halfLength, heightAtPlusX, -plateDepth / 2,
            +halfLength, heightAtPlusX, +plateDepth / 2,
            +halfLength, heightAtPlusX + plateHeight, +plateDepth / 2,
            +halfLength, heightAtPlusX + plateHeight, -plateDepth / 2,

            // Back end (X = -halfLength)
            -halfLength, heightAtMinusX, -plateDepth / 2,
            -halfLength, heightAtMinusX, +plateDepth / 2,
            -halfLength, heightAtMinusX + plateHeight, +plateDepth / 2,
            -halfLength, heightAtMinusX + plateHeight, -plateDepth / 2,
        ]);

        const indices = [
            // Front face
            0, 1, 2,  0, 2, 3,
            // Back face
            5, 4, 7,  5, 7, 6,
            // Top face (angled)
            7, 6, 2,  7, 2, 3,
            // Bottom face (angled - follows wall top)
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

    // Bottom plate height constant (needed early for window calculations)
    const bottomPlateHeight = 0.038;

    // Window opening position along wall
    const windowOffset = windowPosition === 'front' ? wallLength / 4 : -wallLength / 4;

    // Calculate header Y position for window (needed for sheathing with cutout)
    // These values are used by both framing and sheathing
    const headerHeight = 0.089;
    const windowSillY = bottomPlateHeight + headerHeight / 2; // Center of sill
    const windowHeaderY = windowSillY + 1.83 + headerHeight / 2; // Center of header

    // Create trapezoidal sheathing geometry for the section above window header
    // This is only used for side walls with windows
    const aboveHeaderSheathingGeometry = useMemo(() => {
        if (!isSideWall || !hasWindow) return null;

        const sheathingThickness = 0.011;
        const halfLength = wallLength / 2;

        // Heights at each end based on wall direction
        const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
        const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

        // Create trapezoidal geometry from windowHeaderY to wall top
        const vertices = new Float32Array([
            // Front face (X = +halfLength)
            +halfLength, windowHeaderY, -sheathingThickness / 2,
            +halfLength, windowHeaderY, +sheathingThickness / 2,
            +halfLength, heightAtPlusX, +sheathingThickness / 2,
            +halfLength, heightAtPlusX, -sheathingThickness / 2,
            // Back face (X = -halfLength)
            -halfLength, windowHeaderY, -sheathingThickness / 2,
            -halfLength, windowHeaderY, +sheathingThickness / 2,
            -halfLength, heightAtMinusX, +sheathingThickness / 2,
            -halfLength, heightAtMinusX, -sheathingThickness / 2,
        ]);

        const indices = [
            // Front face
            0, 1, 2,  0, 2, 3,
            // Back face
            5, 4, 7,  5, 7, 6,
            // Top face (angled)
            7, 6, 2,  7, 2, 3,
            // Bottom face (flat at headerY)
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
    }, [isSideWall, isSouthWall, wallLength, hasWindow, windowHeaderY]);

    // Bottom plate position
    const bottomPlateY = isSideWall
        ? bottomPlateHeight / 2  // Sitting on floor (y=0), centered on its height
        : -wallHeight / 2;       // Centered geometry

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
            <mesh position={[0, bottomPlateY, 0]} castShadow receiveShadow>
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
                // For side walls with flat-bottom geometry:
                // - Stud bottom at y=0 (floor level)
                // - Stud top at y=studHeight
                // - Stud center at y=studHeight/2
                // For regular walls (centered geometry):
                // - Stud center at y=0
                const studY = isSideWall ? studHeight / 2 : 0;

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
                // For flat-bottom geometry: sill sits just above bottom plate
                // For centered geometry: sill is relative to wall center
                const headerHeight = 0.089;
                const sillY = isSideWall
                    ? bottomPlateHeight + headerHeight / 2  // Floor + bottom plate + half sill
                    : -wallHeight / 2 + 0.089 / 2 + 0.038;   // Original centered calculation
                const headerY = sillY + windowHeight + headerHeight / 2;

                // For rake walls, get the height at each king stud position
                const leftKingStudHeight = isSideWall ? getWallHeightAtX(kingStudLeftX) : wallHeight;
                const rightKingStudHeight = isSideWall ? getWallHeightAtX(kingStudRightX) : wallHeight;

                // Position king studs - flat bottom geometry for side walls
                const leftKingStudY = isSideWall ? leftKingStudHeight / 2 : 0;
                const rightKingStudY = isSideWall ? rightKingStudHeight / 2 : 0;

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
            {hasWindow && isSideWall ? (
                // Side wall with window - split sheathing around window opening
                <>
                    {(() => {
                        const windowWidth = 0.61;
                        const roHalfWidth = windowWidth / 2 + 0.02; // 0.325m

                        // Window horizontal bounds
                        const windowLeft = windowOffset - roHalfWidth;
                        const windowRight = windowOffset + roHalfWidth;
                        const halfLength = wallLength / 2;

                        return (
                            <>
                                {/* Below window - full width, covers bottom plate and sill */}
                                <mesh
                                    position={[0, windowSillY / 2, 0.048]}
                                    castShadow
                                    receiveShadow
                                >
                                    <boxGeometry args={[wallLength, windowSillY, 0.011]} />
                                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                                </mesh>

                                {/* Left of window - from wall left to window left, sill to header */}
                                <mesh
                                    position={[(windowLeft - halfLength) / 2, (windowSillY + windowHeaderY) / 2, 0.048]}
                                    castShadow
                                    receiveShadow
                                >
                                    <boxGeometry args={[windowLeft + halfLength, windowHeaderY - windowSillY, 0.011]} />
                                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                                </mesh>

                                {/* Right of window - from window right to wall right, sill to header */}
                                <mesh
                                    position={[(windowRight + halfLength) / 2, (windowSillY + windowHeaderY) / 2, 0.048]}
                                    castShadow
                                    receiveShadow
                                >
                                    <boxGeometry args={[halfLength - windowRight, windowHeaderY - windowSillY, 0.011]} />
                                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                                </mesh>

                                {/* Above header - full width trapezoidal section */}
                                {aboveHeaderSheathingGeometry && (
                                    <mesh
                                        geometry={aboveHeaderSheathingGeometry}
                                        position={[0, 0, 0.048]}
                                        castShadow
                                        receiveShadow
                                    >
                                        <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                                    </mesh>
                                )}
                            </>
                        );
                    })()}
                </>
            ) : hasDoor && !isSideWall ? (
                // Front/back wall with door - split sheathing around door opening
                <>
                    {(() => {
                        const doorWidth = 1.84;
                        const doorHeight = 2.03;
                        const roHalfWidth = doorWidth / 2 + 0.0125; // 0.9325m
                        const halfLength = wallLength / 2;

                        // Door vertical bounds (centered geometry)
                        const headerTop = -wallHeight / 2 + doorHeight + 0.038 + 0.089;

                        // Door horizontal bounds
                        const doorLeft = -roHalfWidth;
                        const doorRight = roHalfWidth;

                        return (
                            <>
                                {/* Left of door - from floor to header top only (no overlap with above section) */}
                                <mesh
                                    position={[(doorLeft - halfLength) / 2, (-wallHeight / 2 + headerTop) / 2, 0.048]}
                                    castShadow
                                    receiveShadow
                                >
                                    <boxGeometry args={[doorLeft + halfLength, headerTop + wallHeight / 2, 0.011]} />
                                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                                </mesh>

                                {/* Right of door - from floor to header top only */}
                                <mesh
                                    position={[(doorRight + halfLength) / 2, (-wallHeight / 2 + headerTop) / 2, 0.048]}
                                    castShadow
                                    receiveShadow
                                >
                                    <boxGeometry args={[halfLength - doorRight, headerTop + wallHeight / 2, 0.011]} />
                                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                                </mesh>

                                {/* Above door - full width from header top to wall top */}
                                <mesh
                                    position={[0, (headerTop + wallHeight / 2 + 0.05) / 2, 0.048]}
                                    castShadow
                                    receiveShadow
                                >
                                    <boxGeometry args={[wallLength, wallHeight / 2 + 0.05 - headerTop, 0.011]} />
                                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                                </mesh>
                            </>
                        );
                    })()}
                </>
            ) : isSideWall && rakeSheathingGeometry ? (
                // Side wall without opening - solid trapezoidal sheathing
                <mesh
                    geometry={rakeSheathingGeometry}
                    position={[0, 0, 0.048]}
                    castShadow
                    receiveShadow
                >
                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                </mesh>
            ) : (
                // Front/back wall without opening - solid rectangular sheathing
                <mesh position={[0, 0, 0.048]} castShadow receiveShadow>
                    <boxGeometry args={[wallLength, wallHeight + 0.1, 0.011]} />
                    <meshStandardMaterial color={sheathingColor} roughness={0.9} />
                </mesh>
            )}
        </group>
    );
}