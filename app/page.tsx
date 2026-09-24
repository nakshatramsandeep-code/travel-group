import TripCreateForm from "@/components/TripCreateForm";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">Trip Planner</h1>
          <p className="mt-2 text-sm text-neutral-400">
            One link for your group. Everyone submits their preferences, we
            find the trips that actually work for everyone.
          </p>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
          <TripCreateForm />
        </div>
      </div>
    </main>
  );
}
