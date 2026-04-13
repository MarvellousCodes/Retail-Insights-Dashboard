import { useState } from "react";
import {
  AlertTriangle, TrendingDown, Tag, RotateCcw, PackageX,
  Megaphone, BarChart2, CheckCircle2, Clock, Eye, Circle,
  ChevronDown, ShieldAlert, ArrowRight,
} from "lucide-react";

type AnomalyType =
  | "Price Error"
  | "Refund Spike"
  | "Discount Abuse"
  | "Void Pattern"
  | "Stockout"
  | "Promo Execution"
  | "Sales Anomaly";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Status = "Open" | "In Progress" | "Fixed" | "Monitoring";

interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: Severity;
  title: string;
  subject: string;
  lossEstimate: number;
  lossLabel: string;
  cause: string;
  recommendation: string;
  status: Status;
  leakStopped: boolean | null;
  detectedAt: Date;
  source: string;
}

const SEED_ANOMALIES: Anomaly[] = [
  {
    id: "a1",
    type: "Price Error",
    severity: "Critical",
    title: "POS price not updated after supplier repricing",
    subject: "Coke 500ml",
    lossEstimate: 320,
    lossLabel: "/month",
    cause:
      "The shelf price was raised to €1.29 following a supplier cost increase, but the POS system still charges €0.89. Every transaction is selling at a loss of €0.40 per unit.",
    recommendation: "Reprice this SKU in POS immediately — update register price to €1.29 and verify across all tills.",
    status: "Open",
    leakStopped: null,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    source: "sales_report_march.xlsx",
  },
  {
    id: "a2",
    type: "Refund Spike",
    severity: "High",
    title: "Unusually high refund volume on Beer 6-Pack",
    subject: "Beer 6-Pack",
    lossEstimate: 210,
    lossLabel: "/week",
    cause:
      "14 refunds processed in 7 days — 6x the normal rate. This pattern often indicates a batch quality issue, a staff abuse pattern, or customers exploiting a return policy gap.",
    recommendation:
      "Review cashier transaction logs for refund authorisations. Pull the affected batch codes and check with your supplier for a quality issue.",
    status: "In Progress",
    leakStopped: null,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    source: "sales_report_march.xlsx",
  },
  {
    id: "a3",
    type: "Discount Abuse",
    severity: "High",
    title: "Promo code applied to non-qualifying products",
    subject: "Wine — Weekend Promotion",
    lossEstimate: 460,
    lossLabel: "total",
    cause:
      "The weekend wine promotion had a 38% redemption rate vs. the expected 8%. Investigation shows the discount code was applied to full-price bottles outside the promo range, inflating the cost.",
    recommendation:
      "Audit discount logs and restrict the promo code to qualifying SKUs only. Contact POS provider to enforce SKU-level validation on future campaigns.",
    status: "Open",
    leakStopped: null,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    source: "pricing_feb.csv",
  },
  {
    id: "a4",
    type: "Void Pattern",
    severity: "High",
    title: "Excessive void rate on Till 3",
    subject: "Till 3 — Cashier A.",
    lossEstimate: 340,
    lossLabel: "/week",
    cause:
      "18 voided transactions in one week from a single register, far above the store average of 3. High void rates on one till are a common indicator of cashier error — or intentional manipulation to pocket cash.",
    recommendation:
      "Review this cashier's void log with a supervisor. Cross-reference cash drawer balance vs. expected totals. Consider CCTV review if discrepancies are found.",
    status: "Monitoring",
    leakStopped: false,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    source: "sales_report_march.xlsx",
  },
  {
    id: "a5",
    type: "Stockout",
    severity: "Medium",
    title: "Greek Yogurt out of stock for 3 days — lost sales",
    subject: "Greek Yogurt (Aisle 4)",
    lossEstimate: 180,
    lossLabel: "one-time",
    cause:
      "The item sold out without triggering the automated reorder. The reorder point was set too low relative to the current sales velocity, leaving the shelf empty for 3 trading days.",
    recommendation:
      "Restock aisle 4 immediately and raise the reorder point from 4 units to 12 units to cover current weekly demand.",
    status: "Fixed",
    leakStopped: true,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    source: "inventory_jan.xlsx",
  },
  {
    id: "a6",
    type: "Promo Execution",
    severity: "Medium",
    title: "Weekend 2-for-1 promotion failed to trigger in POS",
    subject: "Bakery — 2-for-1 Weekend Deal",
    lossEstimate: 220,
    lossLabel: "total",
    cause:
      "The Saturday/Sunday 2-for-1 promotion on bakery items did not trigger correctly. Customers were charged full price throughout the weekend, which will likely result in complaints and refund requests.",
    recommendation:
      "Re-run the promotion for affected customers and issue refunds. Escalate the POS configuration error to your point-of-sale provider.",
    status: "In Progress",
    leakStopped: null,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    source: "pricing_feb.csv",
  },
  {
    id: "a7",
    type: "Sales Anomaly",
    severity: "Medium",
    title: "Bread sales dropped 40% with no clear stock explanation",
    subject: "Bread Range (Aisle 1)",
    lossEstimate: 95,
    lossLabel: "/week",
    cause:
      "Bread unit sales fell 40% this week compared to the same period last month. Stock levels are normal, so this is likely a placement, freshness, or local competitor pricing issue.",
    recommendation:
      "Check shelf placement and freshness rotation in aisle 1. Run a quick price comparison against nearby competitors — consider a short-term price match to recover footfall.",
    status: "Open",
    leakStopped: null,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
    source: "inventory_jan.xlsx",
  },
  {
    id: "a8",
    type: "Refund Spike",
    severity: "Low",
    title: "Sparkling Water returns above average",
    subject: "Sparkling Water 1.5L",
    lossEstimate: 75,
    lossLabel: "/week",
    cause:
      "Return rate is 3x the normal level for this SKU over the past 2 weeks. Most returns cite taste/quality, pointing to a possible supplier batch issue or incorrect storage temperature.",
    recommendation:
      "Check storage conditions in the chilled section and report the batch code to your supplier. Consider pulling the affected stock pending supplier response.",
    status: "Monitoring",
    leakStopped: true,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 144),
    source: "pricing_feb.csv",
  },
];

