import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function TableSkeleton({
  columns,
  rows = 6,
  className,
}: {
  columns: string[];
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card ring-1 ring-border/70",
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="h-12">
              {columns.map((column, colIndex) => (
                <TableCell key={`${rowIndex}-${column}`} className="h-12">
                  <Skeleton
                    className={cn(
                      "h-4",
                      colIndex === 0
                        ? "w-[7.5rem]"
                        : colIndex === columns.length - 1
                          ? "w-16"
                          : "w-[5.5rem]",
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
