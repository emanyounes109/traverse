import { ReactNode } from "react";

type Tone = "steel" | "accent" | "success" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  steel: "bg-steel/10 text-steel",
  accent: "bg-accent-soft text-[#8a5a00]",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-canvas text-muted",
};

type Props = {
  children: ReactNode;
  tone?: Tone;
  // Shows a small dot before the text
  dot?: boolean;
};

export function Badge({ children, tone = "neutral", dot = false }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}