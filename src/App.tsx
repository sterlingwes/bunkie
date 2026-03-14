import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Environment } from "@react-three/drei";
import { Sidebar } from "./components/ui/Sidebar";
import { Bunkie } from "./components/3d/Bunkie";
import { CameraControls } from "./components/3d/CameraControls";
import { InstructionsPage } from "./components/instructions/InstructionsPage";
import { useBunkieStore } from "./store/useBunkieStore";
import type { BunkieDefinition, AppView } from "./schemas/bunkie.schema";
import bunkieDefinition from "./data/bunkie-definition.json";
import {
  Eye,
  EyeOff,
  Camera,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Box,
  BookOpen,
} from "lucide-react";

// View toggle component to avoid type narrowing issues
function ViewToggle({
  currentView,
  setView,
  variant = "full",
}: {
  currentView: AppView;
  setView: (view: AppView) => void;
  variant?: "full" | "compact";
}) {
  return (
    <div className="flex items-center gap-1 bg-zinc-800/90 backdrop-blur rounded-lg p-1">
      <button
        onClick={() => setView("builder")}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
          currentView === "builder"
            ? "text-white bg-zinc-700"
            : "text-zinc-400 hover:text-white hover:bg-zinc-700"
        }`}
      >
        <Box size={14} />
        {variant === "full" ? "3D Builder" : "3D"}
      </button>
      <button
        onClick={() => setView("instructions")}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
          currentView === "instructions"
            ? "text-white bg-zinc-700"
            : "text-zinc-400 hover:text-white hover:bg-zinc-700"
        }`}
      >
        <BookOpen size={14} />
        Instructions
      </button>
    </div>
  );
}

function App() {
  const [loaded, setLoaded] = useState(false);
  const {
    loadBunkie,
    showClearances,
    showDimensions,
    showAnnotations,
    setClearancesVisible,
    setDimensionsVisible,
    setAnnotationsVisible,
    currentView,
    setView,
  } = useBunkieStore();

  useEffect(() => {
    // Load bunkie definition
    loadBunkie(bunkieDefinition as BunkieDefinition);
    setLoaded(true);
  }, [loadBunkie]);

  const resetCamera = () => {
    // Trigger camera reset by re-rendering
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.dispatchEvent(new CustomEvent("resetCamera"));
    }
  };

  if (!loaded) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  // Render Instructions view
  if (currentView === "instructions") {
    return (
      <div className="w-full h-full flex flex-col bg-zinc-900">
        {/* View toggle header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm font-medium">
              Bunkie Builder
            </span>
          </div>
          <ViewToggle
            currentView={currentView}
            setView={setView}
            variant="full"
          />
        </div>
        <InstructionsPage />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-zinc-900">
      {/* View toggle - top left */}
      <div className="absolute top-4 left-4 z-10">
        <ViewToggle
          currentView={currentView}
          setView={setView}
          variant="compact"
        />
      </div>
      {/* Sidebar */}
      <Sidebar definition={bunkieDefinition as BunkieDefinition} />

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
          <CameraControls />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />

          {/* Environment */}
          <Environment preset="sunset" />

          {/* Bunkie model */}
          <Bunkie definition={bunkieDefinition as BunkieDefinition} />
        </Canvas>

        {/* View controls overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* View presets */}
          <div className="bg-zinc-800/90 backdrop-blur rounded-lg p-1 flex flex-col gap-1">
            <button
              onClick={resetCamera}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded transition-colors"
            >
              <RotateCcw size={14} />
              Reset View
            </button>
          </div>

          {/* Visibility toggles */}
          <div className="bg-zinc-800/90 backdrop-blur rounded-lg p-1 flex flex-col gap-1">
            <button
              onClick={() => setAnnotationsVisible(!showAnnotations)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
                showAnnotations
                  ? "text-white bg-zinc-700"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {showAnnotations ? <Eye size={14} /> : <EyeOff size={14} />}
              Labels
            </button>
            <button
              onClick={() => setDimensionsVisible(!showDimensions)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
                showDimensions
                  ? "text-white bg-zinc-700"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {showDimensions ? <Eye size={14} /> : <EyeOff size={14} />}
              Dimensions
            </button>
            <button
              onClick={() => setClearancesVisible(!showClearances)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
                showClearances
                  ? "text-white bg-zinc-700"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {showClearances ? <Eye size={14} /> : <EyeOff size={14} />}
              Clearances
            </button>
          </div>

          {/* Info */}
          <div className="bg-zinc-800/90 backdrop-blur rounded-lg p-2 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 mb-1">
              <Camera size={12} />
              <span>Drag to rotate</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="flex gap-0.5">
                <ArrowUp size={10} className="text-zinc-500" />
              </div>
              <div className="flex gap-0.5">
                <ArrowLeft size={10} className="text-zinc-500" />
                <ArrowDown size={10} className="text-zinc-500" />
                <ArrowRight size={10} className="text-zinc-500" />
              </div>
              <span>Move camera</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[10px] px-1 bg-zinc-700 rounded">
                Shift
              </span>
              <span>Faster movement</span>
            </div>
          </div>
        </div>

        {/* Orientation indicator */}
        <div className="absolute bottom-4 left-4 bg-zinc-800/90 backdrop-blur rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-zinc-400">West (Front)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-400">East (Back)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
