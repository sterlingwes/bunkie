/**
 * InstructionStep
 *
 * Displays a single instruction step with title, description,
 * tips, warnings, and related components.
 */

import { Lightbulb, AlertTriangle, Layers } from "lucide-react";
import type { InstructionStep as InstructionStepType } from "../../schemas/bunkie.schema";

export interface InstructionStepProps {
  step: InstructionStepType;
}

export function InstructionStep({ step }: InstructionStepProps) {
  return (
    <div className="space-y-4">
      {/* Phase badge */}
      <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300">
        {step.phase.charAt(0).toUpperCase() + step.phase.slice(1)}
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold">{step.title}</h2>

      {/* Description */}
      <p className="text-zinc-400 text-sm whitespace-pre-line">
        {step.description}
      </p>

      {/* Tips */}
      {step.tips && step.tips.length > 0 && (
        <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
          <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
            <Lightbulb size={16} />
            Tips
          </h3>
          <ul className="space-y-2">
            {step.tips.map((tip, i) => (
              <li
                key={i}
                className="text-xs text-zinc-300 flex items-start gap-2"
              >
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {step.warnings && step.warnings.length > 0 && (
        <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-800/30">
          <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            Warnings
          </h3>
          <ul className="space-y-2">
            {step.warnings.map((warning, i) => (
              <li
                key={i}
                className="text-xs text-amber-200 flex items-start gap-2"
              >
                <span className="mt-0.5">⚠</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Components involved */}
      {step.componentIds.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
            <Layers size={16} />
            Components
          </h3>
          <div className="flex flex-wrap gap-1">
            {step.componentIds.map((id) => (
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
    </div>
  );
}

export default InstructionStep;
