/**
 * InstructionsPage
 *
 * Main container for the architectural instruction manual view.
 * Displays step-by-step building instructions with 2D drawings.
 */

import { useBunkieStore } from "../../store/useBunkieStore";
import { ChevronLeft, ChevronRight, BookOpen, Box } from "lucide-react";
import { PlanView } from "./drawing/PlanView";
import { ElevationView } from "./drawing/ElevationView";
import type { ViewType } from "../../schemas/bunkie.schema";

/**
 * Render the appropriate drawing based on view type
 */
function DrawingRenderer({
  views,
  step,
}: {
  views: ViewType[];
  step: {
    phase: string;
    componentIds: string[];
  };
}) {
  // Determine which view to show (first in the list)
  const primaryView = views[0];

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

  switch (primaryView) {
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
      // Section view to be implemented
      return (
        <div className="text-zinc-500 p-8 text-center">
          <p className="text-lg mb-2">Section View</p>
          <p className="text-sm">(Coming soon)</p>
        </div>
      );
    default:
      return (
        <div className="text-zinc-500 p-8 text-center">
          <p className="text-lg">No drawing available</p>
        </div>
      );
  }
}

export function InstructionsPage() {
  const { currentStepIndex, nextStep, prevStep, bunkieDefinition } =
    useBunkieStore();

  const instructions = bunkieDefinition?.instructions ?? [];
  const currentStep = instructions[currentStepIndex];
  const totalSteps = instructions.length;

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <BookOpen className="text-zinc-400" size={24} />
          <h1 className="text-xl font-semibold">Building Instructions</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">
            Step {currentStepIndex + 1} of {totalSteps || "—"}
          </span>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Drawing area */}
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
            {currentStep ? (
              <DrawingRenderer
                views={currentStep.views}
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
        <aside className="w-80 border-l border-zinc-700 p-6 overflow-y-auto">
          {currentStep ? (
            <>
              {/* Phase badge */}
              <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300 mb-4">
                {currentStep.phase.charAt(0).toUpperCase() +
                  currentStep.phase.slice(1)}
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold mb-3">
                {currentStep.title}
              </h2>

              {/* Description */}
              <p className="text-zinc-400 text-sm mb-4">
                {currentStep.description}
              </p>

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">
                    Tips
                  </h3>
                  <ul className="space-y-1">
                    {currentStep.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-400 flex items-start gap-2"
                      >
                        <span className="text-blue-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {currentStep.warnings && currentStep.warnings.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-amber-400 mb-2">
                    Warnings
                  </h3>
                  <ul className="space-y-1">
                    {currentStep.warnings.map((warning, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-300/80 flex items-start gap-2"
                      >
                        <span>⚠</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Components involved */}
              {currentStep.componentIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">
                    Components
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {currentStep.componentIds.map((id) => (
                      <span
                        key={id}
                        className="px-2 py-0.5 text-xs bg-zinc-700 rounded text-zinc-400"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-zinc-500 text-sm">
              <p>No instruction steps defined yet.</p>
              <p className="mt-2 text-xs">
                Add steps to bunkie-definition.json to see them here.
              </p>
            </div>
          )}
        </aside>
      </main>

      {/* Navigation footer */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-zinc-700">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        {/* Progress bar */}
        <div className="flex-1 mx-8">
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
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

        <button
          onClick={nextStep}
          disabled={currentStepIndex >= totalSteps - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </footer>
    </div>
  );
}
