import { formatRM } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { serviceLabel } from "@/lib/services";
import type { Booking, BookingStatus } from "@/lib/types";

const STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "Waiting for confirmation", cls: "bg-amber-50 text-amber-800" },
  accepted: { label: "Confirmed", cls: "bg-brand-50 text-brand-700" },
  declined: { label: "Declined", cls: "bg-red-50 text-red-700" },
  completed: { label: "Completed", cls: "bg-sand-100 text-muted" },
  cancelled: { label: "Cancelled", cls: "bg-sand-100 text-muted" },
};

export function StatusPill({ status }: { status: BookingStatus }) {
  const s = STATUS[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export function BookingItem({
  b,
  title,
  price,
  children,
}: {
  b: Booking;
  title: string;
  price?: number;
  children?: React.ReactNode;
}) {
  const when = new Date(`${b.date}T${b.time}:00+08:00`).toLocaleString("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  });
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{title}</h3>
          <p className="text-sm text-muted">
            {serviceLabel(b.serviceType)}
            {price !== undefined && ` · ${formatRM(price)}`}
          </p>
        </div>
        <StatusPill status={b.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p>🗓 {when}</p>
        <p>
          {b.mode === "home_visit" ? `🏠 Home visit — ${b.address}` : "📍 At therapist's place"}
          {b.distanceKm !== null && <span className="text-muted"> · {formatDistance(b.distanceKm)}</span>}
        </p>
        {b.notes && <p className="text-muted">“{b.notes}”</p>}
      </div>
      {children && <div className="mt-3 flex gap-2">{children}</div>}
    </div>
  );
}
