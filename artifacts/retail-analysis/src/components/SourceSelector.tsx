import { useState, useRef, useEffect } from "react";
import { Layers, X, Check, ChevronDown, FileSpreadsheet, PackageX } from "lucide-react";
import type { Source } from "@/App";

export interface SourceControls {
  sources: Source[];
  activeIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onRemove: (id: string) => void;
}

export function SourceSelector({ sources, activeIds, onToggle, onSelectAll, onSelectNone, onRemove }: SourceControls) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (sources.length === 0) return null;

  const activeCount = sources.filter((s) => activeIds.has(s.id)).length;
  const totalCount = sources.length;
  const label = activeCount === totalCount
    ? `All ${totalCount} source${totalCount !== 1 ? "s" : ""}`
    : activeCount === 0
    ? `No sources selected`
    : `${activeCount} of ${totalCount} sources`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl transition-colors border",
          open
            ? "bg-violet-50 border-violet-300 text-violet-700"
            : "bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50",
        ].join(" ")}
      >
        <Layers className="w-3.5 h-3.5 text-violet-600" />
        <span>{label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-30 overflow-hidden fade-in">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black text-gray-800 uppercase tracking-wide">Data Sources</p>
              <div className="flex gap-2">
                <button onClick={onSelectAll} className="text-[10px] font-bold text-violet-600 hover:text-violet-800">All</button>
                <span className="text-gray-300 text-[10px]">·</span>
                <button onClick={onSelectNone} className="text-[10px] font-bold text-gray-500 hover:text-gray-700">None</button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">Toggle which uploaded files are included in the analysis</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {sources.map((s) => {
              const active = activeIds.has(s.id);
              return (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 group border-b border-gray-50 last:border-b-0">
                  <button
                    onClick={() => onToggle(s.id)}
                    className={[
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      active ? "bg-violet-600 border-violet-600" : "border-gray-300 hover:border-violet-400",
                    ].join(" ")}
                    aria-label={active ? "Deselect" : "Select"}
                  >
                    {active && <Check className="w-3 h-3 text-white" />}
                  </button>
                  {s.isManual ? (
                    <PackageX className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  )}
                  <button
                    onClick={() => onToggle(s.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className={`text-xs font-bold truncate ${active ? "text-gray-900" : "text-gray-400"}`}>
                      {s.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {s.products.length} product{s.products.length !== 1 ? "s" : ""}
                      {s.isManual ? " · manual" : ""}
                    </p>
                  </button>
                  {!s.isManual && (
                    <button
                      onClick={() => onRemove(s.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Remove source"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
