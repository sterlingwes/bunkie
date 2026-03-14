# Bunkie Builder

A 3D visualization and planning tool for a small backyard bunkie structure, built with React, Three.js, and TypeScript.

## Project Overview

This application helps visualize and plan construction of a 3.0m x 3.28m (9.84m²) backyard bunkie on Canadian Shield bedrock. The structure is designed to comply with Ontario Building Code (OBC) requirements and stays under the 10m² threshold that would require building permits.

## Requirements

### Structure Specifications
- **Dimensions**: 3.0m wide x 3.28m deep (9.84m² total area)
- **Foundation**: 6 sonotube piers pinned to bedrock
- **Walls**: 2x4 framing at 16" OC with board and batten siding
- **Roof**: Shed roof (5° slope) with architectural shingles
- **Windows**: 24" x 72" (0.61m x 1.83m) vinyl dual-pane windows on north and south walls
- **Door**: 1.8m x 2.1m sliding patio door on west (front) wall
- **Heating**: EPA-certified wood stove with CSA B365 compliant installation

### Key Features
1. **3D Visualization**: Interactive 3D model with orbit controls
2. **Component Selection**: Click to select and highlight individual building components
3. **Phase-based Construction**: View foundation, framing, envelope, and finishing phases
4. **Structural Framing**: Detailed stud, header, and sill visualization
5. **Code Compliance**: OBC references embedded in component definitions

## Technical Stack

- **Frontend**: React 18 + TypeScript
- **3D Rendering**: Three.js via React Three Fiber
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest

## Project Structure

```
src/
├── components/
│   ├── 3d/
│   │   ├── Walls.tsx      # Wall framing with studs, headers, sills
│   │   ├── Windows.tsx    # Window components
│   │   ├── Floor.tsx      # Floor assembly
│   │   ├── Foundation.tsx # Sonotube piers
│   │   └── Roof.tsx       # Shed roof with rafters
│   └── ui/                # UI controls and panels
├── data/
│   └── bunkie-definition.json  # All component definitions
├── schemas/
│   └── bunkie.schema.ts   # TypeScript interfaces
├── store/
│   └── useBunkieStore.ts  # Zustand state management
└── tests/
    └── structural-validation.test.ts  # Physical validation tests
```

## Component System

### JSON-Driven Architecture
All building components are defined in `bunkie-definition.json` with:
- Dimensions (width, height, depth in meters)
- Position (x, y, z coordinates)
- Materials with quantities and costs
- Code references (OBC sections)
- Child component relationships

### Framing Details
- **Stud spacing**: 16" OC (0.406m)
- **Stud dimensions**: 2x4 (actual 38mm x 89mm)
- **Window rough opening**: Window width + 40mm shim allowance
- **King studs**: Full-height studs at window opening edges

## Structural Validation Tests

The test suite validates physical properties:
- **Gravity Support**: Walls rest on floor, roof rests on walls, piers at ground level
- **Non-Overlap**: Windows within wall bounds, door within front wall
- **Dimensions**: Floor area < 10m², window sizes match spec, wall heights reasonable

Run tests with:
```bash
npm test
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Building Code References

Key Ontario Building Code sections referenced:
- **OBC 9.15.3**: Pier foundation requirements
- **OBC 9.23.4**: Floor joist spans and sizes
- **OBC 9.23.6**: Stud size and spacing
- **OBC 9.23.10**: Exterior wall framing
- **OBC 9.23.14**: Roof framing
- **OBC 9.7.2**: Window requirements
- **CSA B365**: Wood stove installation

## Cost Estimate

Total estimated cost: ~$8,280 CAD (materials only, labor not included)
