"use client";

import { useCallback, useEffect, useState } from "react";
import { Submission, Trip, TripOption, Vote } from "@/lib/types";
import StatusList from "./StatusList";
import OptionCard from "./OptionCard";
import FitScoreGrid from "./FitScoreGrid";

interface AdminData {
  trip: Trip;
  submissions: Submission[];
  options: TripOption[];
  votes: Pick<Vote, "member_name" | "option_id">[];
}

export default function AdminDashboard({
  adminToken,
  initialTrip,
}: {
  adminToken: string;
  initialTrip: Trip;
}) {
  const [data, setData] = useState<AdminData>({
    trip: initialTrip,
    submissions: [],
    options: [],
    votes: [],
  });
  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );
  const [generating, setGenerating] = useState(false);
  const [locking, setLocking] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"share" | "admin" | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/${adminToken}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
  }, [adminToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState only runs after the await inside load()
    load();
  }, [load]);

  const { trip, submissions, options, votes } = data;
  const submittedMembers = submissions.map((s) => s.member_name);
  const allSubmitted = submittedMembers.length >= trip.group_size;
  const deadlinePassed = new Date() > new Date(trip.deadline);
  const canGenerate = (allSubmitted || deadlinePassed) && trip.status !== "locked";

  const shareUrl = origin ? `${origin}/t/${trip.share_token}` : "";
  const adminUrl = origin ? `${origin}/admin/${adminToken}` : "";

  async function copy(text: string, which: "share" | "admin") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard not available; user can select manually
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/admin/${adminToken}/generate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setGenError(json.error ?? "Failed to generate options");
        setGenerating(false);
        return;
      }
      await load();
    } catch {
      setGenError("Could not reach the server.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleLock(optionId: string) {
    setLocking(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/admin/${adminToken}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGenError(json.error ?? "Failed to lock decision");
        setLocking(false);
        return;
      }
      await load();
    } finally {
      setLocking(false);
    }
  }

  const voteCounts = options.reduce<Record<string, number>>((acc, opt) => {
    acc[opt.id] = votes.filter((v) => v.option_id === opt.id).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">{trip.name}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Deadline: {new Date(trip.deadline).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Share this link with the group
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-300"
          />
          <button
            onClick={() => copy(shareUrl, "share")}
            className="shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:border-emerald-500"
          >
            {copied === "share" ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mt-2">
          Your private admin link — don&apos;t share this
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={adminUrl}
            className="flex-1 min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-300"
          />
          <button
            onClick={() => copy(adminUrl, "admin")}
            className="shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:border-emerald-500"
          >
            {copied === "admin" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-sm font-medium text-neutral-200">Submission status</p>
        <StatusList
          memberNames={trip.member_names}
          submittedMembers={submittedMembers}
        />

        {trip.status !== "locked" && (
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 transition-colors"
          >
            {generating
              ? "Generating…"
              : options.length > 0
                ? "Regenerate options"
                : "Generate options"}
          </button>
        )}
        {!canGenerate && trip.status !== "locked" && (
          <p className="text-xs text-neutral-500 text-center">
            Enabled once everyone has submitted or the deadline passes.
          </p>
        )}
        {genError && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {genError}
          </p>
        )}
      </div>

      {options.length > 0 && (
        <div className="flex flex-col gap-5">
          <FitScoreGrid options={options} memberNames={trip.member_names} />
          <div className="grid gap-5 sm:grid-cols-2">
            {options.map((opt) => (
              <div key={opt.id} className="flex flex-col gap-2">
                <OptionCard
                  option={opt}
                  rankLabel={`Option ${opt.rank}`}
                  voteCount={voteCounts[opt.id] ?? 0}
                  isWinner={trip.locked_option_id === opt.id}
                  isLocked={trip.status === "locked"}
                  currentUserVoted={false}
                />
                {trip.status !== "locked" && (
                  <button
                    onClick={() => handleLock(opt.id)}
                    disabled={locking}
                    className="rounded-lg border border-emerald-700 text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-50 text-sm font-medium py-2 transition-colors"
                  >
                    Confirm as final choice
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
