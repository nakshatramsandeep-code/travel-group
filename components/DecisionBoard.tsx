"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trip, TripOption, Vote } from "@/lib/types";
import OptionCard from "./OptionCard";
import FitScoreGrid from "./FitScoreGrid";
import { SkeletonBoard } from "./Skeleton";
import { getStoredIdentity, setStoredIdentity } from "@/lib/localIdentity";

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

const POLL_INTERVAL_MS = 8000;

export default function DecisionBoard({ shareToken }: { shareToken: string }) {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voterName, setVoterNameState] = useState("");
  const [voting, setVoting] = useState(false);

  function setVoterName(name: string) {
    setVoterNameState(name);
    if (name) setStoredIdentity(shareToken, name);
  }

  useEffect(() => {
    const stored = getStoredIdentity(shareToken);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred to after hydration to avoid an SSR/client mismatch (localStorage isn't available on the server)
      setVoterNameState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

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

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (dataRef.current?.trip.status !== "locked") {
        load();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
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
    return <p className="text-red-600 text-center">{error}</p>;
  }

  if (!data) {
    return <SkeletonBoard />;
  }

  const { trip, options, votes } = data;

  const voteCounts = options.reduce<Record<string, number>>((acc, opt) => {
    acc[opt.id] = votes.filter((v) => v.option_id === opt.id).length;
    return acc;
  }, {});

  const myVote = votes.find((v) => v.member_name === voterName)?.option_id;
  const votedMembers = new Set(votes.map((v) => v.member_name));
  const notYetVoted = trip.member_names.filter((n) => !votedMembers.has(n));

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl text-neutral-900">{trip.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {trip.status === "locked"
            ? "Decision locked"
            : trip.status === "options_generated"
              ? "Vote for your favourite"
              : "Waiting for options to be generated"}
        </p>
      </div>

      {trip.status === "collecting" && (
        <p className="text-center text-sm text-neutral-500 bg-white border border-black/10 rounded-xl px-4 py-6 shadow-sm">
          Options haven&apos;t been generated yet. Check back once the
          coordinator has run it.
        </p>
      )}

      {options.length > 0 && (
        <>
          <FitScoreGrid options={options} memberNames={trip.member_names} />

          {trip.status !== "locked" && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-neutral-600">Voting as</label>
              <select
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-neutral-900 focus:border-emerald-600 focus:outline-none"
              >
                <option value="">Select your name</option>
                {trip.member_names.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-neutral-500">
                {notYetVoted.length === 0
                  ? "Everyone has voted"
                  : `Waiting on: ${notYetVoted.join(", ")}`}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {options.map((opt) => (
              <OptionCard
                key={opt.id}
                option={opt}
                rankLabel={`Option ${opt.rank}`}
                isTopPick={opt.rank === 1}
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
