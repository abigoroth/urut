import { getArea } from "./areas";
import type { Gender, Provider, ProviderService, Review, ServesGender, ServiceMode, ServiceType, Verification } from "./types";

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

const CERTIFICATES: Record<ServiceType, string> = {
  urut_tradisional: "SKM Level 2 – Traditional Malay Massage",
  urut_bersalin: "Certificate in Postnatal Care (Urut Bersalin)",
  refleksologi: "Certificate in Foot Reflexology (120 hours)",
  thai: "Thai Massage Certificate – Level 2",
  swedish: "Diploma in Spa Therapy",
  deep_tissue: "Certificate in Sports Massage",
  tui_na: "Certificate in Tui Na Therapy",
  bekam: "Certificate in Cupping Therapy (Bekam)",
};

const FEMALE_NAMES = ["Aisyah", "Farah", "Mei Ling", "Priya", "Siti", "Kavitha", "Nadia", "Liyana", "Rachel", "Hui Min", "Nurul", "Shalini"];
const MALE_NAMES = ["Hafiz", "Daniel", "Amir", "Wei Jie", "Zul", "Jason", "Arun", "Faiz", "Kelvin", "Rizal", "Ganesh", "Irfan"];

const COMMENTS: Record<number, string[]> = {
  5: [
    "Very professional and on time. My back feels so much better.",
    "Urut sangat sedap, badan rasa ringan. Terima kasih!",
    "Tangan berbisa, sakit pinggang terus hilang.",
    "Clean, friendly, and explained everything before starting.",
    "Arrived on time and brought her own mat and oils. Highly recommended.",
    "Servis terbaik, harga pun berpatutan. Akan repeat lagi.",
    "Good pressure, really helped my shoulder pain after long hours at the desk.",
    "Selesa dan mesra. Rasa macam dengan keluarga sendiri.",
  ],
  4: [
    "Gentle but effective. Will book again.",
    "Bagus, cuma lambat 10 minit. Urut memang sedap.",
    "Nice session, would love a bit more time on the legs next time.",
    "Servis okay dan profesional.",
  ],
  3: ["Okay session, pressure a bit too strong for me.", "Boleh tahan, tapi tempat agak sempit."],
};

function seedVerification(rand: () => number, i: number, primary: ServiceType, name: string): Verification {
  const roll = i === 0 ? 0 : rand();
  const submittedAt = new Date(Date.UTC(2026, 1, 1 + i)).toISOString();
  if (roll < 0.55) {
    const certified = i === 0 || rand() < 0.6;
    return {
      status: "verified",
      idVerified: true,
      certified,
      legalName: name,
      icLast4: String(1000 + Math.floor(rand() * 8999)),
      certificateName: certified ? CERTIFICATES[primary] : undefined,
      documents: certified ? ["ic_front", "selfie", "certificate"] : ["ic_front", "selfie"],
      submittedAt,
      reviewedAt: new Date(Date.UTC(2026, 1, 3 + i)).toISOString(),
    };
  }
  if (roll < 0.65) return { status: "pending", idVerified: false, certified: false, documents: ["ic_front", "selfie"], submittedAt };
  return { status: "unverified", idVerified: false, certified: false };
}

export function averageRating(reviews: Pick<Review, "rating">[]): number {
  if (!reviews.length) return 0;
  return +(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
}

export function seedData(): { providers: Provider[]; reviews: Review[] } {
  const rand = mulberry32(2026);
  const reviews: Review[] = [];
  const providers = ROWS.map(([name, gender, areaId, mode, servesGender, services, languages, bio], i): Provider => {
    const area = getArea(areaId)!;
    const id = `p${String(i + 1).padStart(3, "0")}`;
    const phone = `601${Math.floor(10000000 + rand() * 89999999)}`;
    const lat = +(area.lat + (rand() - 0.5) * 0.03).toFixed(5);
    const lng = +(area.lng + (rand() - 0.5) * 0.03).toFixed(5);
    const travelRadiusKm = mode === "premises" ? 0 : [10, 15, 20, 25][Math.floor(rand() * 4)];
    const priced = priceList(rand, services);
    const yearsExperience = 2 + Math.floor(rand() * 20);

    // Reviews from (simulated) completed bookings.
    const n = i === 0 ? 12 : 2 + Math.floor(rand() * 8);
    const names = servesGender === "male_only" ? MALE_NAMES : servesGender === "female_only" ? FEMALE_NAMES : [...FEMALE_NAMES, ...MALE_NAMES];
    const mine: Review[] = [];
    for (let k = 0; k < n; k++) {
      const r = rand();
      const rating = r < 0.68 ? 5 : r < 0.92 ? 4 : 3;
      const bank = COMMENTS[rating];
      mine.push({
        id: `r_${id}_${k}`,
        providerId: id,
        bookingId: `seed_${id}_${k}`,
        customerName: names[Math.floor(rand() * names.length)],
        serviceType: services[Math.floor(rand() * services.length)],
        rating,
        comment: bank[Math.floor(rand() * bank.length)],
        createdAt: new Date(Date.UTC(2026, 9, 30 - k * 3 - Math.floor(rand() * 3), 10)).toISOString(),
      });
    }
    reviews.push(...mine);

    return {
      id,
      name,
      gender,
      bio,
      phone,
      areaId,
      lat,
      lng,
      mode,
      travelRadiusKm,
      servesGender,
      services: priced,
      languages,
      yearsExperience,
      rating: averageRating(mine),
      reviewCount: mine.length,
      verification: seedVerification(rand, i, services[0], name),
      available: i === 0 || rand() > 0.1,
      createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
    };
  });
  return { providers, reviews };
}
