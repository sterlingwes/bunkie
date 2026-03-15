import { useRef, useMemo } from "react";
import { Group, BufferGeometry, Float32BufferAttribute } from "three";
import type { Component } from "../../schemas/bunkie.schema";
import { useBunkieStore } from "../../store/useBunkieStore";
import {
  BACK_WALL_HEIGHT,
  FRONT_WALL_HEIGHT,
  STUD_WIDTH,
  STUD_DEPTH,
  STUD_SPACING,
  BOTTOM_PLATE_HEIGHT,
  TOP_PLATE_HEIGHT,
  PLATE_DEPTH,
  HEADER_HEIGHT,
  SILL_HEIGHT,
  WINDOW_WIDTH,
  WINDOW_HEIGHT,
  WINDOW_SHIM_ALLOWANCE,
  DOOR_HEIGHT,
  DOOR_RO_HALF_WIDTH,
  SHEATHING_THICKNESS,
  SHEATHING_OFFSET,
  STUD_HALF_WIDTH,
} from "../../constants/framing";
import {
  getWallConfigs,
  getWallHeightAtPosition as getWallHeightFromCalculator,
  getOpeningFraming,
} from "../../utils/framing-calculator";

interface WallProps {
  component: Component;
  hasDoor?: boolean;
  hasWindow?: boolean;
  windowPosition?: "front" | "back";
}

