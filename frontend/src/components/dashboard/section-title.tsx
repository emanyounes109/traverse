import Link from "next/link";

type Props = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionTitle({ title, href, linkLabel }: Props) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-xs font-semibold text-ink underline-offset-4 hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}