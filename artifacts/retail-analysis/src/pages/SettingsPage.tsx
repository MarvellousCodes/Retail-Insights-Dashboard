import { Bell, Store, Shield, Users, ChevronRight } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    icon: <Store className="w-5 h-5 text-green-600" />,
    bg: "bg-green-50",
    title: "Store Profile",
    description: "Name, location, store type, and revenue targets",
  },
  {
    icon: <Bell className="w-5 h-5 text-amber-600" />,
    bg: "bg-amber-50",
    title: "Alerts & Notifications",
    description: "Set thresholds for loss alerts and issue notifications",
  },
  {
    icon: <Users className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-50",
    title: "Team Access",
    description: "Manage who can upload reports and view analysis",
  },
  {
    icon: <Shield className="w-5 h-5 text-purple-600" />,
    bg: "bg-purple-50",
    title: "Data & Privacy",
    description: "Control data retention and export your reports",
  },
];

export function SettingsPage() {
  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[800px] mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
        </div>

        <div className="space-y-3">
          {SETTINGS_SECTIONS.map(({ icon, bg, title, description }) => (
            <button
              key={title}
              className="w-full bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left group"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>

        <div className="mt-8 bg-[#0d1117] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Retail Analysis</p>
            <p className="text-xs text-gray-500 mt-0.5">Version 1.0 — Built for independent retailers</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#16a34a] flex items-center justify-center">
            <span className="text-white text-sm font-bold">R</span>
          </div>
        </div>
      </div>
    </div>
  );
}
