"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    if (!deadline) {
      setError("Pick a submission deadline.");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-1">
          Trip name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa or bust 2026"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-1">
          Who&apos;s going? (one name per line)
        </label>
        <textarea
          value={memberNamesText}
          onChange={(e) => setMemberNamesText(e.target.value)}
          rows={5}
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-1">
          Submission deadline
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 transition-colors"
      >
        {loading ? "Creating..." : "Create trip"}
      </button>
    </form>
  );
}
