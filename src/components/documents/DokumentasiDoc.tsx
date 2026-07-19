import React, { useState } from "react";
import { Instansi, Kegiatan, Dokumentasi } from "../../types";
import { KopSurat } from "./KopSurat";
import { Camera, Image as ImageIcon, Trash2, Upload } from "lucide-react";

interface DokumentasiDocProps {
  instansi: Instansi;
  kegiatan: Kegiatan;
  dokumentasiList: Dokumentasi[];
  onUploadFoto: (id: string, base64: string) => void;
  onUpdateKeterangan: (id: string, keterangan: string) => void;
  onTambahSlot: () => void;
  onHapusSlot: (id: string) => void;
  isPrintPreview?: boolean;
}

export const DokumentasiDoc: React.FC<DokumentasiDocProps> = ({
  instansi,
  kegiatan,
  dokumentasiList,
  onUploadFoto,
  onUpdateKeterangan,
  onTambahSlot,
  onHapusSlot,
  isPrintPreview = false,
}) => {
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  // File picker handler
  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUploadFoto(id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Controls panel - hidden during print and preview */}
      {!isPrintPreview && (
        <div className="no-print p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-wrap justify-between items-center gap-4">
          <div>
            <h4 className="font-semibold text-emerald-900 text-[14px]">Pengaturan Dokumentasi</h4>
            <p className="text-[11px] text-emerald-700">Pilih orientasi cetak dan kelola slot foto dokumentasi Anda.</p>
          </div>
          <div className="flex gap-3">
            {/* Orientation Toggle */}
            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setIsLandscape(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${!isLandscape ? "bg-emerald-600 text-white shadow-sm" : "text-gray-700 hover:text-emerald-700"}`}
              >
                Portrait (A4 Tegak)
              </button>
              <button
                type="button"
                onClick={() => setIsLandscape(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${isLandscape ? "bg-emerald-600 text-white shadow-sm" : "text-gray-700 hover:text-emerald-700"}`}
              >
                Landscape (A4 Lebar)
              </button>
            </div>

            <button
              type="button"
              onClick={onTambahSlot}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Camera size={14} />
              Tambah Slot Foto
            </button>
          </div>
        </div>
      )}

      {/* Printable Sheet */}
      <div
        className={`document-container bg-white text-black font-sans text-[13px] leading-relaxed mx-auto document-font ${
          isPrintPreview ? "" : "shadow-md border border-gray-200"
        } ${isLandscape ? "w-full max-w-[297mm] min-h-[210mm]" : "w-full max-w-[210mm] min-h-[297mm]"}`}
        style={{ breakInside: "avoid" }}
      >
        {/* Dynamic page print styling for orientation and normal margins */}
        <style>{`
          @media print {
            @page {
              size: A4 ${isLandscape ? "landscape" : "portrait"} !important;
              margin: 2.54cm !important;
            }
          }
        `}</style>

        {/* Kop Surat */}
        <KopSurat instansi={instansi} />

        {/* Judul Dokumen */}
        <div className="text-center my-6">
          <h2 className="text-[16px] font-bold tracking-wide uppercase leading-snug">
            DOKUMENTASI KEGIATAN
          </h2>
          <h3 className="text-[14px] font-bold tracking-wide uppercase leading-snug mt-1 text-gray-800">
            {kegiatan.namaKegiatan || "Rapat Desa"}
          </h3>
          <p className="text-[12px] font-semibold text-gray-700 uppercase mt-0.5">
            DESA {instansi.namaDesa || "Kecindung"} KEC. {instansi.kecamatan || "Gading"} KAB. {instansi.kabupaten || "Probolinggo"}
          </p>
        </div>

        {/* Photos Stack - Centered 16:9 vertical list of 3 rows as requested */}
        <div className="flex flex-col items-center gap-8 my-8 w-full max-w-[120mm] mx-auto">
          {dokumentasiList.length === 0 ? (
            <div className="w-full text-center py-12 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-xl no-print">
              Belum ada foto dokumentasi. Tambahkan slot menggunakan tombol di atas, lalu unggah foto.
            </div>
          ) : (
            dokumentasiList.map((doc, index) => (
              <div
                key={doc.id}
                className="w-full flex flex-col items-center relative group break-inside-avoid"
                style={{ pageBreakInside: "avoid" }}
              >
                {/* Delete button (hidden on print) */}
                <button
                  type="button"
                  onClick={() => onHapusSlot(doc.id)}
                  className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-lg z-10 no-print opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus Slot"
                >
                  <Trash2 size={14} />
                </button>

                {/* Photo area with 16:9 aspect ratio */}
                <div className="w-full aspect-[16/9] bg-gray-50 border border-gray-300 rounded overflow-hidden relative shadow-sm flex items-center justify-center">
                  {doc.fotoBase64 ? (
                    <img
                      src={doc.fotoBase64}
                      alt={`Dokumentasi ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center">
                      <ImageIcon size={44} className="text-gray-300 mb-2" />
                      <p className="text-[11px] text-gray-400 font-semibold mb-2">Belum ada foto</p>
                      <label className="no-print cursor-pointer px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded hover:bg-emerald-100 transition-colors">
                        <Upload size={10} className="inline mr-1" />
                        PILIH FOTO
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(doc.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Re-upload button over existing photo - hidden on print */}
                  {doc.fotoBase64 && (
                    <label className="no-print absolute bottom-2 right-2 cursor-pointer px-2 py-1 bg-black/75 hover:bg-black/90 text-white text-[9px] rounded flex items-center gap-1">
                      <Upload size={10} />
                      Ganti Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(doc.id, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
