import type { NextRequest } from "next/server";
import { forbidden, isAdmin } from "@/lib/admin";
import { getProvider, setVerification } from "@/lib/db";
import { validationError, verificationDecisionSchema } from "@/lib/schemas";

/** PATCH { decision: "approve" | "reject", idVerified, certified, note } */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/verifications/[providerId]">) {
  if (!isAdmin(req)) return forbidden();
  const { providerId } = await ctx.params;
  const p = await getProvider(providerId);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = verificationDecisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { decision, idVerified, certified, note } = parsed.data;
  if (decision === "reject" && !note) return Response.json({ error: "Give the provider a reason" }, { status: 400 });
  const hasCert = p.verification.documents?.includes("certificate");

  const updated = await setVerification(providerId, {
    ...p.verification,
    status: decision === "approve" ? "verified" : "rejected",
    idVerified: decision === "approve" ? idVerified : p.verification.idVerified,
    certified: decision === "approve" ? certified && !!hasCert : p.verification.certified,
    reviewedAt: new Date().toISOString(),
    note: decision === "reject" ? note : undefined,
  });
  return Response.json({ verification: updated!.verification });
}
