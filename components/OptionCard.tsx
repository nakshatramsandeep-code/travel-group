import { TripOption } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-red-400";
}

export default function OptionCard({
  option,
  rankLabel,
  voteCount,
  isWinner,
  isLocked,
  currentUserVoted,
  onVote,
}: {
  option: TripOption;
  rankLabel: string;
  voteCount: number;
  isWinner: boolean;
  isLocked: boolean;
  currentUserVoted: boolean;
  onVote?: () => void;
}) {
  const scores = Object.entries(option.fit_scores);

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-4 ${
        isWinner
          ? "border-emerald-500 bg-emerald-950/20"
          : "border-neutral-800 bg-neutral-900/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            {rankLabel}
          </span>
          <h3 className="text-lg font-semibold text-white">
            {option.destination}
          </h3>
          <p className="text-sm text-neutral-400">
            {option.dates.start} → {option.dates.end}
          </p>
        </div>
        {isWinner && (
          <span className="text-xs font-medium bg-emerald-600 text-white px-2 py-1 rounded-full whitespace-nowrap">
            Chosen
          </span>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          Estimated cost / person (INR)
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-200">
          {Object.entries(option.est_cost_per_person).map(([name, cost]) => (
            <span key={name}>
              {name}: ₹{cost.toLocaleString("en-IN")}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          Fit
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          {scores.map(([name, entry]) => (
            <li key={name} className="text-neutral-300">
              <span className={`font-semibold ${scoreColor(entry.score)}`}>
                {entry.score}/10
              </span>{" "}
              <span className="text-neutral-400">{name}</span> —{" "}
              <span className="text-neutral-500">{entry.reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          Trade-offs
        </p>
        <p className="text-sm text-neutral-400">{option.tradeoffs}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
        <span className="text-sm text-neutral-400">
          {voteCount} vote{voteCount === 1 ? "" : "s"}
        </span>
        {!isLocked && onVote && (
          <button
            onClick={onVote}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
              currentUserVoted
                ? "bg-emerald-600 text-white"
                : "border border-neutral-700 text-neutral-200 hover:border-emerald-500"
            }`}
          >
            {currentUserVoted ? "Your vote" : "Vote"}
          </button>
        )}
      </div>
    </div>
  );
}
