import { useState, useEffect } from "react";

const MESSAGES = [
  "Reading product data...",
  "Checking margins against targets...",
  "Calculating recommended prices...",
  "Rounding to retail-friendly prices...",
  "Building your attention report...",
];

export function AnalysePage({ analyzing, fileName }: { analyzing: boolean; fileName: string }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!analyzing) return;
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((p) => (p + 1) % MESSAGES.length); setVisible(true); }, 300);
    }, 1400);
    return () => clearInterval(iv);
  }, [analyzing]);

  if (!analyzing) return null;

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6 fade-in">
        <div className="w-16 h-16 relative">
          <svg className="spinner w-16 h-16" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="26" stroke="#ede9fe" strokeWidth="5" />
            <path d="M32 6 A26 26 0 0 1 58 32" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Analysing your data...</h2>
          {fileName && <p className="text-xs text-gray-400 mt-1 mb-3">{fileName}</p>}
          <p className="text-sm text-gray-500 transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }}>
            {MESSAGES[idx]}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-300"
              style={{ animation: `fade-in 0.6s ease-in-out ${i * 0.2}s infinite alternate` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
