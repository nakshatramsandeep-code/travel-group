"use client";

import { useCallback, useEffect, useState } from "react";
import { Trip, TripOption, Vote } from "@/lib/types";
import OptionCard from "./OptionCard";
import FitScoreGrid from "./FitScoreGrid";

interface BoardData {
  trip: Pick<
    Trip,
    | "id"
    | "name"
    | "group_size"
    | "deadline"
    | "member_names"
    | "status"
    | "locked_option_id"
    | "locked_at"
  >;
  submittedMembers: string[];
  options: TripOption[];
  votes: Pick<Vote, "member_name" | "option_id">[];
}

export default function DecisionBoard({ shareToken }: { shareToken: string }) {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voterName, setVoterName] = useState("");
  const [voting, setVoting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${shareToken}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Trip not found");
        return;
      }
      setData(json);
    } catch {
      setError("Could not reach the server.");
    }
  }, [shareToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState only runs after the await inside load()
    load();
  }, [load]);

  async function castVote(optionId: string) {
    if (!voterName) {
      setError("Pick your name before voting.");
      return;
    }
    setVoting(true);
    setError(null);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken, memberName: voterName, optionId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save vote");
        setVoting(false);
        return;
      }
      await load();
    } finally {
      setVoting(false);
    }
  }

  if (error && !data) {
    return <p className="text-red-400 text-center">{error}</p>;
  }

  if (!data) {
    return <p className="text-neutral-500 text-center">Loading…</p>;
  }

  const { trip, options, votes } = data;

  const voteCounts = options.reduce<Record<string, number>>((acc, opt) => {
    acc[opt.id] = votes.filter((v) => v.option_id === opt.id).length;
    return acc;
  }, {});

  const myVote = votes.find((v) => v.member_name === voterName)?.option_id;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">{trip.name}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {trip.status === "locked"
            ? "Decision locked"
            : trip.status === "options_generated"
              ? "Vote for your favourite"
              : "Waiting for options to be generated"}
        </p>
      </div>

      {trip.status === "collecting" && (
        <p className="text-center text-sm text-neutral-500 bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-6">
          Options haven&apos;t been generated yet. Check back once the
          coordinator has run it.
        </p>
      )}

      {options.length > 0 && (
        <>
          <FitScoreGrid options={options} memberNames={trip.member_names} />

          {trip.status !== "locked" && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-400">Voting as</label>
              <select
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select your name</option>
                {trip.member_names.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {options.map((opt) => (
              <OptionCard
                key={opt.id}
                option={opt}
                rankLabel={`Option ${opt.rank}`}
                voteCount={voteCounts[opt.id] ?? 0}
                isWinner={trip.locked_option_id === opt.id}
                isLocked={trip.status === "locked"}
                currentUserVoted={myVote === opt.id}
                onVote={
                  trip.status === "locked" || voting
                    ? undefined
                    : () => castVote(opt.id)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
