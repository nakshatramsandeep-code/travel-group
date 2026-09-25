"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompassIcon, UserIcon, CalendarIcon } from "@/components/icons";

export default function TripCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [memberNamesText, setMemberNamesText] = useState(
    "Riya\nSiddharth\nKaran\nAisha\nPreethi"
  );
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const memberNames = memberNamesText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    if (memberNames.length < 2) {
      setError("Add at least 2 names, one per line.");
      return;
    }
    const lowerNames = memberNames.map((n) => n.toLowerCase());
    const firstDupe = lowerNames.find(
      (n, i) => lowerNames.indexOf(n) !== i
    );
    if (firstDupe) {
      setError(
        `"${memberNames[lowerNames.indexOf(firstDupe)]}" appears more than once — each person needs a distinct name.`
      );
      return;
    }
    if (!deadline) {
      setError("Pick a submission deadline.");
      return;
    }
    if (new Date(deadline) <= new Date()) {
      setError("The deadline needs to be in the future.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          memberNames,
          deadline: new Date(deadline).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      router.push(`/admin/${data.adminToken}`);
    } catch {
      setError("Could not reach the server. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 mb-2">
          <CompassIcon className="h-4 w-4 text-emerald-600" />
          Trip name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa or bust 2026"
          required
          className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:outline-none"
        />
      </section>

      <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
            <UserIcon className="h-4 w-4 text-emerald-600" />
            Who&apos;s going?
          </label>
          <span className="text-xs text-neutral-500">
            {memberNamesText.split("\n").map((n) => n.trim()).filter(Boolean).length}{" "}
            people
          </span>
        </div>
        <p className="text-xs text-neutral-500 mb-2">One name per line.</p>
        <textarea
          value={memberNamesText}
          onChange={(e) => setMemberNamesText(e.target.value)}
          rows={5}
          required
          className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:outline-none"
        />
      </section>

      <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 mb-2">
          <CalendarIcon className="h-4 w-4 text-emerald-600" />
          Submission deadline
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-neutral-900 focus:border-emerald-600 focus:outline-none"
        />
      </section>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed text-[#f5f5f2] font-medium py-3 transition-colors"
      >
        {loading ? "Creating..." : "Create trip"}
      </button>
    </form>
  );
}
