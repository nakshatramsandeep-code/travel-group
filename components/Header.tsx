import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-neutral-200 hover:text-white transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white text-xs">
            ✈
          </span>
          Trip Planner
        </Link>
      </div>
    </header>
  );
}
