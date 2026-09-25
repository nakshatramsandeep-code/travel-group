import { TripOption } from "@/lib/types";
import { formatDateRange } from "@/lib/date";
import { ChestIcon, HeartIcon, MapIcon } from "./icons";

function heartsForScore(score: number): number {
  return Math.max(0, Math.min(5, Math.round(score / 2)));
}

export default function OptionCard({
  option,
  voteCount,
  isWinner,
  isLocked,
  currentUserVoted,
  onVote,
}: {
  option: TripOption;
  voteCount: number;
  isWinner: boolean;
  isLocked: boolean;
  currentUserVoted: boolean;
  onVote?: () => void;
}) {
  const scores = Object.entries(option.fit_scores ?? {});
  const costs = Object.entries(option.est_cost_per_person ?? {});
  const itinerary = option.itinerary ?? [];

  return (
    <div className="mc-panel p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] mc-heading text-[#6b6b6b] mb-1">
            The Oracle Recommends
          </p>
          <h3 className="mc-heading text-base sm:text-lg text-[#202020]">
            {option.destination}
          </h3>
          <p className="text-sm text-[#4a4a4a] mt-1">
            {formatDateRange(option.dates.start, option.dates.end)}
          </p>
        </div>
        {isWinner && (
          <span className="text-[9px] mc-heading bg-[#d4a017] text-white px-2 py-1.5 border-2 border-black whitespace-nowrap">
            Sealed!
          </span>
        )}
      </div>

      {costs.length > 0 && (
        <div className="mc-slot p-3">
          <p className="flex items-center gap-1.5 text-[9px] mc-heading text-[#202020] mb-2">
            <ChestIcon className="h-4 w-4" />
            Loot Cost / Person (INR)
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#202020]">
            {costs.map(([name, cost]) => (
              <span key={name}>
                {name}: ₹{cost.toLocaleString("en-IN")}
              </span>
            ))}
          </div>
        </div>
      )}

      {itinerary.length > 0 && (
        <div className="mc-slot p-3">
          <p className="flex items-center gap-1.5 text-[9px] mc-heading text-[#202020] mb-2">
            <MapIcon className="h-4 w-4" />
            Quest Log
          </p>
          <ol className="flex flex-col gap-2 text-sm">
            {itinerary.map((day) => (
              <li key={day.day} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-[#6cad3f] border-2 border-black text-[10px] font-bold text-white">
                  {day.day}
                </span>
                <span>
                  <span className="font-semibold text-[#202020]">
                    {day.title}
                  </span>{" "}
                  <span className="text-[#4a4a4a]">{day.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {scores.length > 0 && (
        <div className="mc-slot p-3">
          <p className="text-[9px] mc-heading text-[#202020] mb-2">
            Party Fit
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {scores.map(([name, entry]) => (
              <li key={name} className="flex items-start gap-2">
                <div className="flex shrink-0 gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <HeartIcon
                      key={i}
                      className="h-4 w-4"
                      filled={i < heartsForScore(entry.score)}
                    />
                  ))}
                </div>
                <span>
                  <span className="font-medium text-[#202020]">{name}</span>{" "}
                  — <span className="text-[#4a4a4a]">{entry.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-[9px] mc-heading text-[#6b6b6b] mb-1">
          Word of Caution
        </p>
        <p className="text-sm text-[#4a4a4a]">{option.tradeoffs}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-black/20">
        <span className="flex items-center gap-1.5 text-sm text-[#202020]">
          <HeartIcon className="h-4 w-4" filled />
          {voteCount} vote{voteCount === 1 ? "" : "s"}
        </span>
        {!isLocked && onVote && (
          <button
            onClick={onVote}
            className={`mc-btn text-[9px] px-4 py-2.5 ${
              currentUserVoted ? "" : "mc-btn-stone"
            }`}
          >
            {currentUserVoted ? "Your Vote!" : "Vote"}
          </button>
        )}
      </div>
    </div>
  );
}
