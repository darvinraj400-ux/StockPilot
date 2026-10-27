export type CsvValue = string | number | null | undefined;

/**
 * Protects spreadsheet applications from formula injection while preserving
 * numeric cells. Text cells beginning with =, +, -, @, tab, or CR are prefixed
 * with an apostrophe so they are treated as text.
 */
export function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);

  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;

  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(","),
  );
  return `${lines.join("\r\n")}\r\n`;
}

export function csvFilename(baseName: string, date = new Date()) {
  return `${baseName}-${date.toISOString().slice(0, 10)}.csv`;
}
