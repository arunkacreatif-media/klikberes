export interface Instansi {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  alamatKantor: string;
  kodePos: string;
  emailDesa: string;
  websiteDesa: string;
  logoUrl: string; // Base64 or placeholder URL
  namaKepalaDesa: string;
}

export interface Kegiatan {
  id: string;
  nomorSurat: string;
  namaKegiatan: string;
  hari: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  tempat: string;
  acara: string;
  catatan: string;
  pemimpinRapat: string;
  notulis: string;
  tahunKegiatan: string;
  penerimaUndangan?: string; // Menyimpan penerima undangan secara permanen
  tipeDokumen?: "bundling" | "undangan" | "daftarHadir" | "tandaTerima" | "notulensi";
}

export interface Peserta {
  id: string;
  kegiatanId: string;
  no: number;
  nama: string;
  kedudukan: string;
  alamat: string;
  penerimaan: number; // nominal bantuan transport
  pph21: number;      // nominal pajak PPh 21
  jumlahPenerimaan: number; // hasil bersih
  tandaTangan?: string; // empty or custom string
}

export interface Dokumentasi {
  id: string;
  kegiatanId: string;
  fotoBase64: string;
  keterangan: string;
}

export interface HasilRapatPoin {
  poin: string; // Judul poin
  uraian: string; // Uraian detail
}

export interface Notulensi {
  kegiatanId: string;
  hasilRapat: HasilRapatPoin[];
}

export interface PenandaTanganJabatanNama {
  jabatan: string;
  nama: string;
}

export interface PenandaTanganTigaKolom {
  kiri: { label: string; nama: string };
  tengah: { label: string; nama: string };
  kanan: { label: string; nama: string };
}

export interface PenandaTangan {
  daftarHadir: { jabatanPenutup: string; nama: string };
  tandaTerima: PenandaTanganTigaKolom;
  undangan: PenandaTanganJabatanNama;
  notulensi: PenandaTanganJabatanNama;
}
