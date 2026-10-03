import { forwardRef, TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  // Small helper text shown under the field
  helper?: string;
  locked?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, helper, locked = false, id, className = "", ...rest },
  ref
) {
  const fieldId = id ?? rest.name;

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        readOnly={locked}
        tabIndex={locked ? -1 : undefined}
        className={`w-full resize-none rounded-md border px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15 ${
          locked ? "pointer-events-none bg-canvas text-muted" : "bg-surface"
        } ${error ? "border-danger" : "border-line"} ${className}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        helper && <p className="mt-1 text-xs text-muted">{helper}</p>
      )}
    </div>
  );
});