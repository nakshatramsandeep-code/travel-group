import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PreferenceForm from "@/components/PreferenceForm";
import Link from "next/link";
import { describeDeadline, formatDateTime } from "@/lib/date";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, group_size, deadline, member_names, status")
    .eq("share_token", shareToken)
    .single();

  if (!trip) {
    notFound();
  }

  const deadlineStatus = describeDeadline(trip.deadline);
  const badgeClass =
    deadlineStatus.urgency === "passed"
      ? "bg-neutral-800 text-neutral-400 border-neutral-700"
      : deadlineStatus.urgency === "soon"
        ? "bg-amber-950/50 text-amber-300 border-amber-900"
        : "bg-emerald-950/50 text-emerald-400 border-emerald-900";

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">{trip.name}</h1>
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
          <Link
            href={`/t/${shareToken}/board`}
            className="inline-block mt-2 text-sm text-emerald-400 hover:text-emerald-300 underline"
          >
            View decision board
          </Link>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
          <PreferenceForm
            shareToken={shareToken}
            memberNames={trip.member_names}
            deadline={trip.deadline}
            tripStatus={trip.status}
          />
        </div>
      </div>
    </main>
  );
}
