import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UploadScreen } from "@/pages/UploadScreen";
import { ProcessingScreen } from "@/pages/ProcessingScreen";
import { ResultsScreen } from "@/pages/ResultsScreen";

const queryClient = new QueryClient();

export type Screen = "upload" | "processing" | "results";

export interface AnalysisResult {
  totalLoss: number;
  pricingIssues: number;
  inconsistencies: number;
  suspiciousEntries: number;
  worstProduct: { name: string; loss: number };
  biggestIssue: string;
  mostAffectedCategory: string;
  rows: Array<{
    product: string;
    issue: string;
    estimatedLoss: number;
  }>;
  uploadedAt: Date;
  fileName: string;
}

const MOCK_RESULT: AnalysisResult = {
  totalLoss: 1240,
  pricingIssues: 6,
  inconsistencies: 3,
  suspiciousEntries: 2,
  worstProduct: { name: "Coke 500ml", loss: 320 },
  biggestIssue: "Low margins",
  mostAffectedCategory: "Drinks",
  rows: [
    { product: "Coke 500ml", issue: "Margin too low", estimatedLoss: 120 },
    { product: "Bread", issue: "Cost mismatch", estimatedLoss: 80 },
    { product: "Orange Juice", issue: "Pricing inconsistency", estimatedLoss: 95 },
    { product: "Water 1L", issue: "Margin too low", estimatedLoss: 60 },
    { product: "Chips 200g", issue: "Suspicious entry", estimatedLoss: 45 },
    { product: "Milk 1L", issue: "Cost mismatch", estimatedLoss: 70 },
  ],
  uploadedAt: new Date(),
  fileName: "",
};

function App() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [pendingFile, setPendingFile] = useState<string>("");

  const handleUpload = (fileName: string) => {
    setPendingFile(fileName);
    setScreen("processing");
    setTimeout(() => {
      const newResult: AnalysisResult = {
        ...MOCK_RESULT,
        uploadedAt: new Date(),
        fileName,
      };
      setResults((prev) => [newResult, ...prev]);
      setScreen("results");
    }, 4000);
  };

  const handleNewUpload = () => {
    setScreen("upload");
  };

  return (
    <QueryClientProvider client={queryClient}>
      {screen === "upload" && (
        <UploadScreen onUpload={handleUpload} />
      )}
      {screen === "processing" && (
        <ProcessingScreen fileName={pendingFile} />
      )}
      {screen === "results" && results.length > 0 && (
        <ResultsScreen results={results} onNewUpload={handleNewUpload} />
      )}
    </QueryClientProvider>
  );
}

export default App;
