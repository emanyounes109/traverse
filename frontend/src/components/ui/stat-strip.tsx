import { ReactNode } from "react";

type Tone = "default" | "accent" | "steel" | "danger" | "success";

export interface StatItem {
  label: string;
  value: string | number;
  // Small text under the value (or under the label when labelPosition is "top")
  caption?: ReactNode;
  tone?: Tone;
}

type Props = {
  items: StatItem[];
  // Optional first cell with custom content (title, status...)
  lead?: ReactNode;
  // Where the label sits relative to the big number
  labelPosition?: "top" | "bottom";
  // Light tinted background instead of white
  tinted?: boolean;
};

const toneClasses: Record<Tone, string> = {
  default: "text-ink",
  accent: "text-[#a8741a]",
  steel: "text-steel",
  danger: "text-danger",
  success: "text-success",
};

export function StatStrip({ items, lead, labelPosition = "top", tinted = false }: Props) {
  // Dynamic column count needs an inline style (Tailwind cannot generate it at runtime)
  const columns = lead
    ? `1.5fr repeat(${items.length}, minmax(0, 1fr))`
    : `repeat(${items.length}, minmax(0, 1fr))`;

  return (
    <div
      className={`grid overflow-hidden rounded-lg border border-line ${
        tinted ? "bg-[#f8f9f7]" : "bg-surface"
      }`}
      style={{ gridTemplateColumns: columns }}
    >
      {lead && <div className="flex flex-col justify-center px-5 py-4">{lead}</div>}

      {items.map((item) => (
        <div
          key={item.label}
          className={`px-5 py-4 ${lead || items[0] !== item ? "border-l border-line" : ""}`}
        >
          {labelPosition === "top" && <p className="mb-1 text-xs text-muted">{item.label}</p>}

          <p
            className={`font-heading text-3xl font-extrabold leading-none ${
              toneClasses[item.tone ?? "default"]
            }`}
          >
            {item.value}
          </p>

          {labelPosition === "bottom" && <p className="mt-1.5 text-xs text-muted">{item.label}</p>}

          {item.caption && <div className="mt-1.5 text-xs text-muted">{item.caption}</div>}
        </div>
      ))}
    </div>
  );
}