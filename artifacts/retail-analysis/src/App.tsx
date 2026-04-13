import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { UploadPage } from "@/pages/UploadPage";
import { AnalysePage } from "@/pages/AnalysePage";
import { DashboardPage } from "@/pages/DashboardPage";

const queryClient = new QueryClient();

export type NavTab = "upload" | "analyse" | "dashboard";

export interface AnalysisRow {
  product: string;
  issue: string;
  estimatedLoss: number;
  category: string;
}

export interface AnalysisResult {
  id: string;
  totalLoss: number;
  pricingIssues: number;
  inconsistencies: number;
  suspiciousEntries: number;
  worstProduct: { name: string; loss: number };
  biggestIssue: string;
  mostAffectedCategory: string;
  rows: AnalysisRow[];
  uploadedAt: Date;
  fileName: string;
}

export const SEED_RESULTS: AnalysisResult[] = [
  {
    id: "seed-1",
    totalLoss: 1240,
    pricingIssues: 6,
    inconsistencies: 3,
    suspiciousEntries: 2,
    worstProduct: { name: "Coke 500ml", loss: 320 },
    biggestIssue: "Low margins",
    mostAffectedCategory: "Drinks",
    rows: [
      { product: "Coke 500ml", issue: "Margin too low", estimatedLoss: 120, category: "Drinks" },
      { product: "Orange Juice", issue: "Pricing inconsistency", estimatedLoss: 95, category: "Drinks" },
      { product: "Water 1L", issue: "Margin too low", estimatedLoss: 60, category: "Drinks" },
      { product: "Bread", issue: "Cost mismatch", estimatedLoss: 80, category: "Bakery" },
      { product: "Chips 200g", issue: "Suspicious entry", estimatedLoss: 45, category: "Snacks" },
      { product: "Milk 1L", issue: "Cost mismatch", estimatedLoss: 70, category: "Dairy" },
    ],
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    fileName: "sales_report_march.xlsx",
  },
  {
    id: "seed-2",
    totalLoss: 890,
    pricingIssues: 4,
    inconsistencies: 2,
    suspiciousEntries: 1,
    worstProduct: { name: "Greek Yogurt", loss: 210 },
    biggestIssue: "Cost mismatch",
    mostAffectedCategory: "Dairy",
    rows: [
      { product: "Greek Yogurt", issue: "Cost mismatch", estimatedLoss: 210, category: "Dairy" },
      { product: "Butter 250g", issue: "Margin too low", estimatedLoss: 90, category: "Dairy" },
      { product: "Sparkling Water", issue: "Pricing inconsistency", estimatedLoss: 75, category: "Drinks" },
      { product: "Croissant", issue: "Suspicious entry", estimatedLoss: 55, category: "Bakery" },
      { product: "Granola Bar", issue: "Margin too low", estimatedLoss: 40, category: "Snacks" },
    ],
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    fileName: "pricing_feb.csv",
  },
  {
    id: "seed-3",
    totalLoss: 560,
    pricingIssues: 3,
    inconsistencies: 1,
    suspiciousEntries: 2,
    worstProduct: { name: "Red Wine", loss: 180 },
    biggestIssue: "Suspicious entry",
    mostAffectedCategory: "Alcohol",
    rows: [
      { product: "Red Wine", issue: "Suspicious entry", estimatedLoss: 180, category: "Alcohol" },
      { product: "Beer 6-Pack", issue: "Margin too low", estimatedLoss: 95, category: "Alcohol" },
      { product: "Sourdough", issue: "Cost mismatch", estimatedLoss: 65, category: "Bakery" },
      { product: "Cheddar 200g", issue: "Pricing inconsistency", estimatedLoss: 50, category: "Dairy" },
    ],
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
    fileName: "inventory_jan.xlsx",
  },
];

const NEW_RESULT_TEMPLATE: Omit<AnalysisResult, "id" | "uploadedAt" | "fileName"> = {
  totalLoss: 1240,
  pricingIssues: 6,
  inconsistencies: 3,
  suspiciousEntries: 2,
  worstProduct: { name: "Coke 500ml", loss: 320 },
  biggestIssue: "Low margins",
  mostAffectedCategory: "Drinks",
  rows: [
    { product: "Coke 500ml", issue: "Margin too low", estimatedLoss: 120, category: "Drinks" },
    { product: "Orange Juice", issue: "Pricing inconsistency", estimatedLoss: 95, category: "Drinks" },
    { product: "Water 1L", issue: "Margin too low", estimatedLoss: 60, category: "Drinks" },
    { product: "Bread", issue: "Cost mismatch", estimatedLoss: 80, category: "Bakery" },
    { product: "Chips 200g", issue: "Suspicious entry", estimatedLoss: 45, category: "Snacks" },
    { product: "Milk 1L", issue: "Cost mismatch", estimatedLoss: 70, category: "Dairy" },
  ],
};

function App() {
  const [tab, setTab] = useState<NavTab>("dashboard");
  const [results, setResults] = useState<AnalysisResult[]>(SEED_RESULTS);
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingFile, setPendingFile] = useState("");
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);

  const handleUpload = (fileName: string) => {
    setPendingFile(fileName);
    setAnalyzing(true);
    setTab("analyse");
    setTimeout(() => {
      const newResult: AnalysisResult = {
        ...NEW_RESULT_TEMPLATE,
        id: `result-${Date.now()}`,
        uploadedAt: new Date(),
        fileName,
      };
      setResults((prev) => [newResult, ...prev]);
      setLastResult(newResult);
      setAnalyzing(false);
    }, 4000);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-[#f4faf6] overflow-hidden">
        <Sidebar activeTab={tab} onTabChange={setTab} />
        <main className="flex-1 overflow-y-auto">
          {tab === "upload" && (
            <UploadPage onUpload={handleUpload} />
          )}
          {tab === "analyse" && (
            <AnalysePage
              analyzing={analyzing}
              fileName={pendingFile}
              result={lastResult}
              onNavigateDashboard={() => setTab("dashboard")}
              onNewUpload={() => setTab("upload")}
            />
          )}
          {tab === "dashboard" && (
            <DashboardPage
              results={results}
              onNewUpload={() => setTab("upload")}
            />
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
