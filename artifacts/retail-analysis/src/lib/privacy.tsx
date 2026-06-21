import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";

// Revenue privacy mask: lets the owner hide real euro figures (revenue, supplier
// spend) behind stars so the dashboard can be shown to others without exposing them.
// State lives in localStorage and is synced across pages via a window event.
const KEY = "rg-mask-revenue";
const EVT = "rg-mask-change";
export const STARS = "★★★";

export function getMasked(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
function applyMasked(v: boolean) {
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useRevenueMask() {
  const [masked, setM] = useState<boolean>(getMasked());
  useEffect(() => {
    const h = () => setM(getMasked());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener(EVT, h); window.removeEventListener("storage", h); };
  }, []);
  const toggle = useCallback(() => applyMasked(!getMasked()), []);
  return { masked, toggle };
}

export function RevenueMaskToggle({ masked, toggle }: { masked: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} title={masked ? "Show revenue figures" : "Hide revenue figures so you can share the screen"}
      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
      {masked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      {masked ? "Figures hidden" : "Hide figures"}
    </button>
  );
}
