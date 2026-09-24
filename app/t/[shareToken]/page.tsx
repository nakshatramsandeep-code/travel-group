import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PreferenceForm from "@/components/PreferenceForm";
import Link from "next/link";

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

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">{trip.name}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Deadline: {new Date(trip.deadline).toLocaleString("en-IN")}
          </p>
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
