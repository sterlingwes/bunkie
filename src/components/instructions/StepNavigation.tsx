/**
 * StepNavigation
 *
 * Navigation controls for instruction steps with prev/next buttons
 * and a progress bar.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
}: StepNavigationProps) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const isFirst = currentStep === 0;
  const isLast = currentStep >= totalSteps - 1;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-700 bg-zinc-800/50">
      {/* Previous button */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 active:bg-zinc-600 disabled:hover:bg-transparent"
        aria-label="Previous step"
      >
        <ChevronLeft size={18} />
        Previous
      </button>

      {/* Progress indicator */}
      <div className="flex-1 mx-6 max-w-md">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500">
            Step {currentStep + 1} of {totalSteps || "—"}
          </span>
          <span className="text-xs text-zinc-500">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isLast}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 active:bg-zinc-600 disabled:hover:bg-transparent"
        aria-label="Next step"
      >
        Next
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export default StepNavigation;
