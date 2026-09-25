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
          <h1 className="font-serif text-3xl text-neutral-900">
            Plan the trip everyone agrees on
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            One link for your group. Everyone submits their preferences, we
            find the trips that actually work for everyone.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="rounded-xl border border-black/10 bg-black/[0.03] px-2 py-3 text-center"
            >
              <div className="mx-auto mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-[#f5f5f2]">
                {i + 1}
              </div>
              <p className="text-xs font-medium text-neutral-800">
                {step.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-neutral-500">
                {step.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
          <TripCreateForm />
        </div>
      </div>
    </main>
  );
}
