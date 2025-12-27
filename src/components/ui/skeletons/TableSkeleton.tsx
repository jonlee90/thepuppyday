/**
 * Table Skeleton Component
 * Displays loading skeleton for table layouts
 */

import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showHeader?: boolean;
  columnWidths?: string[];
}

export function TableSkeleton({
  columns,
  rows = 5,
  showHeader = true,
  columnWidths = [],
}: TableSkeletonProps) {
  // Default column widths if not provided
  const widths = columnWidths.length === columns
    ? columnWidths
    : Array.from({ length: columns }).map((_, i) => i === 0 ? '200px' : '150px');

  return (
    <div className="w-full">
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 pb-3 border-b border-gray-200 mb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className="h-4 flex-1"
              style={{ maxWidth: widths[i] }}
            />
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-5 flex-1"
                style={{ maxWidth: widths[colIndex] }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
