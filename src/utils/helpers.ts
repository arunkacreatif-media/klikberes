import { Instansi, Kegiatan, Peserta, Dokumentasi, Notulensi, PenandaTangan } from "../types";

// A beautiful default village seal in SVG form
export const DEFAULT_LOGO_SVG = "";

export const DEFAULT_INSTANSI: Instansi = {
  namaDesa: "",
  kecamatan: "",
  kabupaten: "",
  alamatKantor: "",
  kodePos: "",
  emailDesa: "",
  websiteDesa: "",
  logoUrl: "",
  namaKepalaDesa: "",
};

export const DUMMY_KEGIATAN: Kegiatan = {
  id: "",
  nomorSurat: "",
  namaKegiatan: "",
  hari: "",
  tanggal: "",
  waktuMulai: "",
  waktuSelesai: "",
  tempat: "",
  acara: "",
  catatan: "",
  pemimpinRapat: "",
  notulis: "",
  tahunKegiatan: "",
};

export const DUMMY_PESERTA: Peserta[] = [];

export const DUMMY_DOKUMENTASI: Dokumentasi[] = [];

export const DUMMY_NOTULENSI: Notulensi = {
  kegiatanId: "",
  hasilRapat: []
};

export const DEFAULT_PENANDATANGAN = (instansi: Instansi): PenandaTangan => {
  const kades = instansi.namaKepalaDesa || "";
  const desa = instansi.namaDesa || "";
  return {
    daftarHadir: {
      jabatanPenutup: `Mengetahui,\nKepala Desa ${desa}`,
      nama: kades
    },
    tandaTerima: {
      kiri: { label: `Mengetahui,\nKepala Desa Selaku PKPKD`, nama: kades },
      tengah: { label: `Setuju dibayar,\nSekretaris Desa Selaku Koordinator PPKD`, nama: "" },
      kanan: { label: `Lunas Dibayar,\nBendahara Desa`, nama: "" }
    },
    undangan: {
      jabatan: `Kepala Desa ${desa}`,
      nama: kades
    },
    notulensi: {
      jabatan: `Kepala Desa ${desa}`,
      nama: kades
    }
  };
};

// Auto-generate Indonesian Day from Date String
export const getIndonesianDay = (dateStr: string): string => {
  if (!dateStr) return "Senin";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Senin";
  return days[date.getDay()];
};

// Format Date as "16 Juli 2026"
export const formatIndonesianDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Format Rupiah currency
export const formatRupiah = (amount: number): string => {
  if (amount === undefined || amount === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace("IDR", "Rp");
};

// Format Time to Clean Indonesian Western Time (WIB)
export const formatIndonesianTime = (timeStr: string): string => {
  if (!timeStr) return "";

  const trimmed = timeStr.trim();

  // If it's a UTC ISO string (ends with Z or contains offset)
  if (trimmed.includes("T") && (trimmed.endsWith("Z") || /([+-]\d{2}:\d{2}|[+-]\d{4})$/.test(trimmed))) {
    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const formatter = new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta"
        });
        return formatter.format(date).replace(/\./g, ":");
      }
    } catch (e) {
      // fallback
    }
  }

  // If it's an ISO string without timezone indicator (e.g., 1899-12-30T09:00:00),
  // extract the local time directly from the string to prevent offset shift.
  if (trimmed.includes("T")) {
    const match = trimmed.match(/T(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }

  // If it's a standard HH:mm:ss or HH:mm format
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const hh = match[1].padStart(2, "0");
    const mm = match[2];
    return `${hh}:${mm}`;
  }

  return trimmed;
};

