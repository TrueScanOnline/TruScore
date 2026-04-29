export type CsvRecord = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values.map((v) => v.trim());
}

export function parseCsv(content: string): CsvRecord[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const parts = parseCsvLine(line);
    const row: CsvRecord = {};
    for (let idx = 0; idx < headers.length; idx += 1) {
      row[headers[idx]] = parts[idx] ?? '';
    }
    return row;
  });
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: readonly string[], rows: readonly CsvRecord[]): string {
  const headerLine = headers.join(',');
  const body = rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? '')).join(','));
  return `${[headerLine, ...body].join('\n')}\n`;
}
