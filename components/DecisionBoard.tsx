"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trip, TripOption } from "@/lib/types";
import OptionCard from "./OptionCard";
import { SkeletonBoard } from "./Skeleton";

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
}

const POLL_INTERVAL_MS = 8000;

export default function DecisionBoard({ shareToken }: { shareToken: string }) {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error && !data) {
    return <p className="text-red-600 text-center">{error}</p>;
  }

  if (!data) {
    return <SkeletonBoard />;
  }

  const { trip, options } = data;
  const option = options[0] as TripOption | undefined;

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
              ? "The Oracle has spoken"
              : "Waiting for the Oracle..."}
        </p>
      </div>

      {trip.status === "collecting" && (
        <p className="text-center text-sm text-[#4a4a4a] mc-panel px-4 py-6">
          The Oracle hasn&apos;t spoken yet. Check back once the quest giver
          has consulted it.
        </p>
      )}

      {error && (
        <p className="text-sm text-white bg-[#b33a3a] border-2 border-black px-3 py-2">
          {error}
        </p>
      )}

      {option && (
        <OptionCard
          option={option}
          isWinner={trip.locked_option_id === option.id}
        />
      )}
    </div>
  );
}
