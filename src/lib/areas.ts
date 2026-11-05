import type { Area } from "./types";

/** Malaysian service areas with approximate centre coordinates. */
export const AREAS: Area[] = [
  // Kuala Lumpur
  { id: "kl-bukit-bintang", name: "Bukit Bintang", state: "Kuala Lumpur", lat: 3.1466, lng: 101.7101 },
  { id: "kl-cheras", name: "Cheras", state: "Kuala Lumpur", lat: 3.0857, lng: 101.7423 },
  { id: "kl-kepong", name: "Kepong", state: "Kuala Lumpur", lat: 3.2148, lng: 101.6365 },
  { id: "kl-setapak", name: "Setapak", state: "Kuala Lumpur", lat: 3.1997, lng: 101.7155 },
  { id: "kl-bangsar", name: "Bangsar", state: "Kuala Lumpur", lat: 3.1300, lng: 101.6713 },
  { id: "kl-mont-kiara", name: "Mont Kiara", state: "Kuala Lumpur", lat: 3.1717, lng: 101.6506 },
  { id: "kl-wangsa-maju", name: "Wangsa Maju", state: "Kuala Lumpur", lat: 3.2050, lng: 101.7370 },
  { id: "kl-sri-petaling", name: "Sri Petaling", state: "Kuala Lumpur", lat: 3.0680, lng: 101.6900 },
  // Selangor
  { id: "sel-petaling-jaya", name: "Petaling Jaya", state: "Selangor", lat: 3.1073, lng: 101.6067 },
  { id: "sel-shah-alam", name: "Shah Alam", state: "Selangor", lat: 3.0733, lng: 101.5185 },
  { id: "sel-subang-jaya", name: "Subang Jaya", state: "Selangor", lat: 3.0438, lng: 101.5806 },
  { id: "sel-puchong", name: "Puchong", state: "Selangor", lat: 3.0260, lng: 101.6170 },
  { id: "sel-klang", name: "Klang", state: "Selangor", lat: 3.0449, lng: 101.4456 },
  { id: "sel-kajang", name: "Kajang", state: "Selangor", lat: 2.9935, lng: 101.7874 },
  { id: "sel-bangi", name: "Bangi", state: "Selangor", lat: 2.9264, lng: 101.7790 },
  { id: "sel-cyberjaya", name: "Cyberjaya", state: "Selangor", lat: 2.9213, lng: 101.6559 },
  { id: "sel-ampang", name: "Ampang", state: "Selangor", lat: 3.1500, lng: 101.7600 },
  { id: "sel-rawang", name: "Rawang", state: "Selangor", lat: 3.3213, lng: 101.5767 },
  { id: "sel-seri-kembangan", name: "Seri Kembangan", state: "Selangor", lat: 3.0270, lng: 101.7060 },
  { id: "sel-gombak", name: "Gombak", state: "Selangor", lat: 3.2530, lng: 101.6990 },
  // Putrajaya
  { id: "pjy-putrajaya", name: "Putrajaya", state: "Putrajaya", lat: 2.9264, lng: 101.6964 },
  // Penang
  { id: "png-george-town", name: "George Town", state: "Pulau Pinang", lat: 5.4141, lng: 100.3288 },
  { id: "png-bayan-lepas", name: "Bayan Lepas", state: "Pulau Pinang", lat: 5.2946, lng: 100.2593 },
  { id: "png-butterworth", name: "Butterworth", state: "Pulau Pinang", lat: 5.3991, lng: 100.3638 },
  { id: "png-bukit-mertajam", name: "Bukit Mertajam", state: "Pulau Pinang", lat: 5.3631, lng: 100.4667 },
  // Johor
  { id: "jhr-johor-bahru", name: "Johor Bahru", state: "Johor", lat: 1.4927, lng: 103.7414 },
  { id: "jhr-skudai", name: "Skudai", state: "Johor", lat: 1.5343, lng: 103.6594 },
  { id: "jhr-iskandar-puteri", name: "Iskandar Puteri", state: "Johor", lat: 1.4250, lng: 103.6400 },
  { id: "jhr-batu-pahat", name: "Batu Pahat", state: "Johor", lat: 1.8548, lng: 102.9325 },
  { id: "jhr-muar", name: "Muar", state: "Johor", lat: 2.0442, lng: 102.5689 },
  // Perak
  { id: "prk-ipoh", name: "Ipoh", state: "Perak", lat: 4.5975, lng: 101.0901 },
  { id: "prk-taiping", name: "Taiping", state: "Perak", lat: 4.8500, lng: 100.7333 },
  // Melaka
  { id: "mlk-melaka", name: "Bandar Melaka", state: "Melaka", lat: 2.1896, lng: 102.2501 },
  // Negeri Sembilan
  { id: "ns-seremban", name: "Seremban", state: "Negeri Sembilan", lat: 2.7258, lng: 101.9424 },
  { id: "ns-nilai", name: "Nilai", state: "Negeri Sembilan", lat: 2.8167, lng: 101.8000 },
  // Pahang
  { id: "phg-kuantan", name: "Kuantan", state: "Pahang", lat: 3.8077, lng: 103.3260 },
  // Kedah & Perlis
  { id: "kdh-alor-setar", name: "Alor Setar", state: "Kedah", lat: 6.1248, lng: 100.3678 },
  { id: "kdh-sungai-petani", name: "Sungai Petani", state: "Kedah", lat: 5.6470, lng: 100.4877 },
  { id: "pls-kangar", name: "Kangar", state: "Perlis", lat: 6.4414, lng: 100.1986 },
  // East coast
  { id: "ktn-kota-bharu", name: "Kota Bharu", state: "Kelantan", lat: 6.1254, lng: 102.2381 },
  { id: "trg-kuala-terengganu", name: "Kuala Terengganu", state: "Terengganu", lat: 5.3302, lng: 103.1408 },
  // East Malaysia
  { id: "sbh-kota-kinabalu", name: "Kota Kinabalu", state: "Sabah", lat: 5.9804, lng: 116.0735 },
  { id: "swk-kuching", name: "Kuching", state: "Sarawak", lat: 1.5533, lng: 110.3592 },
  { id: "swk-miri", name: "Miri", state: "Sarawak", lat: 4.3995, lng: 113.9914 },
  { id: "lbn-labuan", name: "Labuan", state: "Labuan", lat: 5.2831, lng: 115.2308 },
];

const byId = new Map(AREAS.map((a) => [a.id, a]));

export function getArea(id: string): Area | undefined {
  return byId.get(id);
}

export const STATES = Array.from(new Set(AREAS.map((a) => a.state)));
