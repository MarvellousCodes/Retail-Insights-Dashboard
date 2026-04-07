import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";

interface UploadPageProps {
  onUpload: (fileName: string) => void;
}

export function UploadPage({ onUpload }: UploadPageProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File) => {
    const validExtensions = [".csv", ".xls", ".xlsx"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    return validExtensions.includes(ext);
  };

  const handleFile = (file: File) => {
    if (!isValidFile(file)) {
      setError("Please upload a CSV or Excel file (.csv, .xls, .xlsx)");
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    onUpload(selectedFile.name);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="w-full max-w-lg fade-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your pricing or sales report to find where you're losing money.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)] p-7">
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-12 px-6 cursor-pointer transition-all duration-200",
              dragging
                ? "border-blue-400 bg-blue-50"
                : selectedFile
                ? "border-green-400 bg-green-50/60"
                : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={handleInputChange}
            />

            {selectedFile ? (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[260px]">
                      {selectedFile.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">
                    Drag & drop your file here
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    or <span className="text-blue-600 font-medium">browse to upload</span>
                  </p>
                  <p className="text-xs text-gray-300 mt-2">
                    Supports .CSV, .XLS, .XLSX
                  </p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            className={[
              "mt-5 w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200",
              selectedFile
                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
            ].join(" ")}
          >
            Upload & Analyse
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Supported formats", value: "CSV, XLS, XLSX" },
            { label: "Max file size", value: "50 MB" },
            { label: "Processing time", value: "~5 seconds" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
