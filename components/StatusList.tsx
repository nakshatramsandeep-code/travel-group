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
            className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2"
          >
            <span className="text-neutral-800 text-sm">{name}</span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                submitted
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-black/[0.03] text-neutral-500 border border-black/10"
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
