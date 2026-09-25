"use client";

import { useEffect } from "react";
import { XpOrbIcon } from "./icons";

export default function AchievementToast({
  message,
  show,
  onDone,
}: {
  message: string;
  show: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 mc-panel-dark px-4 py-3 flex items-center gap-3 max-w-[90vw]"
      style={{ animation: "mc-toast-in 0.3s ease-out forwards" }}
    >
      <XpOrbIcon className="h-8 w-8 shrink-0" />
      <div>
        <p className="mc-heading text-[8px] text-[#7fd93f]">
          Achievement Get!
        </p>
        <p className="text-xs text-white mt-1.5">{message}</p>
      </div>
    </div>
  );
}
