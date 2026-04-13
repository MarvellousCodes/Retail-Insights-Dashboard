import { FileText, Upload, ArrowUpRight } from "lucide-react";
import type { AnalysisResult } from "@/App";

function formatEuro(n: number) {
  return `€${n.toLocaleString("en-IE")}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" });
}

interface ReportsPageProps {
  results: AnalysisResult[];
  onNewUpload: () => void;
}

export function ReportsPage({ results, onNewUpload }: ReportsPageProps) {
  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">All uploaded files and their analysis results</p>
          </div>
          <button
            onClick={onNewUpload}
            className="flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors shadow-md shadow-green-900/20"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {results.map((r) => {
            const totalIssues = r.pricingIssues + r.inconsistencies + r.suspiciousEntries;
            const worstRow = r.rows.reduce((a, b) => (a.estimatedLoss > b.estimatedLoss ? a : b), r.rows[0]);
            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 flex items-center gap-5">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{r.fileName}</p>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {totalIssues} issues
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Uploaded {formatDate(r.uploadedAt)}</p>
                </div>
                <div className="text-center px-5 border-l border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-0.5">Worst category</p>
                  <p className="text-xs font-semibold text-gray-700">{r.mostAffectedCategory}</p>
                </div>
                <div className="text-center px-5 border-l border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-0.5">Top issue</p>
                  <p className="text-xs font-semibold text-gray-700">{worstRow?.issue ?? "—"}</p>
                </div>
                <div className="text-right px-5 border-l border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-0.5">Total loss</p>
                  <p className="text-sm font-black text-red-600">{formatEuro(r.totalLoss)}</p>
                </div>
                <button className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#16a34a] hover:text-[#15803d] border border-green-200 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors">
                  View <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
