import { useState, useEffect } from "react";
import { RefreshCw, LogOut, Sun, Moon, Box, Receipt, TrendingUp } from "lucide-react";
import { apiCall, getUser, logout } from "@/lib/api";

interface SettingsPageProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export function SettingsPage({ theme, onThemeToggle }: SettingsPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => { apiCall("/api/stats").then(setStats).catch(() => {}); }, []);

  const handleSync = async () => {
    setSyncing(true); setSyncMsg("");
    try { await apiCall("/api/sync", { method: "POST" }); setSyncMsg("Refresh started. The latest figures land within a few minutes."); }
    catch { setSyncMsg("Could not reach the server. Try again in a moment."); }
    setSyncing(false);
  };

  const name = getUser() || "Store Manager";
  const fmt = (n: number) => (n || 0).toLocaleString();

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 fade-up">
      <div className="px-6 py-6 max-w-[640px] mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your data, account, and appearance</p>
        </div>

        {/* Your data */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white">Your data</h2>
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Refreshing…" : "Refresh now"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Box className="w-4 h-4" />} label="Products" value={stats ? fmt(stats.stock) : "…"} />
            <Stat icon={<Receipt className="w-4 h-4" />} label="Transactions" value={stats ? fmt(stats.transactions) : "…"} />
            <Stat icon={<TrendingUp className="w-4 h-4" />} label="Sales records" value={stats ? fmt(stats.turnover) : "…"} />
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Your shop data updates automatically. Tap <span className="font-semibold text-gray-500 dark:text-gray-300">Refresh now</span> to pull the latest figures from your till system straight away.
          </p>
          {syncMsg && <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">{syncMsg}</p>}
        </section>

        {/* Account */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 dark:text-white mb-4">Account</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <span className="text-violet-700 dark:text-violet-300 text-sm font-black">{name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
                <p className="text-xs text-gray-400">Pro plan</p>
              </div>
            </div>
            <button onClick={() => logout()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold hover:border-red-300 hover:text-red-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-4 h-4 text-violet-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{theme === "dark" ? "Dark" : "Light"} mode</p>
                <p className="text-xs text-gray-400">Switch how RetailGuard looks</p>
              </div>
            </div>
            <button onClick={onThemeToggle}
              className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold hover:border-violet-300 hover:text-violet-600 transition-colors">
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
          </div>
        </section>

        <p className="text-center text-[11px] text-gray-300 dark:text-gray-600 pt-2">RetailGuard · know your shop, grow your margins</p>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">{icon}<span className="text-[11px] font-semibold">{label}</span></div>
      <p className="text-lg font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
