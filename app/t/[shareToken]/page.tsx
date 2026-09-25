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
      ? "bg-[#8b8b8b] text-white"
      : deadlineStatus.urgency === "soon"
        ? "bg-[#d4a017] text-white"
        : "bg-[#6cad3f] text-white";

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
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
          <Link
            href={`/t/${shareToken}/board`}
            className="inline-block mt-3 text-xs mc-heading text-[#1d4ed8] hover:opacity-70 underline"
          >
            View Quest Board
          </Link>
        </div>
        <div className="mc-panel p-6">
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
