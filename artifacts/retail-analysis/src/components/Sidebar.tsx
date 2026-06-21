import { Upload, LayoutDashboard, AlertCircle, FileText, Settings, ChevronRight, ChevronLeft, Shield, Sun, Moon, ScanLine, ScanBarcode, Sparkles, BarChart3, Building2, Database, TrendingUp, Receipt, Truck, Users, Layers, AlertTriangle } from "lucide-react";
import type { NavTab } from "@/App";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  expanded: boolean;
  onToggle: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

type NavItem = { tab: NavTab; icon: React.ReactNode; label: string };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [
    { tab: "dashboard", icon: <LayoutDashboard className="w-5 h-5 shrink-0" />, label: "Dashboard" },
    { tab: "reports", icon: <AlertTriangle className="w-5 h-5 shrink-0" />, label: "Issues" },
    { tab: "depts", icon: <Layers className="w-5 h-5 shrink-0" />, label: "Departments" },
  ] },
  { label: "Scan & ask", items: [
    { tab: "invoices", icon: <ScanLine className="w-5 h-5 shrink-0" />, label: "Invoices" },
    { tab: "scanner", icon: <ScanBarcode className="w-5 h-5 shrink-0" />, label: "Scanner" },
    { tab: "askshop", icon: <Sparkles className="w-5 h-5 shrink-0" />, label: "Ask" },
  ] },
  { label: "Know your shop", items: [
    { tab: "turnover", icon: <TrendingUp className="w-5 h-5 shrink-0" />, label: "Sales" },
    { tab: "margins", icon: <BarChart3 className="w-5 h-5 shrink-0" />, label: "Margins" },
    { tab: "transactions", icon: <Receipt className="w-5 h-5 shrink-0" />, label: "Transactions" },
    { tab: "suppliers", icon: <Truck className="w-5 h-5 shrink-0" />, label: "Suppliers" },
    { tab: "issues", icon: <AlertCircle className="w-5 h-5 shrink-0" />, label: "Insights" },
  ] },
  { label: "Records", items: [
    { tab: "livedata", icon: <Database className="w-5 h-5 shrink-0" />, label: "Products" },
    { tab: "customers", icon: <Users className="w-5 h-5 shrink-0" />, label: "Customers" },
  ] },
];
const SETTINGS_ITEM: NavItem = { tab: "settings", icon: <Settings className="w-5 h-5 shrink-0" />, label: "Settings" };

export function Sidebar({ activeTab, onTabChange, expanded, onToggle, theme, onThemeToggle }: SidebarProps) {
  const isDark = theme === "dark";
  const renderItem = ({ tab, icon, label }: NavItem) => {
    const active = activeTab === tab;
    return (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        title={!expanded ? label : undefined}
        className={[
          "flex items-center gap-3 rounded-xl px-2.5 transition-all duration-150 h-10 w-full mb-0.5",
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
  };
  return (
    <aside
      className="flex flex-col bg-white border-r border-gray-200 py-4 shrink-0 z-10 transition-all duration-200 ease-in-out"
      style={{ width: expanded ? 220 : 64 }}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center mb-6 px-3 ${expanded ? "justify-between" : "justify-center"}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-600/40">
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {expanded && (
          <span className="text-sm font-black ml-2 mr-auto leading-none whitespace-nowrap bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent tracking-tight">RetailGuard</span>
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
      <nav className="flex flex-col flex-1 px-2 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className="flex flex-col">
            {expanded ? (
              <div className="px-2.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                {group.label}
              </div>
            ) : (
              gi > 0 ? <div className="mx-2 my-2 border-t border-gray-100" /> : null
            )}
            {group.items.map(renderItem)}
          </div>
        ))}
        <div className="flex-1 min-h-[8px]" />
        <div className="mx-2 mb-1 border-t border-gray-100" />
        {renderItem(SETTINGS_ITEM)}
      </nav>

      {/* Theme toggle */}
      <div className={`px-2 mb-2 ${expanded ? "" : "flex justify-center"}`}>
        <button
          onClick={onThemeToggle}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={[
            "flex items-center gap-3 rounded-xl px-2.5 h-10 transition-colors",
            expanded ? "w-full" : "justify-center w-10",
            "text-gray-500 hover:bg-violet-50 hover:text-violet-700",
          ].join(" ")}
        >
          {isDark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          {expanded && (
            <span className="text-sm font-semibold whitespace-nowrap">{isDark ? "Light mode" : "Dark mode"}</span>
          )}
        </button>
      </div>

      {/* User avatar */}
      <div className={`px-2 ${expanded ? "" : "flex justify-center"}`}>
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
