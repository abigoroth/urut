import { z } from "zod";
import { getArea } from "./areas";

export const serviceTypeSchema = z.enum([
  "urut_tradisional",
  "urut_bersalin",
  "refleksologi",
  "thai",
  "swedish",
  "deep_tissue",
  "tui_na",
  "bekam",
]);

const genderSchema = z.enum(["female", "male"]);

/** Malaysian mobile number, normalised to 60XXXXXXXXX for WhatsApp links. */
export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s\-()+]/g, ""))
  .transform((s) => (s.startsWith("0") ? `6${s}` : s))
  .refine((s) => /^601\d{7,9}$/.test(s), "Enter a valid Malaysian mobile number, e.g. 012-345 6789");

export const providerInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  gender: genderSchema,
  bio: z.string().trim().max(500).default(""),
  phone: phoneSchema,
  areaId: z.string().refine((id) => !!getArea(id), "Unknown area"),
  lat: z.number().min(0.8).max(7.5).optional(),
  lng: z.number().min(99.5).max(119.5).optional(),
  mode: z.enum(["home_visit", "premises", "both"]),
  travelRadiusKm: z.number().min(0).max(100).default(15),
  servesGender: z.enum(["all", "female_only", "male_only"]),
  services: z
    .array(
      z.object({
        type: serviceTypeSchema,
        durationMin: z.number().int().min(15).max(240),
        priceRM: z.number().min(10).max(2000),
      }),
    )
    .min(1, "Add at least one service"),
  languages: z.array(z.string()).min(1),
  yearsExperience: z.number().int().min(0).max(60),
});

export const providerPatchSchema = providerInputSchema.partial().extend({
  available: z.boolean().optional(),
});

export const bookingInputSchema = z.object({
  providerId: z.string(),
  customerName: z.string().trim().min(2).max(80),
  customerPhone: phoneSchema,
  customerGender: genderSchema,
  serviceType: serviceTypeSchema,
  mode: z.enum(["home_visit", "premises"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  address: z.string().trim().max(300).default(""),
  notes: z.string().trim().max(500).default(""),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["accepted", "declined", "completed", "cancelled"]),
});

export function validationError(error: z.ZodError) {
  return Response.json(
    { error: "Validation failed", issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
    { status: 400 },
  );
}

/** MyKad: 12 digits, YYMMDD-PB-###G. Dashes/spaces allowed. */
export const icNumberSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .refine((s) => /^\d{6}\d{2}\d{4}$/.test(s), "Enter your 12-digit MyKad number, e.g. 900101-14-5678")
  .refine((s) => {
    const mm = Number(s.slice(2, 4));
    const dd = Number(s.slice(4, 6));
    return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
  }, "MyKad number has an invalid date of birth");

const MAX_DOC_BYTES = 3 * 1024 * 1024;
const dataUrlSchema = z
  .string()
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Upload a JPG or PNG photo")
  .refine((s) => (s.length - s.indexOf(",") - 1) * 0.75 <= MAX_DOC_BYTES, "Photo must be under 3 MB");

export const verificationInputSchema = z.object({
  legalName: z.string().trim().min(3, "Enter your full name as on MyKad").max(100),
  icNumber: icNumberSchema,
  certificateName: z.string().trim().max(120).optional(),
  documents: z.object({
    ic_front: dataUrlSchema,
    selfie: dataUrlSchema,
    certificate: dataUrlSchema.optional(),
  }),
});

export const verificationDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  idVerified: z.boolean().default(true),
  certified: z.boolean().default(false),
  note: z.string().trim().max(300).optional(),
});

export const reviewInputSchema = z.object({
  bookingId: z.string(),
  customerPhone: phoneSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(600).default(""),
});
