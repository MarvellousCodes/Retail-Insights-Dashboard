import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  Upload, AlertCircle, CheckCircle2, PlusCircle, ChevronRight, Info,
  FileSpreadsheet, X, ChevronDown,
} from "lucide-react";
import type { Product, Source } from "@/App";

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

function parsePrice(str: string): number {
  if (!str) return 0;
  let s = str.replace(/[€$£\s%]/g, "").trim();
  const lastComma = s.lastIndexOf(",");
  const lastPeriod = s.lastIndexOf(".");
  if (lastComma > lastPeriod) { s = s.replace(/\./g, "").replace(",", "."); }
  else { s = s.replace(/,/g, ""); }
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
    let cur = ""; let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === delim && !inQ) { result.push(cur.replace(/^"|"$/g, "").trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.replace(/^"|"$/g, "").trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const vals = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  }).filter((row) => Object.values(row).some((v) => v.trim() !== ""));
  return { headers, rows };
}

interface ColumnMapping {
  name: string; costPrice: string; sellingPrice: string;
  sku: string; department: string; category: string; supplier: string;
}

function autoDetect(headers: string[]): ColumnMapping {
  const h = headers.map((x) => x.toLowerCase());
  // Track which headers have already been claimed so a single column isn't
  // assigned to two different fields (e.g. "Cost Price" being matched as both
  // cost and selling price via the generic "price" fallback).
  const used = new Set<string>();
  const find = (...patterns: string[]) => {
    for (const p of patterns) {
      for (let i = 0; i < h.length; i++) {
        if (used.has(headers[i])) continue;
        if (h[i].includes(p)) {
          used.add(headers[i]);
          return headers[i];
        }
      }
    }
    return "";
  };
  // Detection order matters — claim the most specific fields first so generic
  // patterns ("price", "cost") don't steal a column from a more specific one.
  const sku = find("barcode", "sku", "product code", "item code", "ean", "upc");
  const name = find("product name", "product desc", "description", "product", "item name", "item", "title", "name");
  const costPrice = find("cost price", "cost ex vat", "cost incl vat", "cost inc vat", "cost ex", "cost inc", "buy price", "purchase price", "wholesale", "unit cost", "net cost", "cost", "buy");
  const sellingPrice = find("selling price", "sell price", "retail price", "sale price", "shelf price", "list price", "rrp", "price inc vat", "price ex vat", "price inc", "price ex", "unit price", "price", "sell", "retail");
  const department = find("department", "dept", "section", "group", "division");
  const category = find("category", "cat", "type", "class");
  const supplier = find("supplier", "vendor", "manufacturer", "brand");
  return { name, sku, costPrice, sellingPrice, department, category, supplier };
}

