import { Upload, LayoutDashboard, AlertCircle, FileText, Settings } from "lucide-react";
import type { NavTab } from "@/App";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: { tab: NavTab; icon: React.ReactNode; label: string }[] = [
  { tab: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
  { tab: "upload", icon: <Upload className="w-5 h-5" />, label: "Upload" },
  { tab: "issues", icon: <AlertCircle className="w-5 h-5" />, label: "Issues" },
  { tab: "reports", icon: <FileText className="w-5 h-5" />, label: "Reports" },
  { tab: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="flex flex-col items-center w-[68px] bg-[#0d1117] py-5 gap-1 shrink-0 z-10">
      <div className="mb-6 w-9 h-9 rounded-xl bg-[#16a34a] flex items-center justify-center shadow-lg shadow-green-900/40">
        <span className="text-white text-sm font-bold tracking-tight">R</span>
      </div>

      <nav className="flex flex-col items-center gap-2 flex-1">
        {NAV_ITEMS.map(({ tab, icon, label }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              title={label}
              className={[
                "group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-150",
                active
                  ? "bg-[#16a34a] text-white shadow-md shadow-green-900/40"
                  : "text-gray-500 hover:bg-white/10 hover:text-gray-200",
              ].join(" ")}
            >
              {icon}
              <span className="text-[9px] font-medium mt-0.5 leading-none">{label}</span>
              <span
                className={[
                  "absolute left-full ml-3 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none",
                  "bg-gray-800 text-gray-100 border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50",
                  active ? "hidden" : "",
                ].join(" ")}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-md">
        <span className="text-white text-xs font-bold">U</span>
      </div>
    </aside>
  );
}
