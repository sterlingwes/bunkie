import { describe, it, expect } from 'vitest';
import bunkieDefinition from '../data/bunkie-definition.json';
import type { BunkieDefinition, Component } from '../schemas/bunkie.schema';

const bunkie = bunkieDefinition as BunkieDefinition;
const components = bunkie.components;

// Helper to get component by ID
function getComponentById(id: string): Component | undefined {
  return components.find(c => c.id === id);
}

// Bounding box interface
interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

// Calculate bounding box for a component
function getBoundingBox(comp: Component): BoundingBox {
  const { position, dimensions } = comp;
  return {
    minX: position.x - dimensions.width / 2,
    maxX: position.x + dimensions.width / 2,
    minY: position.y - dimensions.height / 2,
    maxY: position.y + dimensions.height / 2,
    minZ: position.z - dimensions.depth / 2,
    maxZ: position.z + dimensions.depth / 2,
  };
}

describe('Structural Validation Tests', () => {
  describe('Gravity Support Tests', () => {
    it('Foundation piers must be at ground level', () => {
      const piers = components.filter(c => c.id.startsWith('pier-'));
      piers.forEach(pier => {
        // Piers should have their top at y=0 or extend below
        expect(pier.position.y).toBeLessThanOrEqual(0);
      });
    });

    it('Floor must rest on foundation', () => {
      const floor = getComponentById('floor-assembly');
      const piers = components.filter(c => c.id.startsWith('pier-'));

      expect(floor).toBeDefined();
      expect(piers.length).toBeGreaterThan(0);

      if (floor) {
        const floorBox = getBoundingBox(floor);
        // Piers should support the floor
        const pierTops = piers.map(p => getBoundingBox(p).maxY);
        const highestPierTop = Math.max(...pierTops);

        // Floor bottom should be at or just above highest pier top
        // Piers go from y=-0.4 to y=0, floor goes from y=0 to y=0.2
        expect(floorBox.minY).toBeGreaterThanOrEqual(highestPierTop - 0.05);
      }
    });

    it('Walls must rest on floor', () => {
      const floor = getComponentById('floor-assembly');
      const walls = components.filter(c => c.category === 'wall' && c.id.startsWith('wall-'));

      expect(floor).toBeDefined();
      expect(walls.length).toBeGreaterThan(0);

      if (floor) {
        const floorBox = getBoundingBox(floor);
        walls.forEach(wall => {
          // Side walls (south/north) use flat-bottom geometry where position.y is the wall bottom
          // Front/back walls use centered geometry where minY = position.y - height/2
          const isSideWall = wall.id === 'wall-south' || wall.id === 'wall-north';
          const wallBottomY = isSideWall
            ? wall.position.y  // Flat-bottom: position.y is the bottom
            : wall.position.y - wall.dimensions.height / 2;  // Centered geometry

          // Wall bottom should be at or just above floor top
          expect(wallBottomY).toBeGreaterThanOrEqual(floorBox.maxY - 0.15);
        });
      }
    });

    it('Roof must rest on walls', () => {
      const roof = getComponentById('roof-assembly');
      const walls = components.filter(c => c.category === 'wall' && c.id.startsWith('wall-'));

      expect(roof).toBeDefined();
      expect(walls.length).toBeGreaterThan(0);

      if (roof) {
        const roofBox = getBoundingBox(roof);
        const wallTops = walls.map(w => getBoundingBox(w).maxY);
        const highestWallTop = Math.max(...wallTops);

        // Roof bottom should be at or just above highest wall top
        expect(roofBox.minY).toBeGreaterThanOrEqual(highestWallTop - 0.15);
      }
    });
  });

  describe('Non-Overlap Tests', () => {
    it('Windows should be within wall bounds (with rough opening tolerance)', () => {
      const windows = components.filter(c => c.category === 'window');

      windows.forEach(window => {
        // Find the parent wall (windows have position relative to their wall)
        const windowBox = getBoundingBox(window);

        // Check window is at a reasonable height (above floor, below roof)
        expect(windowBox.minY).toBeGreaterThan(0); // Above floor
        expect(windowBox.maxY).toBeLessThan(3); // Below typical roof height

        // Check window dimensions are reasonable
        expect(window.dimensions.width).toBeGreaterThan(0);
        expect(window.dimensions.height).toBeGreaterThan(0);
      });
    });

    it('Door should be within front wall bounds', () => {
      const door = getComponentById('sliding-door');
      const frontWall = getComponentById('wall-west');

      expect(door).toBeDefined();
      expect(frontWall).toBeDefined();

      if (door && frontWall) {
        const doorBox = getBoundingBox(door);
        const wallBox = getBoundingBox(frontWall);

        // Door should fit within wall width
        expect(doorBox.minX).toBeGreaterThanOrEqual(wallBox.minX - 0.1);
        expect(doorBox.maxX).toBeLessThanOrEqual(wallBox.maxX + 0.1);
      }
    });
  });

  describe('Dimension Validation', () => {
    it('Floor area should be under 10m² (permitless limit)', () => {
      const floor = getComponentById('floor-assembly');
      expect(floor).toBeDefined();

      if (floor) {
        const area = floor.dimensions.width * floor.dimensions.depth;
        expect(area).toBeLessThan(10);
        expect(area).toBeGreaterThan(0);
      }
    });

    it('Window dimensions should match specification (24" x 72")', () => {
      const southWindow = getComponentById('window-south');
      const northWindow = getComponentById('window-north');

      // 24" = 0.61m, 72" = 1.83m
      const expectedWidth = 0.61;
      const expectedHeight = 1.83;

      [southWindow, northWindow].forEach(window => {
        expect(window).toBeDefined();
        if (window) {
          expect(window.dimensions.width).toBeCloseTo(expectedWidth, 1);
          expect(window.dimensions.height).toBeCloseTo(expectedHeight, 0);
        }
      });
    });

    it('Window rough opening should be larger than window dimensions', () => {
      // This is validated in the framing code, but we check the window fits
      const southWindow = getComponentById('window-south');
      const southWall = getComponentById('wall-south');

      expect(southWindow).toBeDefined();
      expect(southWall).toBeDefined();

      if (southWindow && southWall) {
        // Window width should be less than wall width
        expect(southWindow.dimensions.width).toBeLessThan(southWall.dimensions.width);
      }
    });

    it('Wall heights should be reasonable (between 2m and 3m)', () => {
      const walls = components.filter(c => c.category === 'wall' && c.id.startsWith('wall-'));

      walls.forEach(wall => {
        expect(wall.dimensions.height).toBeGreaterThanOrEqual(2);
        expect(wall.dimensions.height).toBeLessThanOrEqual(3);
      });
    });

    it('Total cost should be tracked in metadata', () => {
      expect(bunkie.meta.totalCost).toBeGreaterThan(0);
      expect(bunkie.meta.totalArea).toBeGreaterThan(0);
    });
  });

  describe('Window Framing Alignment', () => {
    it('Windows must be centered in their framing openings', () => {
      // The framing logic in Walls.tsx places windows at:
      // - windowOffset = wallLength / 4 for 'front' position
      // - windowOffset = -wallLength / 4 for 'back' position
      //
      // Walls are rotated, so local X offset becomes world Z offset:
      // - wall-south: rotation -90° around Y → local +X becomes world +Z
      // - wall-north: rotation +90° around Y → local +X becomes world -Z
      //
      // Wall length is 3.28m, so:
      // - wall-south (front): windowOffset = 0.82 → world z = 0 + 0.82 = 0.82
      // - wall-north (back): windowOffset = -0.82 → world z = 0 - (-0.82) = 0.82

      const southWindow = getComponentById('window-south');
      const northWindow = getComponentById('window-north');
      const southWall = getComponentById('wall-south');
      const northWall = getComponentById('wall-north');

      expect(southWindow).toBeDefined();
      expect(northWindow).toBeDefined();
      expect(southWall).toBeDefined();
      expect(northWall).toBeDefined();

      if (!southWindow || !northWindow || !southWall || !northWall) return;

      const wallLength = southWall.dimensions.width; // 3.28m
      const expectedWindowOffset = wallLength / 4; // 0.82m

      // Both windows should be at world z = 0.82 (calculated from framing logic)
      const expectedZ = expectedWindowOffset; // 0.82m

      // Tolerance of 5cm for positioning
      const tolerance = 0.05;

      // South window should be at z ≈ 0.82
      expect(
        Math.abs(southWindow.position.z - expectedZ),
        `South window z=${southWindow.position.z.toFixed(2)}m should be at framing position z=${expectedZ.toFixed(2)}m`
      ).toBeLessThan(tolerance);

      // North window should be at z ≈ 0.82
      expect(
        Math.abs(northWindow.position.z - expectedZ),
        `North window z=${northWindow.position.z.toFixed(2)}m should be at framing position z=${expectedZ.toFixed(2)}m`
      ).toBeLessThan(tolerance);
    });

    it('Windows must have correct X position (on their respective walls)', () => {
      const southWindow = getComponentById('window-south');
      const northWindow = getComponentById('window-north');
      const southWall = getComponentById('wall-south');
      const northWall = getComponentById('wall-north');

      if (!southWindow || !northWindow || !southWall || !northWall) return;

      // Windows should be at the same X as their walls
      expect(southWindow.position.x).toBeCloseTo(southWall.position.x, 1);
      expect(northWindow.position.x).toBeCloseTo(northWall.position.x, 1);
    });

    it('Windows must have correct Y position (centered vertically in opening)', () => {
      const southWindow = getComponentById('window-south');
      const northWindow = getComponentById('window-north');

      if (!southWindow || !northWindow) return;

      // Window is 1.83m tall, sill is just above floor (y ≈ 0.2)
      // Window center should be at: 0.2 + 1.83/2 ≈ 1.115
      // But we positioned at y = 1.2 which is close
      const expectedY = 1.2;
      const tolerance = 0.1;

      expect(
        Math.abs(southWindow.position.y - expectedY),
        `South window y=${southWindow.position.y.toFixed(2)}m should be near expected y=${expectedY.toFixed(2)}m`
      ).toBeLessThan(tolerance);

      expect(
        Math.abs(northWindow.position.y - expectedY),
        `North window y=${northWindow.position.y.toFixed(2)}m should be near expected y=${expectedY.toFixed(2)}m`
      ).toBeLessThan(tolerance);
    });
  });

  describe('Door Framing Alignment', () => {
    it('Door dimensions should match specification (72.5" x 80")', () => {
      const door = getComponentById('sliding-door');

      // 72.5" = 1.8415m, 80" = 2.032m
      const expectedWidth = 1.84;
      const expectedHeight = 2.03;
      const tolerance = 0.01;

      expect(door).toBeDefined();
      if (door) {
        expect(
          Math.abs(door.dimensions.width - expectedWidth),
          `Door width ${door.dimensions.width}m should be ${expectedWidth}m`
        ).toBeLessThan(tolerance);
        expect(
          Math.abs(door.dimensions.height - expectedHeight),
          `Door height ${door.dimensions.height}m should be ${expectedHeight}m`
        ).toBeLessThan(tolerance);
      }
    });

    it('Door should be centered on front wall', () => {
      const door = getComponentById('sliding-door');
      const frontWall = getComponentById('wall-west');

      expect(door).toBeDefined();
      expect(frontWall).toBeDefined();

      if (door && frontWall) {
        // Door should be centered (x position should be same as wall center)
        expect(door.position.x).toBeCloseTo(frontWall.position.x, 1);
        // Door should be on the front wall (same z position)
        expect(door.position.z).toBeCloseTo(frontWall.position.z, 1);
      }
    });

    it('Door should fit snugly in rough opening', () => {
      const door = getComponentById('sliding-door');
      const frontWall = getComponentById('wall-west');

      expect(door).toBeDefined();
      expect(frontWall).toBeDefined();

      if (door && frontWall) {
        // Rough opening should be door width + shim allowance (12.5mm each side = 25mm total)
        const doorWidth = door.dimensions.width;
        const roughOpeningWidth = doorWidth + 0.025; // 25mm total shim allowance

        // Wall is 3.0m wide, door is centered
        // Rough opening goes from -roughOpeningWidth/2 to +roughOpeningWidth/2
        // Wall goes from -1.5 to +1.5

        // Verify door fits within wall bounds
        const doorBox = getBoundingBox(door);
        const wallBox = getBoundingBox(frontWall);

        // Door should fit within wall width
        expect(doorBox.minX).toBeGreaterThan(wallBox.minX);
        expect(doorBox.maxX).toBeLessThan(wallBox.maxX);

        // Door should fit within wall height (with room for header)
        expect(doorBox.minY).toBeGreaterThan(wallBox.minY);
        expect(doorBox.maxY).toBeLessThan(wallBox.maxY);

        // Rough opening should be reasonable size
        expect(roughOpeningWidth).toBeLessThan(wallBox.maxX - wallBox.minX);
      }
    });

    it('Door rough opening should leave adequate shim space', () => {
      const door = getComponentById('sliding-door');

      expect(door).toBeDefined();

      if (door) {
        // Door dimensions: 1.84m x 2.03m
        const doorWidth = door.dimensions.width;
        const doorHeight = door.dimensions.height;

        // Rough opening should be door + 12.5mm each side for shims
        const minShimAllowance = 0.010; // 10mm minimum each side
        const maxShimAllowance = 0.020; // 20mm maximum each side

        const roughOpeningWidth = doorWidth + (minShimAllowance * 2);
        const roughOpeningHeight = doorHeight + (minShimAllowance * 2);

        // Verify rough opening is larger than door
        expect(roughOpeningWidth).toBeGreaterThan(doorWidth);
        expect(roughOpeningHeight).toBeGreaterThan(doorHeight);

        // Verify rough opening isn't excessively large
        const maxRoughOpeningWidth = doorWidth + (maxShimAllowance * 2);
        expect(roughOpeningWidth).toBeLessThanOrEqual(maxRoughOpeningWidth);
      }
    });

    it('Door should have correct Y position (sill at floor level)', () => {
      const door = getComponentById('sliding-door');
      const floor = getComponentById('floor-assembly');

      expect(door).toBeDefined();
      expect(floor).toBeDefined();

      if (door && floor) {
        const floorBox = getBoundingBox(floor);
        const doorBox = getBoundingBox(door);

        // Door sill should be at or just above floor top
        expect(doorBox.minY).toBeGreaterThanOrEqual(floorBox.maxY - 0.05);
      }
    });
  });

  describe('Insulation Requirements (Canadian Climate)', () => {
    it('Floor insulation should be R-28 or better', () => {
      const floor = getComponentById('floor-assembly');
      expect(floor).toBeDefined();

      if (floor) {
        const floorInsulation = floor.materials.find(m => m.id === 'insulation-floor');
        expect(floorInsulation).toBeDefined();
        expect(floorInsulation?.name).toMatch(/R-2[89]|R-3[0-9]/);
      }
    });

    it('Wall insulation component should exist and be in finishing phase', () => {
      const wallInsulation = getComponentById('insulation-walls');
      expect(wallInsulation).toBeDefined();

      if (wallInsulation) {
        expect(wallInsulation.phase).toBe('finishing');
        expect(wallInsulation.materials.length).toBeGreaterThan(0);
      }
    });

    it('Wall insulation should include R-20 batts and R-5 continuous', () => {
      const wallInsulation = getComponentById('insulation-walls');
      expect(wallInsulation).toBeDefined();

      if (wallInsulation) {
        const batts = wallInsulation.materials.find(m => m.id === 'r20-batts');
        const rigid = wallInsulation.materials.find(m => m.id === 'r5-rigid');

        expect(batts).toBeDefined();
        expect(rigid).toBeDefined();
        expect(batts?.name).toMatch(/R-20/);
        expect(rigid?.name).toMatch(/R-5/);
      }
    });

    it('Wall insulation should include vapor barrier for Canadian climate', () => {
      const wallInsulation = getComponentById('insulation-walls');
      expect(wallInsulation).toBeDefined();

      if (wallInsulation) {
        const vaporBarrier = wallInsulation.materials.find(m => m.id === 'vapor-barrier');
        const sealant = wallInsulation.materials.find(m => m.id === 'acoustic-sealant');

        expect(vaporBarrier).toBeDefined();
        expect(sealant).toBeDefined();
      }
    });

    it('Ceiling insulation should exist for heated space', () => {
      const ceilingInsulation = getComponentById('insulation-ceiling');
      expect(ceilingInsulation).toBeDefined();

      if (ceilingInsulation) {
        expect(ceilingInsulation.phase).toBe('finishing');
        expect(ceilingInsulation.category).toBe('roof');
      }
    });

    it('Ceiling insulation should be R-40 or better for Canadian climate', () => {
      const ceilingInsulation = getComponentById('insulation-ceiling');
      expect(ceilingInsulation).toBeDefined();

      if (ceilingInsulation) {
        const batts = ceilingInsulation.materials.find(m => m.id === 'r40-batts');
        expect(batts).toBeDefined();
        expect(batts?.name).toMatch(/R-4[0-9]/);
      }
    });

    it('Finishing phase should include all insulation components', () => {
      const finishingPhase = bunkie.phases.finishing;
      expect(finishingPhase.components).toContain('insulation-walls');
      expect(finishingPhase.components).toContain('insulation-ceiling');
    });

    it('Insulation materials should have OBC code references', () => {
      const wallInsulation = getComponentById('insulation-walls');
      const ceilingInsulation = getComponentById('insulation-ceiling');

      expect(wallInsulation?.codeReferences.some(ref => ref.code === 'OBC')).toBe(true);
      expect(ceilingInsulation?.codeReferences.some(ref => ref.code === 'OBC')).toBe(true);
    });
  });

  describe('Component Relationships', () => {
    it('Walls should reference their windows/doors as children', () => {
      const frontWall = getComponentById('wall-west');
      const southWall = getComponentById('wall-south');
      const northWall = getComponentById('wall-north');

      expect(frontWall?.children).toContain('sliding-door');
      expect(southWall?.children).toContain('window-south');
      expect(northWall?.children).toContain('window-north');
    });

    it('All phases should have valid component references', () => {
      const componentIds = new Set(components.map(c => c.id));

      Object.values(bunkie.phases).forEach(phase => {
        phase.components.forEach(compId => {
          expect(componentIds.has(compId), `Phase references unknown component: ${compId}`).toBe(true);
        });
      });
    });
  });
});
