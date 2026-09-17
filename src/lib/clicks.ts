import { supabase } from "./supabase";

const table = "nhatky";

export type ClickRow = {
  id: string;
  kind: string;
  target: string | null;
  ip: string | null;
  location: string | null;
  created_at: string;
};

type VisitorPlace = {
  ip: string | null;
  location: string | null;
};

const vnPlaces: Record<string, string> = {
  hanoi: "Hà Nội",
  hanoicity: "Hà Nội",
  hochiminh: "TP. Hồ Chí Minh",
  hochiminhcity: "TP. Hồ Chí Minh",
  saigon: "TP. Hồ Chí Minh",
  danang: "Đà Nẵng",
  danangcity: "Đà Nẵng",
  cantho: "Cần Thơ",
  haiphong: "Hải Phòng",
  angiang: "An Giang",
  bariavungtau: "Bà Rịa - Vũng Tàu",
  vungtau: "Bà Rịa - Vũng Tàu",
  bacgiang: "Bắc Giang",
  backan: "Bắc Kạn",
  baclieu: "Bạc Liêu",
  bacninh: "Bắc Ninh",
  bentre: "Bến Tre",
  binhdinh: "Bình Định",
  binhduong: "Bình Dương",
  binhphuoc: "Bình Phước",
  binhthuan: "Bình Thuận",
  camau: "Cà Mau",
  caobang: "Cao Bằng",
  daklak: "Đắk Lắk",
  daknong: "Đắk Nông",
  dienbien: "Điện Biên",
  dongnai: "Đồng Nai",
  dongthap: "Đồng Tháp",
  gialai: "Gia Lai",
  hagiang: "Hà Giang",
  hanam: "Hà Nam",
  hatinh: "Hà Tĩnh",
  haugiang: "Hậu Giang",
  hoabinh: "Hòa Bình",
  hungyen: "Hưng Yên",
  khanhhoa: "Khánh Hòa",
  kiengiang: "Kiên Giang",
  kontum: "Kon Tum",
  laichau: "Lai Châu",
  lamdong: "Lâm Đồng",
  langson: "Lạng Sơn",
  laocai: "Lào Cai",
  longan: "Long An",
  namdinh: "Nam Định",
  nghean: "Nghệ An",
  ninhbinh: "Ninh Bình",
  ninhthuan: "Ninh Thuận",
  phutho: "Phú Thọ",
  phuyen: "Phú Yên",
  quangbinh: "Quảng Bình",
  quangnam: "Quảng Nam",
  quangngai: "Quảng Ngãi",
  quangninh: "Quảng Ninh",
  quangtri: "Quảng Trị",
  soctrang: "Sóc Trăng",
  sonla: "Sơn La",
  tayninh: "Tây Ninh",
  thaibinh: "Thái Bình",
  thainguyen: "Thái Nguyên",
  thanhhoa: "Thanh Hóa",
  thuathienhue: "Thừa Thiên Huế",
  hue: "Thừa Thiên Huế",
  tiengiang: "Tiền Giang",
  travinh: "Trà Vinh",
  tuyenquang: "Tuyên Quang",
  vinhlong: "Vĩnh Long",
  vinhphuc: "Vĩnh Phúc",
  yenbai: "Yên Bái",
};

let cachedPlace: VisitorPlace | undefined;
let placeLookup: Promise<VisitorPlace> | null = null;

function foldName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/^(tinh|thanhpho|tp)\s+/i, "")
    .replace(/[^a-z]/g, "");
}

function localName(name: string, inVietnam: boolean) {
  if (!inVietnam) return name;
  return vnPlaces[foldName(name)] ?? name;
}

function joinPlace(parts: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) continue;
    const key = foldName(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    labels.push(trimmed);
  }
  return labels.join(", ") || null;
}

function locationLabel(city: string | null, region: string | null, country: string | null, countryCode: string | null) {
  const inVietnam = countryCode === "VN" || country === "Vietnam";
  const countryName = inVietnam ? "Việt Nam" : country;
  return joinPlace([
    localName(city || "", inVietnam) || city,
    localName(region || "", inVietnam) || region,
    countryName,
  ]);
}

function visitorPlace() {
  if (cachedPlace) return Promise.resolve(cachedPlace);
  if (!placeLookup) {
    placeLookup = fetch("https://ipwho.is/")
      .then((response) => response.json())
      .then((body) => {
        if (!body || body.success === false) return { ip: null, location: null };
        return {
          ip: typeof body.ip === "string" ? body.ip : null,
          location: locationLabel(body.city || null, body.region || null, body.country || null, body.country_code || null),
        };
      })
      .catch(() => ({ ip: null, location: null }))
      .then((place) => {
        cachedPlace = place;
        return place;
      });
  }
  return placeLookup;
}

async function insertClick(row: Record<string, string | null>) {
  if (!supabase) return;
  const { error } = await supabase.from(table).insert(row);
  if (!error) return;
  if (/column/i.test(error.message)) {
    const { kind, target } = row;
    const retry = await supabase.from(table).insert({ kind, target });
    if (retry.error) console.error("Không ghi được lượt bấm:", retry.error.message);
    return;
  }
  console.error("Không ghi được lượt bấm:", error.message);
}

export function logClick(kind: string, target?: string) {
  if (!supabase) return;
  void (async () => {
    const place = await visitorPlace();
    await insertClick({
      kind,
      target: target || null,
      ip: place.ip,
      location: place.location,
    });
  })();
}

function asClickRow(row: {
  id: string;
  kind: string;
  target: string | null;
  created_at: string;
  ip?: string | null;
  location?: string | null;
  province?: string | null;
}): ClickRow {
  return {
    id: row.id,
    kind: row.kind,
    target: row.target,
    ip: row.ip ?? null,
    location: row.location || row.province || null,
    created_at: row.created_at,
  };
}

export async function fetchClicks(): Promise<{ rows: ClickRow[]; total: number }> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const withLocation = await supabase
    .from(table)
    .select("id, kind, target, ip, location, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  if (!withLocation.error) {
    const rows = (withLocation.data ?? []).map(asClickRow);
    return { rows, total: withLocation.count ?? rows.length };
  }

  const withProvince = await supabase
    .from(table)
    .select("id, kind, target, ip, province, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  if (!withProvince.error) {
    const rows = (withProvince.data ?? []).map(asClickRow);
    return { rows, total: withProvince.count ?? rows.length };
  }

  const basic = await supabase
    .from(table)
    .select("id, kind, target, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);
  if (basic.error) throw basic.error;
  const rows = (basic.data ?? []).map(asClickRow);
  return { rows, total: basic.count ?? rows.length };
}
