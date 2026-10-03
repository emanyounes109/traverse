import Link from "next/link";
import { ReactNode } from "react";
import { BrandPanel } from "./brand-panel";

type Props = {
  children: ReactNode;
  topLink: { text: string; label: string; href: string };
};

export function AuthShell({ children, topLink }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <main className="flex flex-col bg-surface">
        <div className="flex items-center justify-between px-8 py-5 text-sm sm:px-12">
          <span className="text-muted">Internship, in perspective.</span>
          <span className="text-muted">
            {topLink.text}{" "}
            <Link
              href={topLink.href}
              className="font-semibold text-ink underline underline-offset-4"
            >
              {topLink.label}
            </Link>
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-8 py-8 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}