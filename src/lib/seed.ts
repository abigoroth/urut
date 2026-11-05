import { getArea } from "./areas";
import type { Gender, Provider, ProviderService, ServesGender, ServiceMode, ServiceType } from "./types";

/** Small deterministic PRNG so seed data is stable between restarts. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_PRICE: Record<ServiceType, number> = {
  urut_tradisional: 80,
  urut_bersalin: 150,
  refleksologi: 50,
  thai: 90,
  swedish: 110,
  deep_tissue: 120,
  tui_na: 90,
  bekam: 70,
};

type SeedRow = [
  name: string,
  gender: Gender,
  areaId: string,
  mode: ServiceMode,
  serves: ServesGender,
  services: ServiceType[],
  languages: string[],
  bio: string,
];

const ROWS: SeedRow[] = [
  ["Kak Ros Urut Tradisional", "female", "kl-cheras", "home_visit", "female_only", ["urut_tradisional", "urut_bersalin"], ["Bahasa Melayu"], "Urut tradisional & bersalin turun-temurun. 15 tahun pengalaman, datang ke rumah."],
  ["Abang Din Urut Saraf", "male", "kl-setapak", "both", "male_only", ["urut_tradisional", "deep_tissue", "bekam"], ["Bahasa Melayu"], "Specialist in nerve (saraf) massage and cupping. Small studio in Setapak or home visit."],
  ["Mei Ling Reflexology", "female", "kl-bukit-bintang", "premises", "all", ["refleksologi", "tui_na"], ["Mandarin", "Cantonese", "English"], "Certified reflexologist. Walk-ins welcome at our Bukit Bintang shop."],
  ["Bangsar Wellness Studio", "female", "kl-bangsar", "premises", "all", ["swedish", "deep_tissue", "thai"], ["English", "Bahasa Melayu"], "Boutique studio with aromatherapy oils and hot towels."],
  ["Kiara Mobile Spa", "female", "kl-mont-kiara", "home_visit", "all", ["swedish", "thai", "refleksologi"], ["English", "Mandarin"], "Spa-quality treatment at your condo. Massage table provided."],
  ["Pak Hamid Urut Kampung", "male", "kl-kepong", "home_visit", "male_only", ["urut_tradisional", "bekam"], ["Bahasa Melayu"], "Urut kampung untuk sakit belakang, angin dan lenguh-lenguh."],
  ["Siti Urut Bersalin", "female", "kl-wangsa-maju", "home_visit", "female_only", ["urut_bersalin", "urut_tradisional"], ["Bahasa Melayu", "English"], "Pakej urut bersalin 3/5/7 hari termasuk barut dan tungku."],
  ["Kumar Sports Therapy", "male", "kl-sri-petaling", "both", "all", ["deep_tissue", "swedish"], ["Tamil", "English", "Bahasa Melayu"], "Sports massage for runners and gym-goers. Trained physiotherapy assistant."],
  ["PJ Healing Hands", "female", "sel-petaling-jaya", "both", "female_only", ["urut_tradisional", "swedish", "refleksologi"], ["Bahasa Melayu", "English"], "Muslimah therapist, ladies only. Studio in SS2 or home visit."],
  ["Shah Alam Bekam & Urut", "male", "sel-shah-alam", "premises", "all", ["bekam", "urut_tradisional"], ["Bahasa Melayu"], "Pusat bekam sunnah dan urut. Pengamal bertauliah."],
  ["Subang Thai Massage", "female", "sel-subang-jaya", "premises", "all", ["thai", "refleksologi"], ["English", "Bahasa Melayu"], "Authentic Thai stretching massage by Thai-trained therapists."],
  ["Puchong Tui Na Centre", "male", "sel-puchong", "premises", "all", ["tui_na", "refleksologi"], ["Mandarin", "Cantonese"], "传统推拿 Traditional Chinese Tui Na and foot reflexology."],
  ["Kak Yati Klang", "female", "sel-klang", "home_visit", "female_only", ["urut_bersalin", "urut_tradisional"], ["Bahasa Melayu"], "Urut ibu bersalin dan urut badan. Sekitar Klang & Shah Alam."],
  ["Kajang Urut Saraf", "male", "sel-kajang", "both", "male_only", ["urut_tradisional", "deep_tissue"], ["Bahasa Melayu"], "Urut saraf, urut patah & terseliuh. Booking awal digalakkan."],
  ["Bangi Muslimah Spa", "female", "sel-bangi", "premises", "female_only", ["swedish", "urut_tradisional", "bekam"], ["Bahasa Melayu", "English"], "Spa muslimah mesra keluarga. Ladies only."],
  ["Cyberjaya Desk Relief", "male", "sel-cyberjaya", "home_visit", "all", ["deep_tissue", "swedish"], ["English", "Bahasa Melayu"], "Neck & shoulder relief for office workers. Lunch-hour sessions available."],
  ["Ampang Aroma Touch", "female", "sel-ampang", "home_visit", "all", ["swedish", "refleksologi"], ["English", "Mandarin"], "Relaxing aromatherapy at home with organic oils."],
  ["Rawang Urut Kampung", "female", "sel-rawang", "home_visit", "female_only", ["urut_tradisional"], ["Bahasa Melayu"], "Urut tradisional untuk wanita sekitar Rawang & Selayang."],
  ["Seri Kembangan Reflexology", "male", "sel-seri-kembangan", "premises", "all", ["refleksologi", "tui_na"], ["Mandarin", "English"], "Open daily till 11pm. Free parking."],
  ["Putrajaya Urut Sihat", "female", "pjy-putrajaya", "home_visit", "female_only", ["urut_tradisional", "urut_bersalin"], ["Bahasa Melayu"], "Melayani kawasan Putrajaya, Cyberjaya dan Dengkil."],
  ["George Town Heritage Massage", "female", "png-george-town", "premises", "all", ["refleksologi", "thai", "tui_na"], ["English", "Mandarin", "Bahasa Melayu"], "Inside a restored shophouse near Armenian Street."],
  ["Bayan Lepas Mobile Therapy", "male", "png-bayan-lepas", "home_visit", "all", ["deep_tissue", "swedish"], ["English", "Tamil"], "Serving the FTZ area and Batu Maung after work hours."],
  ["Butterworth Urut Tradisi", "female", "png-butterworth", "both", "female_only", ["urut_tradisional", "urut_bersalin"], ["Bahasa Melayu"], "Urut tradisi Utara. Sekitar Seberang Perai."],
  ["JB Relax Point", "female", "jhr-johor-bahru", "premises", "all", ["refleksologi", "thai", "swedish"], ["English", "Mandarin", "Bahasa Melayu"], "Near CIQ — perfect after crossing from Singapore."],
  ["Skudai Urut Pak Mat", "male", "jhr-skudai", "home_visit", "male_only", ["urut_tradisional", "bekam"], ["Bahasa Melayu"], "Urut dan bekam untuk lelaki. Sekitar Skudai & UTM."],
  ["Iskandar Wellness", "female", "jhr-iskandar-puteri", "both", "all", ["swedish", "deep_tissue"], ["English"], "Medini & Puteri Harbour. Hotel visits available."],
  ["Ipoh Old Town Reflexology", "male", "prk-ipoh", "premises", "all", ["refleksologi", "tui_na"], ["Cantonese", "Mandarin", "English"], "Family-run since 1998."],
  ["Melaka Urut Nyonya", "female", "mlk-melaka", "home_visit", "female_only", ["urut_tradisional", "urut_bersalin"], ["Bahasa Melayu", "English"], "Traditional postnatal care around Melaka Tengah."],
  ["Seremban Sports Recovery", "male", "ns-seremban", "both", "all", ["deep_tissue", "thai"], ["English", "Bahasa Melayu"], "Recovery massage for athletes and weekend warriors."],
  ["Kuantan Urut Pantai", "female", "phg-kuantan", "home_visit", "female_only", ["urut_tradisional"], ["Bahasa Melayu"], "Urut tradisional Pantai Timur."],
  ["Kota Bharu Urut Kelantan", "female", "ktn-kota-bharu", "both", "female_only", ["urut_tradisional", "urut_bersalin", "bekam"], ["Bahasa Melayu"], "Urut Kelantan asli, tungku dan bertangas."],
  ["KK Borneo Massage", "female", "sbh-kota-kinabalu", "premises", "all", ["refleksologi", "swedish"], ["English", "Bahasa Melayu"], "Close to Gaya Street, relax after island hopping."],
  ["Kuching Urut Sarawak", "male", "swk-kuching", "both", "all", ["urut_tradisional", "deep_tissue"], ["Bahasa Melayu", "English"], "Traditional Sarawakian massage."],
  ["Alor Setar Urut Kedah", "female", "kdh-alor-setar", "home_visit", "female_only", ["urut_tradisional", "urut_bersalin"], ["Bahasa Melayu"], "Urut ibu dalam pantang sekitar Alor Setar."],
];

function priceList(rand: () => number, types: ServiceType[]): ProviderService[] {
  return types.map((type) => {
    const durationMin = type === "urut_bersalin" ? 90 : type === "refleksologi" ? 45 : rand() > 0.5 ? 90 : 60;
    const factor = 0.85 + rand() * 0.4;
    const priceRM = Math.round((BASE_PRICE[type] * factor * (durationMin / 60)) / 5) * 5;
    return { type, durationMin, priceRM };
  });
}

export function seedProviders(): Provider[] {
  const rand = mulberry32(2026);
  return ROWS.map(([name, gender, areaId, mode, servesGender, services, languages, bio], i) => {
    const area = getArea(areaId)!;
    return {
      id: `p${String(i + 1).padStart(3, "0")}`,
      name,
      gender,
      bio,
      phone: `601${Math.floor(10000000 + rand() * 89999999)}`,
      areaId,
      // Small jitter so providers in the same area are not on the exact same point.
      lat: +(area.lat + (rand() - 0.5) * 0.03).toFixed(5),
      lng: +(area.lng + (rand() - 0.5) * 0.03).toFixed(5),
      mode,
      travelRadiusKm: mode === "premises" ? 0 : [10, 15, 20, 25][Math.floor(rand() * 4)],
      servesGender,
      services: priceList(rand, services),
      languages,
      yearsExperience: 2 + Math.floor(rand() * 20),
      rating: +(3.9 + rand() * 1.1).toFixed(1),
      reviewCount: 5 + Math.floor(rand() * 240),
      verified: rand() > 0.3,
      available: rand() > 0.1,
      createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
    };
  });
}
