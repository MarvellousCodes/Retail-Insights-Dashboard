import { useState, useEffect, useCallback } from "react";
import { apiCall, API_BASE } from "@/lib/api";
import { ClipboardList, Loader2, RotateCcw, AlertCircle, Check, X, CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriceJob {
  id: number;
  product_code: string;
  product_name: string;
  before_price: number | null;
  new_price: number;
  status: "draft" | "pending" | "delivered" | "applied" | "failed" | "reverted" | "dismissed";
  source?: string;
  created_at: string;
  applied_at: string | null;
  error: string | null;
}

interface PriceJobsResponse {
  jobs: PriceJob[];
  writeback_enabled: boolean;
  message?: string;
  summary?: { drafts: number; pending: number; applied: number; failed: number; dismissed?: number };
}

const eur = (v: number) => "\u20AC" + v.toFixed(2);

function formatExactTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

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
  draft: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  delivered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  reverted: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  dismissed: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 border-gray-200 dark:border-gray-700",
};

const SOURCE_LABELS: Record<string, string> = {
  price_check: "Price check",
  products: "Products",
  margins: "Margins",
  invoice_scanner: "Invoice scanner",
};

function SourceChip({ source }: { source?: string }) {
  if (!source) return null;
  return (
    <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
      {SOURCE_LABELS[source] || source}
    </span>
  );
}

