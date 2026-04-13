import { AlertCircle, ChevronRight } from "lucide-react";
import type { AnalysisResult, AnalysisRow } from "@/App";

function formatEuro(n: number) {
  return `€${n.toLocaleString("en-IE")}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" });
}

const ACTION_FOR_ISSUE: Record<string, string> = {
  "Margin too low": "Increase price",
  "Cost mismatch": "Match supplier cost",
  "Pricing inconsistency": "Fix pricing",
  "Suspicious entry": "Review entry",
};

const SEVERITY: Record<string, { label: string; bg: string; text: string }> = {
  "Margin too low": { label: "High", bg: "bg-red-50", text: "text-red-600" },
  "Cost mismatch": { label: "Medium", bg: "bg-amber-50", text: "text-amber-600" },
  "Pricing inconsistency": { label: "Medium", bg: "bg-amber-50", text: "text-amber-600" },
  "Suspicious entry": { label: "Low", bg: "bg-blue-50", text: "text-blue-600" },
};

interface IssuesPageProps {
  results: AnalysisResult[];
}

export function IssuesPage({ results }: IssuesPageProps) {
  const allRows: (AnalysisRow & { fileName: string; uploadedAt: Date })[] = results.flatMap((r) =>
    r.rows.map((row) => ({ ...row, fileName: r.fileName, uploadedAt: r.uploadedAt }))
  );
  const sorted = [...allRows].sort((a, b) => b.estimatedLoss - a.estimatedLoss);
  const total = sorted.reduce((s, r) => s + r.estimatedLoss, 0);

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Issues</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {sorted.length} issues found across {results.length} reports
            </p>
          </div>
          <div className="bg-white border border-red-100 rounded-xl px-4 py-2 shadow-sm">
            <p className="text-xs text-gray-500">Total estimated loss</p>
            <p className="text-lg font-black text-red-600">{formatEuro(total)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Issue</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Severity</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Loss</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, i) => {
                const sev = SEVERITY[row.issue] ?? { label: "Low", bg: "bg-gray-50", text: "text-gray-500" };
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 shrink-0 ${sev.text}`} />
                        <span className="font-semibold text-gray-800 text-xs">{row.product}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{row.issue}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sev.bg} ${sev.text}`}>
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{row.category}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] text-gray-400">{row.fileName}</span>
                      <p className="text-[10px] text-gray-300">{formatDate(row.uploadedAt)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-red-600 text-xs">{formatEuro(row.estimatedLoss)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="text-xs font-semibold text-[#16a34a] hover:text-[#15803d] flex items-center gap-1 ml-auto">
                        {ACTION_FOR_ISSUE[row.issue] ?? "Review"} <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
