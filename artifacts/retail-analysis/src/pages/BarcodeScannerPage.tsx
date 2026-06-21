import { useState, useRef, useEffect, useCallback } from "react";
import { apiCall } from "@/lib/api";
import {
  ScanBarcode, Camera, CameraOff, Check, X, Keyboard, ImageUp,
  Loader2, PackageSearch, AlertTriangle,
} from "lucide-react";

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];

interface Product {
  name: string; barcode: string; code: string;
  dept_name: string; sub_name: string; supplier: string;
  price: number | null; price_on_request: boolean;
  cost: number | null; margin: number | null; markup: number | null;
  margin_valid: boolean; active: boolean;
}
interface LookupResult { exists: boolean; query: string; product: Product | null; }

function eur(v: number | null) {
  return v === null || v === undefined ? "—" : `€${Number(v).toFixed(2)}`;
}
function marginCls(m: number | null) {
  if (m === null || m === undefined) return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300";
  return m >= 25 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
    : m >= 10 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

export function BarcodeScannerPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [looking, setLooking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const hasDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
  const canCamera = typeof window !== "undefined" && window.isSecureContext
    && !!navigator.mediaDevices?.getUserMedia && hasDetector;

  const getDetector = () => {
    if (!detectorRef.current) detectorRef.current = new (window as any).BarcodeDetector({ formats: FORMATS });
    return detectorRef.current;
  };

  const lookup = useCallback(async (c: string) => {
    const q = (c || "").trim();
    if (!q) return;
    setLooking(true); setResult(null);
    try {
      const d = await apiCall(`/api/barcode/${encodeURIComponent(q)}`);
      setResult(d);
    } catch {
      setResult({ exists: false, query: q, product: null });
    }
    setLooking(false);
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setNotice("");
    if (!canCamera) {
      setNotice(!window.isSecureContext
        ? "Live camera needs a secure (HTTPS) connection. For now, take a photo or scan into the box below — a USB/handheld barcode scanner works there too."
        : "This browser can't do live camera scanning. Use photo upload or type/scan the barcode below.");
      return;
    }
    try {
      const detector = getDetector();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setScanning(true);
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length) {
            const val = codes[0].rawValue;
            setCode(val); stopCamera(); lookup(val);
            return;
          }
        } catch { /* transient detect error — keep scanning */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      setNotice(e?.name === "NotAllowedError"
        ? "Camera permission was denied. Allow camera access, or use photo upload / type the barcode."
        : "Couldn't start the camera. Use photo upload or type the barcode below.");
      setScanning(false);
    }
  }, [canCamera, lookup, stopCamera]);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setNotice("");
    if (!hasDetector) {
      setNotice("This browser can't read barcodes from a photo. Type or scan the barcode into the box below instead.");
      return;
    }
    try {
      const bmp = await createImageBitmap(file);
      const codes = await getDetector().detect(bmp);
      (bmp as any).close?.();
      if (codes && codes.length) { setCode(codes[0].rawValue); lookup(codes[0].rawValue); }
      else setNotice("No barcode found in that photo — try a clearer, closer shot, or type it below.");
    } catch {
      setNotice("Couldn't read that image. Try another photo or type the barcode below.");
    }
  }, [hasDetector, lookup]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const p = result?.product;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <ScanBarcode className="w-6 h-6 text-violet-600" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Barcode Scanner</h1>
      </div>
      <p className="text-xs text-gray-500 mb-5">Scan or enter a barcode to check if it's in the store and see its price &amp; margin.</p>

      {/* Scanner card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Camera viewport */}
        <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
          <video ref={videoRef} className={`w-full h-full object-cover ${scanning ? "" : "hidden"}`} playsInline muted />
          {!scanning && (
            <div className="text-center px-6">
              <Camera className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">{canCamera ? "Point the camera at a barcode" : "Live camera needs HTTPS — use the options below"}</p>
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 h-1/3 border-2 border-violet-400/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700">
          {!scanning ? (
            <button onClick={startCamera}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-md shadow-violet-600/25 hover:bg-violet-700 transition disabled:opacity-50"
              disabled={!canCamera} title={canCamera ? "Start camera" : "Requires HTTPS"}>
              <Camera className="w-4 h-4" /> Start camera
            </button>
          ) : (
            <button onClick={stopCamera}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 transition">
              <CameraOff className="w-4 h-4" /> Stop
            </button>
          )}
          <button onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ImageUp className="w-4 h-4" /> Upload photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? undefined)} />
        </div>

        {/* Manual / hardware-scanner entry */}
        <div className="p-4">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Keyboard className="w-3.5 h-3.5" /> Type or scan a barcode (a USB/handheld scanner works here)
          </label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") lookup(code); }}
              autoFocus
              inputMode="numeric"
              placeholder="e.g. 5391520944567"
              className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button onClick={() => lookup(code)} disabled={!code.trim() || looking}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50">
              {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageSearch className="w-4 h-4" />} Check
            </button>
          </div>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{notice}</span>
        </div>
      )}

      {/* Result */}
      {looking && (
        <div className="mt-4 p-6 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking the store…
        </div>
      )}

      {result && !looking && result.exists && p && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-green-300 dark:border-green-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-800">
            <Check className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-700 dark:text-green-300 text-sm">In the store</span>
            {!p.active && <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Inactive</span>}
          </div>
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h2>
            <p className="text-xs text-gray-400 mb-3 font-mono">{p.barcode || result.query}{p.code ? ` · code ${p.code}` : ""}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Price">{p.price_on_request ? <span className="text-sm text-gray-400">on request</span> : <span className="text-lg font-bold text-violet-600">{eur(p.price)}</span>}</Field>
              <Field label="Cost"><span className="text-sm text-gray-700 dark:text-gray-200">{eur(p.cost)}</span></Field>
              <Field label="Margin"><span className={`px-2 py-0.5 rounded-full text-sm font-bold ${marginCls(p.margin)}`}>{p.margin === null ? "—" : p.margin + "%"}</span></Field>
              <Field label="Markup"><span className="text-sm text-gray-700 dark:text-gray-200">{p.markup === null ? "—" : p.markup + "%"}</span></Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
              <span><span className="text-gray-400">Department:</span> {p.dept_name || "—"}</span>
              {p.sub_name && <span><span className="text-gray-400">Sub-dept:</span> {p.sub_name}</span>}
              {p.supplier && <span><span className="text-gray-400">Supplier:</span> {p.supplier}</span>}
            </div>
          </div>
        </div>
      )}

      {result && !looking && !result.exists && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-red-200 dark:border-red-900 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20">
            <X className="w-5 h-5 text-red-600" />
            <div>
              <span className="font-bold text-red-700 dark:text-red-300 text-sm">Not found in the store</span>
              <p className="text-xs text-gray-500 font-mono">{result.query}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      {children}
    </div>
  );
}