export function PriceChangesPage() {
  const [data, setData] = useState<PriceJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<number | null>(null);
  const [revertMsg, setRevertMsg] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dismissing, setDismissing] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const d: PriceJobsResponse = await apiCall("/api/price-jobs");
      setData(d);
      // Auto-check all drafts
      const draftIds = (d.jobs || []).filter((j) => j.status === "draft").map((j) => j.id);
      setChecked(new Set(draftIds));
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
      const res = await apiCall(`/api/price-jobs/${jobId}/revert`, { method: "POST" });
      if (res.error) {
        setRevertMsg({ id: jobId, text: res.message || "Revert failed", ok: false });
      } else {
        setRevertMsg({ id: jobId, text: "Reverted", ok: true });
        fetchJobs();
      }
    } catch {
      setRevertMsg({ id: jobId, text: "Network error", ok: false });
    }
    setReverting(null);
  };

  const handleDismiss = async (jobId: number) => {
    setDismissing(jobId);
    try {
      await apiCall(`/api/price-jobs/${jobId}/dismiss`, { method: "POST" });
      setBanner({ msg: "Price change dismissed", ok: true });
      fetchJobs();
    } catch {
      setBanner({ msg: "Could not dismiss. Please try again.", ok: false });
    }
    setDismissing(null);
  };

  const handleConfirmBatch = async () => {
    setConfirming(true);
    try {
      const res = await apiCall("/api/price-jobs/confirm", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(checked) }),
      });
      setShowModal(false);
      setBanner({ msg: `${checked.size} price change${checked.size !== 1 ? "s" : ""} pushed to your shop`, ok: true });
      fetchJobs();
    } catch {
      setBanner({ msg: "Could not push changes. Please try again.", ok: false });
    }
    setConfirming(false);
  };

  const toggleCheck = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (drafts: PriceJob[]) => {
    if (checked.size === drafts.length) setChecked(new Set());
    else setChecked(new Set(drafts.map((j) => j.id)));
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
  const drafts = jobs.filter((j) => j.status === "draft");
  const history = jobs.filter((j) => j.status !== "draft" && j.status !== "dismissed");
  const checkedCount = drafts.filter((d) => checked.has(d.id)).length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <ClipboardList className="w-6 h-6 text-violet-600" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Price changes</h1>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Review queued price changes, then push them to your till system in one go.
        Every change is recorded with before and after prices.
      </p>

      {banner && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${banner.ok ? "bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300" : "bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"}`}>
          {banner.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {!enabled && (
        <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-5">
          <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-500">
            {data?.message || "Price write-back is not yet active for your shop. Changes will appear here once it is connected."}
          </p>
        </div>
      )}

      {/* ─── DRAFT REVIEW SECTION ─── */}
      {enabled && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Waiting for your OK</h2>
          {drafts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              No queued changes right now. Use Price check, Products, Margins, or Invoice scanner to add one.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left px-3 py-2.5 w-8">
                          <input
                            type="checkbox"
                            checked={checkedCount === drafts.length && drafts.length > 0}
                            onChange={() => toggleAll(drafts)}
                            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                        </th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Product</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Current</th>
                        <th className="text-center px-2 py-2.5 font-semibold text-gray-400">{"\u2192"}</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Proposed</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Source</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Queued</th>
                        <th className="text-right px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.map((job) => (
                        <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={checked.has(job.id)}
                              onChange={() => toggleCheck(job.id)}
                              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <span className="block text-gray-900 dark:text-white font-medium">{job.product_name || job.product_code}</span>
                            <span className="block text-xs text-gray-400">{job.product_code}</span>
                          </td>
                          <td className="text-right px-3 py-3 text-gray-600 dark:text-gray-300 tabular-nums">
                            {job.before_price != null ? eur(job.before_price) : "\u2014"}
                          </td>
                          <td className="text-center px-2 py-3 text-gray-300">{"\u2192"}</td>
                          <td className="text-right px-3 py-3 font-semibold text-gray-900 dark:text-white tabular-nums">
                            {eur(job.new_price)}
                          </td>
                          <td className="px-3 py-3">
                            <SourceChip source={job.source} />
                          </td>
                          <td className="text-right px-3 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatExactTime(job.created_at)}
                          </td>
                          <td className="text-right px-3 py-3">
                            <button
                              onClick={() => handleDismiss(job.id)}
                              disabled={dismissing === job.id}
                              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                              title="Dismiss"
                            >
                              {dismissing === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  disabled={checkedCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm shadow-violet-600/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Push {checkedCount} price change{checkedCount !== 1 ? "s" : ""}
                </button>
                <span className="text-xs text-gray-400">{checkedCount} of {drafts.length} selected</span>
              </div>
            </>
          )}
        </section>
      )}

      {/* ─── CONFIRMATION MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !confirming && setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm price changes</h3>
            <p className="text-sm text-gray-500 mb-4">
              You are about to push {checkedCount} price change{checkedCount !== 1 ? "s" : ""} to your till system. This will update shelf prices.
            </p>
            <div className="max-h-48 overflow-y-auto mb-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <tbody>
                  {drafts.filter((d) => checked.has(d.id)).map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200 font-medium">{job.product_name || job.product_code}</td>
                      <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{job.before_price != null ? eur(job.before_price) : "\u2014"}</td>
                      <td className="px-1 py-2 text-gray-300">{"\u2192"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white tabular-nums">{eur(job.new_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={confirming}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatch}
                disabled={confirming}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50"
              >
                {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm and push
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HISTORY SECTION ─── */}
      <section>
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No price changes sent yet.
          </p>
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
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200">Source</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">When</th>
                    <th className="text-right px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <span className="block text-gray-900 dark:text-white font-medium">{job.product_name || job.product_code}</span>
                        <span className="block text-xs text-gray-400">{job.product_code}</span>
                      </td>
                      <td className="text-right px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">
                        {job.before_price != null ? eur(job.before_price) : "\u2014"}
                      </td>
                      <td className="text-right px-4 py-3 font-semibold text-gray-900 dark:text-white tabular-nums">
                        {eur(job.new_price)}
                      </td>
                      <td className="text-center px-4 py-3">
                        <Badge variant="outline" className={`text-[11px] ${STATUS_STYLES[job.status] || ""}`}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <SourceChip source={job.source} />
                      </td>
                      <td className="text-right px-4 py-3 text-xs whitespace-nowrap">
                        <span className="block text-gray-700 dark:text-gray-200">{formatExactTime(job.applied_at || job.created_at)}</span>
                        <span className="block text-gray-400 text-[10px]">{humanTime(job.applied_at || job.created_at)}</span>
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
      </section>
    </div>
  );
}
