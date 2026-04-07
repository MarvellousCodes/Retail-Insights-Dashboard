import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";

interface UploadScreenProps {
  onUpload: (fileName: string) => void;
}

export function UploadScreen({ onUpload }: UploadScreenProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".csv", ".xls", ".xlsx"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    return validTypes.includes(file.type) || validExtensions.includes(ext);
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
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6">
      <div className="w-full max-w-md fade-up">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Find where you're losing money
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload your sales or pricing report to get started.
            </p>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all duration-200",
              dragging
                ? "border-blue-400 bg-blue-50"
                : selectedFile
                ? "border-green-400 bg-green-50"
                : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40",
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
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[220px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Drop your file here, or{" "}
                    <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Supports CSV and Excel (.xlsx, .xls)
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
              "mt-5 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              selectedFile
                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
            ].join(" ")}
          >
            Upload Report
          </button>
        </div>
      </div>
    </div>
  );
}
