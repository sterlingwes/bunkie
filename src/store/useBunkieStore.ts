import { create } from "zustand";
import type {
  BunkieStore,
  BunkieDefinition,
  BuildPhase,
  Component,
  AppView,
} from "../schemas/bunkie.schema";
import { instructionSteps } from "../data/instructions";

export const useBunkieStore = create<BunkieStore>((set, get) => ({
  // Data
  bunkieDefinition: null,

  // Selection
  selectedComponentId: null,
  hoveredComponentId: null,

  // Phase visibility - all phases visible by default
  visiblePhases: ["foundation", "framing", "envelope", "finishing"],

  // Wall visibility - no walls hidden by default
  hiddenWalls: [],

  // View options
  showAnnotations: true,
  showClearances: true,
  showDimensions: true,

  // Camera
  activeView: "perspective",

  // Instruction view state
  currentView: "builder",
  currentStepIndex: 0,

  // Actions
  loadBunkie: (definition: BunkieDefinition) => {
    // Merge instructions from separate data file
    set({
      bunkieDefinition: {
        ...definition,
        instructions: instructionSteps,
      },
    });
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

  setActiveView: (viewId: string) => {
    set({ activeView: viewId });
  },

  getComponentById: (id: string): Component | undefined => {
    const state = get();
    return state.bunkieDefinition?.components.find((c) => c.id === id);
  },

  // Instruction view actions
  setView: (view: AppView) => {
    set({ currentView: view });
  },

  setCurrentStepIndex: (index: number) => {
    set({ currentStepIndex: index });
  },

  nextStep: () => {
    set((state) => {
      const totalSteps = state.bunkieDefinition?.instructions?.length ?? 0;
      if (state.currentStepIndex < totalSteps - 1) {
        return { currentStepIndex: state.currentStepIndex + 1 };
      }
      return {};
    });
  },

  prevStep: () => {
    set((state) => {
      if (state.currentStepIndex > 0) {
        return { currentStepIndex: state.currentStepIndex - 1 };
      }
      return {};
    });
  },
}));
