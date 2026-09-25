import TripCreateForm from "@/components/TripCreateForm";

const STEPS = [
  { label: "Create", detail: "Name the trip and the group" },
  { label: "Collect", detail: "Everyone shares one link" },
  { label: "Decide", detail: "Vote on the top picks" },
];

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">
            Plan the trip everyone agrees on
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            One link for your group. Everyone submits their preferences, we
            find the trips that actually work for everyone.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-2 py-3 text-center"
            >
              <div className="mx-auto mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/20 text-[11px] font-semibold text-emerald-400">
                {i + 1}
              </div>
              <p className="text-xs font-medium text-neutral-200">
                {step.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-neutral-500">
                {step.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
          <TripCreateForm />
        </div>
      </div>
    </main>
  );
}
