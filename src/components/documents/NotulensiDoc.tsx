import React, { useState } from "react";
import { Instansi, Kegiatan, Peserta, HasilRapatPoin } from "../../types";
import { KopSurat } from "./KopSurat";
import { formatIndonesianDate, getIndonesianDay, formatIndonesianTime } from "../../utils/helpers";
import { Sparkles, Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp, AlertCircle, Loader2 } from "lucide-react";

interface NotulensiDocProps {
  instansi: Instansi;
  kegiatan: Kegiatan;
  pesertaList: Peserta[];
  hasilRapat: HasilRapatPoin[];
  onUpdateHasilRapat: (hasil: HasilRapatPoin[]) => void;
  notulensiPenandatangan: { jabatan: string; nama: string };
  isPrintPreview?: boolean;
  daftarHadirRowCount?: number;
  daftarHadirUseRealData?: boolean;
  tandaTerimaRowCount?: number;
  tandaTerimaUseRealData?: boolean;
}

export const NotulensiDoc: React.FC<NotulensiDocProps> = ({
  instansi,
  kegiatan,
  pesertaList,
  hasilRapat,
  onUpdateHasilRapat,
  notulensiPenandatangan,
  isPrintPreview = false,
  daftarHadirRowCount = 20,
  daftarHadirUseRealData = false,
  tandaTerimaRowCount = 10,
  tandaTerimaUseRealData = false,
}) => {
  const [rawNotes, setRawNotes] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPesertaExpanded, setIsPesertaExpanded] = useState<boolean>(false);

  const hariName = getIndonesianDay(kegiatan.tanggal);
  const tanggalIndo = formatIndonesianDate(kegiatan.tanggal);
  const kotaKab = instansi.kabupaten || "Probolinggo";

  // Dynamic calculation for participants based on real data or blank rows configuration
  const isUsingRealData = (daftarHadirUseRealData || tandaTerimaUseRealData) && pesertaList.length > 0;
  const jumlahPeserta = isUsingRealData 
    ? pesertaList.length 
    : (daftarHadirRowCount || tandaTerimaRowCount || 20);

  // AI Handler
  const handleGenerateAi = async () => {
    if (!rawNotes.trim()) {
      setAiError("Silakan tempel catatan rapat mentah terlebih dahulu.");
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch("/api/notulensi-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaKegiatan: kegiatan.namaKegiatan,
          acara: kegiatan.acara,
          inputUser: rawNotes,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal menghubungi asisten AI.");
      }

      if (result.success && Array.isArray(result.data)) {
        // Map fields 'judul' to 'poin' based on API schema
        const mappedPoin: HasilRapatPoin[] = result.data.map((item: any) => ({
          poin: item.judul || item.poin || "Hasil Bahasan",
          uraian: item.uraian || "",
        }));

        onUpdateHasilRapat(mappedPoin);
        setRawNotes(""); // Clear on success
      } else {
        throw new Error("Respon AI tidak sesuai dengan format yang diharapkan.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Terjadi kesalahan koneksi ke server.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Manual Editing Utilities
  const handlePoinChange = (index: number, field: keyof HasilRapatPoin, value: string) => {
    const updated = [...hasilRapat];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateHasilRapat(updated);
  };

  const handleAddPoin = () => {
    onUpdateHasilRapat([...hasilRapat, { poin: "", uraian: "" }]);
  };

  const handleRemovePoin = (index: number) => {
    const updated = hasilRapat.filter((_, i) => i !== index);
    onUpdateHasilRapat(updated);
  };

  const handleMovePoin = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === hasilRapat.length - 1) return;

    const updated = [...hasilRapat];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onUpdateHasilRapat(updated);
  };

  const renderDocumentContent = () => (
    <>
      {/* Kop Surat */}
      <KopSurat instansi={instansi} className="!mb-3.5" />

      {/* Judul Dokumen */}
      <div className="text-center mt-1.5 mb-1.5">
        <h2 className="text-[15px] font-bold tracking-wider uppercase leading-snug text-black">
          NOTULENSI
        </h2>
        <p className="text-[11.5px] font-mono font-medium text-black mt-0.5">
          Nomor : {kegiatan.nomorSurat || "015/NOTE/403.401.02/2024"}
        </p>
      </div>

      {/* Daftar Poin A - I */}
      <div className="my-2.5 space-y-0.5 text-[12px] leading-tight">
        {/* A */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">A.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Nama Rapat</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow text-black">{kegiatan.namaKegiatan || "Rapat koordinasi dan Evaluasi BPD"}</span>
        </div>

        {/* B */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">B.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Hari, tanggal</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow text-black">{hariName}, {tanggalIndo}</span>
        </div>

        {/* C */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">C.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Waktu</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow text-black">
            {(() => {
              const start = formatIndonesianTime(kegiatan.waktuMulai) || "16:00";
              const end = formatIndonesianTime(kegiatan.waktuSelesai) || "Selesai";
              return end === "Selesai" || !end
                ? `Pukul ${start} WIB s/d Selesai`
                : `Pukul ${start} s/d ${end} WIB`;
            })()}
          </span>
        </div>

        {/* D */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">D.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Tempat</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow text-black">{kegiatan.tempat || "Balai Desa"}</span>
        </div>

        {/* E */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">E.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Acara</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow text-black">{kegiatan.acara || "Rapat koordinasi dan Evaluasi BPD"}</span>
        </div>

        {/* F */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">F.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Pemimpin Rapat</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow text-black">{kegiatan.pemimpinRapat || instansi.namaKepalaDesa}</span>
        </div>

        {/* G */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">G.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Notulis</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow text-black">{kegiatan.notulis || "Mulyadi, S.Sos"}</span>
        </div>

        {/* H */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">H.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Peserta</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <div className="flex-grow text-black flex items-center">
            <span>{jumlahPeserta} Orang</span>
            {/* Expand / Collapse Peserta (Interactive on UI, hidden on Print) */}
            {pesertaList.length > 0 && (
              <button
                type="button"
                onClick={() => setIsPesertaExpanded(!isPesertaExpanded)}
                className="ml-2 no-print inline-flex items-center gap-0.5 text-emerald-800 hover:text-emerald-950 font-semibold text-[11px] cursor-pointer"
              >
                {isPesertaExpanded ? (
                  <>
                    Sembunyikan Daftar <ChevronUp size={12} />
                  </>
                ) : (
                  <>
                    Lihat Daftar Nama <ChevronDown size={12} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic list rendering based on interactive expansion (hidden from print to save page breaks) */}
        {pesertaList.length > 0 && (
          <div className={`${isPesertaExpanded ? "block" : "hidden"} mt-1 pl-10 text-[11.5px] bg-gray-50/50 p-2 rounded border border-gray-100 max-w-xl no-print`}>
            <ol className="list-decimal pl-4 space-y-1 text-gray-700">
              {pesertaList.map((p) => (
                <li key={p.id} className="font-medium">
                  {p.nama} <span className="text-[10.5px] text-gray-500 font-normal">({p.kedudukan})</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* I - Hasil Rapat */}
        <div className="flex items-start text-black">
          <span className="w-6 font-bold flex-shrink-0 text-left">I.</span>
          <span className="w-36 font-bold flex-shrink-0 text-left">Hasil Rapat</span>
          <span className="w-4 flex-shrink-0 text-center">:</span>
          <span className="flex-grow"></span>
        </div>

        {/* Hasil Rapat list styled like the PDF */}
        <div className="pl-10 mt-1 text-[12px] text-black">
          {hasilRapat.length === 0 ? (
            <p className="text-gray-400 italic font-normal text-xs">Belum ada kesimpulan hasil rapat.</p>
          ) : (
            <div className="space-y-1.5">
              {hasilRapat.map((item, index) => (
                <div key={index} className="flex gap-2 text-justify leading-tight">
                  <span className="font-bold text-black flex-shrink-0 w-4">{index + 1}.</span>
                  <div className="flex-grow">
                    <p className="font-bold text-black text-[12px]">{item.poin}</p>
                    {item.uraian && (
                      <p className="font-normal text-black mt-0.5 pl-2.5 leading-normal whitespace-pre-line border-l border-gray-200">
                        {item.uraian}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Penandatangan */}
      <div className="mt-5 flex justify-end break-inside-avoid">
        <div className="text-center min-w-[250px] pr-8 text-[12px] text-black leading-tight">
          <p className="mb-0.5">
            {kotaKab}, {tanggalIndo}
          </p>
          <p className="font-bold uppercase tracking-wide">
            {notulensiPenandatangan.jabatan || `KEPALA DESA ${instansi.namaDesa.toUpperCase()}`}
          </p>
          <div className="h-11"></div>
          <p className="font-bold uppercase tracking-wide">
            {notulensiPenandatangan.nama || instansi.namaKepalaDesa}
          </p>
        </div>
      </div>
    </>
  );

  if (isPrintPreview) {
    return (
      <div className="document-container notulensi-container document-portrait bg-white text-black font-sans text-[13px] leading-relaxed mx-auto document-font" style={{ width: "100%" }}>
        {renderDocumentContent()}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
      {/* 1. LEFT COLUMN: Combined Config Card */}
      <div className="lg:col-span-5 space-y-6 no-print">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6">
          {/* Section A: AI Assistant */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-700 fill-emerald-100" />
              <h3 className="font-extrabold text-xs text-slate-950 uppercase tracking-wide">Susun Hasil Rapat Otomatis dengan AI</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Tempel catatan diskusi, hasil voting, atau draf coretan kasar rapat Anda. Kecerdasan Buatan (Gemini 3.5 Flash) akan menyulapnya menjadi butir-butir kesimpulan formal berstandar administrasi pemerintahan desa.
            </p>

            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Contoh coretan rapat:&#10;- disetujui beli sound system baru buat RW 3 harga 5juta maks&#10;- bu dewi minta jadwal posyandu dimajuin jadi jam 8 pagi karena jam 10 kepanasan&#10;- sekdes ngingetin spj kuartal 1 segera dikumpulin maksimal senin depan"
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono resize-none bg-gray-50/50"
              disabled={isAiLoading}
              title="Tempel catatan rapat"
            />

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-normal">{aiError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={isAiLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-emerald-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {isAiLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-emerald-950" />
                  Sedang Menyusun Notulensi Resmi...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Susun Notulensi Resmi dengan AI
                </>
              )}
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Section B: Manual Points Editor */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-50 text-emerald-800">
                  <Plus size={14} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-950 uppercase tracking-wide">Butir Hasil Rapat (Bagian I)</h3>
                  <p className="text-[10px] text-gray-450 font-medium">Edit secara manual hasil notulensi Anda di bawah ini.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddPoin}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                Poin Baru
              </button>
            </div>

            {hasilRapat.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-6 bg-slate-50/50 border border-dashed border-gray-200 rounded-lg">
                Belum ada hasil rapat. Gunakan asisten AI di atas atau klik tombol &apos;Poin Baru&apos; untuk menulis manual.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                {hasilRapat.map((item, index) => (
                  <div key={index} className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex gap-2 items-start relative group">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      {index + 1}
                    </span>

                    <div className="flex-grow space-y-2">
                      <input
                        type="text"
                        value={item.poin}
                        onChange={(e) => handlePoinChange(index, "poin", e.target.value)}
                        placeholder="Judul Bahasan (cth: Pembelian Inventaris)"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold bg-white"
                        title={`Judul Bahasan ${index + 1}`}
                      />
                      <textarea
                        value={item.uraian}
                        onChange={(e) => handlePoinChange(index, "uraian", e.target.value)}
                        placeholder="Uraian hasil rapat..."
                        rows={2}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 bg-white resize-none font-medium"
                        title={`Uraian hasil rapat ${index + 1}`}
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleMovePoin(index, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 text-gray-600 rounded disabled:opacity-30 cursor-pointer"
                        title="Pindahkan ke atas"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePoin(index, "down")}
                        disabled={index === hasilRapat.length - 1}
                        className="p-1 hover:bg-gray-200 text-gray-600 rounded disabled:opacity-30 cursor-pointer"
                        title="Pindahkan ke bawah"
                      >
                        <ArrowDown size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePoin(index)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                        title="Hapus poin"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Preview Sheet */}
      <div className="lg:col-span-7 flex justify-start md:justify-center w-full overflow-x-auto pb-4">
        <div className="document-container notulensi-container document-portrait bg-white text-black font-sans text-[13px] leading-relaxed mx-auto document-font shadow-md border border-gray-200" style={{ width: "100%" }}>
          {renderDocumentContent()}
        </div>
      </div>
    </div>
  );
};
