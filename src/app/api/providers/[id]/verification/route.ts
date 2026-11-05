import type { NextRequest } from "next/server";
import { getProvider, saveDocument, setVerification } from "@/lib/db";
import { validationError, verificationInputSchema } from "@/lib/schemas";
import type { VerificationDocKind } from "@/lib/types";

/** GET — the provider's own verification status (including any rejection note). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/providers/[id]/verification">) {
  const { id } = await ctx.params;
  const p = await getProvider(id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const { legalName, icLast4, ...rest } = p.verification;
  return Response.json({ verification: { ...rest, hasLegalName: !!legalName, icLast4 } });
}

/** POST — submit MyKad, selfie and (optional) certificate for review. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/providers/[id]/verification">) {
  const { id } = await ctx.params;
  const p = await getProvider(id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });

  const parsed = verificationInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { legalName, icNumber, certificateName, documents } = parsed.data;
  if (documents.certificate && !certificateName) {
    return Response.json({ error: "Name the certificate you uploaded" }, { status: 400 });
  }

  const kinds = Object.keys(documents).filter((k) => documents[k as VerificationDocKind]) as VerificationDocKind[];
  for (const kind of kinds) {
    const url = documents[kind]!;
    await saveDocument(id, kind, Buffer.from(url.slice(url.indexOf(",") + 1), "base64"));
  }

  const v = await setVerification(id, {
    status: "pending",
    // Keep an existing ID check while a new submission (e.g. a certificate) is reviewed.
    idVerified: p.verification.idVerified,
    certified: p.verification.certified,
    legalName,
    icLast4: icNumber.slice(-4), // never store the full MyKad number
    certificateName: documents.certificate ? certificateName : undefined,
    documents: kinds,
    submittedAt: new Date().toISOString(),
  });
  return Response.json({ status: v!.verification.status }, { status: 201 });
}
