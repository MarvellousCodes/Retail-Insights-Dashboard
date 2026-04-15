import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  PlusCircle, Trash2, ChevronRight, Info,
} from "lucide-react";
import type { Product } from "@/App";

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

function parsePrice(str: string): number {
  if (!str) return 0;
  let s = str.replace(/[€$£\s%]/g, "").trim();
  const lastComma = s.lastIndexOf(",");
  const lastPeriod = s.lastIndexOf(".");
  if (lastComma > lastPeriod) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  return parseFloat(s) || 0;
}

function parseCSVText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const first = lines[0];
  const commas = (first.match(/,/g) || []).length;
  const semis = (first.match(/;/g) || []).length;
  const tabs = (first.match(/\t/g) || []).length;
  const delim = tabs > commas && tabs > semis ? "\t" : semis > commas ? ";" : ",";

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === delim && !inQ) { result.push(cur.replace(/^"|"$/g, "").trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.replace(/^"|"$/g, "").trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines
    .slice(1)
    .map((line) => {
      const vals = parseRow(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v.trim() !== ""));

  return { headers, rows };
}

interface ColumnMapping {
  name: string;
  costPrice: string;
  sellingPrice: string;
  sku: string;
  department: string;
  category: string;
  supplier: string;
}

function autoDetect(headers: string[]): ColumnMapping {
  const h = headers.map((x) => x.toLowerCase());
  const find = (...patterns: string[]) => {
    for (const p of patterns) {
      const idx = h.findIndex((header) => header.includes(p));
      if (idx !== -1) return headers[idx];
    }
    return "";
  };
  return {
    name: find("product name", "product desc", "description", "product", "item name", "item", "title", "name"),
    costPrice: find("cost price", "cost ex", "buy price", "purchase price", "unit cost", "cost", "buy", "supplier price"),
    sellingPrice: find("selling price", "sell price", "retail price", "sale price", "rrp", "price inc", "price ex", "price", "sell", "retail"),
    sku: find("barcode", "sku", "product code", "item code", "ean", "upc", "code", "ref"),
    department: find("department", "dept", "section", "group", "division"),
    category: find("category", "cat", "type", "class", "subcategory"),
    supplier: find("supplier", "vendor", "manufacturer", "brand", "supplier name"),
  };
}

function rowsToProducts(rows: Record<string, string>[], mapping: ColumnMapping): Product[] {
  return rows
    .map((row, i) => {
      const name = (mapping.name ? row[mapping.name] : "").trim();
      if (!name) return null;
      const costPrice = parsePrice(mapping.costPrice ? row[mapping.costPrice] : "0");
      const sellingPrice = parsePrice(mapping.sellingPrice ? row[mapping.sellingPrice] : "0");
      const margin =
        sellingPrice > 0
          ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 1000) / 10
          : costPrice > 0 ? -100 : 0;
      return {
        id: `csv-${i}-${Date.now()}`,
        name,
        sku: (mapping.sku ? row[mapping.sku] : "") ?? "",
        category: (mapping.category ? row[mapping.category] : "Uncategorised") || "Uncategorised",
        department: (mapping.department ? row[mapping.department] : "") ?? "",
        costPrice,
        sellingPrice,
        margin,
        supplier: (mapping.supplier ? row[mapping.supplier] : "") ?? "",
        isManualEntry: false,
      } as Product;
    })
    .filter(Boolean) as Product[];
}

// ─── Departments for Manual Entry ─────────────────────────────────────────────

const DEPARTMENTS = [
  "Off Licence", "Alcohol", "Dairy", "Bakery", "Produce",
  "Grocery", "Deli", "Non-Food", "Drinks", "Beverages",
  "Snacks", "Frozen", "Chilled", "General", "Other",
];

// ─── Component ────────────────────────────────────────────────────────────────

type Step = "drop" | "map";
type ActiveTab = "csv" | "manual";

interface UploadPageProps {
  onAnalyse: (products: Product[], fileName: string) => void;
  onManualAdd: (product: Product) => void;
  manualProducts: Product[];
}

const emptyForm = {
  name: "", sku: "", department: "Grocery", category: "",
  costPrice: "", sellingPrice: "", supplier: "",
};

export function UploadPage({ onAnalyse, onManualAdd, manualProducts }: UploadPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("csv");
  const [step, setStep] = useState<Step>("drop");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ name: "", costPrice: "", sellingPrice: "", sku: "", department: "", category: "", supplier: "" });
  const [parseError, setParseError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (![".csv"].includes(ext)) {
      setParseError("Please upload a CSV file (.csv). Excel support coming soon.");
      return;
    }
    setFile(f);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSVText(text);
      if (headers.length === 0) {
        setParseError("Could not read file — make sure it has a header row.");
        return;
      }
      const detected = autoDetect(headers);
      setCsvHeaders(headers);
      setCsvRows(rows);
      setMapping(detected);
      setStep("map");
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleRunAnalysis = () => {
    if (!mapping.name) { setParseError("Please map the Product Name column."); return; }
    if (!mapping.costPrice) { setParseError("Please map the Cost Price column."); return; }
    if (!mapping.sellingPrice) { setParseError("Please map the Selling Price column."); return; }
    const products = rowsToProducts(csvRows, mapping);
    if (products.length === 0) { setParseError("No valid products found after parsing."); return; }
    onAnalyse(products, file?.name ?? "upload.csv");
  };

  const handleManualSubmit = () => {
    if (!form.name.trim()) { setFormError("Product name is required."); return; }
    const cost = parseFloat(form.costPrice);
    const sell = parseFloat(form.sellingPrice);
    if (isNaN(cost) || cost < 0) { setFormError("Enter a valid cost price."); return; }
    if (isNaN(sell) || sell <= 0) { setFormError("Enter a valid selling price."); return; }
    const margin = Math.round(((sell - cost) / sell) * 1000) / 10;
    const product: Product = {
      id: `manual-${Date.now()}`,
      name: form.name.trim(),
      sku: form.sku.trim(),
      department: form.department,
      category: form.category.trim() || form.department,
      costPrice: cost,
      sellingPrice: sell,
      margin,
      supplier: form.supplier.trim(),
      isManualEntry: true,
    };
    onManualAdd(product);
    setForm(emptyForm);
    setFormError(null);
  };

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[860px] mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Upload</h1>
          <p className="text-sm text-gray-500 mt-0.5">Import a CSV file or enter products manually to run margin analysis.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
          {(["csv", "manual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setStep("drop"); setFile(null); setParseError(null); }}
              className={[
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === t ? "bg-[#0d1117] text-white shadow-sm" : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {t === "csv" ? "CSV Upload" : "Manual Entry"}
            </button>
          ))}
        </div>

        {/* ── CSV TAB ────────────────────────────────────────────────────── */}
        {activeTab === "csv" && (
          <>
            {step === "drop" && (
              <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)] p-7">
                <div
                  onClick={() => inputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  className={[
                    "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-14 px-6 cursor-pointer transition-all duration-200",
                    dragging ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/30",
                  ].join(" ")}
                >
                  <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleInputChange} />
                  <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-[#16a34a]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">Drag & drop your CSV file here</p>
                    <p className="text-sm text-gray-400 mt-0.5">or <span className="text-[#16a34a] font-semibold">browse to upload</span></p>
                    <p className="text-xs text-gray-300 mt-2">Supports .CSV — Excel export to CSV recommended</p>
                  </div>
                </div>

                {parseError && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{parseError}</span>
                  </div>
                )}

                <div className="mt-6 bg-gray-50 rounded-xl px-5 py-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Expected CSV columns
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {[
                      { col: "Product Name", note: "required" },
                      { col: "Cost Price", note: "required — ex-VAT cost from supplier" },
                      { col: "Selling Price", note: "required — shelf selling price" },
                      { col: "Department / Category", note: "recommended — for threshold matching" },
                      { col: "SKU / Barcode", note: "optional" },
                      { col: "Supplier", note: "optional" },
                    ].map(({ col, note }) => (
                      <div key={col} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-gray-700">{col}</span>
                          <span className="text-xs text-gray-400"> — {note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === "map" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-bold text-gray-900">{file?.name}</p>
                      </div>
                      <p className="text-xs text-gray-400">{csvRows.length} products found — map the columns below</p>
                    </div>
                    <button onClick={() => { setStep("drop"); setFile(null); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Change file</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(["name", "costPrice", "sellingPrice", "department", "sku", "supplier"] as const).map((field) => {
                      const labels: Record<string, { label: string; required?: boolean }> = {
                        name: { label: "Product Name", required: true },
                        costPrice: { label: "Cost Price (ex-VAT)", required: true },
                        sellingPrice: { label: "Selling Price", required: true },
                        department: { label: "Department / Category" },
                        sku: { label: "SKU / Barcode" },
                        supplier: { label: "Supplier" },
                      };
                      const { label, required } = labels[field];
                      return (
                        <div key={field}>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">
                            {label} {required && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={mapping[field]}
                            onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
                          >
                            <option value="">— Not mapped —</option>
                            {csvHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">Data Preview — first 5 rows</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["name", "costPrice", "sellingPrice", "department", "sku"].filter(f => mapping[f as keyof ColumnMapping]).map((f) => (
                            <th key={f} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                              {f === "name" ? "Product" : f === "costPrice" ? "Cost" : f === "sellingPrice" ? "Sell Price" : f === "department" ? "Dept" : "SKU"}
                            </th>
                          ))}
                          <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {csvRows.slice(0, 5).map((row, i) => {
                          const cost = parsePrice(mapping.costPrice ? row[mapping.costPrice] : "");
                          const sell = parsePrice(mapping.sellingPrice ? row[mapping.sellingPrice] : "");
                          const margin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : null;
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              {["name", "costPrice", "sellingPrice", "department", "sku"].filter(f => mapping[f as keyof ColumnMapping]).map((f) => (
                                <td key={f} className="px-4 py-2.5 text-gray-700 truncate max-w-[160px]">
                                  {mapping[f as keyof ColumnMapping] ? row[mapping[f as keyof ColumnMapping]] : "—"}
                                </td>
                              ))}
                              <td className={`px-4 py-2.5 text-right font-bold ${margin === null ? "text-gray-300" : margin < 0 ? "text-red-600" : margin < 20 ? "text-amber-600" : "text-green-700"}`}>
                                {margin !== null ? `${margin}%` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {parseError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{parseError}</span>
                  </div>
                )}

                <button
                  onClick={handleRunAnalysis}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors shadow-md shadow-green-900/20"
                >
                  Run Margin Analysis — {csvRows.length} products
                </button>
              </div>
            )}
          </>
        )}

        {/* ── MANUAL ENTRY TAB ──────────────────────────────────────────── */}
        {activeTab === "manual" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Add Product Manually</h2>
              <p className="text-xs text-gray-400 mb-5">For products from non-approved suppliers or items not in your electronic billing system.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input
                    type="text" placeholder="e.g. Coke 500ml"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">SKU / Barcode</label>
                  <input
                    type="text" placeholder="Optional"
                    value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Department <span className="text-red-500">*</span></label>
                  <select
                    value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                  >
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Cost Price (ex-VAT) € <span className="text-red-500">*</span></label>
                  <input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Selling Price € <span className="text-red-500">*</span></label>
                  <input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
                {form.costPrice && form.sellingPrice && (
                  <div className="col-span-2 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Calculated margin</span>
                    <span className={`text-sm font-black ${(() => { const m = ((parseFloat(form.sellingPrice) - parseFloat(form.costPrice)) / parseFloat(form.sellingPrice)) * 100; return m < 0 ? "text-red-600" : m < 20 ? "text-amber-600" : "text-green-700"; })()}`}>
                      {isNaN(parseFloat(form.sellingPrice)) || parseFloat(form.sellingPrice) === 0 ? "—" : `${Math.round(((parseFloat(form.sellingPrice) - parseFloat(form.costPrice)) / parseFloat(form.sellingPrice)) * 100)}%`}
                    </span>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Supplier (non-approved)</label>
                  <input
                    type="text" placeholder="e.g. Local Cash & Carry"
                    value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
              </div>

              {formError && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                onClick={handleManualSubmit}
                className="mt-5 flex items-center gap-2 bg-[#16a34a] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {manualProducts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">Manually Entered Products</p>
                  <span className="text-xs bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-full">{manualProducts.length} products</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Dept</th>
                      <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                      <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sell</th>
                      <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Margin</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {manualProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-semibold text-gray-800">{p.name}</td>
                        <td className="px-5 py-3 text-gray-500">{p.department}</td>
                        <td className="px-5 py-3 text-right text-gray-600">€{p.costPrice.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right text-gray-600">€{p.sellingPrice.toFixed(2)}</td>
                        <td className={`px-5 py-3 text-right font-bold ${p.margin < 0 ? "text-red-600" : p.margin < 20 ? "text-amber-600" : "text-green-700"}`}>
                          {p.margin}%
                        </td>
                        <td className="px-5 py-3 text-gray-400 italic">{p.supplier || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
