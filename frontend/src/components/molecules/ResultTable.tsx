import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultTableProps {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
}

export function ResultTable({ columns, rows, rowCount }: ResultTableProps) {
  if (columns.length === 0) return null;

  const displayRows = rows.slice(0, 100);
  const truncated = rows.length > 100;

  return (
    <div className="space-y-1.5">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap text-xs font-semibold">
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
      <p className="text-xs text-muted-foreground">
        {rowCount} {rowCount === 1 ? "Zeile" : "Zeilen"}
        {truncated && ` (erste 100 angezeigt)`}
      </p>
    </div>
  );
}
