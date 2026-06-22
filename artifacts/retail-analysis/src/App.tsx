import { useState, useMemo, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { UploadPage } from "@/pages/UploadPage";
import { AnalysePage } from "@/pages/AnalysePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { IssuesPage } from "@/pages/IssuesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { InvoiceScannerPage } from "@/pages/InvoiceScannerPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { DepartmentsPage } from "@/pages/DepartmentsPage";
import { LoginPage } from "@/pages/LoginPage";
import { LiveDataPage } from "@/pages/LiveDataPage";
import { SuppliersPage } from "@/pages/SuppliersPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { TurnoverPage } from "@/pages/TurnoverPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { DashboardInsights } from "@/pages/DashboardInsights";
import { DeptPage } from "@/pages/DeptPage";
import { MarginsPage } from "@/pages/MarginsPage";
import { InsightsLivePage } from "@/pages/InsightsLivePage";
import { IssuesLivePage } from "@/pages/IssuesLivePage";
import { BarcodeScannerPage } from "@/pages/BarcodeScannerPage";
import { AskPage } from "@/pages/AskPage";
import { isLoggedIn } from "@/lib/api";

const queryClient = new QueryClient();

export type NavTab = "dashboard" | "upload" | "issues" | "reports" | "insights" | "departments" | "invoices" | "scanner" | "askshop" | "livedata" | "turnover" | "transactions" | "suppliers" | "customers" | "depts" | "margins" | "settings";
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
  sourceId?: string;
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

export interface Source {
  id: string;
  name: string;
  uploadedAt: number;
  products: Product[];
  isManual?: boolean;
}

export const MANUAL_SOURCE_ID = "manual-entries";

// ─── Default Thresholds ──────────────────────────────────────────────────────

export const DEFAULT_THRESHOLDS: DeptThreshold[] = [
  { department: "Off Licence", minMargin: 18 },
  { department: "Bread and Cakes", minMargin: 28 },
  { department: "Biscuits", minMargin: 25 },
  { department: "Confectionery", minMargin: 25 },
  { department: "Dairy Wall", minMargin: 22 },
  { department: "Soft Drinks", minMargin: 20 },
  { department: "Frozen Food", minMargin: 22 },
  { department: "Ice Cream N Cones", minMargin: 30 },
  { department: "Grocery", minMargin: 22 },
  { department: "Health and Beauty", minMargin: 35 },
  { department: "Newspapers", minMargin: 10 },
  { department: "Deli Cold", minMargin: 40 },
  { department: "Deli Hot", minMargin: 45 },
  { department: "Instore Bakery", minMargin: 35 },
  { department: "Tea/Coffee Machine", minMargin: 60 },
  { department: "Non Food", minMargin: 30 },
  { department: "Fresh Produce", minMargin: 35 },
  { department: "Tobacco", minMargin: 8 },
  { department: "Newsagents", minMargin: 15 },
  { department: "Prepared Meals", minMargin: 40 },
  { department: "Breakfast Meats", minMargin: 25 },
  { department: "Cooked Meats", minMargin: 30 },
  { department: "Crisps and Snacks", minMargin: 28 },
  { department: "Sports and Nutrition", minMargin: 30 },
  { department: "Fresh Meat", minMargin: 25 },
  { department: "Forecourt Services", minMargin: 15 },
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
  thresholds: DeptThreshold[],
  productOverrides: Record<string, number> = {}
): { marginAlerts: MarginAlert[]; priceAnomalies: PriceAnomaly[] } {
  const defaultMin = 20;
  const marginAlerts: MarginAlert[] = [];
  const priceAnomalies: PriceAnomaly[] = [];
  const anomalyIds = new Set<string>();

  products.forEach((product) => {
    const key = (product.department || product.category || "").toLowerCase();
    const deptThreshold =
      thresholds.find(
        (t) =>
          t.department.toLowerCase() === key ||
          t.department.toLowerCase() === product.category.toLowerCase()
      )?.minMargin ?? defaultMin;
    const threshold = productOverrides[product.id] ?? deptThreshold;

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
        product, threshold, gap, severity,
        recommendedPrice, roundedPrice, profitImpact,
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
  const [tab, setTab] = useState<InternalTab>("livedata");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("rg-theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("rg-theme", theme);
  }, [theme]);

  // Auth gate: no token means not signed in, go to the sign-in page.
  useEffect(() => {
    if (!isLoggedIn()) window.location.href = "/signin.html";
  }, []);
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
  const [marginAlerts, setMarginAlerts] = useState<MarginAlert[]>([]);
  const [priceAnomalies, setPriceAnomalies] = useState<PriceAnomaly[]>([]);
  const [thresholds, setThresholds] = useState<DeptThreshold[]>(DEFAULT_THRESHOLDS);
  const [productOverrides, setProductOverrides] = useState<Record<string, number>>({});
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [lastFileNames, setLastFileNames] = useState("");

  // Active products = union of all products from currently-selected sources
  const activeProducts = useMemo(
    () => sources.filter((s) => activeSourceIds.has(s.id)).flatMap((s) => s.products),
    [sources, activeSourceIds]
  );

  // Re-run analysis whenever active products / thresholds / overrides change
  useEffect(() => {
    if (activeProducts.length === 0) {
      setMarginAlerts([]);
      setPriceAnomalies([]);
      return;
    }
    const { marginAlerts: ma, priceAnomalies: pa } = runAnalysis(activeProducts, thresholds, productOverrides);
    setMarginAlerts(ma);
    setPriceAnomalies(pa);
  }, [activeProducts, thresholds, productOverrides]);

  const handleAnalyseMultiple = (files: { fileName: string; products: Product[] }[]) => {
    if (files.length === 0) return;
    setLastFileNames(files.map((f) => f.fileName).join(", "));
    setAnalyzing(true);
    setTab("analyse");
    setFixedIds(new Set());

    // Create a new source per file. Tag products with their source id.
    const newSources: Source[] = files.map(({ fileName, products }) => {
      const sourceId = `csv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id: sourceId,
        name: fileName,
        uploadedAt: Date.now(),
        products: products.map((p) => ({ ...p, sourceId })),
      };
    });

    // MERGE with existing sources — do not remove previously uploaded files.
    // Keep existing CSV sources, append the new ones, then put manual last.
    const existingCsvSources = sources.filter((s) => !s.isManual);
    const manualSource = sources.find((s) => s.isManual);
    const allSources = [
      ...existingCsvSources,
      ...newSources,
      ...(manualSource ? [manualSource] : []),
    ];
    setSources(allSources);
    // Preserve previous active selection and activate the newly uploaded sources.
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      newSources.forEach((s) => next.add(s.id));
      existingCsvSources.forEach((s) => { if (prev.size === 0) next.add(s.id); });
      if (manualSource) next.add(manualSource.id);
      return next;
    });

    setTimeout(() => { setAnalyzing(false); setTab("issues"); }, 2800);
  };

  const handleManualAdd = (product: Product) => {
    const tagged = { ...product, sourceId: MANUAL_SOURCE_ID };
    setSources((prev) => {
      const existing = prev.find((s) => s.id === MANUAL_SOURCE_ID);
      if (existing) {
        return prev.map((s) => s.id === MANUAL_SOURCE_ID
          ? { ...s, products: [...s.products, tagged] }
          : s);
      }
      return [...prev, {
        id: MANUAL_SOURCE_ID,
        name: "Manual Entries",
        uploadedAt: Date.now(),
        products: [tagged],
        isManual: true,
      }];
    });
    setActiveSourceIds((prev) => new Set([...prev, MANUAL_SOURCE_ID]));
  };

  const handleThresholdUpdate = (newT: DeptThreshold[]) => setThresholds(newT);

  const handleMarkFixed = (id: string) => {
    setFixedIds((prev) => new Set([...prev, id]));
  };

  const handleSetProductOverride = (productId: string, margin: number | null) => {
    setProductOverrides((prev) => {
      const next = { ...prev };
      if (margin === null) delete next[productId];
      else next[productId] = margin;
      return next;
    });
  };

  const handleToggleSource = (id: string) => {
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllSources = () => setActiveSourceIds(new Set(sources.map((s) => s.id)));
  const handleSelectNoSources = () => setActiveSourceIds(new Set());

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const sourceControls = {
    sources,
    activeIds: activeSourceIds,
    onToggle: handleToggleSource,
    onSelectAll: handleSelectAllSources,
    onSelectNone: handleSelectNoSources,
    onRemove: handleRemoveSource,
  };

  const manualProducts = sources.find((s) => s.isManual)?.products ?? [];
  const activeNav: NavTab = tab === "analyse" ? "upload" : (tab as NavTab);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          activeTab={activeNav}
          onTabChange={(t) => setTab(t)}
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((e) => !e)}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />
        <main className="flex-1 overflow-y-auto">
          {tab === "livedata" && <LiveDataPage />}
          {tab === "turnover" && <TurnoverPage />}
          {tab === "transactions" && <TransactionsPage />}
          {tab === "suppliers" && <SuppliersPage />}
          {tab === "customers" && <CustomersPage />}
          {tab === "depts" && <DeptPage />}
          {tab === "margins" && <MarginsPage />}
          {tab === "reports" && <IssuesLivePage />}
          {tab === "upload" && (
            <UploadPage
              onAnalyse={handleAnalyseMultiple}
              onManualAdd={handleManualAdd}
              manualProducts={manualProducts}
              existingSources={sources.filter((s) => !s.isManual)}
              onRemoveSource={handleRemoveSource}
            />
          )}
          {tab === "analyse" && <AnalysePage analyzing={analyzing} fileName={lastFileNames} />}
          {tab === "dashboard" && <DashboardInsights />}
          {tab === "issues" && <InsightsLivePage />}
          {tab === "invoices" && <InvoiceScannerPage existingProducts={activeProducts} onAddToSystem={handleAnalyseMultiple} />}
          {tab === "scanner" && <BarcodeScannerPage />}
          {tab === "askshop" && <AskPage />}
          {tab === "settings" && (
            <SettingsPage thresholds={thresholds} onUpdate={handleThresholdUpdate} />
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
