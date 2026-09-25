export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-black/[0.06] ${className}`}
    />
  );
}

export function SkeletonBoard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <SkeletonBlock className="h-32 w-full rounded-xl" />
      <div className="grid gap-5 sm:grid-cols-2">
        <SkeletonBlock className="h-64 w-full rounded-2xl" />
        <SkeletonBlock className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
