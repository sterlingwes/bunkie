import { useState } from "react";
import { X, DollarSign, FileText, Wrench, ExternalLink } from "lucide-react";
import { useBunkieStore } from "../../store/useBunkieStore";
import type { Component } from "../../schemas/bunkie.schema";

interface ComponentDetailsProps {
  component: Component;
}

type Tab = "materials" | "costs" | "codes";

export function ComponentDetails({ component }: ComponentDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("materials");
  const { selectComponent } = useBunkieStore();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "materials", label: "Materials", icon: <Wrench size={14} /> },
    { id: "costs", label: "Costs", icon: <DollarSign size={14} /> },
    { id: "codes", label: "Codes", icon: <FileText size={14} /> },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{component.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
              {component.category}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
              {component.phase}
            </span>
          </div>
        </div>
        <button
          onClick={() => selectComponent(null)}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Dimensions */}
      <div className="px-3 py-2 border-b border-zinc-800 text-xs">
        <span className="text-zinc-500">Dimensions: </span>
        <span className="text-zinc-300">
          {component.dimensions.width}m × {component.dimensions.height}m ×{" "}
          {component.dimensions.depth}m
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "text-white border-b-2 border-blue-500 bg-zinc-800/50"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "materials" && (
          <div className="space-y-2">
            {component.materials.length === 0 ? (
              <p className="text-sm text-zinc-500">No materials listed</p>
            ) : (
              component.materials.map((material) => (
                <div key={material.id} className="bg-zinc-800/50 rounded p-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-white">{material.name}</div>
                      {material.specs && (
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {material.specs}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-zinc-400">
                      {material.quantity} {material.unit}
                    </span>
                    <span className="text-zinc-500">@</span>
                    <span className="text-emerald-400">
                      ${material.unitCost}
                    </span>
                    <span className="text-zinc-500 ml-auto">
                      = ${material.totalCost}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "costs" && (
          <div className="space-y-3">
            <div className="bg-zinc-800/50 rounded p-3">
              <div className="text-xs text-zinc-500 mb-2">Cost Breakdown</div>
              <div className="space-y-1.5">
                {component.estimatedCost.materials > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Materials</span>
                    <span className="text-white">
                      ${component.estimatedCost.materials}
                    </span>
                  </div>
                )}
                {component.estimatedCost.hardware > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Hardware</span>
                    <span className="text-white">
                      ${component.estimatedCost.hardware}
                    </span>
                  </div>
                )}
                {component.estimatedCost.labor > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Labor</span>
                    <span className="text-white">
                      ${component.estimatedCost.labor}
                    </span>
                  </div>
                )}
                <div className="border-t border-zinc-700 pt-1.5 mt-1.5 flex justify-between text-sm font-medium">
                  <span className="text-zinc-300">Total</span>
                  <span className="text-emerald-400">
                    ${component.estimatedCost.total}{" "}
                    {component.estimatedCost.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "codes" && (
          <div className="space-y-2">
            {component.codeReferences.length === 0 ? (
              <p className="text-sm text-zinc-500">No code references</p>
            ) : (
              component.codeReferences.map((code, index) => (
                <div key={index} className="bg-zinc-800/50 rounded p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono">
                      {code.code} {code.section}
                    </span>
                    {code.url && (
                      <a
                        href={code.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-zinc-300 mt-1.5">
                    {code.description}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
