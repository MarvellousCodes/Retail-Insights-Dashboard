import { useState, useCallback, useRef } from "react";
import { Upload, Plus, Trash2, Download, Calculator, FileText, Image, Loader2, AlertTriangle } from "lucide-react";
import { extractFromImage, extractFromPdf } from "../lib/invoiceParser";

interface InvoiceItem {
  id: string;
  productName: string;
  barcode: string;
  qty: string;
  unitCost: string;
  totalCost: string;
  vatRate: string;
  sellPrice: string;
  department: string;
}

const empty = (): InvoiceItem => ({
  id: crypto.randomUUID(), productName: "", barcode: "", qty: "1",
  unitCost: "", totalCost: "", vatRate: "0", sellPrice: "", department: "",
});

export function InvoiceScannerPage() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [supplier, setSupplier] = useState("");
  const [targetMargin, setTargetMargin] = useState(30);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState("");
  const [lastFile, setLastFile] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setUploading(true);
    setOcrProgress(0);
    setLastFile(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const rawItems = ext === "pdf"
        ? await extractFromPdf(file)
        : await extractFromImage(file, setOcrProgress);
      const parsed: InvoiceItem[] = rawItems.map((i) => ({
        id: crypto.randomUUID(),
        productName: i.product_name || "",
        barcode: i.barcode || "",
        qty: i.qty || "1",
        unitCost: i.unit_cost || "",
        totalCost: i.total_cost || "",
        vatRate: i.vat_rate || "0",
        sellPrice: "",
        department: "",
      }));
      if (!parsed.length) setError("No line items detected. Try a clearer image or add rows manually.");
      setItems((prev) => [...prev, ...parsed]);
    } catch (e: any) {
      setError(`OCR processing failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const update = (id: string, field: keyof InvoiceItem, value: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const autoPrice = () => {
    setItems((prev) => prev.map((i) => {
      const cost = parseFloat(i.unitCost) || 0;
      return cost > 0 && targetMargin > 0 && targetMargin < 100
        ? { ...i, sellPrice: (cost / (1 - targetMargin / 100)).toFixed(2) }
        : i;
    }));
  };

  const exportCSV = () => {
    const header = "barcode,product_name,department,cost_price,sell_price,vat_rate,supplier,qty";
    const rows = items.map((i) => {
      const cost = parseFloat(i.unitCost) || 0;
      let sell = parseFloat(i.sellPrice) || 0;
      if (!sell && cost > 0) sell = +(cost / (1 - targetMargin / 100)).toFixed(2);
      return [i.barcode, `"${i.productName}"`, i.department, cost.toFixed(2), sell.toFixed(2), i.vatRate, supplier, i.qty].join(",");
    });
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "invoice_import.csv"; a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-violet-600" />
          Invoice Scanner
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload supplier invoices (PDF, JPG, PNG) — edit extracted data, then export for Retail Solutions import.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          For non-approved suppliers: photograph or scan the invoice → upload → correct any OCR errors → export ready-to-import CSV.
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6 ${
          dragOver ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20 scale-[1.01]"
            : "border-gray-300 dark:border-gray-600 hover:border-violet-400 bg-white dark:bg-gray-900"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.csv" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {uploading ? (
          <>
            <Loader2 className="w-10 h-10 text-violet-500 mx-auto mb-3 animate-spin" />
            <p className="font-semibold text-violet-600 dark:text-violet-400">Processing {lastFile}...</p>
            <p className="text-xs text-gray-400 mt-1">
              {ocrProgress > 0 ? `OCR: ${Math.round(ocrProgress * 100)}%` : "Extracting line items via OCR (runs in your browser)"}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3 mb-3">
              <Upload className="w-8 h-8 text-violet-500" />
              <Image className="w-8 h-8 text-violet-400" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Drop invoice here or click to browse</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {["PDF", "JPG", "PNG"].map((fmt) => (
                <span key={fmt} className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded text-xs font-medium">{fmt}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Photos of handwritten invoices, scanned PDFs, or digital invoices</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* Controls */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier:</label>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Murphy's Farm Fresh"
              className="px-3 py-1.5 border rounded-lg text-sm w-56 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Margin:</label>
            <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))}
              className="px-3 py-1.5 border rounded-lg text-sm w-20 dark:bg-gray-800 dark:border-gray-600 dark:text-white" min={0} max={80} />
            <span className="text-sm text-gray-400">%</span>
          </div>
          <button onClick={autoPrice} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors dark:bg-violet-900/30 dark:text-violet-300">
            <Calculator className="w-4 h-4" /> Auto-Price
          </button>
          <button onClick={() => setItems((p) => [...p, empty()])} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300">
            <Plus className="w-4 h-4" /> Add Row
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors ml-auto">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      )}

      {items.length > 0 && <p className="text-xs text-gray-400 mb-2">{items.length} item{items.length !== 1 ? "s" : ""} — edit any cell to correct OCR errors</p>}

      {/* Table */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
                {["Product Name", "Barcode", "Qty", "Unit Cost €", "Total €", "VAT%", "Sell Price €", "Dept", ""].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {(["productName", "barcode", "qty", "unitCost", "totalCost", "vatRate", "sellPrice", "department"] as const).map((field) => (
                    <td key={field} className="px-2 py-1.5">
                      <input value={item[field]} onChange={(e) => update(item.id, field, e.target.value)}
                        className="w-full px-2 py-1 border border-transparent rounded text-sm hover:border-gray-300 focus:border-violet-500 focus:outline-none dark:bg-transparent dark:text-white dark:hover:border-gray-600 dark:focus:border-violet-400" />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <button onClick={() => remove(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !uploading && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No invoice items yet</p>
          <p className="text-sm mt-1">Upload a PDF, photo, or image of a supplier invoice</p>
          <p className="text-xs mt-3 text-gray-300 dark:text-gray-600">
            Saves ~1.5 hours per week on non-approved supplier data entry
          </p>
        </div>
      )}
    </div>
  );
}
