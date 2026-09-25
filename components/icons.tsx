type IconProps = { className?: string };

const base = "1.75";

export function WalletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5h10A2.5 2.5 0 0 1 18 7.5V8H5.5A2.5 2.5 0 0 0 3 10.5v-3Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <path
        d="M3 10.5A2.5 2.5 0 0 1 5.5 8H19a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 15.5v-5Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <circle cx="16.5" cy="13" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2"
        stroke="currentColor"
        strokeWidth={base}
      />
      <path
        d="M3.5 9.5h17M8 3v3.5M16 3v3.5"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={base} />
      <path
        d="M14.5 9.5 13 13l-3.5 1.5L11 11l3.5-1.5Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BanIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={base} />
      <path
        d="M6.3 6.3l11.4 11.4"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth={base} />
      <path
        d="M4.5 20c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
