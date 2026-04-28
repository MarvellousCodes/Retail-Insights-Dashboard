import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronUp, ArrowUpDown, Upload } from "lucide-react";
import type { Product, DeptThreshold } from "@/App";

interface DepartmentsPageProps {
  products: Product[];
  thresholds: DeptThreshold[];
  onNewUpload: () => void;
}

type SortKey = "margin" | "profit" | "count";
type ColSort = "margin" | "profitUnit" | null;

interface DeptSummary {
  name: string;
  products: Product[];
  count: number;
  avgMargin: number;
  totalProfit: number;
  totalRevenue: number;
  grade: string;
  gradeColor: string;
  gradeBg: string;
  belowTarget: number;
  lossMaking: number;
  threshold: number;
}

const GRADE_MAP: [number, string, string, string][] = [
  [40, "A", "text-emerald-700 dark:text-emerald-400", "bg-emerald-100 dark:bg-emerald-900/40"],
  [30, "B", "text-blue-700 dark:text-blue-400", "bg-blue-100 dark:bg-blue-900/40"],
  [20, "C", "text-yellow-700 dark:text-yellow-400", "bg-yellow-100 dark:bg-yellow-900/40"],
  [10, "D", "text-orange-700 dark:text-orange-400", "bg-orange-100 dark:bg-orange-900/40"],
  [-Infinity, "F", "text-red-700 dark:text-red-400", "bg-red-100 dark:bg-red-900/40"],
];

function getGrade(margin: number) {
  for (const [min, g, c, bg] of GRADE_MAP) if (margin >= min) return { grade: g, gradeColor: c, gradeBg: bg };
  return { grade: "F", gradeColor: GRADE_MAP[4][2], gradeBg: GRADE_MAP[4][3] };
}

const fmt = (n: number) => "€" + n.toFixed(2);
const pct = (n: number) => n.toFixed(1) + "%";

export function DepartmentsPage({ products, thresholds, onNewUpload }: DepartmentsPageProps) {
  const [sortKey, setSortKey] = useState<SortKey>("margin");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [colSort, setColSort] = useState<ColSort>(null);
  const [colAsc, setColAsc] = useState(false);

  const departments = useMemo((): DeptSummary[] => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const key = p.department || p.category || "Uncategorised";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).map(([name, prods]) => {
      const avgMargin = prods.reduce((s, p) => s + p.margin, 0) / prods.length;
      const totalProfit = prods.reduce((s, p) => s + (p.sellingPrice - p.costPrice), 0);
      const totalRevenue = prods.reduce((s, p) => s + p.sellingPrice, 0);
      const th = thresholds.find((t) => t.department.toLowerCase() === name.toLowerCase())?.minMargin ?? 20;
      const { grade, gradeColor, gradeBg } = getGrade(avgMargin);
      return {
        name, products: prods, count: prods.length, avgMargin, totalProfit, totalRevenue, grade, gradeColor, gradeBg,
        belowTarget: prods.filter((p) => p.margin < th).length,
        lossMaking: prods.filter((p) => p.margin < 0).length,
        threshold: th,
      };
    });
  }, [products, thresholds]);

  const sorted = useMemo(() => {
    const arr = [...departments];
    if (sortKey === "margin") arr.sort((a, b) => b.avgMargin - a.avgMargin);
    else if (sortKey === "profit") arr.sort((a, b) => b.totalProfit - a.totalProfit);
    else arr.sort((a, b) => b.count - a.count);
    return arr;
  }, [departments, sortKey]);

  const sortedProducts = useMemo(() => {
    if (!expandedDept) return [];
    const dept = departments.find((d) => d.name === expandedDept);
    if (!dept) return [];
    const arr = [...dept.products];
    if (colSort === "margin") arr.sort((a, b) => colAsc ? a.margin - b.margin : b.margin - a.margin);
    else if (colSort === "profitUnit") arr.sort((a, b) => colAsc ? (a.sellingPrice - a.costPrice) - (b.sellingPrice - b.costPrice) : (b.sellingPrice - b.costPrice) - (a.sellingPrice - a.costPrice));
    return arr;
  }, [expandedDept, departments, colSort, colAsc]);

  const toggleColSort = (key: ColSort) => {
    if (colSort === key) setColAsc(!colAsc);
    else { setColSort(key); setColAsc(false); }
  };

  const expanded = expandedDept ? departments.find((d) => d.name === expandedDept) : null;

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-4">
        <Building2 className="w-12 h-12" />
        <p className="text-lg font-semibold">No data yet</p>
        <button onClick={onNewUpload} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
          <Upload className="w-4 h-4" /> Upload CSV
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Departments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{departments.length} departments · {products.length} products</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 text-xs font-semibold">
          {(["margin", "profit", "count"] as SortKey[]).map((k) => (
            <button key={k} onClick={() => setSortKey(k)}
              className={`px-3 py-1.5 rounded-md transition-colors ${sortKey === k ? "bg-white dark:bg-gray-700 text-violet-600 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {k === "margin" ? "Margin" : k === "profit" ? "Profit" : "Products"}
            </button>
          ))}
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid gap-3">
        {sorted.map((dept) => {
          const isExpanded = expandedDept === dept.name;
          return (
            <div key={dept.name}>
              <button onClick={() => { setExpandedDept(isExpanded ? null : dept.name); setColSort(null); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isExpanded ? "bg-violet-50 dark:bg-violet-950/20 border-violet-300 dark:border-violet-700" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600"}`}>
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black ${dept.gradeBg} ${dept.gradeColor}`}>{dept.grade}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{dept.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{dept.count} products</p>
                </div>
                <div className="text-right mr-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{pct(dept.avgMargin)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(dept.totalProfit)} profit</p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>

              {/* Expanded Detail */}
              {isExpanded && expanded && (
                <div className="mt-2 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                    {[
                      ["Products", String(expanded.count)],
                      ["Avg Margin", pct(expanded.avgMargin)],
                      ["Revenue", fmt(expanded.totalRevenue)],
                      ["Profit", fmt(expanded.totalProfit)],
                      ["Below Target", String(expanded.belowTarget)],
                      ["Loss-Making", String(expanded.lossMaking)],
                    ].map(([label, val]) => (
                      <div key={label} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Product table */}
                  <div className="overflow-auto max-h-[420px] rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">Product</th>
                          <th className="px-3 py-2 text-left">SKU</th>
                          <th className="px-3 py-2 text-left">Supplier</th>
                          <th className="px-3 py-2 text-right">Cost</th>
                          <th className="px-3 py-2 text-right">Sell</th>
                          <th className="px-3 py-2 text-right cursor-pointer select-none" onClick={() => toggleColSort("margin")}>
                            <span className="inline-flex items-center gap-1">Margin % <ArrowUpDown className="w-3 h-3" /></span>
                          </th>
                          <th className="px-3 py-2 text-right cursor-pointer select-none" onClick={() => toggleColSort("profitUnit")}>
                            <span className="inline-flex items-center gap-1">Profit/u <ArrowUpDown className="w-3 h-3" /></span>
                          </th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {sortedProducts.map((p, i) => {
                          const profit = p.sellingPrice - p.costPrice;
                          const status = p.margin < 0 ? { label: "LOSS", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" }
                            : p.margin < expanded.threshold ? { label: "LOW", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" }
                            : { label: "OK", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
                          return (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{p.name}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.sku}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{p.supplier}</td>
                              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{fmt(p.costPrice)}</td>
                              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{fmt(p.sellingPrice)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{pct(p.margin)}</td>
                              <td className="px-3 py-2 text-right">{fmt(profit)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.cls}`}>{status.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
