const STEPS = ["Apply", "Connect", "Grow", "Reflect"];
const ACTIVE_STEP = 2; // index of the highlighted step ("Grow")

export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between bg-brand px-12 py-10 text-white lg:flex">
      {/* Top logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-accent font-heading text-lg font-bold text-accent">
          T
        </div>
        <span className="font-heading text-xl font-bold">
          Traverse<span className="text-accent">.</span>
        </span>
      </div>

      {/* Middle headline */}
      <div>
        <div className="mb-8 h-0.5 w-12 bg-accent" />
        <h2 className="font-heading text-6xl font-extrabold leading-none tracking-tight">
          Traverse<span className="text-accent">.</span>
        </h2>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75">
          A considered place to track the applications, people, and work that shape your
          internship journey.
        </p>
      </div>

      {/* Bottom stepper */}
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const done = i < ACTIVE_STEP;
          const active = i === ACTIVE_STEP;

          return (
            <li key={label} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-start gap-2.5">
                <span
                  className={`h-3 w-3 rounded-full border ${
                    active
                      ? "border-accent bg-accent ring-4 ring-accent/25"
                      : done
                        ? "border-white bg-white"
                        : "border-white/60"
                  }`}
                />
                <span className={`text-xs ${active ? "text-accent" : "text-white/70"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <span className="mx-3 mt-1.5 h-px flex-1 bg-white/30" />}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}