import { useState, useEffect, useCallback } from "react";
import { apiCall, API_BASE } from "@/lib/api";
import { ClipboardList, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriceJob {
  id: number;
  product_code: string;
  product_name: string;
  before_price: number | null;
  new_price: number;
  status: "pending" | "delivered" | "applied" | "failed" | "reverted";
  created_at: string;
  applied_at: string | null;
  error: string | null;
}

interface PriceJobsResponse {
  jobs: PriceJob[];
  writeback_enabled: boolean;
  message?: string;
}

const eur = (v: number) => "\u20AC" + v.toFixed(2);

function humanTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  delivered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  reverted: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

export function PriceChangesPage() {
  const [data, setData] = useState<PriceJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<number | null>(null);
  const [revertMsg, setRevertMsg] = useState<{ id: number; text: string; ok: boolean } | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("rg-token");
      const res = await fetch(`${API_BASE}/api/price-jobs`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const d = await res.json();
      setData(d);
    } catch {
      setData({ jobs: [], writeback_enabled: false, message: "Could not reach the server." });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleRevert = async (jobId: number) => {
    setReverting(jobId);
    setRevertMsg(null);
    try {
      const token = localStorage.getItem("rg-token");
      const res = await fetch(`${API_BASE}/api/price-jobs/${jobId}/revert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const d = await res.json();
      if (res.ok) {
        setRevertMsg({ id: jobId, text: "Reverted", ok: true });
        fetchJobs();
      } else {
        setRevertMsg({ id: jobId, text: d.message || "Revert failed", ok: false });
      }
    } catch {
      setRevertMsg({ id: jobId, text: "Network error", ok: false });
    }
    setReverting(null);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="text-sm text-gray-400 flex items-center gap-2 py-12">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading price changes...
        </div>
      </div>
    );
  }

  const jobs = data?.jobs || [];
  const enabled = data?.writeback_enabled !== false;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <ClipboardList className="w-6 h-6 text-violet-600" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Price changes</h1>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Approved price changes are sent to your till system and applied automatically.
        Every change is recorded here with before and after prices.
      </p>

      {!enabled && (
        <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-5">
          <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-500">
            {data?.message || "Price write-back is not yet active for your shop. Changes will appear here once it is connected."}
          </p>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center">
          No price changes yet. Use the Opportunities tab on the Price check page to queue your first change.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Product</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Before</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">New price</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">When</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <span className="block text-gray-900 dark:text-white font-medium">{job.product_name || job.product_code}</span>
                      <span className="block text-xs text-gray-400">{job.product_code}</span>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-600 dark:text-gray-300">
                      {job.before_price != null ? eur(job.before_price) : "\u2014"}
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {eur(job.new_price)}
                    </td>
                    <td className="text-center px-4 py-3">
                      <Badge variant="outline" className={`text-[11px] ${STATUS_STYLES[job.status] || ""}`}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="text-right px-4 py-3 text-xs text-gray-400">
                      {humanTime(job.applied_at || job.created_at)}
                    </td>
                    <td className="text-right px-4 py-3">
                      {job.status === "applied" && (
                        <button
                          onClick={() => handleRevert(job.id)}
                          disabled={reverting === job.id}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition disabled:opacity-50"
                        >
                          {reverting === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                          Revert
                        </button>
                      )}
                      {revertMsg?.id === job.id && (
                        <span className={`block text-[10px] mt-0.5 ${revertMsg.ok ? "text-green-600" : "text-red-500"}`}>
                          {revertMsg.text}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
