import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ adminToken: string }>;
}) {
  const { adminToken } = await params;

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("admin_token", adminToken)
    .single();

  if (!trip) {
    notFound();
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <AdminDashboard adminToken={adminToken} initialTrip={trip} />
      </div>
    </main>
  );
}
