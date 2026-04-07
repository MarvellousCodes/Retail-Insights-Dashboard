import { useState, useEffect } from "react";

const MESSAGES = [
  "Checking pricing consistency...",
  "Calculating margins...",
  "Finding anomalies...",
  "Comparing historical data...",
  "Building your report...",
];

interface ProcessingScreenProps {
  fileName: string;
}

export function ProcessingScreen({ fileName }: ProcessingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 fade-in">
        <div className="relative w-16 h-16">
          <svg
            className="spinner w-16 h-16"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="#e5e7eb"
              strokeWidth="5"
            />
            <path
              d="M32 6 A26 26 0 0 1 58 32"
              stroke="#2563eb"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Analyzing your data...
          </h2>
          {fileName && (
            <p className="text-xs text-gray-400 mt-1 mb-3">
              {fileName}
            </p>
          )}
          <div
            className="text-sm text-gray-500 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {MESSAGES[messageIndex]}
          </div>
        </div>

        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-300"
              style={{
                animation: `fade-in 0.6s ease-in-out ${i * 0.2}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
