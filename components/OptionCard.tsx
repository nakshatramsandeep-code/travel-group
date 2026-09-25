import { TripOption } from "@/lib/types";
import { formatDateRange } from "@/lib/date";

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-red-400";
}

function scoreDotColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
}

function averageScore(scores: [string, { score: number }][]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, [, s]) => sum + s.score, 0) / scores.length;
}

export default function OptionCard({
  option,
  rankLabel,
  isTopPick,
  voteCount,
  isWinner,
  isLocked,
  currentUserVoted,
  onVote,
}: {
  option: TripOption;
  rankLabel: string;
  isTopPick?: boolean;
  voteCount: number;
  isWinner: boolean;
  isLocked: boolean;
  currentUserVoted: boolean;
  onVote?: () => void;
}) {
  const scores = Object.entries(option.fit_scores);
  const avg = averageScore(scores);

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
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              {rankLabel}
            </span>
            {isTopPick && !isWinner && (
              <span className="text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded-full">
                Top pick
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white">
            {option.destination}
          </h3>
          <p className="text-sm text-neutral-400">
            {formatDateRange(option.dates.start, option.dates.end)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isWinner && (
            <span className="text-xs font-medium bg-emerald-600 text-white px-2 py-1 rounded-full whitespace-nowrap">
              Chosen
            </span>
          )}
          <span
            className={`text-xs font-semibold ${scoreColor(avg)}`}
            title="Average fit across the group"
          >
            {avg.toFixed(1)}/10 avg
          </span>
        </div>
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
        <ul className="flex flex-col gap-1.5 text-sm">
          {scores.map(([name, entry]) => (
            <li key={name} className="flex items-start gap-2 text-neutral-300">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${scoreDotColor(entry.score)}`}
                aria-hidden
              />
              <span>
                <span className={`font-semibold ${scoreColor(entry.score)}`}>
                  {entry.score}/10
                </span>{" "}
                <span className="text-neutral-400">{name}</span> —{" "}
                <span className="text-neutral-500">{entry.reason}</span>
              </span>
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
