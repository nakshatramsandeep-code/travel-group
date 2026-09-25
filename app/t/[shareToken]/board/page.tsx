import DecisionBoard from "@/components/DecisionBoard";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <DecisionBoard shareToken={shareToken} />
      </div>
    </main>
  );
}
