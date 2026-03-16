import { useMemo } from "react";
import type { Component } from "../../schemas/bunkie.schema";
import { FLOOR_SURFACE_Y } from "../../constants/framing";
import { generateWallGeometryLocal } from "../../geometry/wall-factory";
import { GeometryRenderer } from "./GeometryRenderer";

interface WallProps {
  component: Component;
}

/** Rotation for each wall to orient it correctly in world space */
function getWallRotation(wallId: string): [number, number, number] {
  switch (wallId) {
    case "wall-west":
      return [0, Math.PI, 0]; // 180° - face +Z (front/exterior)
    case "wall-east":
      return [0, 0, 0]; // 0° - face -Z (back/exterior)
    case "wall-south":
      return [0, -Math.PI / 2, 0]; // -90° - face +X (right/exterior)
    case "wall-north":
      return [0, Math.PI / 2, 0]; // +90° - face -X (left/exterior)
    default:
      return [0, 0, 0];
  }
}

export function Wall({ component }: WallProps) {
  const wallId = component.id.replace("wall-", "") as
    | "west"
    | "east"
    | "north"
    | "south";

  const primitives = useMemo(() => {
    const geometry = generateWallGeometryLocal(wallId);
    return geometry.segments.map((s) => s.primitive);
  }, [wallId]);

  const rotation = getWallRotation(component.id);

  // All walls use Y=0 at floor in local coords; position at floor surface height
  const position: [number, number, number] = [
    component.position.x,
    FLOOR_SURFACE_Y,
    component.position.z,
  ];

  return (
    <group position={position} rotation={rotation}>
      <GeometryRenderer
        primitives={primitives}
        groupId={component.id}
        excludeMaterials={["opening"]}
      />
    </group>
  );
}
