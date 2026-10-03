"use client";

import { ChangeEvent, ReactNode, useRef } from "react";
import { Loader2 } from "lucide-react";
import { buttonStyles } from "./button";

type Props = {
  children: ReactNode;
  accept?: string;
  maxMb?: number;
  loading?: boolean;
  // "link" looks like a text link, "button" looks like a compact button
  kind?: "link" | "button";
  onFile: (file: File) => void;
  onError?: (message: string) => void;
};

export function FileButton({
  children,
  accept = ".pdf,.doc,.docx",
  maxMb = 10,
  loading = false,
  kind = "link",
  onFile,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still triggers onChange
    e.target.value = "";
    if (!file) return;

    if (file.size > maxMb * 1024 * 1024) {
      onError?.(`The file is too large. The maximum size is ${maxMb} MB.`);
      return;
    }

    onFile(file);
  };

  const style =
    kind === "button"
      ? buttonStyles("accent", true)
      : "inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4";

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className={`${style} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    </>
  );
}