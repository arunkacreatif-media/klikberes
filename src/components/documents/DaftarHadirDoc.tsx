import React from "react";
import { Instansi, Kegiatan, Peserta } from "../../types";
import { KopSurat } from "./KopSurat";
import { formatIndonesianDate, formatIndonesianTime } from "../../utils/helpers";

interface DaftarHadirDocProps {
  instansi: Instansi;
  kegiatan: Kegiatan;
  pesertaList: Peserta[];
  daftarHadirPenandatangan: { jabatanPenutup: string; nama: string };
  isPrintPreview?: boolean;
  rowCount?: number;
  useRealData?: boolean;
}

export const DaftarHadirDoc: React.FC<DaftarHadirDocProps> = ({
  instansi,
  kegiatan,
  pesertaList,
  daftarHadirPenandatangan,
  isPrintPreview = false,
  rowCount = 20,
  useRealData = false,
}) => {
  const tanggalIndo = formatIndonesianDate(kegiatan.tanggal);
  const kotaKab = instansi.kabupaten || "Probolinggo";
  const namaDesa = instansi.namaDesa || "Kecindung";
  const tahun = kegiatan.tahunKegiatan || new Date(kegiatan.tanggal || "2026").getFullYear().toString();

  // Smart padding logic to always render exactly rowCount lines
  const rowsToRender: Peserta[] = [];
  if (useRealData && pesertaList.length > 0) {
    // Add real participants
    rowsToRender.push(...pesertaList);
    // Pad with empty rows up to rowCount
    if (rowsToRender.length < rowCount) {
      const padCount = rowCount - rowsToRender.length;
      for (let i = 0; i < padCount; i++) {
        rowsToRender.push({
          id: `pad-row-${i}`,
          kegiatanId: kegiatan.id || "",
          no: rowsToRender.length + 1,
          nama: "",
          kedudukan: "",
          alamat: "",
          penerimaan: 0,
          pph21: 0,
          jumlahPenerimaan: 0,
        });
      }
    }
  } else {
    // Just empty rows of length rowCount
    for (let i = 0; i < rowCount; i++) {
      rowsToRender.push({
        id: `empty-row-${i}`,
        kegiatanId: kegiatan.id || "",
        no: i + 1,
        nama: "",
        kedudukan: "",
        alamat: "",
        penerimaan: 0,
        pph21: 0,
        jumlahPenerimaan: 0,
      });
    }
  }

  return (
    <div className={`daftar-hadir-container document-portrait bg-white text-black font-sans leading-relaxed mx-auto document-font ${isPrintPreview ? "" : "shadow-md border border-gray-200"}`} style={{ width: "100%", fontSize: "11pt" }}>
      {/* Dynamic page print styling to enforce normal 2.54cm margins */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 2.54cm !important;
          }
        }
      `}</style>

      {/* Kop Surat */}
      <KopSurat instansi={instansi} />

      {/* Judul Dokumen */}
      <div className="text-center my-3">
        <h2 className="text-[15px] font-bold tracking-wide uppercase leading-tight">
          DAFTAR HADIR KEGIATAN
        </h2>
        <h3 className="text-[13px] font-bold tracking-wide uppercase leading-tight mt-0.5 text-black">
          {kegiatan.namaKegiatan || "Rapat Desa"} TAHUN {tahun}
        </h3>
        <p className="text-[11px] font-semibold text-black uppercase mt-0.5">
          DESA {namaDesa} KECAMATAN {instansi.kecamatan || "Gading"} KABUPATEN {kotaKab}
        </p>
      </div>

      {/* Rincian Singkat Rapat */}
      <div className="mb-2 text-[11px] bg-gray-50/50 p-2 rounded-md border border-gray-100">
        <table className="border-none text-[11px] text-black w-full max-w-xl">
          <tbody>
            <tr>
              <td className="py-0.5 font-semibold text-black w-32">Hari / Tanggal</td>
              <td className="py-0.5">: {kegiatan.hari || "Senin"}, {tanggalIndo}</td>
            </tr>
            <tr>
              <td className="py-0.5 font-semibold text-black">Waktu</td>
              <td className="py-0.5">
                {(() => {
                  const start = formatIndonesianTime(kegiatan.waktuMulai) || "09:00";
                  const end = formatIndonesianTime(kegiatan.waktuSelesai) || "Selesai";
                  return end === "Selesai" || !end
                    ? `: Pukul ${start} WIB s/d Selesai`
                    : `: Pukul ${start} s/d ${end} WIB`;
                })()}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 font-semibold text-black">Tempat</td>
              <td className="py-0.5">: {kegiatan.tempat || "Balai Desa"}</td>
            </tr>
            <tr>
              <td className="py-0.5 font-semibold text-black">Acara</td>
              <td className="py-0.5">: {kegiatan.acara || "Koordinasi"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tabel Peserta */}
      <table className="w-full table-fixed border-collapse border border-black my-3" style={{ fontSize: "11pt" }}>
        <thead>
          <tr className="bg-gray-100 font-bold text-center">
            <th className="border border-black px-2 py-1.5 text-center font-bold" style={{ width: "5%" }} rowSpan={2}>No</th>
            <th className="border border-black px-3 py-1.5 text-center font-bold" style={{ width: "30%" }} rowSpan={2}>Nama</th>
            <th className="border border-black px-3 py-1.5 text-center font-bold" style={{ width: "20%" }} rowSpan={2}>UNSUR</th>
            <th className="border border-black px-3 py-1.5 text-center font-bold" style={{ width: "19%" }} rowSpan={2}>ALAMAT</th>
            <th className="border border-black px-3 py-1 text-center font-bold" style={{ width: "26%" }} colSpan={2}>Tanda Tangan</th>
          </tr>
          <tr className="bg-gray-100">
            <th className="border border-black p-0 h-0" style={{ width: "13%" }}></th>
            <th className="border border-black p-0 h-0" style={{ width: "13%" }}></th>
          </tr>
        </thead>
        <tbody>
          {rowsToRender.map((peserta, index) => {
            const noStr = (index + 1).toString();
            const isGanjil = (index + 1) % 2 !== 0;

            return (
              <tr 
                key={peserta.id} 
                className="hover:bg-gray-50/50 break-inside-avoid"
                style={{ height: "1.0cm" }}
              >
                {/* No Column */}
                <td className="border border-black px-2 text-center font-bold" style={{ width: "5%" }}>
                  {index + 1}
                </td>
                
                {/* Nama Column */}
                <td className="border border-black px-3 font-medium" style={{ width: "30%" }}>
                  {peserta.nama || ""}
                </td>
                
                {/* UNSUR Column */}
                <td className="border border-black px-3 text-black" style={{ width: "20%" }}>
                  {peserta.kedudukan || ""}
                </td>
                
                {/* ALAMAT Column */}
                <td className="border border-black px-3 text-black" style={{ width: "19%" }}>
                  {peserta.alamat || ""}
                </td>
                
                {/* Staggered double-column signature with bottom-left number alignment */}
                {isGanjil ? (
                  <>
                    <td 
                      className="border border-black px-2 pb-1 pt-2 align-bottom text-left select-none font-sans text-[10px] font-bold" 
                      style={{ width: "13%" }}
                    >
                      {noStr}.
                    </td>
                    <td className="border border-black" style={{ width: "13%" }}></td>
                  </>
                ) : (
                  <>
                    <td className="border border-black" style={{ width: "13%" }}></td>
                    <td 
                      className="border border-black px-2 pb-1 pt-2 align-bottom text-left select-none font-sans text-[10px] font-bold" 
                      style={{ width: "13%" }}
                    >
                      {noStr}.
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer Penutup */}
      <div className="mt-12 flex justify-between items-start break-inside-avoid">
        <div className="w-1/2">
          {/* Sisi kiri kosong untuk penyeimbang */}
        </div>
        <div className="w-1/2 text-center pl-12 pr-4">
          <p className="font-sans text-[12px] text-black mb-1">
            {kotaKab}, {tanggalIndo}
          </p>
          <div className="whitespace-pre-line font-bold uppercase text-[12px] leading-tight text-black">
            {daftarHadirPenandatangan.jabatanPenutup || `MENGETAHUI,\nKEPALA DESA ${namaDesa.toUpperCase()}`}
          </div>
          <div className="h-20"></div>
          <p className="font-bold uppercase text-[13px] leading-tight text-black">
            {daftarHadirPenandatangan.nama || instansi.namaKepalaDesa}
          </p>
        </div>
      </div>
    </div>
  );
};
