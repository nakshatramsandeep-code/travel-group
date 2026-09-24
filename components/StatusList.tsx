export default function StatusList({
  memberNames,
  submittedMembers,
}: {
  memberNames: string[];
  submittedMembers: string[];
}) {
  return (
    <ul className="flex flex-col gap-2">
      {memberNames.map((name) => {
        const submitted = submittedMembers.includes(name);
        return (
          <li
            key={name}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2"
          >
            <span className="text-neutral-200 text-sm">{name}</span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                submitted
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900"
                  : "bg-neutral-800 text-neutral-500 border border-neutral-700"
              }`}
            >
              {submitted ? "Submitted" : "Waiting"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
