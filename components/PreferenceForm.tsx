"use client";

import { useEffect, useState } from "react";
import {
  DESTINATION_TYPES,
  HARD_NO_OPTIONS,
  DateRange,
  DestinationType,
} from "@/lib/types";
import { getStoredIdentity, setStoredIdentity } from "@/lib/localIdentity";
import {
  ChestIcon,
  ClockIcon,
  CompassIcon,
  TntIcon,
  PlayerHeadIcon,
  CheckIcon,
} from "@/components/icons";

interface Props {
  shareToken: string;
  memberNames: string[];
  deadline: string;
  tripStatus: string;
}

const emptyRange = (): DateRange => ({ start: "", end: "" });

export default function PreferenceForm({
  shareToken,
  memberNames,
  deadline,
  tripStatus,
}: Props) {
  const [memberName, setMemberNameState] = useState("");
  function setMemberName(name: string) {
    setMemberNameState(name);
    if (name) setStoredIdentity(shareToken, name);
  }

  useEffect(() => {
    const stored = getStoredIdentity(shareToken);
    if (memberNames.includes(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred to after hydration to avoid an SSR/client mismatch (localStorage isn't available on the server)
      setMemberNameState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only; re-running on memberNames identity changes would fight the user's own selection
  }, []);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [dateRanges, setDateRanges] = useState<DateRange[]>([emptyRange()]);
  const [destinationTypes, setDestinationTypes] = useState<DestinationType[]>(
    []
  );
  const [hardNos, setHardNos] = useState<string[]>([]);
  const [hardNoNotes, setHardNoNotes] = useState("");

  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const isLocked = tripStatus === "locked";
  const isPastDeadline = new Date() > new Date(deadline);
  const isReadOnly = isLocked || isPastDeadline;

  function resetForm() {
    setBudgetMin("");
    setBudgetMax("");
    setDateRanges([emptyRange()]);
    setDestinationTypes([]);
    setHardNos([]);
    setHardNoNotes("");
    setHasExisting(false);
  }

  useEffect(() => {
    if (!memberName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing local form state when the selected person changes
      resetForm();
      return;
    }
    setLoadingExisting(true);
    setSuccess(false);
    setError(null);
    fetch(
      `/api/submissions?shareToken=${encodeURIComponent(
        shareToken
      )}&memberName=${encodeURIComponent(memberName)}`
    )
      .then((r) => r.json())
      .then((data) => {
        const s = data.submission;
        if (s) {
          setBudgetMin(String(s.budget_min));
          setBudgetMax(String(s.budget_max));
          setDateRanges(
            s.date_ranges?.length ? s.date_ranges : [emptyRange()]
          );
          setDestinationTypes(s.destination_types ?? []);
          setHardNos(s.hard_nos ?? []);
          setHardNoNotes(s.hard_no_notes ?? "");
          setHasExisting(true);
        } else {
          resetForm();
        }
      })
      .finally(() => setLoadingExisting(false));
  }, [memberName, shareToken]);

  function updateRange(idx: number, field: keyof DateRange, value: string) {
    setDateRanges((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  }

  function addRange() {
    setDateRanges((prev) => [...prev, emptyRange()]);
  }

  function removeRange(idx: number) {
    setDateRanges((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleDestinationType(type: DestinationType) {
    setDestinationTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleHardNo(value: string) {
    setHardNos((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!memberName) {
      setError("Select your name first.");
      return;
    }
    const min = Number(budgetMin);
    const max = Number(budgetMax);
    if (!budgetMin || !budgetMax || min > max) {
      setError("Enter a valid budget range (min ≤ max).");
      return;
    }
    const cleanRanges = dateRanges.filter((r) => r.start && r.end);
    if (cleanRanges.length === 0) {
      setError("Add at least one available date range.");
      return;
    }
    if (destinationTypes.length === 0) {
      setError("Pick at least one destination type you'd enjoy.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareToken,
          memberName,
          budgetMin: min,
          budgetMax: max,
          dateRanges: cleanRanges,
          destinationTypes,
          hardNos,
          hardNoNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setSaving(false);
        return;
      }
      setSuccess(true);
      setHasExisting(true);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {isReadOnly && (
        <p className="text-sm text-white bg-[#8b8b8b] border-2 border-black px-3 py-2">
          {isLocked
            ? "This quest is sealed — submissions are closed."
            : "The quest deadline has passed."}
        </p>
      )}

      <div>
        <label className="flex items-center gap-2 mc-heading text-[9px] text-[#202020] mb-2">
          <PlayerHeadIcon className="h-5 w-5" />
          Which Adventurer Are You?
        </label>
        <div className="relative">
          <select
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            disabled={isReadOnly}
            className="mc-input w-full appearance-none px-3.5 py-3 pr-9 disabled:opacity-60"
          >
            <option value="">Select your name</option>
            {memberNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {memberName && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {loadingExisting && (
            <p className="text-sm text-[#4a4a4a]">Loading your answers…</p>
          )}

          {hasExisting && !loadingExisting && (
            <p className="flex items-center gap-1.5 text-xs text-[#2f6b1f] font-medium">
              <CheckIcon className="h-4 w-4" />
              You&apos;ve already submitted — editing will update your answers.
            </p>
          )}

          <fieldset
            disabled={isReadOnly || loadingExisting}
            className="flex flex-col gap-4"
          >
            <section className="mc-slot p-4">
              <h3 className="flex items-center gap-2 mc-heading text-[9px] text-[#202020] mb-3">
                <ChestIcon className="h-5 w-5" />
                Budget / Person (INR)
              </h3>
              <div className="flex gap-3">
                <div className="relative w-1/2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="mc-input w-full pl-7 pr-3 py-2.5"
                  />
                </div>
                <div className="relative w-1/2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="mc-input w-full pl-7 pr-3 py-2.5"
                  />
                </div>
              </div>
            </section>

            <section className="mc-slot p-4">
              <h3 className="flex items-center gap-2 mc-heading text-[9px] text-[#202020] mb-3">
                <ClockIcon className="h-5 w-5" />
                Available Dates
              </h3>
              <div className="flex flex-col gap-2">
                {dateRanges.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-[#e8e8e8] border-2 border-black p-2"
                  >
                    <input
                      type="date"
                      value={r.start}
                      onChange={(e) =>
                        updateRange(idx, "start", e.target.value)
                      }
                      className="mc-input min-w-0 flex-1 px-2.5 py-2 text-sm"
                    />
                    <span className="shrink-0 text-neutral-500 text-xs">
                      to
                    </span>
                    <input
                      type="date"
                      value={r.end}
                      onChange={(e) =>
                        updateRange(idx, "end", e.target.value)
                      }
                      className="mc-input min-w-0 flex-1 px-2.5 py-2 text-sm"
                    />
                    {dateRanges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(idx)}
                        className="shrink-0 bg-[#b33a3a] border-2 border-black text-white px-2 py-1.5 text-xs font-bold hover:brightness-110"
                        aria-label="Remove date range"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRange}
                  className="mc-btn mc-btn-stone self-start px-3 py-2 text-[9px]"
                >
                  + Add Window
                </button>
              </div>
            </section>

            <section className="mc-slot p-4">
              <h3 className="flex items-center gap-2 mc-heading text-[9px] text-[#202020] mb-3">
                <CompassIcon className="h-5 w-5" />
                Biome Preference
              </h3>
              <p className="text-xs text-[#4a4a4a] mb-2">
                Pick all you&apos;d enjoy.
              </p>
              <div className="flex flex-wrap gap-2">
                {DESTINATION_TYPES.map((d) => {
                  const active = destinationTypes.includes(d.value);
                  return (
                    <button
                      type="button"
                      key={d.value}
                      onClick={() => toggleDestinationType(d.value)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 border-2 border-black text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#6cad3f] text-white"
                          : "bg-white text-[#202020] hover:bg-[#f0f0f0]"
                      }`}
                    >
                      {active && <CheckIcon className="h-3.5 w-3.5" />}
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mc-slot p-4">
              <h3 className="flex items-center gap-2 mc-heading text-[9px] text-[#202020] mb-3">
                <TntIcon className="h-5 w-5" />
                Forbidden Biomes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HARD_NO_OPTIONS.map((opt) => {
                  const active = hardNos.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleHardNo(opt)}
                      aria-pressed={active}
                      className={`flex items-center gap-2 border-2 border-black px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#c62828] text-white"
                          : "bg-white text-[#202020] hover:bg-[#f0f0f0]"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 border-black ${
                          active ? "bg-white" : "bg-[#e0e0e0]"
                        }`}
                      >
                        {active && <CheckIcon className="h-3 w-3" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={hardNoNotes}
                onChange={(e) => setHardNoNotes(e.target.value)}
                placeholder="Anything else you definitely don't want..."
                rows={2}
                className="mc-input mt-3 w-full px-3 py-2 text-sm"
              />
            </section>

            {error && (
              <p className="text-sm text-white bg-[#b33a3a] border-2 border-black px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="flex items-center gap-2 text-sm text-white bg-[#6cad3f] border-2 border-black px-3 py-2">
                <CheckIcon className="h-4 w-4" />
                Saved! You can come back and edit until the deadline.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mc-btn w-full py-4 text-[10px]"
            >
              {saving ? "Saving..." : hasExisting ? "Update Answers" : "Submit"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
