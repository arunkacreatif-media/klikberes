import React from "react";
import { Instansi } from "../../types";

interface KopSuratProps {
  instansi: Instansi;
  className?: string;
}

export const KopSurat: React.FC<KopSuratProps> = ({ instansi, className = "" }) => {
  const kabupaten = (instansi.kabupaten || "PROBOLINGGO").toUpperCase();
  const kecamatan = (instansi.kecamatan || "GADING").toUpperCase();
  const namaDesa = (instansi.namaDesa || "KECINDUNG").toUpperCase();
  const alamat = instansi.alamatKantor || "Jl. Raya Kecindung No. 12";
  const kodePos = instansi.kodePos || "67278";
  const email = instansi.emailDesa || "desa.kecindung@gmail.com";
  const website = instansi.websiteDesa || "kecindung.desa.id";

  return (
    <div className={`w-full mb-5 document-font ${className}`} style={{ contentVisibility: "auto" }}>
      <div className="flex items-center justify-between pb-1 relative">
        {/* Logo container - Left */}
        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-start">
          {instansi.logoUrl ? (
            <img
              src={instansi.logoUrl}
              alt="Logo Desa"
              className="w-22 h-22 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 bg-emerald-100 flex items-center justify-center border-2 border-emerald-800">
              <span className="text-emerald-800 font-bold text-xs">LOGO</span>
            </div>
          )}
        </div>

        {/* Text contents - Centered */}
        <div className="flex-grow text-center px-4 -ml-4 pr-12">
          <h4 className="text-[16px] font-bold leading-tight text-black uppercase tracking-wide">
            PEMERINTAH KABUPATEN {kabupaten}
          </h4>
          <h3 className="text-[15px] font-bold leading-tight text-black uppercase tracking-wide mt-0.5">
            KECAMATAN {kecamatan}
          </h3>
          <h2 className="text-[22px] font-bold leading-normal text-black uppercase tracking-wider my-0.5">
            DESA {namaDesa}
          </h2>
          <p className="text-[12px] text-black leading-snug font-sans">
            {alamat}
          </p>
          <p className="text-[11.5px] text-black leading-snug font-sans">
            e-mail : {email} {website && `. http://${website}`}
          </p>
        </div>
      </div>

      {/* Right aligned postal code just above the double lines */}
      <div className="w-full text-right text-[11px] font-semibold text-black -mt-1.5 mb-1.5 pr-2">
        Kode Pos : {kodePos}
      </div>

      {/* Traditional Double Line Separator (Thick top line, thin bottom line) */}
      <div className="w-full flex flex-col gap-[2px]">
        <div className="h-[3.5px] bg-black w-full"></div>
        <div className="h-[1px] bg-black w-full"></div>
      </div>
    </div>
  );
};

