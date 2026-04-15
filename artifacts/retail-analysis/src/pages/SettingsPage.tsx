import { useState } from "react";
import { Plus, Trash2, Save, RotateCcw } from "lucide-react";
import type { DeptThreshold } from "@/App";
import { DEFAULT_THRESHOLDS } from "@/App";

interface SettingsPageProps {
  thresholds: DeptThreshold[];
  onUpdate: (thresholds: DeptThreshold[]) => void;
}

export function SettingsPage({ thresholds, onUpdate }: SettingsPageProps) {
  const [local, setLocal] = useState<DeptThreshold[]>(thresholds);
  const [saved, setSaved] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [newMargin, setNewMargin] = useState("");

  const update = (idx: number, val: string) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) return;
    setLocal((prev) => prev.map((t, i) => (i === idx ? { ...t, minMargin: parsed } : t)));
    setSaved(false);
  };

  const remove = (idx: number) => {
    setLocal((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const addDept = () => {
    const dept = newDept.trim();
    const margin = parseFloat(newMargin);
    if (!dept || isNaN(margin) || margin < 0 || margin > 100) return;
    if (local.some((t) => t.department.toLowerCase() === dept.toLowerCase())) return;
    setLocal((prev) => [...prev, { department: dept, minMargin: margin }]);
    setNewDept("");
    setNewMargin("");
    setSaved(false);
  };

  const handleSave = () => {
    onUpdate(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setLocal(DEFAULT_THRESHOLDS);
    setSaved(false);
  };

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[700px] mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure minimum margin thresholds per department</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Margin Thresholds</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Products below these thresholds will be flagged as margin issues.
                Example: Off Licence = 18% means any product with margin &lt; 18% is flagged.
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {local.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-2.5 rounded-lg">
                  {t.department}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2.5 w-32">
                  <span className="text-xs text-gray-400 font-medium">min</span>
                  <input
                    type="number"
                    min="0" max="100" step="0.5"
                    value={t.minMargin}
                    onChange={(e) => update(i, e.target.value)}
                    className="w-full text-sm font-bold text-gray-900 bg-transparent focus:outline-none text-right"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <div className={`w-24 h-2 rounded-full overflow-hidden bg-gray-100`}>
                  <div
                    className={`h-full rounded-full ${t.minMargin >= 35 ? "bg-green-500" : t.minMargin >= 20 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(100, t.minMargin * 2)}%` }}
                  />
                </div>
                <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add department */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Add Department</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Department name"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-2.5 w-28">
                <input
                  type="number" min="0" max="100" step="0.5"
                  placeholder="0"
                  value={newMargin}
                  onChange={(e) => setNewMargin(e.target.value)}
                  className="w-full text-sm focus:outline-none"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
              <button
                onClick={addDept}
                className="flex items-center gap-1.5 bg-[#0d1117] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className={[
              "flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm",
              saved
                ? "bg-green-100 text-green-700"
                : "bg-[#16a34a] text-white hover:bg-[#15803d] shadow-green-900/20",
            ].join(" ")}
          >
            <Save className="w-4 h-4" />
            {saved ? "Saved!" : "Save Thresholds"}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>

        <div className="mt-8 bg-[#0d1117] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Retail Analysis Tool</p>
            <p className="text-xs text-gray-500 mt-0.5">Margin checking · Price anomaly detection · Attention reports</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#16a34a] flex items-center justify-center">
            <span className="text-white text-sm font-bold">R</span>
          </div>
        </div>
      </div>
    </div>
  );
}
