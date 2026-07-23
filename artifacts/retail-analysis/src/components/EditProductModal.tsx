import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface EditProductLine {
  invoice_desc: string;
  matched: string;
  barcode?: string;
  old_cost: number | null;
  invoice_cost: number | null;
  selling_price?: number | null;
  plu?: string | null;
}

interface EditProductModalProps {
  line: EditProductLine;
  onClose: () => void;
  onResult: (msg: string, ok: boolean) => void;
}

function computeMargin(cost: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

export function EditProductModal({ line, onClose, onResult }: EditProductModalProps) {
  const currentCost = line.invoice_cost ?? line.old_cost ?? 0;
  const currentPrice = (line as any).retail_price ?? (line as any).selling_price ?? 0;

  const [costValue, setCostValue] = useState(currentCost > 0 ? currentCost.toFixed(2) : "");
  const [priceValue, setPriceValue] = useState(currentPrice > 0 ? currentPrice.toFixed(2) : "");
  const [submitting, setSubmitting] = useState(false);

  const parsedCost = parseFloat(costValue) || 0;
  const parsedPrice = parseFloat(priceValue) || 0;
  const margin = parsedCost > 0 && parsedPrice > 0 ? computeMargin(parsedCost, parsedPrice) : null;

  const costChanged = parsedCost > 0 && line.old_cost != null && parsedCost !== line.old_cost;
  const priceChanged = parsedPrice > 0 && currentPrice > 0 && parsedPrice !== currentPrice;
  const canSubmit = costChanged || priceChanged;

  const submit = async (draft: boolean) => {
    setSubmitting(true);
    const token = localStorage.getItem("rg-token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const jobs: Promise<Response>[] = [];

    if (costChanged) {
      jobs.push(
        fetch(`${API_BASE}/api/price-jobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            plu: line.plu || line.barcode || null,
            field: "cost",
            old_value: line.old_cost,
            new_value: parsedCost,
            draft,
            source: "invoice_scanner",
          }),
        })
      );
    }

    if (priceChanged) {
      jobs.push(
        fetch(`${API_BASE}/api/price-jobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            plu: line.plu || line.barcode || null,
            field: "price",
            old_value: currentPrice,
            new_value: parsedPrice,
            draft,
            source: "invoice_scanner",
          }),
        })
      );
    }

    try {
      const results = await Promise.all(jobs);
      const allOk = results.every((r) => r.ok);
      const count = results.length;
      const word = draft ? "queued" : "pushed";
      if (allOk) {
        onResult(`${count} change${count > 1 ? "s" : ""} ${word}`, true);
      } else {
        const failedRes = results.find((r) => !r.ok); const errData = failedRes ? await failedRes.json().catch(() => ({})) : {}; onResult(errData.error || errData.message || "Some changes failed, please try again", false);
      }
    } catch {
      onResult("Network error, please try again", false);
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Edit product</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          {/* Product name (read only) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Product</label>
            <div className="text-sm text-gray-800 dark:text-gray-200 font-medium px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {line.matched || line.invoice_desc}
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Cost (per unit)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">&euro;</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-7 pr-3 py-2 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 tabular-nums text-gray-800 dark:text-gray-200"
              />
            </div>
            {line.old_cost != null && parsedCost !== line.old_cost && (
              <p className="text-[11px] text-amber-600 mt-1">
                Was &euro;{line.old_cost.toFixed(2)} &rarr; &euro;{parsedCost.toFixed(2)}
              </p>
            )}
          </div>

          {/* Selling price */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Selling price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">&euro;</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-7 pr-3 py-2 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 tabular-nums text-gray-800 dark:text-gray-200"
              />
            </div>
            {margin !== null && (
              <p className="text-[11px] text-gray-400 mt-1">
                {margin}% margin at this price
              </p>
            )}
            {currentPrice > 0 && parsedPrice !== currentPrice && (
              <p className="text-[11px] text-amber-600 mt-0.5">
                Was &euro;{currentPrice.toFixed(2)} &rarr; &euro;{parsedPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => submit(true)}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Queue
          </button>
          <button
            onClick={() => submit(false)}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Push now
          </button>
        </div>
      </div>
    </div>
  );
}
