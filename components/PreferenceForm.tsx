"use client";

import { useEffect, useState } from "react";
import {
  DESTINATION_TYPES,
  HARD_NO_OPTIONS,
  DateRange,
  DestinationType,
} from "@/lib/types";

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
  const [memberName, setMemberName] = useState("");
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
        <p className="text-sm text-amber-300 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2">
          {isLocked
            ? "This trip's decision is locked — submissions are closed."
            : "The submission deadline has passed."}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-1">
          Which one are you?
        </label>
        <select
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          disabled={isReadOnly}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
        >
          <option value="">Select your name</option>
          {memberNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {memberName && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {loadingExisting && (
            <p className="text-sm text-neutral-500">Loading your answers…</p>
          )}

          {hasExisting && !loadingExisting && (
            <p className="text-xs text-emerald-400">
              You&apos;ve already submitted — editing will update your answers.
            </p>
          )}

          <fieldset disabled={isReadOnly || loadingExisting} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-1">
                Budget per person (INR)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-1/2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-1/2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-1">
                When are you available?
              </label>
              <div className="flex flex-col gap-2">
                {dateRanges.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="date"
                      value={r.start}
                      onChange={(e) =>
                        updateRange(idx, "start", e.target.value)
                      }
                      className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-neutral-500 text-sm">to</span>
                    <input
                      type="date"
                      value={r.end}
                      onChange={(e) =>
                        updateRange(idx, "end", e.target.value)
                      }
                      className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                    {dateRanges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(idx)}
                        className="text-neutral-500 hover:text-red-400 px-1"
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
                  className="self-start text-sm text-emerald-400 hover:text-emerald-300"
                >
                  + Add another window
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                What kind of trip? (pick all you&apos;d enjoy)
              </label>
              <div className="flex flex-wrap gap-2">
                {DESTINATION_TYPES.map((d) => {
                  const active = destinationTypes.includes(d.value);
                  return (
                    <button
                      type="button"
                      key={d.value}
                      onClick={() => toggleDestinationType(d.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Hard no&apos;s
              </label>
              <div className="flex flex-col gap-2">
                {HARD_NO_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm text-neutral-300"
                  >
                    <input
                      type="checkbox"
                      checked={hardNos.includes(opt)}
                      onChange={() => toggleHardNo(opt)}
                      className="rounded border-neutral-600 bg-neutral-900 text-emerald-600 focus:ring-emerald-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              <textarea
                value={hardNoNotes}
                onChange={(e) => setHardNoNotes(e.target.value)}
                placeholder="Anything else you definitely don't want..."
                rows={2}
                className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
                Saved! You can come back and edit until the deadline.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 transition-colors"
            >
              {saving ? "Saving..." : hasExisting ? "Update my answers" : "Submit"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
