import type { NextRequest } from "next/server";
import { forbidden, isAdmin } from "@/lib/admin";
import { getArea } from "@/lib/areas";
import { listProviders } from "@/lib/db";

/** GET /api/admin/verifications?status=pending */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return forbidden();
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const items = (await listProviders())
    .filter((p) => status === "all" || p.verification.status === status)
    .sort((a, b) => (a.verification.submittedAt ?? "").localeCompare(b.verification.submittedAt ?? ""))
    .map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      phone: p.phone,
      area: getArea(p.areaId)?.name,
      services: p.services.map((s) => s.type),
      verification: p.verification,
    }));
  return Response.json({ items });
}
