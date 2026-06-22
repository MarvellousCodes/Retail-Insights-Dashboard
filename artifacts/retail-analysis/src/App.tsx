import { useState, useMemo, useEffect } from "react";
import { Menu } from "lucide-react";
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

// Default minimum margin targets, keyed by the CANONICAL department names from
// the dept_names table (the single naming scheme used everywhere else in the app).
// Non-repriceable categories (fuel, lottery, vouchers, levies) are intentionally
// omitted: their margin is commission/duty-set, not a target you can hit.
// Any department not listed defaults to 20%.
export const DEFAULT_THRESHOLDS: DeptThreshold[] = [
  { department: "Wines & Spirits", minMargin: 18 },
  { department: "Bread & Bakery", minMargin: 28 },
  { department: "Biscuits & Cookies", minMargin: 25 },
  { department: "Confectionery / Sweets", minMargin: 25 },
  { department: "Dairy & Chilled", minMargin: 22 },
  { department: "Soft Drinks & Beverages", minMargin: 20 },
  { department: "Frozen / Ready Meals", minMargin: 22 },
  { department: "Ice Cream & Frozen Treats", minMargin: 30 },
  { department: "Grocery / Tinned & Dry Goods", minMargin: 22 },
  { department: "General Grocery", minMargin: 22 },
  { department: "Health & Beauty / Pharmacy", minMargin: 35 },
  { department: "Deli / Fresh Meat", minMargin: 40 },
  { department: "Bakery / Pastry", minMargin: 35 },
  { department: "Café & Catering Equipment", minMargin: 60 },
  { department: "General Merchandise & Equipment", minMargin: 30 },
  { department: "Fresh Produce / Vegetables", minMargin: 35 },
  { department: "Tobacco & Lighters", minMargin: 8 },
  { department: "Magazines & Publications", minMargin: 12 },
  { department: "Balloons, Cards & Stationery", minMargin: 45 },
  { department: "Toys", minMargin: 35 },
  { department: "Chilled Ready Meals", minMargin: 40 },
  { department: "Sausages & Fresh Meat", minMargin: 25 },
  { department: "Deli Meats / Charcuterie", minMargin: 35 },
  { department: "Crisps & Snacks", minMargin: 28 },
  { department: "BBQ & Firelighters", minMargin: 30 },
  { department: "Sports & Health Bars", minMargin: 30 },
  { department: "Fresh Meat / Butchery", minMargin: 25 },
  { department: "Motoring & Fuel", minMargin: 15 },
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
  const [mobileNav, setMobileNav] = useState(false);
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
          onTabChange={(t) => { setTab(t); setMobileNav(false); }}
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((e) => !e)}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          mobileOpen={mobileNav}
          onClose={() => setMobileNav(false)}
        />
        {mobileNav && (
          <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setMobileNav(false)} aria-hidden="true" />
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden sticky top-0 z-10 flex items-center gap-3 h-14 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setMobileNav(true)} aria-label="Open menu" className="w-9 h-9 -ml-1 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-black text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">RetailGuard</span>
          </div>
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
          {tab === "dashboard" && <DashboardInsights onNavigate={(t) => { setTab(t); setMobileNav(false); }} />}
          {tab === "issues" && <InsightsLivePage />}
          {tab === "invoices" && <InvoiceScannerPage existingProducts={activeProducts} onAddToSystem={handleAnalyseMultiple} />}
          {tab === "scanner" && <BarcodeScannerPage />}
          {tab === "askshop" && <AskPage />}
          {tab === "settings" && (
            <SettingsPage theme={theme} onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
