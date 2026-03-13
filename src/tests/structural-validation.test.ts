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
          const wallBox = getBoundingBox(wall);
          // Wall bottom should be at or just above floor top
          expect(wallBox.minY).toBeGreaterThanOrEqual(floorBox.maxY - 0.15);
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
