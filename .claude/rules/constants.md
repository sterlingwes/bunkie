# Constants Rule

All raw measurement values must be defined in constants files, not in application code.

## Guidelines

### Application Code
- All raw measurement values (dimensions, spacing, offsets, etc.) must be in `src/constants/` files
- Components, hooks, and utilities must import from constants
- No magic numbers in application code

### Tests
- Tests may contain raw values only for their assertions (expected values)
- Tests should import from constants for values being tested

### Benefits
- Ensures consistency across the codebase
- Makes dimension changes easier (single source of truth)
- Self-documenting code with named constants
- Easier to verify calculations

## Example

```typescript
// ❌ Bad - raw values in component
<mesh position={[0, 0, 0.048]}>
  <boxGeometry args={[3.28, 2.1, 0.011]} />

// ✅ Good - constants from framing.ts
import { SHEATHING_OFFSET, SIDE_WALL_LENGTH, BACK_WALL_HEIGHT, SHEATHING_THICKNESS } from '../../constants/framing';

<mesh position={[0, 0, SHEATHING_OFFSET]}>
  <boxGeometry args={[SIDE_WALL_LENGTH, BACK_WALL_HEIGHT, SHEATHING_THICKNESS]} />
```

## Constants Location

- Framing/building measurements: `src/constants/framing.ts`
- Add new constant files as needed for other domains
