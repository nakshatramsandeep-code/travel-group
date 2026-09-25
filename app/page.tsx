import TripCreateForm from "@/components/TripCreateForm";

const STEPS = [
  { label: "Create", detail: "Name your quest & party" },
  { label: "Recruit", detail: "Everyone shares one link" },
  { label: "Embark", detail: "Vote and lock the destination" },
];

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="mc-heading text-xl sm:text-2xl leading-relaxed text-[#202020]">
            Plan the Quest Everyone Agrees On
          </h1>
          <p className="mt-4 text-sm text-[#2f2f2f]">
            One link for your party. Everyone submits their preferences, and
            the Oracle finds the one destination that fits everyone.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {STEPS.map((step, i) => (
            <div key={step.label} className="mc-panel px-2 py-3 text-center">
              <div className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center bg-[#6cad3f] border-2 border-black text-[10px] font-bold text-white mc-heading">
                {i + 1}
              </div>
              <p className="mc-heading text-[9px] text-[#202020]">
                {step.label}
              </p>
              <p className="mt-1 text-[11px] leading-tight text-[#4a4a4a]">
                {step.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="mc-panel p-6">
          <TripCreateForm />
        </div>
      </div>
    </main>
  );
}
