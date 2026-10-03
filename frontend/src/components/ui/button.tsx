import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "accent" | "primary" | "ghost" | "outline" | "danger" | "dangerOutline";

const variants: Record<Variant, string> = {
  accent: "bg-accent text-ink hover:brightness-95",
  primary: "bg-primary text-white hover:bg-primary-hover",
  ghost: "bg-transparent text-ink hover:bg-primary-soft",
  outline: "border border-line bg-surface text-ink hover:bg-canvas",
  danger: "bg-danger text-white hover:brightness-95",
  dangerOutline: "border border-danger/40 bg-surface text-danger hover:bg-danger/5",
};

// Exported so links can look like buttons: <Link className={buttonStyles("accent", true)} />
export function buttonStyles(variant: Variant = "primary", compact = false) {
  const layout = compact
    ? "inline-flex h-9 items-center justify-center gap-2 px-4"
    : "flex h-11 w-full items-center justify-between px-5";

  return `${layout} rounded-md text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  trailingIcon?: ReactNode;
  // Compact buttons size to their content instead of stretching to full width
  compact?: boolean;
};

export function Button({
  variant = "primary",
  loading,
  trailingIcon,
  compact = false,
  type = "button",
  children,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${buttonStyles(variant, compact)} ${className}`}
      {...rest}
    >
      <span>{children}</span>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : trailingIcon}
    </button>
  );
}