import { TripOption } from "@/lib/types";
import { formatDateRange } from "@/lib/date";

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-700";
  if (score >= 5) return "text-amber-700";
  return "text-red-600";
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
          ? "border-emerald-400 bg-emerald-50/60"
          : "border-black/10 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              {rankLabel}
            </span>
            {isTopPick && !isWinner && (
              <span className="text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full">
                Top pick
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg text-neutral-900">
            {option.destination}
          </h3>
          <p className="text-sm text-neutral-500">
            {formatDateRange(option.dates.start, option.dates.end)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isWinner && (
            <span className="text-xs font-medium bg-neutral-900 text-[#f5f5f2] px-2 py-1 rounded-full whitespace-nowrap">
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
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700">
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
            <li key={name} className="flex items-start gap-2 text-neutral-700">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${scoreDotColor(entry.score)}`}
                aria-hidden
              />
              <span>
                <span className={`font-semibold ${scoreColor(entry.score)}`}>
                  {entry.score}/10
                </span>{" "}
                <span className="text-neutral-600">{name}</span> —{" "}
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
        <p className="text-sm text-neutral-600">{option.tradeoffs}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-black/10">
        <span className="text-sm text-neutral-500">
          {voteCount} vote{voteCount === 1 ? "" : "s"}
        </span>
        {!isLocked && onVote && (
          <button
            onClick={onVote}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
              currentUserVoted
                ? "bg-neutral-900 text-[#f5f5f2]"
                : "border border-black/15 text-neutral-700 hover:border-emerald-600"
            }`}
          >
            {currentUserVoted ? "Your vote" : "Vote"}
          </button>
        )}
      </div>
    </div>
  );
}
