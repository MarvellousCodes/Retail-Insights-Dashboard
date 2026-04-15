import { useState, useEffect } from "react";

const MESSAGES = [
  "Reading product data...",
  "Checking margins against thresholds...",
  "Detecting price anomalies...",
  "Flagging below-margin products...",
  "Building your attention report...",
];

function ProcessingView({ fileName }: { fileName: string }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((p) => (p + 1) % MESSAGES.length); setVisible(true); }, 300);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full flex items-center justify-center bg-[#f4faf6]">
      <div className="flex flex-col items-center gap-6 fade-in">
        <div className="relative w-16 h-16">
          <svg className="spinner w-16 h-16" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="26" stroke="#e5e7eb" strokeWidth="5" />
            <path d="M32 6 A26 26 0 0 1 58 32" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Analysing your data...</h2>
          {fileName && <p className="text-xs text-gray-400 mt-1 mb-3">{fileName}</p>}
          <p
            className="text-sm text-gray-500 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {MESSAGES[idx]}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#16a34a]/40"
              style={{ animation: `fade-in 0.6s ease-in-out ${i * 0.2}s infinite alternate` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AnalysePageProps {
  analyzing: boolean;
  fileName: string;
}

export function AnalysePage({ analyzing, fileName }: AnalysePageProps) {
  if (analyzing) return <ProcessingView fileName={fileName} />;
  return null;
}
