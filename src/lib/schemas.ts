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
