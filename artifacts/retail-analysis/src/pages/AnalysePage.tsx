import { useState, useEffect } from "react";
import { TrendingDown, AlertTriangle, BarChart2, Package, LayoutDashboard, Upload, ArrowRight } from "lucide-react";
import type { AnalysisResult } from "@/App";

const MESSAGES = [
  "Checking pricing consistency...",
  "Calculating margins...",
  "Finding anomalies...",
  "Comparing historical data...",
  "Building your report...",
];

function formatEuro(n: number) {
  return `€${n.toLocaleString("en-IE")}`;
}

function ProcessingView({ fileName }: { fileName: string }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMessageIndex((p) => (p + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 fade-in">
        <div className="relative w-16 h-16">
          <svg className="spinner w-16 h-16" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="26" stroke="#e5e7eb" strokeWidth="5" />
            <path d="M32 6 A26 26 0 0 1 58 32" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Analyzing your data...</h2>
          {fileName && (
            <p className="text-xs text-gray-400 mt-1 mb-3">{fileName}</p>
          )}
          <div
            className="text-sm text-gray-500 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {MESSAGES[messageIndex]}
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-300"
              style={{ animation: `fade-in 0.6s ease-in-out ${i * 0.2}s infinite alternate` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyAnalyse({ onNewUpload }: { onNewUpload: () => void }) {
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center fade-up">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">No analysis yet</h2>
        <p className="text-sm text-gray-400 mt-1 mb-5">Upload a report to see your analysis here.</p>
        <button
          onClick={onNewUpload}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload a report
        </button>
      </div>
    </div>
  );
}

interface ResultViewProps {
  result: AnalysisResult;
  onNavigateDashboard: () => void;
  onNewUpload: () => void;
}

function ResultView({ result, onNavigateDashboard, onNewUpload }: ResultViewProps) {
  return (
    <div className="p-8 max-w-3xl mx-auto fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analysis Complete</h1>
          <p className="text-sm text-gray-400 mt-0.5">{result.fileName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onNewUpload}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </button>
          <button
            onClick={onNavigateDashboard}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            View Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-6 mb-5">
        <div className="text-3xl font-extrabold text-gray-900 leading-none mb-2">
          You are losing{" "}
          <span className="text-red-600">{formatEuro(result.totalLoss)}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
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

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Worst Product</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{result.worstProduct.name}</p>
          <p className="text-xs text-red-600 mt-0.5">{formatEuro(result.worstProduct.loss)} loss</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Biggest Issue</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{result.biggestIssue}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Most Affected</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{result.mostAffectedCategory}</p>
          <p className="text-xs text-gray-400 mt-0.5">Category</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">Issue Breakdown</span>
          <span className="text-xs text-gray-400">{result.rows.length} items</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Issue</th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Est. Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {result.rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  {row.product}
                </td>
                <td className="px-5 py-3 text-gray-500">{row.issue}</td>
                <td className="px-5 py-3 text-right font-semibold text-red-600">{formatEuro(row.estimatedLoss)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-100">
              <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500">Total estimated loss</td>
              <td className="px-5 py-3 text-right text-sm font-extrabold text-red-600">
                {formatEuro(result.rows.reduce((s, r) => s + r.estimatedLoss, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

interface AnalysePageProps {
  analyzing: boolean;
  fileName: string;
  result: AnalysisResult | null;
  onNavigateDashboard: () => void;
  onNewUpload: () => void;
}

export function AnalysePage({ analyzing, fileName, result, onNavigateDashboard, onNewUpload }: AnalysePageProps) {
  if (analyzing) return <ProcessingView fileName={fileName} />;
  if (result) return <ResultView result={result} onNavigateDashboard={onNavigateDashboard} onNewUpload={onNewUpload} />;
  return <EmptyAnalyse onNewUpload={onNewUpload} />;
}