export function Wall({ component, hasDoor, hasWindow }: WallProps) {
  const groupRef = useRef<Group>(null);
  const {
    selectedComponentId,
    hoveredComponentId,
    hoverComponent,
    selectComponent,
  } = useBunkieStore();

  const isSelected = selectedComponentId === component.id;
  const isHovered = hoveredComponentId === component.id;

  const handlePointerOver = () => {
    hoverComponent(component.id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    hoverComponent(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = () => {
    selectComponent(isSelected ? null : component.id);
  };

  // Wall dimensions - width is the length along the wall
  const wallLength = component.dimensions.width;
  const wallHeight = component.dimensions.height;

  // Check if this is a side wall (needs rake/angled top to match roof slope)
  const isSideWall =
    component.id === "wall-south" || component.id === "wall-north";
  const isSouthWall = component.id === "wall-south";

  // Get wall config from the calculator based on wall ID
  const wallId = component.id.replace("wall-", "") as
    | "west"
    | "east"
    | "north"
    | "south";
  const wallConfigs = getWallConfigs();
  const wallConfig = wallConfigs[wallId];

  // For rake walls, the height varies from BACK_WALL_HEIGHT to FRONT_WALL_HEIGHT
  // Use the calculator function for consistency
  const getWallHeightAtX = (xPos: number): number => {
    return getWallHeightFromCalculator(xPos, wallConfig);
  };

  // Rotation based on wall ID:
  // - wall-west (front, +Z): exterior faces +Z, rotate 180° to face outward
  // - wall-east (back, -Z): exterior faces -Z, no rotation (default)
  // - wall-south (+X): exterior faces +X, rotate -90° to face +X
  // - wall-north (-X): exterior faces -X, rotate +90° to face -X
  let rotation: [number, number, number];
  switch (component.id) {
    case "wall-west":
      rotation = [0, Math.PI, 0]; // 180° - face +Z (front/exterior)
      break;
    case "wall-east":
      rotation = [0, 0, 0]; // 0° - face -Z (back/exterior)
      break;
    case "wall-south":
      rotation = [0, -Math.PI / 2, 0]; // -90° - face +X (right/exterior)
      break;
    case "wall-north":
      rotation = [0, Math.PI / 2, 0]; // +90° - face -X (left/exterior)
      break;
    default:
      rotation = [0, 0, 0];
  }

  const studSpacing = STUD_SPACING;
  const studCount = Math.floor(wallLength / studSpacing) + 1;

  // Wall color based on selection state
  const frameColor = isSelected ? "#60a5fa" : isHovered ? "#93c5fd" : "#c4a574";
  const sheathingColor = isSelected
    ? "#60a5fa"
    : isHovered
      ? "#93c5fd"
      : "#d4b896";

  // Create trapezoidal sheathing geometry for rake walls
  // IMPORTANT: Bottom is FLAT (all at y=0), only top is angled
  // This ensures the wall sits level on the floor
  const rakeSheathingGeometry = useMemo(() => {
    if (!isSideWall) return null;

    const sheathingThickness = SHEATHING_THICKNESS;
    const halfLength = wallLength / 2;

    // Heights at each end based on wall direction
    // For south wall: +X is front (taller), for north wall: +X is back (shorter)
    const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
    const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

    // Create a trapezoidal prism with FLAT BOTTOM (y=0) and ANGLED TOP
    const vertices = new Float32Array([
      // Front face (X = +halfLength) - bottom at y=0, top at heightAtPlusX
      +halfLength,
      0,
      -sheathingThickness / 2,
      +halfLength,
      0,
      +sheathingThickness / 2,
      +halfLength,
      heightAtPlusX,
      +sheathingThickness / 2,
      +halfLength,
      heightAtPlusX,
      -sheathingThickness / 2,

      // Back face (X = -halfLength) - bottom at y=0, top at heightAtMinusX
      -halfLength,
      0,
      -sheathingThickness / 2,
      -halfLength,
      0,
      +sheathingThickness / 2,
      -halfLength,
      heightAtMinusX,
      +sheathingThickness / 2,
      -halfLength,
      heightAtMinusX,
      -sheathingThickness / 2,
    ]);

    const indices = [
      // Front face (X = +halfLength)
      0, 1, 2, 0, 2, 3,
      // Back face (X = -halfLength)
      5, 4, 7, 5, 7, 6,
      // Top face (angled)
      7, 6, 2, 7, 2, 3,
      // Bottom face (flat)
      4, 5, 1, 4, 1, 0,
      // Right face (+Z)
      1, 5, 6, 1, 6, 2,
      // Left face (-Z)
      4, 0, 3, 4, 3, 7,
    ];

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [isSideWall, isSouthWall, wallLength]);

  // Create angled top plate geometry for rake walls
  // IMPORTANT: Like the sheathing, bottom is FLAT, top follows the rake
  const rakeTopPlateGeometry = useMemo(() => {
    if (!isSideWall) return null;

    const plateHeight = TOP_PLATE_HEIGHT;
    const plateDepth = PLATE_DEPTH;
    const halfLength = wallLength / 2;

    // Heights at each end (top of wall, so we use the full heights)
    const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
    const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

    // Top plate sits on top of the studs
    // Bottom of plate is at wall height, top is at wall height + plate height
    const vertices = new Float32Array([
      // Front end (X = +halfLength)
      +halfLength,
      heightAtPlusX,
      -plateDepth / 2,
      +halfLength,
      heightAtPlusX,
      +plateDepth / 2,
      +halfLength,
      heightAtPlusX + plateHeight,
      +plateDepth / 2,
      +halfLength,
      heightAtPlusX + plateHeight,
      -plateDepth / 2,

      // Back end (X = -halfLength)
      -halfLength,
      heightAtMinusX,
      -plateDepth / 2,
      -halfLength,
      heightAtMinusX,
      +plateDepth / 2,
      -halfLength,
      heightAtMinusX + plateHeight,
      +plateDepth / 2,
      -halfLength,
      heightAtMinusX + plateHeight,
      -plateDepth / 2,
    ]);

    const indices = [
      // Front face
      0, 1, 2, 0, 2, 3,
      // Back face
      5, 4, 7, 5, 7, 6,
      // Top face (angled)
      7, 6, 2, 7, 2, 3,
      // Bottom face (angled - follows wall top)
      4, 5, 1, 4, 1, 0,
      // Right face (+Z)
      1, 5, 6, 1, 6, 2,
      // Left face (-Z)
      4, 0, 3, 4, 3, 7,
    ];

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [isSideWall, isSouthWall, wallLength]);

  // Bottom plate height constant (needed early for window calculations)
  const bottomPlateHeight = BOTTOM_PLATE_HEIGHT;

  // Get opening framing for window (if present)
  const windowOpeningFraming = hasWindow ? getOpeningFraming(wallConfig) : null;
  const windowOffset = windowOpeningFraming?.centerX ?? 0;

  // Calculate header Y position for window (needed for sheathing with cutout)
  // These values are used by both framing and sheathing
  const windowSillY =
    windowOpeningFraming?.sillY ?? bottomPlateHeight + SILL_HEIGHT / 2;
  const windowHeaderY =
    windowOpeningFraming?.headerY ??
    bottomPlateHeight + WINDOW_HEIGHT + HEADER_HEIGHT / 2;

  // Create trapezoidal sheathing geometry for the section above window header
  // This is only used for side walls with windows
  const aboveHeaderSheathingGeometry = useMemo(() => {
    if (!isSideWall || !hasWindow) return null;

    const sheathingThickness = SHEATHING_THICKNESS;
    const halfLength = wallLength / 2;

    // Heights at each end based on wall direction
    const heightAtPlusX = isSouthWall ? FRONT_WALL_HEIGHT : BACK_WALL_HEIGHT;
    const heightAtMinusX = isSouthWall ? BACK_WALL_HEIGHT : FRONT_WALL_HEIGHT;

    // Create trapezoidal geometry from windowHeaderY to wall top
    const vertices = new Float32Array([
      // Front face (X = +halfLength)
      +halfLength,
      windowHeaderY,
      -sheathingThickness / 2,
      +halfLength,
      windowHeaderY,
      +sheathingThickness / 2,
      +halfLength,
      heightAtPlusX,
      +sheathingThickness / 2,
      +halfLength,
      heightAtPlusX,
      -sheathingThickness / 2,
      // Back face (X = -halfLength)
      -halfLength,
      windowHeaderY,
      -sheathingThickness / 2,
      -halfLength,
      windowHeaderY,
      +sheathingThickness / 2,
      -halfLength,
      heightAtMinusX,
      +sheathingThickness / 2,
      -halfLength,
      heightAtMinusX,
      -sheathingThickness / 2,
    ]);

    const indices = [
      // Front face
      0, 1, 2, 0, 2, 3,
      // Back face
      5, 4, 7, 5, 7, 6,
      // Top face (angled)
      7, 6, 2, 7, 2, 3,
      // Bottom face (flat at headerY)
      4, 5, 1, 4, 1, 0,
      // Right face (+Z)
      1, 5, 6, 1, 6, 2,
      // Left face (-Z)
      4, 0, 3, 4, 3, 7,
    ];

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [isSideWall, isSouthWall, wallLength, hasWindow, windowHeaderY]);

  // Bottom plate position
  const bottomPlateY = isSideWall
    ? bottomPlateHeight / 2 // Sitting on floor (y=0), centered on its height
    : -wallHeight / 2; // Centered geometry

  return (
    <group
      ref={groupRef}
      position={[
        component.position.x,
        component.position.y,
        component.position.z,
      ]}
      rotation={rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Bottom plate */}
      <mesh position={[0, bottomPlateY, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallLength, STUD_WIDTH, STUD_DEPTH]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* Top plate (double) */}
      {isSideWall && rakeTopPlateGeometry ? (
        <mesh geometry={rakeTopPlateGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={frameColor} roughness={0.8} />
        </mesh>
      ) : (
        <mesh
          position={[0, wallHeight / 2 + STUD_HALF_WIDTH, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[wallLength, 0.076, STUD_DEPTH]} />
          <meshStandardMaterial color={frameColor} roughness={0.8} />
        </mesh>
      )}

      {/* Studs */}
      {Array.from({ length: studCount }).map((_, i) => {
        const xPos = -wallLength / 2 + STUD_DEPTH / 2 + i * studSpacing;

        // Door opening framing (centered on wall)
        if (hasDoor) {
          const doorHeight = DOOR_HEIGHT;
          // Rough opening (RO) - slightly larger than door for shims (12.5mm each side)
          const roHalfWidth = DOOR_RO_HALF_WIDTH;
          const studHalfWidth = STUD_HALF_WIDTH; // half of STUD_WIDTHm (2x4 actual width)

          // King stud positions (at rough opening edges)
          const kingStudLeftX = -roHalfWidth - studHalfWidth;
          const kingStudRightX = roHalfWidth + studHalfWidth;

          // Skip regular studs in the door opening area
          if (Math.abs(xPos) < roHalfWidth) {
            return null;
          }

          // Jack studs (short studs supporting header) at king stud positions
          if (
            Math.abs(xPos - kingStudRightX) < 0.02 ||
            Math.abs(xPos - kingStudLeftX) < 0.02
          ) {
            const jackStudHeight = doorHeight - STUD_DEPTH; // door height minus sill/threshold
            return (
              <mesh
                key={`stud-${i}`}
                position={[
                  xPos,
                  -wallHeight / 2 + jackStudHeight / 2 + STUD_WIDTH,
                  0,
                ]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[STUD_WIDTH, jackStudHeight, STUD_DEPTH]} />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>
            );
          }
        }

        // Window opening - skip regular studs in the rough opening area
        if (hasWindow) {
          // Window dimensions: 0.61m x 1.83m (24" x 72")
          const windowWidth = WINDOW_WIDTH;
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
          <mesh
            key={`stud-${i}`}
            position={[xPos, studY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[STUD_WIDTH, studHeight, STUD_DEPTH]} />
            <meshStandardMaterial color={frameColor} roughness={0.8} />
          </mesh>
        );
      })}

      {/* Window framing - explicit king studs, header, and sill */}
      {hasWindow &&
        (() => {
          const openingFraming = getOpeningFraming(wallConfig);
          if (!openingFraming) return null;

          const windowOffset = openingFraming.centerX;

          // King stud positions
          const roHalfWidth = openingFraming.roughOpeningWidth / 2;
          const kingStudLeftX = windowOffset - roHalfWidth - STUD_HALF_WIDTH;
          const kingStudRightX = windowOffset + roHalfWidth + STUD_HALF_WIDTH;

          // For rake walls, get the height at each king stud position
          const leftKingStudHeight = isSideWall
            ? getWallHeightAtX(kingStudLeftX)
            : wallHeight;
          const rightKingStudHeight = isSideWall
            ? getWallHeightAtX(kingStudRightX)
            : wallHeight;

          // Position king studs - flat bottom geometry for side walls
          const leftKingStudY = isSideWall ? leftKingStudHeight / 2 : 0;
          const rightKingStudY = isSideWall ? rightKingStudHeight / 2 : 0;

          // Header and sill Y positions from calculator
          // Calculator returns floor-relative coordinates
          // For side walls (flat-bottom, y=0 at floor): use directly
          // For front/back walls (centered geometry): need to convert
          const headerY = isSideWall
            ? openingFraming.headerY
            : openingFraming.headerY - wallHeight / 2;
          const sillY = isSideWall
            ? openingFraming.sillY
            : openingFraming.sillY - wallHeight / 2;

          return (
            <>
              {/* King studs at window edges - full height */}
              <mesh
                position={[kingStudLeftX, leftKingStudY, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[STUD_WIDTH, leftKingStudHeight, STUD_DEPTH]}
                />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>
              <mesh
                position={[kingStudRightX, rightKingStudY, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[STUD_WIDTH, rightKingStudHeight, STUD_DEPTH]}
                />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>

              {/* Header - spans rough opening, sits on king studs */}
              <mesh
                position={[windowOffset, headerY, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[openingFraming.headerWidth, STUD_DEPTH, STUD_DEPTH]}
                />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>

              {/* Sill - bottom of rough opening */}
              <mesh
                position={[windowOffset, sillY, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[
                    openingFraming.roughOpeningWidth,
                    STUD_DEPTH,
                    STUD_DEPTH,
                  ]}
                />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>
            </>
          );
        })()}

      {/* Door framing - explicit king studs and header */}
      {hasDoor &&
        (() => {
          const openingFraming = getOpeningFraming(wallConfig);
          if (!openingFraming) return null;

          // King stud positions
          const roHalfWidth = openingFraming.roughOpeningWidth / 2;
          const kingStudLeftX = -roHalfWidth - STUD_HALF_WIDTH;
          const kingStudRightX = roHalfWidth + STUD_HALF_WIDTH;

          // Header Y position - calculator returns floor-relative, need to convert for centered geometry
          // For front/back walls (centered geometry): y = headerY - wallHeight/2
          // For side walls (flat-bottom geometry): y = headerY directly
          const headerY = isSideWall
            ? openingFraming.headerY
            : openingFraming.headerY - wallHeight / 2;

          return (
            <>
              {/* King studs at door edges - full height */}
              <mesh position={[kingStudLeftX, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[STUD_WIDTH, wallHeight, STUD_DEPTH]} />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>
              <mesh position={[kingStudRightX, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[STUD_WIDTH, wallHeight, STUD_DEPTH]} />
                <meshStandardMaterial color={frameColor} roughness={0.8} />
              </mesh>

              {/* Header - spans rough opening, sits on jack studs */}
              <mesh position={[0, headerY, 0]} castShadow receiveShadow>
                <boxGeometry
                  args={[openingFraming.headerWidth, STUD_DEPTH, STUD_DEPTH]}
                />
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
            const windowWidth = WINDOW_WIDTH;
            const roHalfWidth = windowWidth / 2 + WINDOW_SHIM_ALLOWANCE;

            // Window horizontal bounds
            const windowLeft = windowOffset - roHalfWidth;
            const windowRight = windowOffset + roHalfWidth;
            const halfLength = wallLength / 2;

            return (
              <>
                {/* Below window - full width, covers bottom plate and sill */}
                <mesh
                  position={[0, windowSillY / 2, SHEATHING_OFFSET]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry
                    args={[wallLength, windowSillY, SHEATHING_THICKNESS]}
                  />
                  <meshStandardMaterial
                    color={sheathingColor}
                    roughness={0.9}
                  />
                </mesh>

                {/* Left of window - from wall left to window left, sill to header */}
                <mesh
                  position={[
                    (windowLeft - halfLength) / 2,
                    (windowSillY + windowHeaderY) / 2,
                    SHEATHING_OFFSET,
                  ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry
                    args={[
                      windowLeft + halfLength,
                      windowHeaderY - windowSillY,
                      SHEATHING_THICKNESS,
                    ]}
                  />
                  <meshStandardMaterial
                    color={sheathingColor}
                    roughness={0.9}
                  />
                </mesh>

                {/* Right of window - from window right to wall right, sill to header */}
                <mesh
                  position={[
                    (windowRight + halfLength) / 2,
                    (windowSillY + windowHeaderY) / 2,
                    SHEATHING_OFFSET,
                  ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry
                    args={[
                      halfLength - windowRight,
                      windowHeaderY - windowSillY,
                      SHEATHING_THICKNESS,
                    ]}
                  />
                  <meshStandardMaterial
                    color={sheathingColor}
                    roughness={0.9}
                  />
                </mesh>

                {/* Above header - full width trapezoidal section */}
                {aboveHeaderSheathingGeometry && (
                  <mesh
                    geometry={aboveHeaderSheathingGeometry}
                    position={[0, 0, SHEATHING_OFFSET]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial
                      color={sheathingColor}
                      roughness={0.9}
                    />
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
            const doorHeight = DOOR_HEIGHT;
            const roHalfWidth = DOOR_RO_HALF_WIDTH;
            const halfLength = wallLength / 2;

            // Door vertical bounds (centered geometry)
            const headerTop =
              -wallHeight / 2 + doorHeight + STUD_WIDTH + STUD_DEPTH;

            // Door horizontal bounds
            const doorLeft = -roHalfWidth;
            const doorRight = roHalfWidth;

            return (
              <>
                {/* Left of door - from floor to header top only (no overlap with above section) */}
                <mesh
                  position={[
                    (doorLeft - halfLength) / 2,
                    (-wallHeight / 2 + headerTop) / 2,
                    SHEATHING_OFFSET,
                  ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry
                    args={[
                      doorLeft + halfLength,
                      headerTop + wallHeight / 2,
                      SHEATHING_THICKNESS,
                    ]}
                  />
                  <meshStandardMaterial
                    color={sheathingColor}
                    roughness={0.9}
                  />
                </mesh>

                {/* Right of door - from floor to header top only */}
                <mesh
                  position={[
                    (doorRight + halfLength) / 2,
                    (-wallHeight / 2 + headerTop) / 2,
                    SHEATHING_OFFSET,
                  ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry
                    args={[
                      halfLength - doorRight,
                      headerTop + wallHeight / 2,
                      SHEATHING_THICKNESS,
                    ]}
                  />
                  <meshStandardMaterial
                    color={sheathingColor}
                    roughness={0.9}
                  />
                </mesh>

                {/* Above door - full width from header top to wall top */}
                <mesh
                  position={[
                    0,
                    (headerTop + wallHeight / 2 + 0.05) / 2,
                    SHEATHING_OFFSET,
                  ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry
                    args={[
                      wallLength,
                      wallHeight / 2 + 0.05 - headerTop,
                      SHEATHING_THICKNESS,
                    ]}
                  />
                  <meshStandardMaterial
                    color={sheathingColor}
                    roughness={0.9}
                  />
                </mesh>
              </>
            );
          })()}
        </>
      ) : isSideWall && rakeSheathingGeometry ? (
        // Side wall without opening - solid trapezoidal sheathing
        <mesh
          geometry={rakeSheathingGeometry}
          position={[0, 0, SHEATHING_OFFSET]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={sheathingColor} roughness={0.9} />
        </mesh>
      ) : (
        // Front/back wall without opening - solid rectangular sheathing
        <mesh position={[0, 0, SHEATHING_OFFSET]} castShadow receiveShadow>
          <boxGeometry
            args={[wallLength, wallHeight + 0.1, SHEATHING_THICKNESS]}
          />
          <meshStandardMaterial color={sheathingColor} roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}
