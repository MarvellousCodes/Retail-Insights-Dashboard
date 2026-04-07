import { Upload, Search, LayoutDashboard } from "lucide-react";
import type { NavTab } from "@/App";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: { tab: NavTab; icon: React.ReactNode; label: string }[] = [
  {
    tab: "dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: "Dashboard",
  },
  {
    tab: "upload",
    icon: <Upload className="w-5 h-5" />,
    label: "Upload",
  },
  {
    tab: "analyse",
    icon: <Search className="w-5 h-5" />,
    label: "Analyse",
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="flex flex-col items-center w-[68px] bg-white border-r border-gray-100 py-5 gap-1 shrink-0 z-10">
      <div className="mb-5 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
        <span className="text-white text-sm font-bold">R</span>
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1">
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
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
              ].join(" ")}
            >
              {icon}
              <span className="text-[9px] font-medium mt-0.5 leading-none">
                {label}
              </span>
              <span
                className={[
                  "absolute left-full ml-3 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none",
                  "bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                  active ? "hidden" : "",
                ].join(" ")}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
        <span className="text-white text-xs font-bold">U</span>
      </div>
    </aside>
  );
}
