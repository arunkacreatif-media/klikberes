import React from "react";
import { Instansi, Kegiatan } from "../../types";
import { KopSurat } from "./KopSurat";
import { formatIndonesianDate, getIndonesianDay, formatIndonesianTime } from "../../utils/helpers";

interface UndanganDocProps {
  instansi: Instansi;
  kegiatan: Kegiatan;
  undanganPenandatangan: { jabatan: string; nama: string };
  isPrintPreview?: boolean;
  onUpdatePenerima?: (penerima: string) => void;
}

export const UndanganDoc: React.FC<UndanganDocProps> = ({
  instansi,
  kegiatan,
  undanganPenandatangan,
  isPrintPreview = false,
  onUpdatePenerima,
}) => {
  const ythPenerima = kegiatan.penerimaUndangan || "Bpk/Ibu/Sdr/i..................................";

  const hariName = getIndonesianDay(kegiatan.tanggal);
  const tanggalIndo = formatIndonesianDate(kegiatan.tanggal);
  const kotaKab = instansi.kabupaten || "Probolinggo";

  return (
    <div className={`document-container bg-white text-black font-sans text-[14px] leading-relaxed mx-auto document-font ${isPrintPreview ? "" : "shadow-md border border-gray-200 max-w-[210mm] min-h-[297mm]"}`} style={{ width: "100%" }}>
      {/* Kop Surat */}
      <KopSurat instansi={instansi} />

      {/* Tanggal & Nomor */}
      <div className="grid grid-cols-12 gap-4 mt-6 mb-4 text-[14px]">
        {/* Left Side: Nomor, Lampiran, Perihal */}
        <div className="col-span-7">
          <table className="w-full border-none text-[14px] leading-relaxed">
            <tbody>
              <tr>
                <td className="w-20 py-0.5 align-top">Nomor</td>
                <td className="w-4 py-0.5 align-top text-center">:</td>
                <td className="py-0.5 align-top font-mono text-black">{kegiatan.nomorSurat || "005/ 16/403.401.02/2024"}</td>
              </tr>
              <tr>
                <td className="py-0.5 align-top">Lampiran</td>
                <td className="py-0.5 align-top text-center">:</td>
                <td className="py-0.5 align-top text-black">
                  {kegiatan.lampiran || ""}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 align-top">Perihal</td>
                <td className="py-0.5 align-top text-center">:</td>
                <td className="py-0.5 align-top font-bold text-black uppercase">
                  {kegiatan.perihal || "UNDANGAN"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Side: Date */}
        <div className="col-span-5 flex flex-col items-end text-[14px] pr-4">
          <p className="mb-1 text-black">
            {kotaKab}, {tanggalIndo}
          </p>
        </div>
      </div>

      {/* Kepada Block below Nomor/Lampiran/Perihal */}
      <div className="mt-4 mb-6 pl-0 text-[14px] max-w-[350px]">
        <p className="text-black mb-1">Kepada :</p>
        <div className="w-full flex items-start gap-1 mb-1">
          <span className="text-black">Yth.</span>
          <div className="flex-grow">
            {!isPrintPreview ? (
              <input
                type="text"
                value={ythPenerima}
                onChange={(e) => onUpdatePenerima?.(e.target.value)}
                className="w-full border-none focus:outline-none bg-transparent p-0 font-bold text-black no-print text-[14px]"
                placeholder="Nama / Jabatan Penerima"
                title="Nama Penerima"
              />
            ) : null}
            <p className={`${isPrintPreview ? "block" : "hidden print:block"} font-bold pb-0.5 min-w-[150px] text-black`}>
              {ythPenerima}
            </p>
          </div>
        </div>
        <div className="w-full text-left pl-8 mt-1">
          <p className="font-bold text-black tracking-wide uppercase">DI TEMPAT</p>
        </div>
      </div>

      {/* Paragraf Pembuka */}
      <div className="my-6 text-justify indent-8 leading-relaxed text-black">
        <p>
          Dengan ini mengharap Kehadiran Bapak/Ibu/Sdr/I besuk Pada :
        </p>
      </div>

      {/* Rincian Kegiatan */}
      <div className="my-6 pl-12 text-[14px]">
        <table className="border-none text-[14px] leading-relaxed w-full">
          <tbody>
            <tr>
              <td className="w-28 py-1 align-top text-black">Hari</td>
              <td className="w-4 py-1 align-top text-center text-black">:</td>
              <td className="py-1 align-top text-black">{hariName}</td>
            </tr>
            <tr>
              <td className="py-1 align-top text-black">Tanggal</td>
              <td className="py-1 align-top text-center text-black">:</td>
              <td className="py-1 align-top text-black">{tanggalIndo}</td>
            </tr>
            <tr>
              <td className="py-1 align-top text-black">Tempat</td>
              <td className="py-1 align-top text-center text-black">:</td>
              <td className="py-1 align-top text-black font-semibold">{kegiatan.tempat || "Balai Desa"}</td>
            </tr>
            <tr>
              <td className="py-1 align-top text-black">Waktu</td>
              <td className="py-1 align-top text-center text-black">:</td>
              <td className="py-1 align-top text-black">
                {(() => {
                  const start = formatIndonesianTime(kegiatan.waktuMulai) || "16:00";
                  const end = formatIndonesianTime(kegiatan.waktuSelesai) || "Selesai";
                  return end === "Selesai" || !end
                    ? `Pukul ${start} WIB s/d Selesai`
                    : `Pukul ${start} s/d ${end} WIB`;
                })()}
              </td>
            </tr>
            <tr>
              <td className="py-1 align-top text-black">Acara</td>
              <td className="py-1 align-top text-center text-black">:</td>
              <td className="py-1 align-top text-black font-semibold">{kegiatan.acara || "Rapat koordinasi dan Evaluasi BPD"}</td>
            </tr>
            {kegiatan.catatan && (
              <tr>
                <td className="py-1 align-top text-black">Catatan</td>
                <td className="py-1 align-top text-center text-black">:</td>
                <td className="py-1 align-top text-black italic">
                  {kegiatan.catatan}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paragraf Penutup */}
      <div className="my-8 text-justify indent-8 leading-relaxed text-black">
        <p>
          Demikian Undangan ini kami sampaikan atas Kehadiranya disampaikan Terima Kasih
        </p>
      </div>

      {/* Tanda Tangan */}
      <div className="mt-16 flex justify-end">
        <div className="text-center min-w-[250px] pr-8 text-[14px]">
          <p className="uppercase font-bold text-black tracking-wide">
            {undanganPenandatangan.jabatan || `KEPALA DESA ${instansi.namaDesa.toUpperCase()}`}
          </p>
          <div className="h-24"></div>
          <p className="font-bold uppercase text-black tracking-wide">
            {undanganPenandatangan.nama || instansi.namaKepalaDesa}
          </p>
        </div>
      </div>
    </div>
  );
};
