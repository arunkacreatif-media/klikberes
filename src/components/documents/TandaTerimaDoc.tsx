import React, { useState } from "react";
import { Instansi, Kegiatan, Peserta, PenandaTangan } from "../../types";
import { KopSurat } from "./KopSurat";
import { formatIndonesianDate, formatRupiah } from "../../utils/helpers";

interface TandaTerimaDocProps {
  instansi: Instansi;
  kegiatan: Kegiatan;
  pesertaList: Peserta[];
  onUpdatePenerimaan: (id: string, nominal: number) => void;
  onUpdatePph21Persen: (persen: number) => void;
  onBatchUpdatePenerimaan?: (nominal: number) => void;
  pph21Persen: number; // e.g. 5 for 5%
  tandaTerimaPenandatangan: PenandaTangan["tandaTerima"];
  isPrintPreview?: boolean;
  rowCount?: number;
  useRealData?: boolean;
}

export const TandaTerimaDoc: React.FC<TandaTerimaDocProps> = ({
  instansi,
  kegiatan,
  pesertaList,
  onUpdatePenerimaan,
  onUpdatePph21Persen,
  onBatchUpdatePenerimaan,
  pph21Persen,
  tandaTerimaPenandatangan,
  isPrintPreview = false,
  rowCount = 10,
  useRealData = false,
}) => {
  const [batchNominal, setBatchNominal] = useState<number>(100000);
  const tanggalIndo = formatIndonesianDate(kegiatan.tanggal);
  const kotaKab = instansi.kabupaten || "Probolinggo";
  const namaDesa = instansi.namaDesa || "Kecindung";
  const tahun = kegiatan.tahunKegiatan || new Date(kegiatan.tanggal || "2026").getFullYear().toString();

  const isUsingRealData = useRealData && pesertaList.length > 0;

  // Aggregate calculations
  const totalPenerimaan = isUsingRealData ? pesertaList.reduce((sum, p) => sum + (p.penerimaan || 0), 0) : 0;
  const totalPph21 = isUsingRealData ? pesertaList.reduce((sum, p) => sum + (p.pph21 || 0), 0) : 0;
  const totalJumlahPenerimaan = isUsingRealData ? pesertaList.reduce((sum, p) => sum + (p.jumlahPenerimaan || 0), 0) : 0;

  const rowsToRender = isUsingRealData 
    ? pesertaList 
    : Array.from({ length: rowCount }, (_, i) => ({
        id: `empty-row-${i}`,
        nama: "",
        kedudukan: "",
        penerimaan: null,
        pph21: null,
        jumlahPenerimaan: null,
      }));

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Controls panel - hidden during print and preview */}
      {!isPrintPreview && (
        <div className="no-print p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-1.5">
              <span className="p-1 bg-emerald-100 rounded-lg text-emerald-800">💸</span>
              Pengaturan & Pengisian Bantuan Transport
            </h4>
            <p className="text-[11px] text-emerald-700/90 leading-tight">
              Pajak PPh 21, diterima bersih, dan jumlah total akan dihitung secara otomatis.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* PPh 21 Tarif */}
            <div className="flex items-center gap-2 bg-white/60 border border-emerald-100 px-3 py-1.5 rounded-lg">
              <label htmlFor="pph-input" className="text-xs font-semibold text-gray-700">Tarif PPh 21:</label>
              <div className="relative flex items-center">
                <input
                  id="pph-input"
                  type="number"
                  min="0"
                  max="100"
                  value={pph21Persen}
                  onChange={(e) => onUpdatePph21Persen(Number(e.target.value))}
                  className="w-14 border border-emerald-200 rounded px-1.5 py-1 text-xs text-center pr-4 focus:outline-none focus:border-emerald-500 font-bold bg-white"
                />
                <span className="absolute right-1 text-xs text-gray-400">%</span>
              </div>
            </div>

            {/* Pengisian Otomatis Semua Baris */}
            {isUsingRealData && onBatchUpdatePenerimaan && (
              <div className="flex items-center gap-2 bg-emerald-700/5 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <label htmlFor="batch-transport-input" className="text-xs font-semibold text-gray-700">Isi Semua Baris:</label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-[10px] text-gray-400 font-mono">Rp</span>
                    <input
                      id="batch-transport-input"
                      type="number"
                      min="0"
                      step="5000"
                      value={batchNominal}
                      onChange={(e) => setBatchNominal(Number(e.target.value))}
                      placeholder="100000"
                      className="w-24 border border-emerald-200 rounded pl-6 pr-1.5 py-1 text-xs font-bold text-center font-mono focus:outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onBatchUpdatePenerimaan(batchNominal)}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                    title="Terapkan nominal ini ke semua peserta"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}

            {!isUsingRealData && (
              <div className="text-[11px] text-amber-855 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                <span>💡 Tip:</span>
                <span>Aktifkan mode <strong>"Gunakan Data Asli"</strong> di panel kanan agar Anda dapat mengisi nominal transport otomatis dan menggunakan pengisian batch.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Sheet */}
      <div className={`tanda-terima-container document-portrait bg-white text-black font-sans text-[12px] leading-relaxed mx-auto document-font ${isPrintPreview ? "" : "shadow-md border border-gray-200"}`} style={{ width: "100%" }}>
        {/* Dynamic page print styling - margin normal 2.54cm di semua sisi */}
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
        <div className="text-center my-6">
          <h2 className="text-[15px] font-bold tracking-wide uppercase leading-snug">
            DAFTAR PENERIMAAN BANTUAN TRANSPORT
          </h2>
          <h3 className="text-[13px] font-bold tracking-wide uppercase leading-snug mt-1 text-black">
            {kegiatan.namaKegiatan || "Rapat Desa"} TAHUN {tahun}
          </h3>
          <p className="text-[11px] font-semibold text-black uppercase mt-0.5">
            DESA {namaDesa} KECAMATAN {instansi.kecamatan || "Gading"} KABUPATEN {kotaKab}
          </p>
        </div>

        {/* Tabel Tanda Terima */}
        <table className="w-full table-fixed border-collapse border-2 border-black text-[11px] my-6">
          <thead>
            <tr className="bg-gray-100 text-center font-bold">
              <th className="border border-black px-1.5 py-2.5 text-center font-bold align-middle bg-gray-100" style={{ width: "5%" }} rowSpan={2}>No</th>
              <th className="border border-black px-2 py-2.5 text-center font-bold align-middle bg-gray-100" style={{ width: "17%" }} rowSpan={2}>Nama Penerima</th>
              <th className="border border-black px-2 py-2.5 text-center font-bold align-middle bg-gray-100" style={{ width: "12%" }} rowSpan={2}>Kedudukan / Jabatan</th>
              <th className="border border-black px-2 py-2.5 text-center font-bold align-middle bg-gray-100" style={{ width: "13%" }} rowSpan={2}>
                Penerimaan<br />(Rp)
              </th>
              <th className="border border-black px-2 py-2.5 text-center font-bold align-middle bg-gray-100" style={{ width: "13%" }} rowSpan={2}>
                PPh 21<br />({pph21Persen}%)
              </th>
              <th className="border border-black px-2 py-2.5 text-center font-bold align-middle bg-gray-100" style={{ width: "13%" }} rowSpan={2}>
                Diterima Bersih
              </th>
              <th className="border border-black px-2 py-1.5 text-center font-bold align-middle bg-gray-100" style={{ width: "26%" }} colSpan={2}>
                Tanda Tangan
              </th>
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
                  <td className="border border-black px-1.5 text-center align-middle font-bold" style={{ width: "5%" }}>{index + 1}</td>
                  <td className="border border-black px-2 text-center align-middle font-medium truncate" style={{ width: "17%" }}>
                    {peserta.nama || <span className="text-gray-300 select-none block truncate">......................</span>}
                  </td>
                  <td className="border border-black px-2 text-center align-middle text-black truncate" style={{ width: "12%" }}>
                    {peserta.kedudukan || <span className="text-gray-300 select-none block truncate">..................</span>}
                  </td>
                  {/* Editable / Viewable Nominal */}
                  <td className="border border-black px-2 text-center align-middle font-medium truncate" style={{ width: "13%" }}>
                    {isUsingRealData ? (
                      !isPrintPreview ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex items-center justify-center no-print w-full max-w-[110px] mx-auto gap-0.5">
                            <span className="text-[11px] text-black font-semibold select-none">Rp</span>
                            <input
                              type="text"
                              value={peserta.penerimaan === 0 ? "" : (peserta.penerimaan || 0).toLocaleString("id-ID")}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, "");
                                const numValue = rawValue === "" ? 0 : Number(rawValue);
                                onUpdatePenerimaan(peserta.id, numValue);
                              }}
                              placeholder="0"
                              className="w-16 text-left text-[11px] focus:outline-none font-semibold bg-transparent border-none p-0 outline-none text-black"
                              title="Nominal Transport"
                            />
                          </div>
                          <span className="hidden print:inline">{formatRupiah(peserta.penerimaan || 0)}</span>
                        </div>
                      ) : (
                        <span className="text-black">{formatRupiah(peserta.penerimaan || 0)}</span>
                      )
                    ) : (
                      <span className="text-gray-300 select-none block truncate">..................</span>
                    )}
                  </td>
                  <td className="border border-black px-2 text-center align-middle text-black truncate" style={{ width: "13%" }}>
                    {isUsingRealData ? formatRupiah(peserta.pph21 || 0) : <span className="text-gray-300 select-none block truncate">..................</span>}
                  </td>
                  <td className="border border-black px-2 text-center align-middle font-semibold text-black truncate" style={{ width: "13%" }}>
                    {isUsingRealData ? formatRupiah(peserta.jumlahPenerimaan || 0) : <span className="text-gray-300 select-none block truncate">..................</span>}
                  </td>
                  {/* Staggered double-column signature with bottom-left number alignment */}
                  {isGanjil ? (
                    <>
                      <td 
                        className="border border-black pl-1.5 pb-1 align-bottom text-left select-none font-sans text-[10px] font-bold" 
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
                        className="border border-black pl-1.5 pb-1 align-bottom text-left select-none font-sans text-[10px] font-bold" 
                        style={{ width: "13%" }}
                      >
                        {noStr}.
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="bg-gray-100 font-bold border-t-2 border-black break-inside-avoid" style={{ height: "1.0cm" }}>
              <td colSpan={3} className="border border-black px-3 py-2 text-center align-middle uppercase font-bold">
                JUMLAH TOTAL (RP)
              </td>
              <td className="border border-black px-2 py-2 text-center align-middle text-black font-bold" style={{ width: "13%" }}>
                {isUsingRealData ? formatRupiah(totalPenerimaan) : <span className="text-gray-300 select-none block truncate">..................</span>}
              </td>
              <td className="border border-black px-2 py-2 text-center align-middle text-black font-bold" style={{ width: "13%" }}>
                {isUsingRealData ? formatRupiah(totalPph21) : <span className="text-gray-300 select-none block truncate">..................</span>}
              </td>
              <td className="border border-black px-2 py-2 text-center align-middle text-black font-bold" style={{ width: "13%" }}>
                {isUsingRealData ? formatRupiah(totalJumlahPenerimaan) : <span className="text-gray-300 select-none block truncate">..................</span>}
              </td>
              <td className="border border-black bg-gray-100" colSpan={2} style={{ width: "26%" }}></td>
            </tr>
          </tbody>
        </table>

        {/* 3-Column Footer Penandatangan */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center text-[11px] leading-tight break-inside-avoid" style={{ pageBreakInside: "avoid" }}>
          {/* Kolom Kiri - Kepala Desa */}
          <div className="flex flex-col justify-between h-40">
            <div className="whitespace-pre-line font-bold uppercase text-black">
              {tandaTerimaPenandatangan.kiri.label || `MENGETAHUI,\nKEPALA DESA SELAKU PKPKD`}
            </div>
            <div>
              <p className="font-bold uppercase text-[12px] text-black">
                {tandaTerimaPenandatangan.kiri.nama || instansi.namaKepalaDesa}
              </p>
            </div>
          </div>

          {/* Kolom Tengah - Sekdes */}
          <div className="flex flex-col justify-between h-40">
            <div className="whitespace-pre-line font-bold uppercase text-black">
              {tandaTerimaPenandatangan.tengah.label || `SETUJU DIBAYAR,\nSEKRETARIS DESA SELAKU KOORDINATOR PPKD`}
            </div>
            <div>
              <p className="font-bold uppercase text-[12px] text-black">
                {tandaTerimaPenandatangan.tengah.nama}
              </p>
            </div>
          </div>

          {/* Kolom Kanan - Bendahara */}
          <div className="flex flex-col justify-between h-40">
            <div>
              <p className="text-black mb-1">{namaDesa}, {tanggalIndo}</p>
              <div className="whitespace-pre-line font-bold uppercase text-black">
                {tandaTerimaPenandatangan.kanan.label || `LUNAS DIBAYAR,\nBENDAHARA DESA`}
              </div>
            </div>
            <div>
              <p className="font-bold uppercase text-[12px] text-black">
                {tandaTerimaPenandatangan.kanan.nama}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};