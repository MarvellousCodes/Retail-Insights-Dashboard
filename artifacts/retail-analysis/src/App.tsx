import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { UploadPage } from "@/pages/UploadPage";
import { AnalysePage } from "@/pages/AnalysePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { IssuesPage } from "@/pages/IssuesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";

const queryClient = new QueryClient();

export type NavTab = "dashboard" | "upload" | "issues" | "reports" | "settings";
type InternalTab = NavTab | "analyse";

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  department: string;
  costPrice: number;
  sellingPrice: number;
  margin: number;
  supplier: string;
  isManualEntry: boolean;
}

export interface MarginAlert {
  product: Product;
  threshold: number;
  gap: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  recommendedPrice: number;
  roundedPrice: number;
  profitImpact: number;
}

export interface PriceAnomaly {
  product: Product;
  reason: string;
  severity: "Critical" | "High" | "Medium" | "Low";
}

export interface DeptThreshold {
  department: string;
  minMargin: number;
}

// ─── Default Thresholds ──────────────────────────────────────────────────────

export const DEFAULT_THRESHOLDS: DeptThreshold[] = [
  { department: "Off Licence", minMargin: 18 },
  { department: "Alcohol", minMargin: 18 },
  { department: "Dairy", minMargin: 25 },
  { department: "Bakery", minMargin: 30 },
  { department: "Produce", minMargin: 35 },
  { department: "Grocery", minMargin: 22 },
  { department: "Deli", minMargin: 45 },
  { department: "Non-Food", minMargin: 30 },
  { department: "Drinks", minMargin: 20 },
  { department: "Beverages", minMargin: 20 },
  { department: "Snacks", minMargin: 28 },
  { department: "Frozen", minMargin: 22 },
  { department: "Chilled", minMargin: 24 },
  { department: "General", minMargin: 20 },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

export function roundRetailPrice(price: number): number {
  if (price <= 0) return 0;
  const whole = Math.floor(price);
  const frac = price - whole;
  if (frac <= 0.49) return +(whole + 0.49).toFixed(2);
  if (frac <= 0.99) return +(whole + 0.99).toFixed(2);
  return +(whole + 1.49).toFixed(2);
}

// ─── Analysis Engine ─────────────────────────────────────────────────────────

export function runAnalysis(
  products: Product[],
  thresholds: DeptThreshold[]
): { marginAlerts: MarginAlert[]; priceAnomalies: PriceAnomaly[] } {
  const defaultMin = 20;
  const marginAlerts: MarginAlert[] = [];
  const priceAnomalies: PriceAnomaly[] = [];
  const anomalyIds = new Set<string>();

  products.forEach((product) => {
    const key = (product.department || product.category || "").toLowerCase();
    const threshold =
      thresholds.find(
        (t) =>
          t.department.toLowerCase() === key ||
          t.department.toLowerCase() === product.category.toLowerCase()
      )?.minMargin ?? defaultMin;

    if (product.margin < threshold) {
      const gap = threshold - product.margin;
      let severity: MarginAlert["severity"];
      if (product.margin < 0) severity = "Critical";
      else if (gap >= 10) severity = "High";
      else if (gap >= 5) severity = "Medium";
      else severity = "Low";

      const recommendedPrice =
        threshold > 0 && threshold < 100
          ? +(product.costPrice / (1 - threshold / 100)).toFixed(2)
          : product.sellingPrice;
      const roundedPrice = roundRetailPrice(recommendedPrice);
      const profitImpact = +(roundedPrice - product.sellingPrice).toFixed(2);

      marginAlerts.push({
        product,
        threshold,
        gap,
        severity,
        recommendedPrice,
        roundedPrice,
        profitImpact,
      });
    }

    if (!anomalyIds.has(product.id)) {
      if (product.sellingPrice > 0 && product.costPrice > product.sellingPrice) {
        priceAnomalies.push({ product, reason: "Selling price is below cost — losing money on every sale.", severity: "Critical" });
        anomalyIds.add(product.id);
      } else if (product.costPrice === 0 || product.sellingPrice === 0) {
        priceAnomalies.push({ product, reason: "Zero cost or selling price — likely a data entry error.", severity: "High" });
        anomalyIds.add(product.id);
      } else if (product.margin > 75) {
        priceAnomalies.push({ product, reason: `Unusually high margin (${product.margin}%) — check cost price is correct.`, severity: "Medium" });
        anomalyIds.add(product.id);
      } else if (product.margin < 0) {
        priceAnomalies.push({ product, reason: `Negative margin (${product.margin}%) — product is priced below cost.`, severity: "Critical" });
        anomalyIds.add(product.id);
      }
    }
  });

  const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  marginAlerts.sort((a, b) => order[a.severity] - order[b.severity] || b.gap - a.gap);
  priceAnomalies.sort((a, b) => order[a.severity] - order[b.severity]);

  return { marginAlerts, priceAnomalies };
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [tab, setTab] = useState<InternalTab>("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [marginAlerts, setMarginAlerts] = useState<MarginAlert[]>([]);
  const [priceAnomalies, setPriceAnomalies] = useState<PriceAnomaly[]>([]);
  const [thresholds, setThresholds] = useState<DeptThreshold[]>(DEFAULT_THRESHOLDS);
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [lastFileName, setLastFileName] = useState("");

  const applyAnalysis = (allProducts: Product[], t: DeptThreshold[]) => {
    const { marginAlerts: ma, priceAnomalies: pa } = runAnalysis(allProducts, t);
    setMarginAlerts(ma);
    setPriceAnomalies(pa);
  };

  const handleAnalyse = (csvProducts: Product[], fileName: string) => {
    setLastFileName(fileName);
    setAnalyzing(true);
    setTab("analyse");
    setFixedIds(new Set());
    const manual = products.filter((p) => p.isManualEntry);
    const all = [...csvProducts, ...manual];
    setProducts(all);
    applyAnalysis(all, thresholds);
    setTimeout(() => { setAnalyzing(false); setTab("issues"); }, 2800);
  };

  const handleManualAdd = (product: Product) => {
    const all = [...products, product];
    setProducts(all);
    applyAnalysis(all, thresholds);
  };

  const handleThresholdUpdate = (newT: DeptThreshold[]) => {
    setThresholds(newT);
    if (products.length > 0) applyAnalysis(products, newT);
  };

  const handleMarkFixed = (id: string) => {
    setFixedIds((prev) => new Set([...prev, id]));
  };

  const activeNav: NavTab = tab === "analyse" ? "upload" : (tab as NavTab);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          activeTab={activeNav}
          onTabChange={(t) => setTab(t)}
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((e) => !e)}
        />
        <main className="flex-1 overflow-y-auto">
          {tab === "upload" && (
            <UploadPage
              onAnalyse={handleAnalyse}
              onManualAdd={handleManualAdd}
              manualProducts={products.filter((p) => p.isManualEntry)}
            />
          )}
          {tab === "analyse" && <AnalysePage analyzing={analyzing} fileName={lastFileName} />}
          {tab === "dashboard" && (
            <DashboardPage
              products={products}
              marginAlerts={marginAlerts}
              priceAnomalies={priceAnomalies}
              thresholds={thresholds}
              fixedIds={fixedIds}
              onNewUpload={() => setTab("upload")}
            />
          )}
          {tab === "issues" && (
            <IssuesPage
              products={products}
              marginAlerts={marginAlerts}
              priceAnomalies={priceAnomalies}
              fixedIds={fixedIds}
              onMarkFixed={handleMarkFixed}
              onNewUpload={() => setTab("upload")}
            />
          )}
          {tab === "reports" && (
            <ReportsPage
              products={products}
              marginAlerts={marginAlerts}
              priceAnomalies={priceAnomalies}
              fixedIds={fixedIds}
              onNewUpload={() => setTab("upload")}
            />
          )}
          {tab === "settings" && (
            <SettingsPage thresholds={thresholds} onUpdate={handleThresholdUpdate} />
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
