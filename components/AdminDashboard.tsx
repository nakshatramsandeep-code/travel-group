"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Submission, Trip, TripOption, Vote } from "@/lib/types";
import StatusList from "./StatusList";
import OptionCard from "./OptionCard";
import XpBar from "./XpBar";
import AchievementToast from "./AchievementToast";
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
  const [achievement, setAchievement] = useState<string | null>(null);

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
      ? "bg-[#8b8b8b] text-white"
      : deadlineStatus.urgency === "soon"
        ? "bg-[#d4a017] text-white"
        : "bg-[#6cad3f] text-white";

  const shareUrl = origin ? `${origin}/t/${trip.share_token}` : "";
  const adminUrl = origin ? `${origin}/admin/${adminToken}` : "";
  const option = options[0] as TripOption | undefined;

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
        setGenError(json.error ?? "Failed to consult the Oracle");
        setGenerating(false);
        return;
      }
      await load();
      setAchievement("The Oracle has revealed your destination!");
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
        setGenError(json.error ?? "Failed to seal the quest");
        setLocking(false);
        return;
      }
      await load();
      setAchievement("Quest Sealed! The destination is locked in.");
    } finally {
      setLocking(false);
    }
  }

  const voteCount = option
    ? votes.filter((v) => v.option_id === option.id).length
    : 0;
  const votedMembers = new Set(votes.map((v) => v.member_name));
  const notYetVoted = trip.member_names.filter((n) => !votedMembers.has(n));

  return (
    <div className="flex flex-col gap-6">
      <AchievementToast
        message={achievement ?? ""}
        show={achievement !== null}
        onDone={() => setAchievement(null)}
      />

      <div className="text-center">
        <h1 className="mc-heading text-base sm:text-lg text-[#202020]">
          {trip.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`text-[10px] mc-heading px-2.5 py-1.5 border-2 border-black ${badgeClass}`}
          >
            {deadlineStatus.text}
          </span>
          <span className="text-xs text-[#3f3f3f]">
            {formatDateTime(trip.deadline)}
          </span>
        </div>
      </div>

      <div className="mc-panel p-5 flex flex-col gap-3">
        <p className="text-[9px] mc-heading text-[#4a4a4a]">
          Share This Scroll With Your Party
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="mc-input flex-1 min-w-0 px-3 py-2 text-sm"
          />
          <button onClick={() => copy(shareUrl, "share")} className="mc-btn mc-btn-stone shrink-0 px-3 py-2 text-[9px]">
            {copied === "share" ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-[9px] mc-heading text-[#4a4a4a] mt-2">
          Your Private Admin Scroll — Keep Secret
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={adminUrl}
            className="mc-input flex-1 min-w-0 px-3 py-2 text-sm"
          />
          <button onClick={() => copy(adminUrl, "admin")} className="mc-btn mc-btn-stone shrink-0 px-3 py-2 text-[9px]">
            {copied === "admin" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mc-panel p-5 flex flex-col gap-4">
        {hasLoadedOnce && (
          <XpBar current={submittedMembers.length} total={trip.group_size} />
        )}

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
              <div className="flex flex-col gap-2 bg-[#d4a017] border-2 border-black p-3">
                <p className="text-sm text-white font-medium">
                  Re-rolling the Oracle will replace the current destination
                  and clear any votes already cast. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="mc-btn flex-1 py-2 text-[9px]"
                  >
                    {generating ? "Rolling…" : "Yes, Re-roll"}
                  </button>
                  <button
                    onClick={() => setConfirmingRegenerate(false)}
                    disabled={generating}
                    className="mc-btn mc-btn-stone flex-1 py-2 text-[9px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateClick}
                disabled={!canGenerate || generating}
                className="mc-btn w-full py-3 text-[10px]"
              >
                {generating
                  ? "Consulting the Oracle…"
                  : options.length > 0
                    ? "Re-roll the Oracle"
                    : "Consult the Oracle"}
              </button>
            )}
          </>
        )}
        {hasLoadedOnce && !canGenerate && trip.status !== "locked" && (
          <p className="text-xs text-[#4a4a4a] text-center">
            Enabled once everyone has submitted or the deadline passes.
          </p>
        )}
        {genError && (
          <p className="text-sm text-white bg-[#b33a3a] border-2 border-black px-3 py-2">
            {genError}
          </p>
        )}
      </div>

      {option && (
        <div className="flex flex-col gap-3">
          {trip.status !== "locked" && (
            <p className="text-xs text-[#4a4a4a] text-center">
              {notYetVoted.length === 0
                ? "Everyone has voted."
                : `Waiting on votes from: ${notYetVoted.join(", ")}`}
            </p>
          )}

          <OptionCard
            option={option}
            voteCount={voteCount}
            isWinner={trip.locked_option_id === option.id}
            isLocked={trip.status === "locked"}
            currentUserVoted={false}
          />
          {trip.status !== "locked" && (
            <button
              onClick={() => handleLock(option.id)}
              disabled={locking}
              className="mc-btn mc-btn-gold w-full py-3 text-[10px]"
            >
              {locking ? "Sealing…" : "Seal the Quest!"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
