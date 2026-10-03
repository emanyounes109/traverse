export function BulletList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li
          key={`${i}-${item}`}
          className="flex items-start gap-3 border-b border-line py-2.5 text-sm text-ink first:pt-0 last:border-b-0 last:pb-0"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-steel" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}