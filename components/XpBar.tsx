export default function XpBar({
  current,
  total,
  label = "Party Readiness",
}: {
  current: number;
  total: number;
  label?: string;
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-[8px] mc-heading text-[#202020] mb-1.5">
        <span>{label}</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-5 w-full bg-[#1b1b1b] border-2 border-black overflow-hidden">
        <div
          className="h-full bg-gradient-to-b from-[#8fe94f] to-[#5a9e2f] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
