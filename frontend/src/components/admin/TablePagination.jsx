import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TablePagination({
  page,
  limit,
  totalItems,
  currentCount,
  totalPages,
  onPageChange,
  label = "results",
  className = "",
}) {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.max(1, limit || 1);
  const safeTotalPages = Math.max(1, totalPages || 1);
  const start = totalItems === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const end = totalItems === 0 ? 0 : start + Math.max(0, currentCount - 1);

  return (
    <div className={`mt-6 flex flex-col gap-4 border-t border-gray-800 pt-6 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-white">{start}-{end}</span> of{" "}
        <span className="font-medium text-white">{totalItems}</span> {label}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="rounded-lg border border-gray-700 p-2 text-gray-400 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300">
          Page <span className="font-medium text-white">{safePage}</span> of{" "}
          <span className="font-medium text-white">{safeTotalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages}
          className="rounded-lg border border-gray-700 p-2 text-gray-400 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
