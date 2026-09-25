"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Submission, Trip, TripOption, Vote } from "@/lib/types";
import StatusList from "./StatusList";
import OptionCard from "./OptionCard";
import FitScoreGrid from "./FitScoreGrid";
import { SkeletonBlock } from "./Skeleton";
import { describeDeadline, formatDateTime } from "@/lib/date";

interface AdminData {
  trip: Trip;
  submissions: Submission[];
  options: TripOption[];
  votes: Pick<Vote, "member_name" | "option_id">[];
}

const POLL_INTERVAL_MS = 8000;

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );
  const [generating, setGenerating] = useState(false);
  const [locking, setLocking] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"share" | "admin" | null>(null);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/${adminToken}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setHasLoadedOnce(true);
  }, [adminToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState only runs after the await inside load()
    load();
  }, [load]);

  // Poll for changes (new submissions/votes from the group) while the
  // decision isn't locked yet, so the dashboard stays live without a manual
  // refresh.
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

  const { trip, submissions, options, votes } = data;
  const submittedMembers = submissions.map((s) => s.member_name);
  const allSubmitted = submittedMembers.length >= trip.group_size;
  const deadlineStatus = describeDeadline(trip.deadline);
  const deadlinePassed = deadlineStatus.urgency === "passed";
  const canGenerate = (allSubmitted || deadlinePassed) && trip.status !== "locked";
  const badgeClass =
    deadlineStatus.urgency === "passed"
      ? "bg-black/[0.04] text-neutral-500 border-black/10"
      : deadlineStatus.urgency === "soon"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";

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
    setConfirmingRegenerate(false);
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

  function handleGenerateClick() {
    if (options.length > 0 && !confirmingRegenerate) {
      setConfirmingRegenerate(true);
      return;
    }
    handleGenerate();
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
  const votedMembers = new Set(votes.map((v) => v.member_name));
  const notYetVoted = trip.member_names.filter((n) => !votedMembers.has(n));

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl text-neutral-900">{trip.name}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badgeClass}`}
          >
            {deadlineStatus.text}
          </span>
          <span className="text-xs text-neutral-500">
            {formatDateTime(trip.deadline)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Share this link with the group
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-neutral-600"
          />
          <button
            onClick={() => copy(shareUrl, "share")}
            className="shrink-0 rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-700 hover:border-emerald-600"
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
            className="flex-1 min-w-0 rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-neutral-600"
          />
          <button
            onClick={() => copy(adminUrl, "admin")}
            className="shrink-0 rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-700 hover:border-emerald-600"
          >
            {copied === "admin" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-800">
            Submission status
          </p>
          {hasLoadedOnce && (
            <span className="text-xs text-neutral-500">
              {submittedMembers.length}/{trip.group_size} submitted
            </span>
          )}
        </div>

        {!hasLoadedOnce ? (
          <div className="flex flex-col gap-2">
            {trip.member_names.map((n) => (
              <SkeletonBlock key={n} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <StatusList
            memberNames={trip.member_names}
            submittedMembers={submittedMembers}
          />
        )}

        {hasLoadedOnce && trip.status !== "locked" && (
          <>
            {confirmingRegenerate ? (
              <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  Regenerating will replace the current options and clear any
                  votes already cast. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium py-2 transition-colors"
                  >
                    {generating ? "Regenerating…" : "Yes, regenerate"}
                  </button>
                  <button
                    onClick={() => setConfirmingRegenerate(false)}
                    disabled={generating}
                    className="flex-1 rounded-lg border border-black/15 text-neutral-700 hover:border-black/30 text-sm font-medium py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateClick}
                disabled={!canGenerate || generating}
                className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-[#f5f5f2] font-medium py-2.5 transition-colors"
              >
                {generating
                  ? "Generating…"
                  : options.length > 0
                    ? "Regenerate options"
                    : "Generate options"}
              </button>
            )}
          </>
        )}
        {hasLoadedOnce && !canGenerate && trip.status !== "locked" && (
          <p className="text-xs text-neutral-500 text-center">
            Enabled once everyone has submitted or the deadline passes.
          </p>
        )}
        {genError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {genError}
          </p>
        )}
      </div>

      {options.length > 0 && (
        <div className="flex flex-col gap-5">
          <FitScoreGrid options={options} memberNames={trip.member_names} />

          {trip.status !== "locked" && (
            <p className="text-xs text-neutral-500 -mt-2">
              {notYetVoted.length === 0
                ? "Everyone has voted."
                : `Waiting on votes from: ${notYetVoted.join(", ")}`}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {options.map((opt) => (
              <div key={opt.id} className="flex flex-col gap-2">
                <OptionCard
                  option={opt}
                  rankLabel={`Option ${opt.rank}`}
                  isTopPick={opt.rank === 1}
                  voteCount={voteCounts[opt.id] ?? 0}
                  isWinner={trip.locked_option_id === opt.id}
                  isLocked={trip.status === "locked"}
                  currentUserVoted={false}
                />
                {trip.status !== "locked" && (
                  <button
                    onClick={() => handleLock(opt.id)}
                    disabled={locking}
                    className="rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 text-sm font-medium py-2 transition-colors"
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
