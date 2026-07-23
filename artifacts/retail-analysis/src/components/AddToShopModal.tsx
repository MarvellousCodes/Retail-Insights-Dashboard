import React, { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface AddToShopLine {
  invoice_desc: string;
  barcode: string;
  invoice_cost: number | null;
  qty: number | null;
}

interface AddToShopModalProps {
  line: AddToShopLine;
  onClose: () => void;
  onResult: (msg: string, ok: boolean) => void;
}

function computeMargin(cost: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

function defaultSellingPrice(cost: number): string {
  if (!cost || cost <= 0) return "";
  return (cost / (1 - 0.25)).toFixed(2);
}

export function AddToShopModal({ line, onClose, onResult }: AddToShopModalProps) {
  const cost = line.invoice_cost ?? 0;
  const [description, setDescription] = useState(line.invoice_desc || "");
  const [barcode, setBarcode] = useState(line.barcode || "");
  const [costValue, setCostValue] = useState(cost > 0 ? cost.toFixed(2) : "");
  const [sellingPrice, setSellingPrice] = useState(defaultSellingPrice(cost));
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const parsedCost = parseFloat(costValue) || 0;
  const parsedPrice = parseFloat(sellingPrice) || 0;
  const margin = parsedCost > 0 && parsedPrice > 0 ? computeMargin(parsedCost, parsedPrice) : null;
  const canSubmit = description.trim().length > 0 && parsedPrice > 0;

  const submit = async (draft: boolean) => {
    setSubmitting(true);
    const token = localStorage.getItem("rg-token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/api/price-jobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          field: "new_product",
          description: description.trim(),
          barcode: barcode.trim() || null,
          cost: parsedCost > 0 ? parsedCost : null,
          new_price: parsedPrice,
          draft,
          source: "invoice_scanner",
        }),
      });
      if (res.ok) {
        const word = draft ? "queued" : "pushed";
        onResult(`1 new product ${word} to your shop`, true);
      } else {
        const data = await res.json().catch(() => ({}));
        onResult(data.error || data.message || `Could not add product (${res.status})`, false);
      }
    } catch (err: any) {
      onResult(err?.message || "Network error, please try again", false);
    }
    setSubmitting(false);
    setShowConfirm(false);
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
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Add to your shop</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 text-gray-800 dark:text-gray-200"
              placeholder="Product name"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Barcode</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono text-gray-800 dark:text-gray-200"
              placeholder="Optional"
            />
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
                onChange={(e) => {
                  setCostValue(e.target.value);
                  const c = parseFloat(e.target.value);
                  if (c > 0) setSellingPrice((c / (1 - 0.25)).toFixed(2));
                }}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-7 pr-3 py-2 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 tabular-nums text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Selling price */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">
              Selling price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">&euro;</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-7 pr-3 py-2 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 tabular-nums text-gray-800 dark:text-gray-200"
              />
            </div>
            {margin !== null && (
              <p className="text-[11px] text-gray-400 mt-1">
                {margin}% margin at this price
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
            onClick={() => setShowConfirm(true)}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Push now
          </button>
        </div>
      </div>

      {/* Push confirm overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Add this product to your shop now?</h3>
            <p className="text-sm text-gray-500 mb-1 font-medium">{description}</p>
            <p className="text-xs text-gray-400 mb-5">
              Selling at &euro;{parsedPrice.toFixed(2)}{margin !== null ? ` (${margin}% margin)` : ""}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); submit(true); }}
                disabled={submitting}
                className="px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Queue instead
              </button>
              <button
                onClick={() => submit(false)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Push now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
