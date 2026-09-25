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
      ? "bg-black/[0.04] text-neutral-500 border-black/10"
      : deadlineStatus.urgency === "soon"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
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
          <Link
            href={`/t/${shareToken}/board`}
            className="inline-block mt-2 text-sm text-emerald-700 hover:text-emerald-800 underline"
          >
            View decision board
          </Link>
        </div>
        <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
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
