import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

export function CollapsiblePanel({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center gap-2 hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-zinc-400">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        {icon}
        <span className="text-sm font-medium text-zinc-300 flex-1 text-left">
          {title}
        </span>
        {badge && (
          <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </button>
      {isOpen && <div className="pb-1">{children}</div>}
    </div>
  );
}
