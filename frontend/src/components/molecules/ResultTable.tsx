import { useState, useCallback } from "react";
import { Download, ChevronDown, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PREVIEW_SIZE = 50;
const LOAD_MORE_SIZE = 50;
const BACKEND_SAFETY_LIMIT = 100_000;

interface ResultTableProps {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ResultTable({ columns, rows, rowCount }: ResultTableProps) {
  const [visibleCount, setVisibleCount] = useState(PREVIEW_SIZE);

  const exportCSV = useCallback(() => {
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const header = columns.map(escape).join(",");
    const body = rows.map((row) => row.map(escape).join(",")).join("\n");
    const csv = `${header}\n${body}`;
    downloadBlob(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
      "export.csv",
    );
  }, [columns, rows]);

  const exportExcel = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ergebnis");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    downloadBlob(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "export.xlsx",
    );
  }, [columns, rows]);

  if (columns.length === 0) return null;

  const totalRows = rows.length;
  const displayRows = rows.slice(0, visibleCount);
  const hasMore = totalRows > visibleCount;
  const remaining = totalRows - visibleCount;
  const maybeTruncated = rowCount >= BACKEND_SAFETY_LIMIT;

  return (
    <div className="space-y-2">
      {maybeTruncated && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Ergebnis wurde auf {BACKEND_SAFETY_LIMIT.toLocaleString("de-DE")} Zeilen
          begrenzt. Die tatsächliche Datenmenge kann größer sein.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead
                  key={col}
                  className="whitespace-nowrap text-xs font-semibold"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className="whitespace-nowrap text-xs">
                    {cell == null ? (
                      <span className="italic text-muted-foreground">null</span>
                    ) : (
                      String(cell)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + LOAD_MORE_SIZE)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {remaining > LOAD_MORE_SIZE
            ? `${LOAD_MORE_SIZE} weitere anzeigen (${remaining.toLocaleString("de-DE")} verbleibend)`
            : `Alle ${remaining} verbleibenden anzeigen`}
        </button>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasMore
            ? `Vorschau: ${visibleCount} von ${rowCount.toLocaleString("de-DE")} Zeilen`
            : `${rowCount.toLocaleString("de-DE")} ${rowCount === 1 ? "Zeile" : "Zeilen"}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            CSV
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            Excel
          </button>
        </div>
      </div>
    </div>
  );
}
