"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/search", label: "Find", icon: SearchIcon, match: (p: string) => p.startsWith("/search") || p.startsWith("/providers") },
  { href: "/bookings", label: "Bookings", icon: CalendarIcon, match: (p: string) => p.startsWith("/bookings") },
  { href: "/provider", label: "For Therapists", icon: HandIcon, match: (p: string) => p.startsWith("/provider/") || p === "/provider" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-sand-200 bg-white/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-[11px] font-medium ${active ? "text-brand-600" : "text-muted"}`}
              >
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { active: boolean };
const base = (active: boolean) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: active ? 2.2 : 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function HomeIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function SearchIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function CalendarIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}
function HandIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L3.3 15a1.5 1.5 0 0 1 2.3-1.9L8 15.5" />
    </svg>
  );
}
