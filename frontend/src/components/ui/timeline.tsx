export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  note?: string | null;
}

// Items should be ordered newest first: the first dot is highlighted
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {items.map((item, i) => (
        <li key={item.id} className="relative">
          <span
            className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ${
              i === 0 ? "bg-accent" : "bg-steel/50"
            }`}
          />
          <p className="font-mono text-[11px] text-muted">{item.date}</p>
          <p className="mt-0.5 text-sm text-ink">{item.title}</p>
          {item.note && <p className="mt-0.5 text-xs italic text-muted">&ldquo;{item.note}&rdquo;</p>}
        </li>
      ))}
    </ol>
  );
}