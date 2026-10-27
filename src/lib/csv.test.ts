import { describe, expect, it } from "vitest";

import { csvFilename, escapeCsvCell, toCsv } from "@/lib/csv";

describe("CSV escaping", () => {
  it("leaves plain text untouched", () => {
    expect(escapeCsvCell("Widget")).toBe("Widget");
  });

  it("quotes cells containing commas, quotes, or newlines", () => {
    expect(escapeCsvCell("Widget, large")).toBe('"Widget, large"');
    expect(escapeCsvCell('He said "hi"')).toBe('"He said ""hi"""');
    expect(escapeCsvCell("line one\nline two")).toBe('"line one\nline two"');
  });

  it("prefixes formula-like text with an apostrophe", () => {
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell("+1")).toBe("'+1");
    expect(escapeCsvCell("-1")).toBe("'-1");
    expect(escapeCsvCell("@cmd")).toBe("'@cmd");
    expect(escapeCsvCell("\tstart")).toBe("'\tstart");
    expect(escapeCsvCell("\rstart")).toBe("\"'\rstart\"");
  });

  it("quotes formula-like text that also needs escaping", () => {
    expect(escapeCsvCell("=1,2")).toBe('"\'=1,2"');
  });

  it("keeps numeric values unquoted and negative numbers numeric", () => {
    expect(escapeCsvCell(42)).toBe("42");
    expect(escapeCsvCell(-42)).toBe("-42");
    expect(escapeCsvCell(1.5)).toBe("1.5");
  });

  it("renders empty cells for null and undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });
});

describe("CSV generation", () => {
  it("joins rows with CRLF and ends with a trailing newline", () => {
    const csv = toCsv(
      ["Name", "Quantity", "Note"],
      [
        ["Widget", 4, ""],
        ["Gadget, large", 0, '=unsafe'],
      ],
    );

    expect(csv).toBe(
      'Name,Quantity,Note\r\nWidget,4,\r\n"Gadget, large",0,\'=unsafe\r\n',
    );
  });

  it("builds a dated filename", () => {
    expect(csvFilename("stockpilot-inventory", new Date("2026-02-03T12:00:00Z"))).toBe(
      "stockpilot-inventory-2026-02-03.csv",
    );
  });
});
