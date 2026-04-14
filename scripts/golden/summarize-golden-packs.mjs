#!/usr/bin/env node
/**
 * Summarizes Phase 4 golden barcode CSVs (no I/O beyond docs/).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const dir = path.join(root, "docs", "phase4");

const files = ["golden-barcode-pack-au.csv", "golden-barcode-pack-nz.csv"];

for (const f of files) {
  const p = path.join(dir, f);
  const text = fs.readFileSync(p, "utf8");
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const dataRows = Math.max(0, lines.length - 1);
  console.log(`${f}: ${dataRows} barcodes (+ header)`);
}
