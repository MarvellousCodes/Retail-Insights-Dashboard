import { TrendingDown, AlertTriangle, BarChart2, Package, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AnalysisResult } from "@/App";

interface ResultsScreenProps {
  results: AnalysisResult[];
  onNewUpload: () => void;
}

function formatEuro(amount: number) {
  return `€${amount.toLocaleString("en-IE")}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ResultCard({
  result,
  isLatest,
}: {
  result: AnalysisResult;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = useState(isLatest);

  return (
    <div
      className={[
        "bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] overflow-hidden transition-all",
        isLatest ? "ring-2 ring-blue-200" : "",
      ].join(" ")}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="flex-shrink-0">
            {isLatest ? (
              <span className="inline-block text-xs font-semibold bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5">
                Latest
              </span>
            ) : (
              <span className="inline-block text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5">
                Previous
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
              {result.fileName || "Report"}
            </p>
            <p className="text-xs text-gray-400">{formatDate(result.uploadedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base font-bold text-red-600">
            {formatEuro(result.totalLoss)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 fade-up">
          <div className="border-t border-gray-100 pt-5">
            <div className="mb-5">
              <div className="text-3xl font-extrabold text-gray-900 leading-none">
                You are losing{" "}
                <span className="text-red-600">{formatEuro(result.totalLoss)}</span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">{result.pricingIssues}</span> pricing issues
                </span>
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">{result.inconsistencies}</span> inconsistencies
                </span>
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">{result.suspiciousEntries}</span> suspicious entries
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Worst Product
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {result.worstProduct.name}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {formatEuro(result.worstProduct.loss)} loss
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Biggest Issue
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {result.biggestIssue}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Most Affected
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {result.mostAffectedCategory}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Category</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Issue
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Est. Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {result.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        {row.product}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{row.issue}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {formatEuro(row.estimatedLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-gray-500">
                      Total estimated loss
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-extrabold text-red-600">
                      {formatEuro(result.rows.reduce((s, r) => s + r.estimatedLoss, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultsScreen({ results, onNewUpload }: ResultsScreenProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fc] py-10 px-4">
      <div className="max-w-2xl mx-auto fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analysis Results</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {results.length} report{results.length !== 1 ? "s" : ""} analyzed
            </p>
          </div>
          <button
            onClick={onNewUpload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {results.map((result, i) => (
            <ResultCard key={i} result={result} isLatest={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
