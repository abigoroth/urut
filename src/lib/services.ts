import type { ServiceType } from "./types";

export const SERVICE_TYPES: { id: ServiceType; name: string; malay: string; emoji: string }[] = [
  { id: "urut_tradisional", name: "Traditional Malay", malay: "Urut Tradisional", emoji: "🌿" },
  { id: "urut_bersalin", name: "Postnatal", malay: "Urut Bersalin", emoji: "🤱" },
  { id: "refleksologi", name: "Foot Reflexology", malay: "Refleksologi", emoji: "🦶" },
  { id: "thai", name: "Thai Massage", malay: "Urut Thai", emoji: "🧘" },
  { id: "swedish", name: "Swedish / Aromatherapy", malay: "Aromaterapi", emoji: "🌸" },
  { id: "deep_tissue", name: "Deep Tissue / Sports", malay: "Urut Sukan", emoji: "💪" },
  { id: "tui_na", name: "Chinese Tui Na", malay: "Tui Na", emoji: "☯️" },
  { id: "bekam", name: "Cupping", malay: "Bekam", emoji: "🫙" },
];

const byId = new Map(SERVICE_TYPES.map((s) => [s.id, s]));

export function serviceLabel(id: ServiceType): string {
  const s = byId.get(id);
  return s ? s.malay : id;
}

export function serviceInfo(id: ServiceType) {
  return byId.get(id);
}

export const LANGUAGES = ["Bahasa Melayu", "English", "Mandarin", "Cantonese", "Tamil"];
