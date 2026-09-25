"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trip, TripOption, Vote } from "@/lib/types";
import OptionCard from "./OptionCard";
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
  const option = options[0] as TripOption | undefined;
  const voteCount = option
    ? votes.filter((v) => v.option_id === option.id).length
    : 0;

  const myVote = votes.find((v) => v.member_name === voterName)?.option_id;
  const votedMembers = new Set(votes.map((v) => v.member_name));
  const notYetVoted = trip.member_names.filter((n) => !votedMembers.has(n));

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="mc-heading text-base sm:text-lg text-[#202020]">
          {trip.name}
        </h1>
        <p className="mt-2 text-sm text-[#4a4a4a]">
          {trip.status === "locked"
            ? "Quest sealed!"
            : trip.status === "options_generated"
              ? "Vote to confirm the quest"
              : "Waiting for the Oracle..."}
        </p>
      </div>

      {trip.status === "collecting" && (
        <p className="text-center text-sm text-[#4a4a4a] mc-panel px-4 py-6">
          The Oracle hasn&apos;t spoken yet. Check back once the quest giver
          has consulted it.
        </p>
      )}

      {option && (
        <>
          {trip.status !== "locked" && (
            <div className="mc-panel p-3 flex flex-wrap items-center gap-3">
              <label className="text-xs mc-heading text-[#202020]">
                Voting as
              </label>
              <select
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="mc-input px-3 py-2 text-sm"
              >
                <option value="">Select your name</option>
                {trip.member_names.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-[#4a4a4a]">
                {notYetVoted.length === 0
                  ? "Everyone has voted"
                  : `Waiting on: ${notYetVoted.join(", ")}`}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-white bg-[#b33a3a] border-2 border-black px-3 py-2">
              {error}
            </p>
          )}

          <OptionCard
            option={option}
            voteCount={voteCount}
            isWinner={trip.locked_option_id === option.id}
            isLocked={trip.status === "locked"}
            currentUserVoted={myVote === option.id}
            onVote={
              trip.status === "locked" || voting
                ? undefined
                : () => castVote(option.id)
            }
          />
        </>
      )}
    </div>
  );
}
