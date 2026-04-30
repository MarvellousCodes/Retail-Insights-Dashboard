import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface RawInvoiceItem {
  product_name: string;
  barcode: string;
  qty: string;
  unit_cost: string;
  total_cost: string;
  vat_rate: string;
}

export async function extractFromImage(
  file: File,
  onProgress?: (p: number) => void
): Promise<RawInvoiceItem[]> {
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  return parseInvoiceLines(data.text);
}

export async function extractFromPdf(file: File): Promise<RawInvoiceItem[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Group text items by Y position to reconstruct rows
    const rows: Record<number, { x: number; str: string }[]> = {};
    for (const item of content.items as any[]) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!rows[y]) rows[y] = [];
      rows[y].push({ x: Math.round(item.transform[4]), str: item.str });
    }
    // Sort rows top-to-bottom (descending Y), cells left-to-right
    const sortedYs = Object.keys(rows).map(Number).sort((a, b) => b - a);
    for (const y of sortedYs) {
      text += rows[y].sort((a, b) => a.x - b.x).map((c) => c.str).join("  ") + "\n";
    }
  }
  return parseInvoiceLines(text);
}

function parseInvoiceLines(text: string): RawInvoiceItem[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: RawInvoiceItem[] = [];
  const skip = /^(qty|product|unit|total|subtotal|vat reg|iban|payment|date:|to:|tel:|invoice:|customer:|bank:|murphy|fitzgerald|o'connell|knockraha|church road|ballincollig|cork|midleton|centra)/i;
  const totalLine = /(^subtotal|^total[^a-z]|^vat\s*[\d%(]|^vat:|^payment|^IBAN)/i;

  for (const line of lines) {
    if (skip.test(line) || totalLine.test(line)) continue;

    // Strategy 1: Structured columns (2+ spaces between fields) — for clean PDF text
    const cols = line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 3) {
      const nums = cols.filter((c) => /^\d+\.?\d*$/.test(c));
      if (nums.length >= 2) {
        const qtyMatch = cols[0].match(/^(\d{1,3})$/);
        const qty = qtyMatch ? qtyMatch[1] : "1";
        const nameCol = cols.filter((c) => !/^\d+\.?\d*%?$/.test(c)).sort((a, b) => b.length - a.length)[0];
        if (nameCol && nameCol.length >= 2) {
          const prices = nums.filter((n) => n.includes("."));
          const unitCost = prices[0] || nums[0] || "0";
          const totalCost = prices.length >= 2 ? prices[prices.length - 1]! : String(+(+unitCost * +qty).toFixed(2));
          let vat = "0";
          const vatCol = cols.find((c) => /^\d+\.?\d*%$/.test(c));
          if (vatCol) vat = vatCol.replace("%", "");
          else {
            const usedNums = new Set([qty, unitCost, totalCost]);
            const smallNums = nums.filter((n) => +n <= 25 && !usedNums.has(n));
            if (smallNums.length) vat = smallNums[0];
          }
          let barcode = "";
          const bcMatch = line.match(/\b(\d{8,13})\b/);
          if (bcMatch) barcode = bcMatch[1];
          items.push({ product_name: nameCol, barcode, qty, unit_cost: unitCost, total_cost: totalCost, vat_rate: vat });
          continue;
        }
      }
    }

    // Strategy 2: Regex-based parsing for OCR text (single spaces, messy formatting)
    // Match any number that looks like a price: 1.40, 28.00, or even just digits
    const allNums = line.match(/\d+\.?\d*/g);
    if (!allNums || allNums.length < 2) continue;

    // Leading qty: 1-3 digit integer at start of line
    const qtyMatch = line.match(/^\s*(\d{1,3})\s+/);
    const qty = qtyMatch?.[1] ?? "1";

    // Extract product name: text between qty and first price-like number
    const after = qtyMatch ? line.slice(qtyMatch[0].length) : line;
    // Split on price patterns: number with decimal, or standalone number preceded by space
    const nameParts = after.split(/\s+\d+\.\d{1,2}\b/);
    let name = (nameParts[0] ?? after).trim()
      .replace(/[€£$]/g, "")
      .replace(/[«»'"~]+\d*\.?\d*/g, "")
      .replace(/\s+/g, " ")
      .replace(/^[-x@X*%\s]+|[-x@X*%\s]+$/g, "");
    if (name.length < 2) continue;

    // Find prices (numbers with decimals)
    const prices = line.match(/\d+\.\d{1,2}/g) || [];
    if (!prices.length) continue;

    let barcode = "";
    const bcMatch = line.match(/\b(\d{8,13})\b/);
    if (bcMatch) barcode = bcMatch[1];

    // VAT: look for N% pattern
    let vat = "0";
    const vatMatch = line.match(/(\d+\.?\d*)%/);
    if (vatMatch) vat = vatMatch[1];

    // Unit cost = first price, total = last price (if different from first)
    const unitCost = prices[0]!;
    const totalCost = prices.length >= 2 ? prices[prices.length - 1]! : String(+(+unitCost * +qty).toFixed(2));
    // If VAT was captured as a price (e.g. "13.5%" matched as "13.5"), and it equals totalCost, fix it
    if (vat !== "0" && totalCost === vat) {
      const tc = prices.length >= 3 ? prices[prices.length - 1]! : String(+(+unitCost * +qty).toFixed(2));
      items.push({ product_name: name, barcode, qty, unit_cost: unitCost, total_cost: tc, vat_rate: vat });
    } else {
      items.push({ product_name: name, barcode, qty, unit_cost: unitCost, total_cost: totalCost, vat_rate: vat });
    }
  }
  return items;
}
