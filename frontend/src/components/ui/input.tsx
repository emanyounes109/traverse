import { forwardRef, InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md";
  // Read-only look for fields that cannot be edited
  locked?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, size = "md", locked = false, id, className = "", ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  const height = size === "sm" ? "h-9 px-3" : "h-11 px-3.5";

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        readOnly={locked}
        tabIndex={locked ? -1 : undefined}
        className={`${height} w-full rounded-md border text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15 ${
          locked ? "pointer-events-none bg-canvas text-muted" : "bg-surface"
        } ${error ? "border-danger" : "border-line"} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});