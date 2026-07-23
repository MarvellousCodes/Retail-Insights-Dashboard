import { useState, useEffect } from "react";
import { LogOut, Sun, Moon, Box, Receipt, TrendingUp, Sparkles } from "lucide-react";
import { apiCall, getUser, logout } from "@/lib/api";

interface SettingsPageProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export function SettingsPage({ theme, onThemeToggle }: SettingsPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [aiProvider, setAiProvider] = useState<"claude" | "mistral">("mistral");
  const [aiModel, setAiModel] = useState("");
  const [claudeAvailable, setClaudeAvailable] = useState(false);
  const [aiSwitching, setAiSwitching] = useState(false);
  const [aiToast, setAiToast] = useState("");

  useEffect(() => { apiCall("/api/stats").then(setStats).catch(() => {}); }, []);

  useEffect(() => {
    apiCall("/api/ask/provider").then((data) => {
      if (data) {
        setAiProvider(data.provider || "mistral");
        setAiModel(data.model || "");
        setClaudeAvailable(!!data.claude_available);
      }
    }).catch(() => {});
  }, []);

  const switchProvider = async (provider: "claude" | "mistral") => {
    if (provider === aiProvider) return;
    if (provider === "claude" && !claudeAvailable) return;
    setAiSwitching(true);
    try {
      const data = await apiCall("/api/ask/provider", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      setAiProvider(data.provider || provider);
      setAiModel(data.model || "");
      setAiToast(`Switched to ${provider === "claude" ? "Claude" : "Mistral"}`);
      setTimeout(() => setAiToast(""), 3000);
    } catch {
      setAiToast("Failed to switch model");
      setTimeout(() => setAiToast(""), 3000);
    }
    setAiSwitching(false);
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
          <h2 className="text-sm font-black text-gray-900 dark:text-white mb-4">Your data</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Box className="w-4 h-4" />} label="Products" value={stats ? fmt(stats.stock) : "…"} />
            <Stat icon={<Receipt className="w-4 h-4" />} label="Transactions" value={stats ? fmt(stats.transactions) : "…"} />
            <Stat icon={<TrendingUp className="w-4 h-4" />} label="Sales records" value={stats ? fmt(stats.turnover) : "…"} />
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Your shop data updates automatically from your till system.
          </p>
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

        {/* AI Model */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-black text-gray-900 dark:text-white">AI Model</h2>
            </div>
            {aiToast && (
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 animate-pulse">{aiToast}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">Choose the model that powers Ask Your Shop</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Claude option */}
            <button
              onClick={() => switchProvider("claude")}
              disabled={!claudeAvailable || aiSwitching}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                aiProvider === "claude"
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                  : claudeAvailable
                    ? "border-gray-200 dark:border-gray-600 hover:border-violet-300"
                    : "border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed"
              }`}
            >
              <p className="text-sm font-bold text-gray-900 dark:text-white">Claude Sonnet 4</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Anthropic</p>
              {aiProvider === "claude" && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full">Active</span>
              )}
              {!claudeAvailable && (
                <span className="block mt-2 text-[10px] text-red-400 font-medium">Not configured</span>
              )}
            </button>
            {/* Mistral option */}
            <button
              onClick={() => switchProvider("mistral")}
              disabled={aiSwitching}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                aiProvider === "mistral"
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-violet-300"
              }`}
            >
              <p className="text-sm font-bold text-gray-900 dark:text-white">Mistral Small</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Mistral AI</p>
              {aiProvider === "mistral" && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full">Active</span>
              )}
            </button>
          </div>
          {aiModel && (
            <p className="text-[11px] text-gray-400 mt-3">Current model: <span className="font-mono text-gray-500 dark:text-gray-300">{aiModel}</span></p>
          )}
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
