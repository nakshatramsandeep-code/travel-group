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
  WalletIcon,
  CalendarIcon,
  CompassIcon,
  BanIcon,
  UserIcon,
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
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {isLocked
            ? "This trip's decision is locked — submissions are closed."
            : "The submission deadline has passed."}
        </p>
      )}

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
          <UserIcon className="h-4 w-4 text-neutral-400" />
          Which one are you?
        </label>
        <div className="relative">
          <select
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            disabled={isReadOnly}
            className="w-full appearance-none rounded-xl border border-black/15 bg-white px-3.5 py-3 pr-9 text-neutral-900 focus:border-emerald-600 focus:outline-none disabled:opacity-60"
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
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
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
            <p className="text-sm text-neutral-500">Loading your answers…</p>
          )}

          {hasExisting && !loadingExisting && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckIcon className="h-3.5 w-3.5" />
              You&apos;ve already submitted — editing will update your answers.
            </p>
          )}

          <fieldset
            disabled={isReadOnly || loadingExisting}
            className="flex flex-col gap-4"
          >
            <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-3">
                <WalletIcon className="h-4 w-4 text-emerald-600" />
                Budget per person (INR)
              </h3>
              <div className="flex gap-3">
                <div className="relative w-1/2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full rounded-lg border border-black/15 bg-white pl-7 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="relative w-1/2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full rounded-lg border border-black/15 bg-white pl-7 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-3">
                <CalendarIcon className="h-4 w-4 text-emerald-600" />
                When are you available?
              </h3>
              <div className="flex flex-col gap-2">
                {dateRanges.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-black/10 bg-white p-2"
                  >
                    <input
                      type="date"
                      value={r.start}
                      onChange={(e) =>
                        updateRange(idx, "start", e.target.value)
                      }
                      className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:border-emerald-600 focus:outline-none"
                    />
                    <span className="shrink-0 text-neutral-400 text-xs">
                      to
                    </span>
                    <input
                      type="date"
                      value={r.end}
                      onChange={(e) =>
                        updateRange(idx, "end", e.target.value)
                      }
                      className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:border-emerald-600 focus:outline-none"
                    />
                    {dateRanges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(idx)}
                        className="shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                  className="self-start rounded-lg border border-dashed border-black/20 px-3 py-1.5 text-sm text-emerald-700 hover:border-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  + Add another window
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-3">
                <CompassIcon className="h-4 w-4 text-emerald-600" />
                What kind of trip?{" "}
                <span className="font-normal text-neutral-500">
                  (pick all you&apos;d enjoy)
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {DESTINATION_TYPES.map((d) => {
                  const active = destinationTypes.includes(d.value);
                  return (
                    <button
                      type="button"
                      key={d.value}
                      onClick={() => toggleDestinationType(d.value)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-neutral-900 border-neutral-900 text-[#f5f5f2]"
                          : "border-black/15 bg-white text-neutral-700 hover:border-black/30"
                      }`}
                    >
                      {active && <CheckIcon className="h-3.5 w-3.5" />}
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-3">
                <BanIcon className="h-4 w-4 text-rose-600" />
                Hard no&apos;s
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
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? "bg-rose-50 border-rose-300 text-rose-800"
                          : "border-black/15 bg-white text-neutral-700 hover:border-black/30"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          active
                            ? "bg-rose-600 border-rose-600"
                            : "border-neutral-300"
                        }`}
                      >
                        {active && (
                          <CheckIcon className="h-3 w-3 text-white" />
                        )}
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
                className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:outline-none"
              />
            </section>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Saved! You can come back and edit until the deadline.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed text-[#f5f5f2] font-medium py-3 transition-colors"
            >
              {saving ? "Saving..." : hasExisting ? "Update my answers" : "Submit"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
