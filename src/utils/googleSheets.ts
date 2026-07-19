import { Instansi, Kegiatan, Peserta, Dokumentasi, Notulensi, PenandaTangan } from "../types";

export interface SheetsPayload {
  instansi: Instansi;
  kegiatanList: Kegiatan[];
  pesertaList: Peserta[];
  dokumentasiList: Dokumentasi[];
  notulensiList: Notulensi[];
  penandaTangan: PenandaTangan;
}

/**
 * Fetch all data tables from Google Sheets Web App
 */
export async function fetchFromSheets(webAppUrl: string): Promise<SheetsPayload> {
  const url = `${webAppUrl}${webAppUrl.includes("?") ? "&" : "?"}action=getAll&_t=${Date.now()}`;
  
  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Koneksi gagal: HTTP ${response.status}`);
  }

  const result = await response.json();
  
  if (result.status === "error") {
    throw new Error(result.message || "Gagal mengambil data dari Google Sheets.");
  }

  return result.data;
}

/**
 * Sync (POST) all local data tables to Google Sheets Web App
 */
export async function syncToSheets(webAppUrl: string, payload: SheetsPayload): Promise<void> {
  const response = await fetch(webAppUrl, {
    method: "POST",
    mode: "no-cors", // Since Apps Script Web App redirect can cause CORS pre-flight issues in some browsers
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  // Note: with "no-cors", the response type is "opaque" and response.ok is false,
  // but the server still receives and processes the payload successfully!
  // To verify fully, we can also perform a quick background confirmation or trust the write,
  // but to provide a robust user experience, we notify the user.
}

/**
 * Clean POST sync with standard CORS handling (requires Google Apps Script to return correct responses)
 */
export async function syncToSheetsWithStatus(webAppUrl: string, payload: SheetsPayload): Promise<any> {
  // We send standard post request
  const response = await fetch(webAppUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8" // bypass CORS preflight check on GAS doPost
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Sinkronisasi gagal: HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.status === "error") {
    throw new Error(result.message || "Gagal melakukan sinkronisasi.");
  }
  return result;
}
