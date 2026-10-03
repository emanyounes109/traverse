import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, total, limit, onChange }: Props) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const arrow =
    "flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-xs text-muted">
      <span>
        {from}–{to} of {total}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          className={arrow}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          aria-label="Next page"
          className={arrow}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}