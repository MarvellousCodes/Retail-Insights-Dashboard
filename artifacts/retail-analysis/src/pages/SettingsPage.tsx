import { useState } from "react";
import { Plus, Trash2, Save, RotateCcw, RefreshCw, Database } from "lucide-react";
import type { DeptThreshold } from "@/App";
import { DEFAULT_THRESHOLDS } from "@/App";
import { apiCall } from "@/lib/api";

interface SettingsPageProps {
  thresholds: DeptThreshold[];
  onUpdate: (thresholds: DeptThreshold[]) => void;
}

export function SettingsPage({ thresholds, onUpdate }: SettingsPageProps) {
  const [local, setLocal] = useState<DeptThreshold[]>(thresholds);
  const [saved, setSaved] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [newMargin, setNewMargin] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const handleSync = async () => {
    setSyncing(true); setSyncMsg("");
    try { await apiCall("/api/sync", { method: "POST" }); setSyncMsg("Sync triggered — fresh data lands within ~10 min."); }
    catch { setSyncMsg("Could not reach the server."); }
    setSyncing(false);
  };

  const update = (idx: number, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0 || n > 100) return;
    setLocal((prev) => prev.map((t, i) => (i === idx ? { ...t, minMargin: n } : t)));
    setSaved(false);
  };

  const addDept = () => {
    const dept = newDept.trim();
    const margin = parseFloat(newMargin);
    if (!dept || isNaN(margin) || margin < 0 || margin > 100) return;
    if (local.some((t) => t.department.toLowerCase() === dept.toLowerCase())) return;
    setLocal((prev) => [...prev, { department: dept, minMargin: margin }]);
    setNewDept(""); setNewMargin(""); setSaved(false);
  };

  const handleSave = () => {
    onUpdate(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-full bg-gray-50 fade-up">
      <div className="px-7 py-6 max-w-[680px] mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Data pipeline, sync, and margin targets</p>
        </div>

        {/* Data Pipeline & Sync (moved off Dashboard) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-600" />
              <h2 className="text-sm font-black text-gray-900">Data Pipeline & Sync</h2>
            </div>
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Triggering…" : "Sync now"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><p className="text-gray-400">Source</p><p className="text-gray-800 font-medium">Pervasive + SQL Server</p></div>
            <div><p className="text-gray-400">Cloud DB</p><p className="text-gray-800 font-medium">Oracle PostgreSQL</p></div>
            <div><p className="text-gray-400">Schedule</p><p className="text-gray-800 font-medium">Every 6 hours</p></div>
            <div><p className="text-gray-400">Transport</p><p className="text-gray-800 font-medium">SCP + auto-rebuild</p></div>
          </div>
          {syncMsg && <p className="text-xs text-violet-600 mt-3">{syncMsg}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="mb-5">
            <h2 className="text-sm font-black text-gray-900">Margin Targets</h2>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Products below these thresholds are flagged as issues. Default is 20% if a department is not listed.
              <span className="text-violet-600 font-semibold"> The vertical line on each bar shows the target.</span>
            </p>
          </div>

          <div className="space-y-2 mb-5">
            {local.map((t, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="flex-1 text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-2.5 rounded-xl">{t.department}</div>
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2.5 w-28 focus-within:border-violet-400 transition-colors">
                  <span className="text-xs text-gray-400">min</span>
                  <input
                    type="number" min="0" max="100" step="0.5"
                    value={t.minMargin}
                    onChange={(e) => update(i, e.target.value)}
                    className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none text-right"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <div className="w-20 h-2 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className={`h-full rounded-full ${t.minMargin >= 35 ? "bg-green-500" : t.minMargin >= 20 ? "bg-violet-500" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(100, t.minMargin * 2)}%` }}
                  />
                </div>
                <button
                  onClick={() => { setLocal((p) => p.filter((_, j) => j !== i)); setSaved(false); }}
                  className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Add Category</p>
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Category name" value={newDept} onChange={(e) => setNewDept(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors" />
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2.5 w-28 focus-within:border-violet-400 transition-colors">
                <input type="number" min="0" max="100" step="0.5" placeholder="0" value={newMargin} onChange={(e) => setNewMargin(e.target.value)}
                  className="w-full text-sm focus:outline-none" />
                <span className="text-xs text-gray-400">%</span>
              </div>
              <button onClick={addDept} className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave}
            className={["flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl transition-all",
              saved ? "bg-green-100 text-green-700" : "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-600/25"].join(" ")}>
            <Save className="w-4 h-4" />
            {saved ? "Saved!" : "Save Targets"}
          </button>
          <button onClick={() => { setLocal(DEFAULT_THRESHOLDS); setSaved(false); }}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 border border-gray-200 bg-white px-4 py-2.5 rounded-xl hover:border-gray-300 transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </button>
        </div>

        <div className="mt-8 bg-violet-600 rounded-2xl p-5 flex items-center justify-between shadow-md shadow-violet-600/20">
          <div>
            <p className="text-sm font-black text-white">Retail Profit Tool</p>
            <p className="text-xs text-violet-200 mt-0.5">Margin optimisation · Price recommendations · Profit recovery</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-black">R</span>
          </div>
        </div>
      </div>
    </div>
  );
}
