// 3D position coordinates
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// 3D dimensions
export interface Dimensions3D {
  width: number; // X axis
  height: number; // Y axis
  depth: number; // Z axis
}

// Build phases
export type BuildPhase = "foundation" | "framing" | "envelope" | "finishing";

// Component categories
export type ComponentCategory =
  | "foundation"
  | "floor"
  | "wall"
  | "window"
  | "door"
  | "roof"
  | "appliance";

// Cost breakdown
export interface CostBreakdown {
  materials: number;
  labor: number;
  hardware: number;
  total: number;
  currency: string;
}

// Material reference
export interface MaterialRef {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  specs?: string;
}

// Code reference
export interface CodeReference {
  code: string;
  section: string;
  description: string;
  url?: string;
}

// Annotation types
export type AnnotationType = "dimension" | "label" | "clearance" | "note";

export interface Annotation {
  id: string;
  type: AnnotationType;
  text: string;
  position: Position3D;
  endPosition?: Position3D; // For dimension lines
  color?: string;
  fontSize?: number;
}

// Building component
export interface Component {
  id: string;
  name: string;
  category: ComponentCategory;
  phase: BuildPhase;
  dimensions: Dimensions3D;
  position: Position3D;
  rotation?: Position3D;
  materials: MaterialRef[];
  codeReferences: CodeReference[];
  estimatedCost: CostBreakdown;
  annotations: Annotation[];
  children?: string[]; // IDs of child components
  visible?: boolean;
}

// Site information
export interface SiteInfo {
  orientation: string;
  terrain: "bedrock" | "soil" | "concrete";
  frostDepth: number; // in mm
  slope?: number;
  accessNotes?: string;
}

// Phase definition
export interface PhaseDefinition {
  name: string;
  description: string;
  order: number;
  components: string[];
  tasks: string[];
  estimatedHours?: number;
}

// Metadata
export interface BunkieMeta {
  name: string;
  description: string;
  totalArea: number; // in m²
  totalCost: number;
  currency: string;
  created: string;
  modified: string;
}

// Main bunkie definition
export interface BunkieDefinition {
  meta: BunkieMeta;
  site: SiteInfo;
  components: Component[];
  phases: Record<BuildPhase, PhaseDefinition>;
  instructions?: InstructionStep[];
}

// View presets for camera
export interface ViewPreset {
  id: string;
  name: string;
  position: Position3D;
  target: Position3D;
}

// =============================================================================
// INSTRUCTION MANUAL TYPES
// =============================================================================

// App view type
export type AppView = "builder" | "instructions" | "materials";

// Types of 2D architectural views for instruction steps
export type ViewType =
  | "plan"
  | "side-view-front"
  | "side-view-back"
  | "side-view-side";

// 2D dimension line for drawings
export interface DimensionLine2D {
  start: { x: number; y: number };
  end: { x: number; y: number };
  label: string;
  offset: number;
}

// Instruction step for building the bunkie
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

// Store state
export interface BunkieStore {
  // Data
  bunkieDefinition: BunkieDefinition | null;

  // Selection
  selectedComponentId: string | null;
  hoveredComponentId: string | null;

  // Phase visibility
  visiblePhases: BuildPhase[];

  // Wall visibility (for inspecting interior)
  hiddenWalls: string[];

  // View options
  showAnnotations: boolean;
  showClearances: boolean;
  showDimensions: boolean;
  wireframe: boolean;

  // Camera
  activeView: string;

  // Instruction view state
  currentView: AppView;
  currentStepIndex: number;

  // Actions
  loadBunkie: (definition: BunkieDefinition) => void;
  selectComponent: (id: string | null) => void;
  hoverComponent: (id: string | null) => void;
  togglePhase: (phase: BuildPhase) => void;
  toggleWall: (wallId: string) => void;
  showAllWalls: () => void;
  setAnnotationsVisible: (visible: boolean) => void;
  setClearancesVisible: (visible: boolean) => void;
  setDimensionsVisible: (visible: boolean) => void;
  setWireframe: (wireframe: boolean) => void;
  setActiveView: (viewId: string) => void;
  getComponentById: (id: string) => Component | undefined;

  // Instruction view actions
  setView: (view: AppView) => void;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}
