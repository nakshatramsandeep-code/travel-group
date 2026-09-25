import { TripOption } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 8) return "bg-emerald-600/80 text-white";
  if (score >= 5) return "bg-amber-500/80 text-white";
  return "bg-red-600/70 text-white";
}

export default function FitScoreGrid({
  options,
  memberNames,
}: {
  options: TripOption[];
  memberNames: string[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="bg-neutral-900">
            <th className="sticky left-0 z-10 bg-neutral-900 text-left font-medium text-neutral-400 px-3 py-2">
              Person
            </th>
            {options.map((opt) => (
              <th
                key={opt.id}
                className="text-center font-medium text-neutral-300 px-3 py-2"
              >
                {opt.destination}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {memberNames.map((name) => (
            <tr key={name} className="border-t border-neutral-800">
              <td className="sticky left-0 z-10 bg-neutral-950 px-3 py-2 text-neutral-200 whitespace-nowrap">
                {name}
              </td>
              {options.map((opt) => {
                const entry = opt.fit_scores[name];
                return (
                  <td key={opt.id} className="px-3 py-2 text-center">
                    {entry ? (
                      <span
                        title={entry.reason}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold cursor-help ${scoreColor(
                          entry.score
                        )}`}
                      >
                        {entry.score}
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
