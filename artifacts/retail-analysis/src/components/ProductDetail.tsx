import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { useRevenueMask, STARS } from "@/lib/privacy";
import { X } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtPeriod = (p?: string) => (p && p.length === 6) ? `${MONTHS[parseInt(p.slice(4,6),10)-1]} ${p.slice(2,4)}` : (p || "");

interface Props { id: string | null; onClose: () => void; }

export function ProductDetail({ id, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { masked } = useRevenueMask();

  useEffect(() => {
    if (!id) { setData(null); return; }
    setLoading(true);
    apiCall(`/api/product/${encodeURIComponent(id)}`)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (!id) return null;

  const eur = (n: any) => (n === null || n === undefined) ? "—" : (masked ? STARS : `€${Number(n).toFixed(2)}`);
  const eur0 = (n: any) => (n === null || n === undefined) ? "—" : (masked ? STARS : "€" + Math.round(Number(n)).toLocaleString());
  const num = (n: any) => (n === null || n === undefined) ? "—" : Number(n).toLocaleString();

  const p = data?.product;
  const hist: any[] = data?.history || [];
  const s = data?.summary || {};
  const maxUnits = Math.max(...hist.map((h) => h.qty || 0), 1);
  const notFound = data && data.error;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-50 dark:bg-gray-900 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white truncate pr-3">{loading && !data ? "Loading…" : (p?.description || "Product")}</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && !data && <div className="p-10 text-center text-gray-400">Loading product…</div>}
        {notFound && <div className="p-10 text-center text-gray-400">Product not found.</div>}

        {p && (
          <div className="p-5 space-y-5">
            {/* identity chips */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {p.barcode && <span className="font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded">{p.barcode}</span>}
              {p.code && <span className="font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded">{p.code}</span>}
              {p.active
                ? <span className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded font-semibold">Active</span>
                : <span className="text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-semibold">Inactive</span>}
              {p.price_on_request && <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">price on request</span>}
            </div>

            {/* catalogue */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Department" value={p.dept_name} />
              <Field label="Sub-department" value={p.sub_dept_name} />
              <Field label="Supplier" value={p.supplier_name} />
              <Field label="VAT code" value={p.vat} />
              <Field label="Sell price" value={eur(p.display_price)} />
              <Field label="Retail 2" value={eur(p.retail2)} />
              <Field label="Unit cost" value={eur(p.unit_cost)} />
              <Field label="Pack size" value={p.pack_size ?? "—"} />
              <Field label="Margin" value={p.margin === null ? "—" : `${p.margin}%`} strong />
              <Field label="Markup" value={p.markup_pct === null ? "—" : `${p.markup_pct}%`} />
            </div>
            {p.margin_valid === false && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Cost or price looks off for this product, so the margin may not be reliable.</p>
            )}

            {/* lifetime summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Months" value={num(s.months)} />
              <Stat label="Units sold" value={num(s.units_total)} />
              <Stat label="Revenue" value={eur0(s.revenue_total)} />
              <Stat label="Avg units/mo" value={num(s.avg_monthly_units)} />
            </div>

            {/* units trend (last 12 months) */}
            {hist.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-3">Units sold per month</h3>
                <div className="flex gap-1 items-end" style={{ height: "92px" }}>
                  {hist.slice(-12).map((h, i) => {
                    const barH = Math.max(3, Math.round(((h.qty || 0) / maxUnits) * 72));
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end items-center h-full" title={`${fmtPeriod(h.period)}: ${num(h.qty)} units`}>
                        <div className="w-full rounded-t bg-violet-500" style={{ height: `${barH}px` }} />
                        <span className="text-[8px] text-gray-400 mt-1 shrink-0">{h.period.slice(4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* monthly sales history table */}
            {hist.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 px-4 pt-4 pb-2">Monthly sales history</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left font-semibold pl-4 py-1.5">Month</th>
                      <th className="text-right font-semibold py-1.5">Units</th>
                      <th className="text-right font-semibold py-1.5">Revenue</th>
                      <th className="text-right font-semibold pr-4 py-1.5">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hist.slice().reverse().map((h, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="pl-4 py-1.5 text-gray-700 dark:text-gray-200">{fmtPeriod(h.period)}</td>
                        <td className="py-1.5 text-right text-gray-600 dark:text-gray-300">{num(h.qty)}</td>
                        <td className="py-1.5 text-right text-gray-600 dark:text-gray-300">{eur0(h.value)}</td>
                        <td className="pr-4 py-1.5 text-right font-medium" style={{ color: h.margin == null ? undefined : (h.margin >= 25 ? "#16a34a" : h.margin >= 10 ? "#d97706" : "#dc2626") }}>{h.margin == null ? "—" : `${h.margin}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-[11px] text-gray-400">Sales are monthly totals from the till system. The data has no individual receipts, so this is the full sales record we hold for this product.</p>
          </div>
        )}
      </aside>
    </>
  );
}

function Field({ label, value, strong }: { label: string; value: any; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`${strong ? "text-base font-bold" : "text-sm font-medium"} text-gray-900 dark:text-white truncate`}>{value || "—"}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
      <p className="text-sm font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
