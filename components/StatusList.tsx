import { PlayerHeadIcon } from "./icons";

export default function StatusList({
  memberNames,
  submittedMembers,
}: {
  memberNames: string[];
  submittedMembers: string[];
}) {
  return (
    <ul className="flex flex-col gap-2">
      {memberNames.map((name, i) => {
        const submitted = submittedMembers.includes(name);
        return (
          <li
            key={name}
            className="flex items-center justify-between bg-white border-2 border-black px-3 py-2"
          >
            <span className="flex items-center gap-2 text-[#202020] text-sm">
              <PlayerHeadIcon
                className={`h-6 w-6 ${submitted ? "" : "grayscale opacity-60"}`}
                seed={i}
              />
              {name}
            </span>
            <span
              className={`text-[9px] mc-heading px-2 py-1.5 border-2 border-black ${
                submitted
                  ? "bg-[#6cad3f] text-white"
                  : "bg-[#c6c6c6] text-[#4a4a4a]"
              }`}
            >
              {submitted ? "Ready" : "Waiting"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