const TYPE_META: Record<AnomalyType, { icon: React.ReactNode; color: string; bg: string; filterLabel: string }> = {
  "Price Error":      { icon: <Tag className="w-4 h-4" />,         color: "text-red-600",    bg: "bg-red-50",    filterLabel: "Price Errors" },
  "Refund Spike":     { icon: <RotateCcw className="w-4 h-4" />,   color: "text-orange-600", bg: "bg-orange-50", filterLabel: "Refund Spikes" },
  "Discount Abuse":   { icon: <TrendingDown className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50", filterLabel: "Discount Abuse" },
  "Void Pattern":     { icon: <AlertTriangle className="w-4 h-4" />,color: "text-yellow-600", bg: "bg-yellow-50", filterLabel: "Void Patterns" },
  "Stockout":         { icon: <PackageX className="w-4 h-4" />,     color: "text-blue-600",   bg: "bg-blue-50",   filterLabel: "Stockouts" },
  "Promo Execution":  { icon: <Megaphone className="w-4 h-4" />,    color: "text-pink-600",   bg: "bg-pink-50",   filterLabel: "Promos" },
  "Sales Anomaly":    { icon: <BarChart2 className="w-4 h-4" />,    color: "text-indigo-600", bg: "bg-indigo-50", filterLabel: "Sales" },
};

const SEV_META: Record<Severity, { label: string; dot: string; text: string }> = {
  Critical: { label: "Critical", dot: "bg-red-500",    text: "text-red-600" },
  High:     { label: "High",     dot: "bg-orange-400", text: "text-orange-600" },
  Medium:   { label: "Medium",   dot: "bg-amber-400",  text: "text-amber-600" },
  Low:      { label: "Low",      dot: "bg-blue-400",   text: "text-blue-500" },
};

const STATUS_META: Record<Status, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  "Open":        { icon: <Circle className="w-3.5 h-3.5" />,       label: "Open",        bg: "bg-red-50",    text: "text-red-600" },
  "In Progress": { icon: <Clock className="w-3.5 h-3.5" />,        label: "In Progress", bg: "bg-amber-50",  text: "text-amber-600" },
  "Fixed":       { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Fixed",       bg: "bg-green-50",  text: "text-green-700" },
  "Monitoring":  { icon: <Eye className="w-3.5 h-3.5" />,          label: "Monitoring",  bg: "bg-blue-50",   text: "text-blue-600" },
};

const STATUS_CYCLE: Record<Status, Status> = {
  "Open": "In Progress",
  "In Progress": "Fixed",
  "Fixed": "Monitoring",
  "Monitoring": "Open",
};

const ALL_TYPES: AnomalyType[] = [
  "Price Error", "Refund Spike", "Discount Abuse",
  "Void Pattern", "Stockout", "Promo Execution", "Sales Anomaly",
];

function formatEuro(n: number) {
  return `€${n.toLocaleString("en-IE")}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IE", { day: "2-digit", month: "short" }) +
    " " + d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export function IssuesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(SEED_ANOMALIES);
  const [filter, setFilter] = useState<AnomalyType | "All">("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = filter === "All" ? anomalies : anomalies.filter((a) => a.type === filter);

  const totalLoss = visible.reduce((s, a) => s + a.lossEstimate, 0);
  const openCount = visible.filter((a) => a.status === "Open").length;
  const fixedCount = visible.filter((a) => a.status === "Fixed").length;
  const leakStoppedCount = anomalies.filter((a) => a.leakStopped === true).length;

  function cycleStatus(id: string) {
    setAnomalies((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = STATUS_CYCLE[a.status];
        return {
          ...a,
          status: next,
          leakStopped: next === "Fixed" || next === "Monitoring" ? (a.leakStopped ?? false) : null,
        };
      })
    );
  }

  function toggleLeakStopped(id: string) {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, leakStopped: !a.leakStopped } : a))
    );
  }

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Issues</h1>
            <p className="text-sm text-gray-500 mt-0.5">Anomaly detection across sales, refunds, pricing, stock, and operations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-red-100 rounded-xl px-4 py-2.5 shadow-sm text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">At Risk</p>
              <p className="text-xl font-black text-red-600">{formatEuro(totalLoss)}</p>
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Open Issues",    value: openCount,          color: "text-red-600",   bg: "bg-red-50",   icon: <ShieldAlert className="w-4 h-4 text-red-500" /> },
            { label: "In Progress",    value: visible.filter(a => a.status === "In Progress").length, color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="w-4 h-4 text-amber-500" /> },
            { label: "Fixed",          value: fixedCount,         color: "text-green-700", bg: "bg-green-50", icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
            { label: "Leaks Stopped",  value: leakStoppedCount,   color: "text-blue-700",  bg: "bg-blue-50",  icon: <Eye className="w-4 h-4 text-blue-500" /> },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] px-4 py-3.5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
              <div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {(["All", ...ALL_TYPES] as const).map((type) => {
            const count = type === "All" ? anomalies.length : anomalies.filter((a) => a.type === type).length;
            const active = filter === type;
            const meta = type !== "All" ? TYPE_META[type] : null;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  active
                    ? "bg-[#0d1117] text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800",
                ].join(" ")}
              >
                {meta && <span className={active ? "text-white" : meta.color}>{meta.icon}</span>}
                {type === "All" ? "All" : meta!.filterLabel}
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Anomaly list */}
        <div className="space-y-3">
          {visible.map((anomaly) => {
            const typeMeta = TYPE_META[anomaly.type];
            const sevMeta = SEV_META[anomaly.severity];
            const statusMeta = STATUS_META[anomaly.status];
            const isExpanded = expanded === anomaly.id;
            const isResolved = anomaly.status === "Fixed" || anomaly.status === "Monitoring";

            return (
              <div
                key={anomaly.id}
                className={[
                  "bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200",
                  isExpanded ? "ring-2 ring-[#16a34a]/30" : "",
                ].join(" ")}
              >
                {/* Card header — always visible */}
                <div
                  className="px-5 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : anomaly.id)}
                >
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-xl ${typeMeta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className={typeMeta.color}>{typeMeta.icon}</span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${typeMeta.color}`}>
                        {anomaly.type}
                      </span>
                      <span className="text-gray-300">·</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${sevMeta.dot}`} />
                        <span className={`text-[10px] font-semibold ${sevMeta.text}`}>{sevMeta.label}</span>
                      </div>
                      <span className="text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(anomaly.detectedAt)}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{anomaly.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{anomaly.subject}</p>
                  </div>

                  {/* Loss + status */}
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{formatEuro(anomaly.lossEstimate)}</p>
                      <p className="text-[10px] text-gray-400">{anomaly.lossLabel}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); cycleStatus(anomaly.id); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${statusMeta.bg} ${statusMeta.text} hover:opacity-80 transition-opacity border border-transparent hover:border-current/20`}
                      title="Click to advance status"
                    >
                      {statusMeta.icon}
                      {statusMeta.label}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/40 space-y-4">
                    {/* Cause */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Likely Cause</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{anomaly.cause}</p>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-[#f0faf4] border border-green-100 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-green-700 mb-1">Recommended Next Action</p>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-sm font-semibold text-green-900 leading-snug">{anomaly.recommendation}</p>
                      </div>
                    </div>

                    {/* Footer: source + leak stopped toggle */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Source</p>
                          <p className="text-xs text-gray-600 font-medium">{anomaly.source}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Detected</p>
                          <p className="text-xs text-gray-600 font-medium">{formatDate(anomaly.detectedAt)}</p>
                        </div>
                      </div>

                      {isResolved && (
                        <button
                          onClick={() => toggleLeakStopped(anomaly.id)}
                          className={[
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                            anomaly.leakStopped
                              ? "bg-green-600 text-white border-green-600 shadow-sm"
                              : "bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-700",
                          ].join(" ")}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {anomaly.leakStopped ? "Leak Stopped" : "Mark Leak Stopped"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {visible.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No issues in this category</p>
          </div>
        )}

      </div>
    </div>
  );
}
