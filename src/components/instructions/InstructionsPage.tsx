/**
 * InstructionsPage
 *
 * Main container for the architectural instruction manual view.
 * Displays step-by-step building instructions with 2D drawings.
 */

import { useState } from "react";
import { useBunkieStore } from "../../store/useBunkieStore";
import { BookOpen, Box, Eye } from "lucide-react";
import { PlanView } from "./drawing/PlanView";
import { ElevationView } from "./drawing/ElevationView";
import { InstructionStep } from "./InstructionStep";
import { StepNavigation } from "./StepNavigation";
import { MaterialsList } from "./MaterialsList";
import type { ViewType } from "../../schemas/bunkie.schema";

const VIEW_LABELS: Record<ViewType, string> = {
  plan: "Plan View",
  "elevation-front": "Front Elevation",
  "elevation-back": "Back Elevation",
  "elevation-side": "Side Elevation",
  section: "Section View",
};

/**
 * Render the appropriate drawing based on view type
 */
function DrawingRenderer({
  view,
  step,
}: {
  view: ViewType;
  step: {
    phase: string;
    componentIds: string[];
  };
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
  const showOpenings = step.phase !== "foundation";

  switch (view) {
    case "plan":
      return (
        <PlanView
          showPiers={showPiers}
          showJoists={showJoists}
          showWalls={showWalls}
          showDimensions={true}
          scale={100}
        />
      );
    case "elevation-front":
      return (
        <ElevationView
          direction="front"
          showFraming={showFraming}
          showDimensions={true}
          showOpenings={showOpenings}
          showRoof={true}
          scale={100}
        />
      );
    case "elevation-back":
      return (
        <ElevationView
          direction="back"
          showFraming={showFraming}
          showDimensions={true}
          showOpenings={false}
          showRoof={true}
          scale={100}
        />
      );
    case "elevation-side":
      return (
        <ElevationView
          direction="side"
          showFraming={showFraming}
          showDimensions={true}
          showOpenings={showOpenings}
          showRoof={true}
          scale={100}
        />
      );
    case "section":
      return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-100">
          <div className="text-zinc-500 p-8 text-center">
            <p className="text-lg mb-2">Section View</p>
            <p className="text-sm">(Coming soon)</p>
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-100">
          <div className="text-zinc-500 p-8 text-center">
            <p className="text-lg">No drawing available</p>
          </div>
        </div>
      );
  }
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

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <BookOpen className="text-blue-400" size={22} />
          <h1 className="text-lg font-semibold">Building Instructions</h1>
        </div>
        {currentStep && (
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-zinc-500" />
            <ViewSelector
              views={currentStep.views}
              selectedView={activeView}
              onSelect={setSelectedView}
            />
          </div>
        )}
      </header>

      {/* Main content area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Drawing area */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
            {currentStep ? (
              <DrawingRenderer
                view={activeView}
                step={{
                  phase: currentStep.phase,
                  componentIds: currentStep.componentIds,
                }}
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

        {/* Step details sidebar */}
        <aside className="w-96 border-l border-zinc-700 bg-zinc-800/30 overflow-y-auto">
          <div className="p-5">
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

      {/* Navigation footer */}
      <StepNavigation
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
