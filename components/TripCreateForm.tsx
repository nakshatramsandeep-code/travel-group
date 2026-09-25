"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompassIcon, PlayerHeadIcon, ClockIcon } from "@/components/icons";

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
      <section className="mc-slot p-4">
        <label className="flex items-center gap-2 mc-heading text-[9px] text-[#202020] mb-3">
          <CompassIcon className="h-5 w-5" />
          Quest Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa or bust 2026"
          required
          className="mc-input w-full px-3.5 py-3 placeholder-neutral-400"
        />
      </section>

      <section className="mc-slot p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 mc-heading text-[9px] text-[#202020]">
            <PlayerHeadIcon className="h-5 w-5" />
            Recruit Party
          </label>
          <span className="text-xs text-[#4a4a4a]">
            {memberNamesText.split("\n").map((n) => n.trim()).filter(Boolean).length}{" "}
            joined
          </span>
        </div>
        <p className="text-xs text-[#4a4a4a] mb-2">One name per line.</p>
        <textarea
          value={memberNamesText}
          onChange={(e) => setMemberNamesText(e.target.value)}
          rows={5}
          required
          className="mc-input w-full px-3.5 py-3 placeholder-neutral-400"
        />
      </section>

      <section className="mc-slot p-4">
        <label className="flex items-center gap-2 mc-heading text-[9px] text-[#202020] mb-3">
          <ClockIcon className="h-5 w-5" />
          Quest Deadline
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          className="mc-input w-full px-3.5 py-3"
        />
      </section>

      {error && (
        <p className="text-sm text-white bg-[#b33a3a] border-2 border-black px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="mc-btn w-full py-4 text-[10px]">
        {loading ? "Crafting..." : "Start the Quest"}
      </button>
    </form>
  );
}