function rowsToProducts(rows: Record<string, string>[], mapping: ColumnMapping, fileTag: string): Product[] {
  return rows.map((row, i) => {
    const name = (mapping.name ? row[mapping.name] : "").trim();
    if (!name) return null;
    const costPrice = parsePrice(mapping.costPrice ? row[mapping.costPrice] : "0");
    const sellingPrice = parsePrice(mapping.sellingPrice ? row[mapping.sellingPrice] : "0");
    const margin = sellingPrice > 0 ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 1000) / 10 : costPrice > 0 ? -100 : 0;
    return {
      id: `${fileTag}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      sku: (mapping.sku ? row[mapping.sku] : "") ?? "",
      department: (mapping.department ? row[mapping.department] : "") ?? "",
      category: (mapping.category ? row[mapping.category] : "") ||
        (mapping.department ? row[mapping.department] : "") || "General",
      costPrice, sellingPrice, margin,
      supplier: (mapping.supplier ? row[mapping.supplier] : "") ?? "",
      isManualEntry: false,
    } as Product;
  }).filter(Boolean) as Product[];
}

const DEPARTMENTS = ["Off Licence", "Alcohol", "Dairy", "Bakery", "Produce", "Grocery", "Deli", "Non-Food", "Drinks", "Beverages", "Snacks", "Frozen", "Chilled", "General", "Other"];

type ActiveTab = "csv" | "manual";
const emptyForm = { name: "", sku: "", department: "Grocery", category: "", costPrice: "", sellingPrice: "", supplier: "" };

interface ParsedFile {
  id: string;
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  mapping: ColumnMapping;
}

interface UploadPageProps {
  onAnalyse: (files: { fileName: string; products: Product[] }[]) => void;
  onManualAdd: (product: Product) => void;
  manualProducts: Product[];
  existingSources: Source[];
  onRemoveSource: (id: string) => void;
}

export function UploadPage({ onAnalyse, onManualAdd, manualProducts, existingSources, onRemoveSource }: UploadPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("csv");
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    setParseError(null);
    const arr = Array.from(files);
    arr.forEach((f) => {
      if (!f.name.toLowerCase().endsWith(".csv")) {
        setParseError(`${f.name} is not a CSV file (.csv only).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCSVText(text);
        if (headers.length === 0) {
          setParseError(`Could not read ${f.name} — no header row found.`);
          return;
        }
        const newFile: ParsedFile = {
          id: `pf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: f.name,
          headers,
          rows,
          mapping: autoDetect(headers),
        };
        setParsedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsText(f);
    });
  };

  const removeParsedFile = (id: string) => {
    setParsedFiles((prev) => prev.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateMapping = (id: string, field: keyof ColumnMapping, value: string) => {
    setParsedFiles((prev) => prev.map((p) =>
      p.id === id ? { ...p, mapping: { ...p.mapping, [field]: value } } : p
    ));
  };

  const isFileValid = (p: ParsedFile) =>
    !!p.mapping.name && !!p.mapping.costPrice && !!p.mapping.sellingPrice;

  const handleRunAnalysis = () => {
    if (parsedFiles.length === 0) { setParseError("Add at least one CSV file."); return; }
    const invalid = parsedFiles.find((p) => !isFileValid(p));
    if (invalid) {
      setParseError(`${invalid.fileName} is missing a required column. Click to expand and map it.`);
      setExpandedId(invalid.id);
      return;
    }
    const fileResults = parsedFiles.map((p) => ({
      fileName: p.fileName,
      products: rowsToProducts(p.rows, p.mapping, p.id),
    }));
    onAnalyse(fileResults);
    // Clear staged files after handing off to analyse
    setParsedFiles([]);
    setExpandedId(null);
  };

  const handleManualSubmit = () => {
    if (!form.name.trim()) { setFormError("Product name is required."); return; }
    const cost = parseFloat(form.costPrice); const sell = parseFloat(form.sellingPrice);
    if (isNaN(cost) || cost < 0) { setFormError("Enter a valid cost price."); return; }
    if (isNaN(sell) || sell <= 0) { setFormError("Enter a valid selling price."); return; }
    const margin = Math.round(((sell - cost) / sell) * 1000) / 10;
    onManualAdd({
      id: `manual-${Date.now()}`, name: form.name.trim(), sku: form.sku.trim(),
      department: form.department, category: form.category.trim() || form.department,
      costPrice: cost, sellingPrice: sell, margin,
      supplier: form.supplier.trim(), isManualEntry: true,
    });
    setForm(emptyForm); setFormError(null);
  };

  const calcMargin = () => {
    const c = parseFloat(form.costPrice); const s = parseFloat(form.sellingPrice);
    if (isNaN(c) || isNaN(s) || s === 0) return null;
    return Math.round(((s - c) / s) * 100);
  };

  const totalRows = parsedFiles.reduce((s, p) => s + p.rows.length, 0);

  return (
    <div className="min-h-full bg-gray-50 fade-up">
      <div className="px-7 py-6 max-w-[900px] mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Upload</h1>
          <p className="text-sm text-gray-400 mt-0.5">Drop one or many CSV files at once, then choose which ones to analyse from the dashboard.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm mb-6 w-fit">
          {(["csv", "manual"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={["px-5 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === t ? "bg-violet-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-700"].join(" ")}>
              {t === "csv" ? "CSV Upload" : "Manual Entry"}
            </button>
          ))}
        </div>

        {activeTab === "csv" && (
          <>
            {/* Existing already-uploaded sources */}
            {existingSources.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">
                  Currently Loaded ({existingSources.length})
                </p>
                <div className="space-y-2">
                  {existingSources.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 bg-violet-50/50 border border-violet-100 rounded-xl px-3.5 py-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.products.length} products</p>
                      </div>
                      <button onClick={() => onRemoveSource(s.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors" title="Remove this source">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                  Adding new files below will <strong>replace</strong> these. Use the source selector on Dashboard / Issues / Reports to toggle which files are visible.
                </p>
              </div>
            )}

            {/* Drop zone — always shown so you can keep adding files */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
              <div onClick={() => inputRef.current?.click()}
                onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
                onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                className={["flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all duration-200",
                  dragging ? "border-violet-400 bg-violet-50" : "border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/30"].join(" ")}>
                <input ref={inputRef} type="file" accept=".csv" multiple className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }} />
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-violet-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-700">
                    {parsedFiles.length === 0 ? "Drag & drop one or many CSV files" : "Add more CSV files"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">or <span className="text-violet-600 font-bold">browse to upload</span> — multi-select supported</p>
                </div>
              </div>

              {parseError && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{parseError}</span>
                </div>
              )}

              {parsedFiles.length === 0 && existingSources.length === 0 && (
                <div className="mt-5 bg-gray-50 rounded-xl px-5 py-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Expected columns
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {[
                      { col: "Product Name", note: "required" },
                      { col: "Cost Price", note: "required — ex-VAT cost" },
                      { col: "Selling Price", note: "required — shelf price" },
                      { col: "Category", note: "recommended" },
                      { col: "SKU / Barcode", note: "optional" },
                      { col: "Supplier", note: "optional" },
                    ].map(({ col, note }) => (
                      <div key={col} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                        <div><span className="text-xs font-bold text-gray-700">{col}</span><span className="text-xs text-gray-400"> — {note}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Staged files awaiting analysis */}
            {parsedFiles.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-gray-800">{parsedFiles.length} file{parsedFiles.length !== 1 ? "s" : ""} ready</p>
                    <p className="text-[11px] text-gray-400">{totalRows} rows total — click any file to review its column mapping</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {parsedFiles.map((p) => {
                    const valid = isFileValid(p);
                    const expanded = expandedId === p.id;
                    return (
                      <div key={p.id}>
                        <div className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                          <button onClick={() => setExpandedId(expanded ? null : p.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${expanded ? "rotate-0" : "-rotate-90"}`} />
                            <FileSpreadsheet className="w-4 h-4 text-violet-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{p.fileName}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="text-[10px] text-gray-400">{p.rows.length} rows</span>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className="text-[10px] text-gray-500">
                                  Cost: <span className={`font-bold ${p.mapping.costPrice ? "text-violet-600" : "text-red-500"}`}>{p.mapping.costPrice || "not set"}</span>
                                </span>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className="text-[10px] text-gray-500">
                                  Sell: <span className={`font-bold ${p.mapping.sellingPrice ? "text-violet-600" : "text-red-500"}`}>{p.mapping.sellingPrice || "not set"}</span>
                                </span>
                                {p.mapping.costPrice && p.mapping.sellingPrice && p.mapping.costPrice === p.mapping.sellingPrice && (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">⚠ same column</span>
                                )}
                              </div>
                            </div>
                          </button>
                          {valid ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Mapped
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Needs mapping
                            </span>
                          )}
                          <button onClick={() => removeParsedFile(p.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Remove file">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {expanded && (
                          <div className="px-5 pb-4 bg-violet-50/30 border-t border-violet-100">
                            <div className="grid grid-cols-2 gap-3 pt-4">
                              {(["name", "costPrice", "sellingPrice", "category", "sku", "supplier"] as const).map((field) => {
                                const meta: Record<string, { label: string; req?: boolean }> = {
                                  name: { label: "Product Name", req: true },
                                  costPrice: { label: "Cost Price", req: true },
                                  sellingPrice: { label: "Selling Price", req: true },
                                  category: { label: "Category" }, sku: { label: "SKU" }, supplier: { label: "Supplier" },
                                };
                                return (
                                  <div key={field}>
                                    <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                                      {meta[field].label} {meta[field].req && <span className="text-red-500">*</span>}
                                    </label>
                                    <select value={p.mapping[field]} onChange={(e) => updateMapping(p.id, field, e.target.value)}
                                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400">
                                      <option value="">— Not mapped —</option>
                                      {p.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Preview */}
                            <div className="mt-3 bg-white rounded-lg border border-gray-100 overflow-hidden">
                              <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">Preview — first 3 rows</div>
                              <table className="w-full text-[11px]">
                                <tbody className="divide-y divide-gray-50">
                                  {p.rows.slice(0, 3).map((row, i) => {
                                    const cost = parsePrice(p.mapping.costPrice ? row[p.mapping.costPrice] : "");
                                    const sell = parsePrice(p.mapping.sellingPrice ? row[p.mapping.sellingPrice] : "");
                                    const margin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : null;
                                    return (
                                      <tr key={i}>
                                        <td className="px-3 py-1.5 text-gray-700 truncate max-w-[200px]">{p.mapping.name ? row[p.mapping.name] : "—"}</td>
                                        <td className="px-3 py-1.5 text-right text-gray-500">€{cost.toFixed(2)}</td>
                                        <td className="px-3 py-1.5 text-right text-gray-500">€{sell.toFixed(2)}</td>
                                        <td className={`px-3 py-1.5 text-right font-black ${margin === null ? "text-gray-300" : margin < 0 ? "text-red-600" : margin < 20 ? "text-amber-600" : "text-green-700"}`}>
                                          {margin !== null ? `${margin}%` : "—"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {parsedFiles.length > 0 && (
              <button onClick={handleRunAnalysis}
                className="w-full py-3.5 rounded-xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-md shadow-violet-600/25">
                Run Profit Analysis on {parsedFiles.length} file{parsedFiles.length !== 1 ? "s" : ""} — {totalRows} products
              </button>
            )}
          </>
        )}

        {activeTab === "manual" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-gray-900 mb-1">Add Product Manually</h2>
              <p className="text-xs text-gray-400 mb-5">For products from non-approved suppliers or items not in your billing system.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Coke 500ml" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">SKU / Barcode</label>
                  <input type="text" placeholder="Optional" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Category <span className="text-red-500">*</span></label>
                  <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors bg-white">
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Cost Price (ex-VAT) € <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Selling Price € <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors" />
                </div>
                {form.costPrice && form.sellingPrice && (() => {
                  const m = calcMargin();
                  return m !== null ? (
                    <div className="col-span-2 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Calculated margin</span>
                      <span className={`text-sm font-black ${m < 0 ? "text-red-600" : m < 20 ? "text-amber-600" : "text-green-700"}`}>{m}%</span>
                    </div>
                  ) : null;
                })()}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">Supplier (non-approved)</label>
                  <input type="text" placeholder="e.g. Local Cash & Carry" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors" />
                </div>
              </div>
              {formError && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{formError}</span>
                </div>
              )}
              <button onClick={handleManualSubmit} className="mt-5 flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
                <PlusCircle className="w-4 h-4" /> Add Product
              </button>
            </div>

            {manualProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-black text-gray-900">Manual Products</p>
                  <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2.5 py-1 rounded-full">{manualProducts.length}</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Product", "Category", "Cost", "Sell", "Margin", "Supplier"].map((h) => (
                        <th key={h} className={`py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide ${["Cost", "Sell", "Margin"].includes(h) ? "text-right px-4" : "text-left px-5"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {manualProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-bold text-gray-800">{p.name}</td>
                        <td className="px-5 py-3 text-gray-500">{p.department}</td>
                        <td className="px-4 py-3 text-right text-gray-600">€{p.costPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">€{p.sellingPrice.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-black ${p.margin < 0 ? "text-red-600" : p.margin < 20 ? "text-amber-600" : "text-green-700"}`}>{p.margin}%</td>
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
