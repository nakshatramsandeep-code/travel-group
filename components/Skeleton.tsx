export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#9a9a9a] border-2 border-black/40 ${className}`}
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
      <SkeletonBlock className="h-8 w-full" />
      <SkeletonBlock className="h-80 w-full" />
    </div>
  );
}
