# 2D Architectural Instruction Manual Page

## Context

The user wants a separate page that serves as a linear instruction manual for building the bunkie, following the existing build phase order (foundation → framing → envelope → finishing). The page should include 2D architectural-style drawings with clear measurements, derived from the existing 3D model data.

**User Preferences:**

- **Content authoring**: Manual JSON authoring with detailed descriptions, tips, and warnings
- **View types**: Plan views + Elevation views (front/side)
- **Detail level**: Full construction details (studs, joists, rafters at actual 16" OC spacing)

**Current State:**

- Single-page app with React Three Fiber 3D visualization
- Components defined in `bunkie-definition.json` with 3D dimensions
- Build phases already exist with task lists
- No routing system currently

## Approach

### 1. View Switching (No Router)

Add state-based view switching rather than adding react-router-dom. This keeps the app simple and maintains the single-page feel.

- Add `currentView: 'builder' | 'instructions'` to Zustand store
- Conditionally render `<BuilderView />` or `<InstructionsView />` in App.tsx
- Add a nav toggle to switch between views

### 2. SVG-Based 2D Drawings

Generate 2D drawings programmatically from existing 3D dimension data using SVG:

- No heavy dependencies needed
- Easy to add dimension lines, labels, annotations
- Derives directly from `bunkie-definition.json` geometry
- Supports future print/PDF export

### 3. Data Model Extensions

**New types to add to `bunkie.schema.ts`:**

```typescript
export type ViewType =
  | "plan"
  | "elevation-front"
  | "elevation-back"
  | "elevation-side"
  | "section";

export interface DimensionLine2D {
  start: { x: number; y: number };
  end: { x: number; y: number };
  label: string;
  offset: number;
}

export interface InstructionStep {
  id: string;
  phase: BuildPhase;
  order: number;
  title: string;
  description: string;
  views: ViewType[]; // which drawing views to show
  componentIds: string[]; // components involved
  tips?: string[];
  warnings?: string[];
}
```

**Extend `BunkieDefinition`:**

```typescript
instructions: InstructionStep[];
```

### 4. New File Structure

```
src/
  components/
    instructions/
      InstructionsPage.tsx      # Main page container
      InstructionStep.tsx       # Individual step display
      StepNavigation.tsx        # Prev/Next, progress indicator
      MaterialsList.tsx         # Required materials
      drawing/
        DrawingCanvas.tsx       # SVG viewport container
        PlanView.tsx            # Top-down floor plan
        ElevationView.tsx       # Front/back/side elevations
        SectionView.tsx         # Cross-section views
        DimensionLine.tsx       # Reusable dimension line
        Grid.tsx                # Background grid
  utils/
    drawing-utils.ts            # 2D projection utilities
```

## Critical Files to Modify

| File                              | Changes                                              |
| --------------------------------- | ---------------------------------------------------- |
| `src/store/useBunkieStore.ts`     | Add `currentView`, `currentStepIndex`, actions       |
| `src/schemas/bunkie.schema.ts`    | Add `InstructionStep`, `ViewType`, `DimensionLine2D` |
| `src/data/bunkie-definition.json` | Add `instructions` array with step content           |
| `src/App.tsx`                     | Add view conditional rendering, nav toggle           |

## Implementation Steps

### Phase 1: Infrastructure

1. Add view state to store (`currentView`, `currentStepIndex`)
2. Create view toggle in App.tsx header
3. Create `InstructionsPage.tsx` skeleton

### Phase 2: Drawing System

1. Create `drawing-utils.ts` with projection functions:
   - `projectToPlan(component)` - X-Z plane projection
   - `projectToElevation(component, direction)` - X-Y or Z-Y projection
   - `calculateDimensionLines(component)` - auto-generate dimensions
2. Create base SVG components:
   - `DrawingCanvas.tsx` - viewport with pan/zoom
   - `DimensionLine.tsx` - arrows, labels, values
   - `Grid.tsx` - background grid pattern

### Phase 3: View Renderers

1. `PlanView.tsx` - Top-down view showing:
   - Foundation pier layout with spacing dimensions
   - Floor joist layout at 16" OC (individual joists rendered)
   - Wall positions with door/window openings
   - Stud locations visible within walls
2. `ElevationView.tsx` - Front/back/side views showing:
   - Wall framing with individual studs at 16" OC
   - Door/window headers, sills, and rough openings
   - Roof slope (5°) with rafter locations
   - Height dimensions from floor to ceiling
3. (Future) `SectionView.tsx` - Cross-section showing connections

### Phase 4: Data & Content

1. Extend schema with new types
2. Add `instructions` array to JSON with step-by-step content
3. Create instruction steps from existing phase tasks

### Phase 5: Instruction UI

1. `InstructionStep.tsx` - displays step with drawings
2. `StepNavigation.tsx` - prev/next, progress bar
3. `MaterialsList.tsx` - pulls from component materials

## Deriving 2D from 3D (Examples)

```typescript
// Foundation plan view - circles for piers with labels
function projectFoundationPlan(foundation: Component, piers: Component[]) {
  return {
    outline: {
      width: foundation.dimensions.width,
      depth: foundation.dimensions.depth,
    },
    piers: piers.map((pier) => ({
      cx: pier.position.x,
      cy: pier.position.z,
      r: pier.dimensions.width / 2,
      label: pier.id.split("-")[1].toUpperCase(), // FL, ML, BL, FR, MR, BR
    })),
  };
}

// Floor plan view - rectangle with individual joists at 16" OC
function projectFloorPlan(floor: Component, spacing: number = 0.406) {
  const joists = [];
  const startX = -floor.dimensions.width / 2 + 0.05; // offset from edge
  for (let x = startX; x <= floor.dimensions.width / 2 - 0.05; x += spacing) {
    joists.push({
      x1: x,
      y1: -floor.dimensions.depth / 2,
      x2: x,
      y2: floor.dimensions.depth / 2,
      thickness: 0.038, // 2x8 actual thickness ~38mm
    });
  }
  return {
    outline: floor.dimensions,
    rimJoists: { top: true, bottom: true, left: true, right: true },
    joists,
    spacing,
  };
}

// Wall elevation - studs, header, sill, opening
function projectWallElevation(
  wall: Component,
  opening?: { width; height; sillHeight },
) {
  const studs = [];
  const studSpacing = 0.406; // 16" OC
  for (
    let x = -wall.dimensions.width / 2;
    x <= wall.dimensions.width / 2;
    x += studSpacing
  ) {
    studs.push({ x, height: wall.dimensions.height });
  }
  return {
    outline: wall.dimensions,
    studs,
    plates: { bottom: 0.038, top: 0.038, doubleTop: 0.038 },
    opening: opening
      ? {
          x: 0, // centered
          width: opening.width,
          sillHeight: opening.sillHeight,
          headerHeight: opening.sillHeight + opening.height,
        }
      : null,
  };
}
```

## Verification

1. **Manual Testing:**
   - Switch between Builder and Instructions views
   - Navigate through all instruction steps
   - Verify dimensions match 3D model measurements
   - Check all 4 phases have complete steps

2. **Dimension Accuracy:**
   - Foundation: 6 piers at correct positions
   - Floor: 3.0m x 3.28m, joists at 16" OC
   - Walls: heights 2.1m-2.4m, openings correct
   - Roof: 5° slope visible in section view

3. **Visual Review:**
   - Drawings are clear and readable
   - Dimension lines don't overlap
   - Labels are positioned well
