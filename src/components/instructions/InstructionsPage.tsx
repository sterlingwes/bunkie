/**
 * InstructionsPage
 *
 * Main container for the architectural instruction manual view.
 * Displays step-by-step building instructions with 2D drawings.
 */

import { useState } from "react";
import { useBunkieStore } from "../../store/useBunkieStore";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Box,
  ChevronDown,
  X,
  Image,
} from "lucide-react";
import { PlanView } from "./drawing/PlanView";
import {
  FrontElevation2D,
  BackElevation2D,
  RightElevation2D,
} from "./drawing/GeometryRenderer2D";
import { InstructionStep } from "./InstructionStep";
import { MaterialsList } from "./MaterialsList";
import type {
  ViewType,
  InstructionStep as InstructionStepType,
} from "../../schemas/bunkie.schema";
import type { UnitSystem } from "../../utils/unit-conversion";

const VIEW_LABELS: Record<ViewType, string> = {
  plan: "Plan View",
  "side-view-front": "Front Wall",
  "side-view-back": "Back Wall",
  "side-view-side": "Side Walls",
};

/**
 * Dropdown to quickly jump to any step
 */
function StepDropdown({
  steps,
  currentIndex,
  onSelect,
}: {
  steps: InstructionStepType[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="relative">
      <select
        value={currentIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="appearance-none bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-100 text-xs font-medium rounded-md px-2 py-1.5 pr-7 cursor-pointer border-none outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        {steps.map((step, index) => (
          <option key={step.id} value={index} className="bg-zinc-800">
            {index + 1}. {step.title}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
      />
    </div>
  );
}

/**
 * Render the appropriate drawing based on view type
 */
function DrawingRenderer({
  view,
  step,
  units,
}: {
  view: ViewType;
  step: {
    phase: string;
    componentIds: string[];
  };
  units: UnitSystem;
}) {
  // Show different drawings based on phase and view type
  const showPiers =
    step.phase === "foundation" ||
    step.componentIds.some((id) => id.includes("pier"));
  const showJoists =
    step.phase === "framing" &&
    step.componentIds.some((id) => id.includes("floor"));
  const showWalls = step.phase !== "foundation";
  const showFraming =
    step.phase === "framing" ||
    step.componentIds.some((id) => id.includes("wall"));

  // Plan view uses legacy renderer (for now)
  if (view === "plan") {
    return (
      <PlanView
        showPiers={showPiers}
        showJoists={showJoists}
        showWalls={showWalls}
        showDimensions={true}
        scale={100}
        units={units}
      />
    );
  }

  // All elevation views use new unified geometry renderer
  const viewMap: Record<string, React.ReactNode> = {
    "side-view-front": (
      <FrontElevation2D showFraming={showFraming} showSheathing scale={100} />
    ),
    "side-view-back": (
      <BackElevation2D showFraming={showFraming} showSheathing scale={100} />
    ),
    "side-view-side": (
      <RightElevation2D showFraming={showFraming} showSheathing scale={100} />
    ),
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      {viewMap[view] || (
        <div className="text-zinc-500 p-4 text-center text-sm">
          No drawing available for this view
        </div>
      )}
    </div>
  );
}

/**
 * View selector tabs for steps with multiple views
 */
function ViewSelector({
  views,
  selectedView,
  onSelect,
}: {
  views: ViewType[];
  selectedView: ViewType;
  onSelect: (view: ViewType) => void;
}) {
  if (views.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-700/50 rounded-lg">
      {views.map((view) => (
        <button
          key={view}
          onClick={() => onSelect(view)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            selectedView === view
              ? "bg-blue-500 text-white"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600/50"
          }`}
        >
          {VIEW_LABELS[view]}
        </button>
      ))}
    </div>
  );
}

export function InstructionsPage() {
  const { currentStepIndex, nextStep, prevStep, bunkieDefinition } =
    useBunkieStore();
  const [selectedView, setSelectedView] = useState<ViewType | null>(null);
  const [units, setUnits] = useState<UnitSystem>("imperial");
  const [showDiagramOverlay, setShowDiagramOverlay] = useState(false);

  const instructions = bunkieDefinition?.instructions ?? [];
  const components = bunkieDefinition?.components ?? [];
  const currentStep = instructions[currentStepIndex];
  const totalSteps = instructions.length;

  // Determine the active view
  const activeView = selectedView ?? currentStep?.views[0] ?? "plan";

  // Reset selected view when step changes
  const handlePrev = () => {
    setSelectedView(null);
    prevStep();
  };

  const handleNext = () => {
    setSelectedView(null);
    nextStep();
  };

  // Handler for step dropdown selection
  const handleStepSelect = (index: number) => {
    setSelectedView(null);
    setShowDiagramOverlay(false);
    useBunkieStore.getState().setCurrentStepIndex(index);
  };

  // Handler for view selection
  const handleViewSelect = (view: ViewType) => {
    setSelectedView(view);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-900 text-zinc-100">
      {/* Header with navigation */}
      <header className="flex-shrink-0 border-b border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center justify-between px-2 py-2 sm:px-4">
          {/* Left: Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen className="text-blue-400" size={18} />
            <h1 className="text-sm sm:text-base font-semibold hidden sm:block">
              Building Instructions
            </h1>
          </div>

          {/* Center: Step dropdown + progress */}
          <div className="flex items-center gap-2 sm:gap-4">
            {totalSteps > 0 && (
              <StepDropdown
                steps={instructions}
                currentIndex={currentStepIndex}
                onSelect={handleStepSelect}
              />
            )}
            <span className="text-xs sm:text-sm text-zinc-400">
              {currentStepIndex + 1} / {totalSteps || "—"}
            </span>
            <div className="w-16 sm:w-24 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width:
                    totalSteps > 0
                      ? `${((currentStepIndex + 1) / totalSteps) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          {/* Right: Navigation + Unit toggle + View selector */}
          <div className="flex items-center gap-2">
            {/* Unit toggle */}
            <button
              onClick={() =>
                setUnits(units === "imperial" ? "metric" : "imperial")
              }
              className="px-2 py-1 text-xs font-medium rounded-md bg-zinc-700/50 hover:bg-zinc-600/50 transition-colors"
              title={`Switch to ${units === "imperial" ? "metric" : "imperial"} units`}
            >
              {units === "imperial" ? "ft/in" : "mm/m"}
            </button>
            {currentStep && currentStep.views.length > 1 && (
              <ViewSelector
                views={currentStep.views}
                selectedView={activeView}
                onSelect={handleViewSelect}
              />
            )}
            {/* Navigation arrows - together on the right */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700"
                aria-label="Previous step"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                disabled={currentStepIndex >= totalSteps - 1}
                className="p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700"
                aria-label="Next step"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Drawing area - hidden on mobile, shown on lg+ */}
        <div className="hidden lg:flex flex-1 p-4 items-center justify-center min-h-0 overflow-hidden">
          <div className="w-full h-full max-h-full bg-white rounded-lg shadow-lg overflow-hidden flex items-center justify-center p-2">
            {currentStep ? (
              <DrawingRenderer
                view={activeView}
                step={{
                  phase: currentStep.phase,
                  componentIds: currentStep.componentIds,
                }}
                units={units}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-zinc-400 p-8 text-center">
                  <Box size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No Instructions</p>
                  <p className="text-sm mt-2">
                    No instruction steps are available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step details sidebar - full width on mobile */}
        <aside className="flex-1 lg:w-96 lg:flex-none border-t lg:border-t-0 lg:border-l border-zinc-700 bg-zinc-800/30 overflow-y-auto flex-shrink-0">
          <div className="p-4 sm:p-5">
            {/* View Diagram button - mobile only */}
            {currentStep && (
              <button
                onClick={() => setShowDiagramOverlay(true)}
                className="lg:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                <Image size={20} />
                View Diagram
              </button>
            )}

            {currentStep ? (
              <>
                <InstructionStep step={currentStep} />
                <MaterialsList
                  components={components}
                  componentIds={currentStep.componentIds}
                />
              </>
            ) : (
              <div className="text-zinc-500 text-sm">
                <p>No instruction steps defined yet.</p>
                <p className="mt-2 text-xs">
                  Add steps to bunkie-definition.json to see them here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Diagram overlay - mobile only */}
      {showDiagramOverlay && currentStep && (
        <div className="lg:hidden fixed inset-0 z-50 bg-zinc-900 flex flex-col">
          {/* Overlay header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium">{VIEW_LABELS[activeView]}</h2>
              {currentStep.views.length > 1 && (
                <ViewSelector
                  views={currentStep.views}
                  selectedView={activeView}
                  onSelect={handleViewSelect}
                />
              )}
            </div>
            <button
              onClick={() => setShowDiagramOverlay(false)}
              className="p-2 rounded-md hover:bg-zinc-700 transition-colors"
              aria-label="Close diagram"
            >
              <X size={24} />
            </button>
          </div>

          {/* Diagram content */}
          <div className="flex-1 p-4 flex items-center justify-center overflow-hidden bg-zinc-800">
            <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
              <DrawingRenderer
                view={activeView}
                step={{
                  phase: currentStep.phase,
                  componentIds: currentStep.componentIds,
                }}
                units={units}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
