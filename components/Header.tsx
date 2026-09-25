import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-[#f5f5f2]">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg text-neutral-900 hover:opacity-70 transition-opacity"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 text-[#f5f5f2] text-xs">
            ✈
          </span>
          Trip Planner
        </Link>
      </div>
    </header>
  );
}
