import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const MOVE_SPEED = 0.05;
const SHIFT_MULTIPLIER = 3;

export function CameraControls() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      keysPressed.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!controlsRef.current) return;

    const keys = keysPressed.current;
    const shift = keys.has("Shift");

    // Calculate movement direction based on arrow keys
    let moveX = 0;
    let moveZ = 0;

    if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) {
      moveZ -= 1;
    }
    if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) {
      moveZ += 1;
    }
    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
      moveX -= 1;
    }
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
      moveX += 1;
    }

    if (moveX === 0 && moveZ === 0) return;

    // Get camera's forward direction (on XZ plane)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Right vector is perpendicular to forward
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Calculate movement vector
    const speed = MOVE_SPEED * (shift ? SHIFT_MULTIPLIER : 1);
    const moveVector = new THREE.Vector3();
    moveVector.addScaledVector(forward, -moveZ * speed);
    moveVector.addScaledVector(right, moveX * speed);

    // Move both camera and target
    camera.position.add(moveVector);

    const target = controlsRef.current.target;
    target.add(moveVector);

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2}
    />
  );
}
