import { Upload, LayoutDashboard, AlertCircle, FileText, Settings, ChevronRight, ChevronLeft } from "lucide-react";
import type { NavTab } from "@/App";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  expanded: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { tab: NavTab; icon: React.ReactNode; label: string }[] = [
  { tab: "dashboard", icon: <LayoutDashboard className="w-5 h-5 shrink-0" />, label: "Dashboard" },
  { tab: "upload", icon: <Upload className="w-5 h-5 shrink-0" />, label: "Upload" },
  { tab: "issues", icon: <AlertCircle className="w-5 h-5 shrink-0" />, label: "Issues" },
  { tab: "reports", icon: <FileText className="w-5 h-5 shrink-0" />, label: "Reports" },
  { tab: "settings", icon: <Settings className="w-5 h-5 shrink-0" />, label: "Settings" },
];

export function Sidebar({ activeTab, onTabChange, expanded, onToggle }: SidebarProps) {
  return (
    <aside
      className="flex flex-col bg-white border-r border-gray-200 py-4 shrink-0 z-10 transition-all duration-200 ease-in-out"
      style={{ width: expanded ? 220 : 64 }}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center mb-6 px-3 ${expanded ? "justify-between" : "justify-center"}`}>
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-600/30">
          <span className="text-white text-xs font-black tracking-tight">R</span>
        </div>
        {expanded && (
          <span className="text-sm font-black text-gray-900 ml-2 mr-auto leading-none">Profit</span>
        )}
        <button
          onClick={onToggle}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 px-2">
        {NAV_ITEMS.map(({ tab, icon, label }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              title={!expanded ? label : undefined}
              className={[
                "flex items-center gap-3 rounded-xl px-2.5 transition-all duration-150 h-10 w-full",
                active
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/25"
                  : "text-gray-500 hover:bg-violet-50 hover:text-violet-700",
                expanded ? "" : "justify-center",
              ].join(" ")}
            >
              {icon}
              {expanded && (
                <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User avatar */}
      <div className={`px-2 mt-auto ${expanded ? "" : "flex justify-center"}`}>
        <div className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${expanded ? "" : "justify-center"}`}>
          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <span className="text-violet-700 text-xs font-black">U</span>
          </div>
          {expanded && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">Store Manager</p>
              <p className="text-[10px] text-gray-400 truncate">Pro plan</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
