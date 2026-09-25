import Link from "next/link";
import { GrassBlockIcon } from "./icons";

export default function Header() {
  return (
    <header className="sticky top-0 z-10">
      <div className="bg-[#373737] border-b-4 border-black">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <GrassBlockIcon className="h-6 w-6" />
            <span className="mc-heading text-white text-xs sm:text-sm">
              Quest Planner
            </span>
          </Link>
        </div>
      </div>
      <div className="mc-groundline" />
    </header>
  );
}
