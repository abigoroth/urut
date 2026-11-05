export type Gender = "female" | "male";

/** Where the session happens. */
export type ServiceMode = "home_visit" | "premises" | "both";

/** Which customers a provider accepts (common preference in Malaysia). */
export type ServesGender = "all" | "female_only" | "male_only";

export type ServiceType =
  | "urut_tradisional"
  | "urut_bersalin"
  | "refleksologi"
  | "thai"
  | "swedish"
  | "deep_tissue"
  | "tui_na"
  | "bekam";

export interface Area {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export interface ProviderService {
  type: ServiceType;
  durationMin: number;
  priceRM: number;
}

export interface Provider {
  id: string;
  name: string;
  gender: Gender;
  bio: string;
  phone: string; // WhatsApp number, e.g. 60123456789
  areaId: string;
  lat: number;
  lng: number;
  mode: ServiceMode;
  /** How far the provider will travel for home visits. */
  travelRadiusKm: number;
  servesGender: ServesGender;
  services: ProviderService[];
  languages: string[];
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  available: boolean;
  createdAt: string;
}

export type BookingStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

export interface Booking {
  id: string;
  providerId: string;
  customerName: string;
  customerPhone: string;
  customerGender: Gender;
  serviceType: ServiceType;
  mode: "home_visit" | "premises";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  address: string;
  notes: string;
  distanceKm: number | null;
  status: BookingStatus;
  createdAt: string;
}

/** Provider as returned by search, with distance from the customer. */
export interface ProviderMatch extends Provider {
  distanceKm: number | null;
  areaName: string;
  state: string;
  /** True if the customer is within the provider's home-visit radius. */
  canHomeVisit: boolean;
  fromPriceRM: number;
}
