import { create } from 'zustand';
import type {
  BunkieStore,
  BunkieDefinition,
  BuildPhase,
  Component,
} from '../schemas/bunkie.schema';

export const useBunkieStore = create<BunkieStore>((set, get) => ({
  // Data
  bunkieDefinition: null,

  // Selection
  selectedComponentId: null,
  hoveredComponentId: null,

  // Phase visibility - all phases visible by default
  visiblePhases: ['foundation', 'framing', 'envelope', 'finishing'],

  // Wall visibility - no walls hidden by default
  hiddenWalls: [],

  // View options
  showAnnotations: true,
  showClearances: true,
  showDimensions: true,
  wireframe: false,

  // Camera
  activeView: 'perspective',

  // Actions
  loadBunkie: (definition: BunkieDefinition) => {
    set({ bunkieDefinition: definition });
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponentId: id });
  },

  hoverComponent: (id: string | null) => {
    set({ hoveredComponentId: id });
  },

  togglePhase: (phase: BuildPhase) => {
    set((state) => {
      const visiblePhases = state.visiblePhases.includes(phase)
        ? state.visiblePhases.filter((p) => p !== phase)
        : [...state.visiblePhases, phase];
      return { visiblePhases };
    });
  },

  toggleWall: (wallId: string) => {
    set((state) => {
      const hiddenWalls = state.hiddenWalls.includes(wallId)
        ? state.hiddenWalls.filter((id) => id !== wallId)
        : [...state.hiddenWalls, wallId];
      return { hiddenWalls };
    });
  },

  showAllWalls: () => {
    set({ hiddenWalls: [] });
  },

  setAnnotationsVisible: (visible: boolean) => {
    set({ showAnnotations: visible });
  },

  setClearancesVisible: (visible: boolean) => {
    set({ showClearances: visible });
  },

  setDimensionsVisible: (visible: boolean) => {
    set({ showDimensions: visible });
  },

  setWireframe: (wireframe: boolean) => {
    set({ wireframe });
  },

  setActiveView: (viewId: string) => {
    set({ activeView: viewId });
  },

  getComponentById: (id: string): Component | undefined => {
    const state = get();
    return state.bunkieDefinition?.components.find((c) => c.id === id);
  },
}));
