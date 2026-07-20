import React, { useState, useEffect } from "react";
import { Instansi, Kegiatan, Peserta, Dokumentasi, Notulensi, HasilRapatPoin, PenandaTangan } from "./types";
import {
  DEFAULT_INSTANSI,
  DEFAULT_PENANDATANGAN,
  DUMMY_KEGIATAN,
  DUMMY_PESERTA,
  DUMMY_DOKUMENTASI,
  DUMMY_NOTULENSI,
  getIndonesianDay,
  formatIndonesianDate,
  formatRupiah
} from "./utils/helpers";
import { KopSurat } from "./components/documents/KopSurat";
import { UndanganDoc } from "./components/documents/UndanganDoc";
import { DaftarHadirDoc } from "./components/documents/DaftarHadirDoc";
import { DokumentasiDoc } from "./components/documents/DokumentasiDoc";
import { TandaTerimaDoc } from "./components/documents/TandaTerimaDoc";
import { NotulensiDoc } from "./components/documents/NotulensiDoc";
import {
  Building2,
  CalendarDays,
  FileText,
  Mail,
  Plus,
  Settings,
  Trash2,
  Users,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Printer,
  Sparkles,
  Download,
  AlertCircle,
  HelpCircle,
  Grid,
  Upload,
  Cloud,
  CloudOff,
  Database,
  RefreshCw,
  FileCode,
  ExternalLink,
  Check,
  Info,
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { fetchFromSheets, syncToSheetsWithStatus } from "./utils/googleSheets";

export default function App() {
  // --- APPLICATION STATE ---
  const [instansi, setInstansi] = useState<Instansi>(() => {
    const saved = localStorage.getItem("desa_instansi");
    return saved ? JSON.parse(saved) : DEFAULT_INSTANSI;
  });

  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>(() => {
    const saved = localStorage.getItem("desa_kegiatan_list");
    return saved ? JSON.parse(saved) : [];
  });

  const [pesertaList, setPesertaList] = useState<Peserta[]>(() => {
    const saved = localStorage.getItem("desa_peserta_list");
    return saved ? JSON.parse(saved) : [];
  });

  const [dokumentasiList, setDokumentasiList] = useState<Dokumentasi[]>(() => {
    const saved = localStorage.getItem("desa_dokumentasi_list");
    return saved ? JSON.parse(saved) : [];
  });

  const [notulensiList, setNotulensiList] = useState<Notulensi[]>(() => {
    const saved = localStorage.getItem("desa_notulensi_list");
    return saved ? JSON.parse(saved) : [];
  });

  const [penandaTangan, setPenandaTangan] = useState<PenandaTangan>(() => {
    const saved = localStorage.getItem("desa_penandatangan");
    return saved ? JSON.parse(saved) : DEFAULT_PENANDATANGAN(DEFAULT_INSTANSI);
  });

  const [pph21Persen, setPph21Persen] = useState<number>(5);

  // --- TOAST NOTIFICATION STATE ---
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { ...prev, show: false } : prev));
    }, 4000);
  };

  // --- GOOGLE SHEETS STATE ---
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem("desa_sheet_url") || "https://script.google.com/macros/s/AKfycbzqOam4HqkD_erktyGwXQVUzhzCtx-6cSXGyG3rFrvmxkSmCQOz1FMTJGrzBGZdjw-xdQ/exec";
  });
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [lastSynced, setLastSynced] = useState<string>(() => {
    return localStorage.getItem("desa_last_synced") || "";
  });

  // Save sheetUrl to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("desa_sheet_url", sheetUrl);
  }, [sheetUrl]);

  // Sync state functions
  const handlePullFromSheets = async (targetUrl?: string) => {
    const activeUrl = targetUrl || sheetUrl;
    if (!activeUrl) {
      setSyncStatus("error");
      setSyncMessage("URL Google Sheets Web App belum dimasukkan!");
      showToast("URL Google Sheets Web App belum dimasukkan!", "error");
      return;
    }
    if (!activeUrl.startsWith("https://script.google.com/macros/s/")) {
      setSyncStatus("error");
      setSyncMessage("URL Google Sheets Web App tidak valid! Format harus dimulai dengan https://script.google.com/macros/s/");
      showToast("URL Google Sheets tidak valid!", "error");
      return;
    }

    setSyncStatus("loading");
    setSyncMessage("Mengambil data terbaru dari Google Sheets...");
    
    try {
      const data = await fetchFromSheets(activeUrl);
      if (data.instansi) setInstansi(data.instansi);
      if (data.kegiatanList) setKegiatanList(data.kegiatanList);
      if (data.pesertaList) setPesertaList(data.pesertaList);
      if (data.dokumentasiList) setDokumentasiList(data.dokumentasiList);
      if (data.notulensiList) setNotulensiList(data.notulensiList);
      if (data.penandaTangan) setPenandaTangan(data.penandaTangan);

      const timestamp = new Date().toLocaleString("id-ID", { hour12: false });
      setLastSynced(timestamp);
      localStorage.setItem("desa_last_synced", timestamp);
      setSyncStatus("success");
      setSyncMessage("Data berhasil ditarik dan disinkronkan dari Google Sheets!");
      showToast("Data berhasil ditarik & disinkronkan dari Google Sheets!", "success");
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setSyncMessage(`Gagal mengambil data: ${err.message || "Pastikan setelan Aplikasi Web Anda 'Siapa saja' (Anyone) dan coba lagi."}`);
      showToast("Gagal menarik data dari Google Sheets", "error");
    }
  };

  const handlePushToSheets = async (targetUrl?: string) => {
    const activeUrl = targetUrl || sheetUrl;
    if (!activeUrl) {
      setSyncStatus("error");
      setSyncMessage("URL Google Sheets Web App belum dimasukkan!");
      showToast("URL Google Sheets Web App belum dimasukkan!", "error");
      return;
    }
    if (!activeUrl.startsWith("https://script.google.com/macros/s/")) {
      setSyncStatus("error");
      setSyncMessage("URL Google Sheets Web App tidak valid! Format harus dimulai dengan https://script.google.com/macros/s/");
      showToast("URL Google Sheets tidak valid!", "error");
      return;
    }

    setSyncStatus("loading");
    setSyncMessage("Mengirimkan data lokal ke Google Sheets...");

    try {
      const payload = {
        instansi,
        kegiatanList,
        pesertaList,
        dokumentasiList,
        notulensiList,
        penandaTangan
      };
      const response = await syncToSheetsWithStatus(activeUrl, payload);
      
      const timestamp = new Date().toLocaleString("id-ID", { hour12: false });
      setLastSynced(timestamp);
      localStorage.setItem("desa_last_synced", timestamp);
      setSyncStatus("success");
      setSyncMessage(response.message || "Data lokal berhasil disimpan ke Google Sheets!");
      showToast("Berhasil menyimpan data dokumen ke Google Sheets!", "success");
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setSyncMessage(`Gagal mengirim data: ${err.message || "Periksa koneksi internet atau setelan Google Apps Script Anda."}`);
      showToast("Gagal menyimpan data ke Google Sheets", "error");
    }
  };

  // Auto pull from Google Sheets on mount if URL is available
  useEffect(() => {
    const url = localStorage.getItem("desa_sheet_url") || "";
    if (url && url.startsWith("https://script.google.com/macros/s/")) {
      handlePullFromSheets(url);
    }
  }, []);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "kegiatan-baru" | "pengaturan" | "detail" | "tentang-kami" | "dokumen-mandiri">("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [standaloneDocType, setStandaloneDocType] = useState<"undangan" | "daftarHadir" | "tandaTerima" | "notulensi">("undangan");
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<string>(() => {
    return localStorage.getItem("desa_selected_kegiatan_id") || "";
  });
  const [detailSubTab, setDetailSubTab] = useState<"undangan" | "daftarHadir" | "dokumentasi" | "tandaTerima" | "notulensi">("undangan");

  // Keep selectedKegiatanId in localStorage
  useEffect(() => {
    localStorage.setItem("desa_selected_kegiatan_id", selectedKegiatanId);
  }, [selectedKegiatanId]);

  // --- PWA INSTALL HOOKS ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User PWA choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // --- DOCUMENT DISPLAY CONFIG STATE ---
  const [daftarHadirRowCount, setDaftarHadirRowCount] = useState<number>(() => {
    const saved = localStorage.getItem("desa_dh_row_count");
    return saved ? Number(saved) : 20;
  });
  const [daftarHadirUseRealData, setDaftarHadirUseRealData] = useState<boolean>(() => {
    const saved = localStorage.getItem("desa_dh_use_real");
    return saved ? saved === "true" : false;
  });
  const [tandaTerimaRowCount, setTandaTerimaRowCount] = useState<number>(() => {
    const saved = localStorage.getItem("desa_tt_row_count");
    return saved ? Number(saved) : 10;
  });
  const [tandaTerimaUseRealData, setTandaTerimaUseRealData] = useState<boolean>(() => {
    const saved = localStorage.getItem("desa_tt_use_real");
    return saved ? saved === "true" : false;
  });

  // Sync these document display states to localStorage
  useEffect(() => {
    localStorage.setItem("desa_dh_row_count", daftarHadirRowCount.toString());
  }, [daftarHadirRowCount]);
  useEffect(() => {
    localStorage.setItem("desa_dh_use_real", daftarHadirUseRealData.toString());
  }, [daftarHadirUseRealData]);
  useEffect(() => {
    localStorage.setItem("desa_tt_row_count", tandaTerimaRowCount.toString());
  }, [tandaTerimaRowCount]);
  useEffect(() => {
    localStorage.setItem("desa_tt_use_real", tandaTerimaUseRealData.toString());
  }, [tandaTerimaUseRealData]);

  // --- PRINT ORCHESTRATION ---
  const [printTarget, setPrintTarget] = useState<{ kegiatanId: string; docType: string } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // --- NEW KEGIATAN FORM STATE ---
  const [newKegiatan, setNewKegiatan] = useState<Omit<Kegiatan, "id" | "hari" | "tahunKegiatan">>({
    nomorSurat: "005/17/403.401.02/2026",
    namaKegiatan: "",
    tanggal: new Date().toISOString().split("T")[0],
    waktuMulai: "09:00",
    waktuSelesai: "12:00",
    tempat: "",
    acara: "",
    catatan: "Harap hadir tepat waktu dan membawa dokumen laporan.",
    pemimpinRapat: instansi.namaKepalaDesa,
    notulis: ""
  });

  // --- NEW PARTICIPANT INPUT STATE ---
  const [newPeserta, setNewPeserta] = useState({
    nama: "",
    kedudukan: "",
    alamat: "",
    penerimaan: 100000
  });

  const [blankRowsCount, setBlankRowsCount] = useState<number>(5);
  const [standaloneJumlahBaris, setStandaloneJumlahBaris] = useState<number>(10);
  const [standaloneBesaranTransport, setStandaloneBesaranTransport] = useState<number>(100000);

  useEffect(() => {
    if (standaloneDocType === "daftarHadir") {
      setStandaloneJumlahBaris(10);
    } else if (standaloneDocType === "tandaTerima") {
      setStandaloneJumlahBaris(10);
      setStandaloneBesaranTransport(100000);
    } else if (standaloneDocType === "notulensi") {
      setStandaloneJumlahBaris(5);
    }
  }, [standaloneDocType]);

  // --- SYNC TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem("desa_instansi", JSON.stringify(instansi));
  }, [instansi]);

  useEffect(() => {
    localStorage.setItem("desa_kegiatan_list", JSON.stringify(kegiatanList));
  }, [kegiatanList]);

  useEffect(() => {
    localStorage.setItem("desa_peserta_list", JSON.stringify(pesertaList));
  }, [pesertaList]);

  useEffect(() => {
    localStorage.setItem("desa_dokumentasi_list", JSON.stringify(dokumentasiList));
  }, [dokumentasiList]);

  useEffect(() => {
    localStorage.setItem("desa_notulensi_list", JSON.stringify(notulensiList));
  }, [notulensiList]);

  useEffect(() => {
    localStorage.setItem("desa_penandatangan", JSON.stringify(penandaTangan));
  }, [penandaTangan]);

  // Auto-synchronize penandaTangan names and village references when settings change
  useEffect(() => {
    const nama = instansi.namaDesa;
    const kades = instansi.namaKepalaDesa;
    if (!nama) return;

    setPenandaTangan(prev => {
      // Helper to replace "Kecindung" with the actual village name (case-insensitive)
      const replaceKecindung = (text: string): string => {
        if (!text) return text;
        return text.replace(/Kecindung/g, nama)
                   .replace(/KECINDUNG/g, nama.toUpperCase())
                   .replace(/kecindung/g, nama.toLowerCase());
      };

      return {
        ...prev,
        daftarHadir: {
          jabatanPenutup: replaceKecindung(prev.daftarHadir.jabatanPenutup),
          nama: prev.daftarHadir.nama || kades || ""
        },
        undangan: {
          jabatan: replaceKecindung(prev.undangan.jabatan),
          nama: prev.undangan.nama || kades || ""
        },
        notulensi: {
          jabatan: replaceKecindung(prev.notulensi.jabatan),
          nama: prev.notulensi.nama || kades || ""
        },
        tandaTerima: {
          kiri: {
            label: replaceKecindung(prev.tandaTerima.kiri.label),
            nama: prev.tandaTerima.kiri.nama || kades || ""
          },
          tengah: {
            label: replaceKecindung(prev.tandaTerima.tengah.label),
            nama: prev.tandaTerima.tengah.nama
          },
          kanan: {
            label: replaceKecindung(prev.tandaTerima.kanan.label),
            nama: prev.tandaTerima.kanan.nama
          }
        }
      };
    });
  }, [instansi.namaDesa, instansi.namaKepalaDesa]);

  // Handle head of village change to auto-update default signatures
  const handleKepalaDesaChangeInSettings = (nama: string) => {
    setInstansi({ ...instansi, namaKepalaDesa: nama });
    // Keep PenandaTangan synchronized if not manually edited
    setPenandaTangan(prev => ({
      ...prev,
      daftarHadir: { ...prev.daftarHadir, nama: nama },
      tandaTerima: {
        ...prev.tandaTerima,
        kiri: { ...prev.tandaTerima.kiri, nama: nama }
      },
      undangan: { ...prev.undangan, nama: nama },
      notulensi: { ...prev.notulensi, nama: nama }
    }));
  };

  // Handle name of village change to auto-update default signatures
  const handleNamaDesaChangeInSettings = (nama: string) => {
    setInstansi(prev => ({ ...prev, namaDesa: nama }));
    // Keep PenandaTangan synchronized if not manually edited
    setPenandaTangan(prev => ({
      ...prev,
      daftarHadir: { 
        ...prev.daftarHadir, 
        jabatanPenutup: prev.daftarHadir.jabatanPenutup.includes("Kepala Desa")
          ? prev.daftarHadir.jabatanPenutup.replace(/Kepala Desa.*/i, `Kepala Desa ${nama}`)
          : `Mengetahui,\nKepala Desa ${nama}`
      },
      undangan: { 
        ...prev.undangan, 
        jabatan: prev.undangan.jabatan.includes("Kepala Desa")
          ? prev.undangan.jabatan.replace(/Kepala Desa.*/i, `Kepala Desa ${nama}`)
          : `Kepala Desa ${nama}`
      },
      notulensi: { 
        ...prev.notulensi, 
        jabatan: prev.notulensi.jabatan.includes("Kepala Desa")
          ? prev.notulensi.jabatan.replace(/Kepala Desa.*/i, `Kepala Desa ${nama}`)
          : `Kepala Desa ${nama}`
      }
    }));
  };

  // --- ACTIONS ---

  // Create new kegiatan
  const handleCreateKegiatan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKegiatan.namaKegiatan.trim()) return;

    const id = "kegiatan-" + Date.now();
    const hari = getIndonesianDay(newKegiatan.tanggal);
    const tahunKegiatan = new Date(newKegiatan.tanggal).getFullYear().toString();

    const created: Kegiatan = {
      ...newKegiatan,
      id,
      hari,
      tahunKegiatan
    };

    setKegiatanList([...kegiatanList, created]);

    // Create an empty or pre-filled notulensi for this kegiatan
    const newNotulensi: Notulensi = {
      kegiatanId: id,
      hasilRapat: []
    };
    setNotulensiList([...notulensiList, newNotulensi]);

    // Auto add default documentation slots (3 slots)
    const defaultDocs: Dokumentasi[] = [
      { id: "doc-1-" + id, kegiatanId: id, fotoBase64: "", keterangan: "" },
      { id: "doc-2-" + id, kegiatanId: id, fotoBase64: "", keterangan: "" },
      { id: "doc-3-" + id, kegiatanId: id, fotoBase64: "", keterangan: "" }
    ];
    setDokumentasiList([...dokumentasiList, ...defaultDocs]);

    // Redirect to detail right away
    setSelectedKegiatanId(id);
    setDetailSubTab("undangan");
    setActiveTab("detail");

    // Reset form
    setNewKegiatan({
      nomorSurat: `005/${kegiatanList.length + 18}/403.401.02/2026`,
      namaKegiatan: "",
      tanggal: new Date().toISOString().split("T")[0],
      waktuMulai: "09:00",
      waktuSelesai: "12:00",
      tempat: "",
      acara: "",
      catatan: "Harap hadir tepat waktu.",
      pemimpinRapat: instansi.namaKepalaDesa,
      notulis: ""
    });
  };

  // Delete kegiatan
  const handleDeleteKegiatan = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kegiatan ini dan semua dokumen terkait? Data yang dihapus tidak dapat dikembalikan.")) {
      setKegiatanList(kegiatanList.filter((k) => k.id !== id));
      setPesertaList(pesertaList.filter((p) => p.kegiatanId !== id));
      setDokumentasiList(dokumentasiList.filter((d) => d.kegiatanId !== id));
      setNotulensiList(notulensiList.filter((n) => n.kegiatanId !== id));
      if (selectedKegiatanId === id) {
        setSelectedKegiatanId("");
      }
    }
  };

  // Add participant
  const handleAddPeserta = (e: React.FormEvent) => {
    e.preventDefault();
    // No longer requiring name to be filled, allowing blank rows

    const netAmount = (newPeserta.penerimaan || 0) - Math.round((newPeserta.penerimaan || 0) * (pph21Persen / 100));
    const created: Peserta = {
      id: "peserta-" + Date.now() + Math.random(),
      kegiatanId: selectedKegiatanId,
      no: pesertaList.filter(p => p.kegiatanId === selectedKegiatanId).length + 1,
      nama: newPeserta.nama ? newPeserta.nama.trim() : "",
      kedudukan: newPeserta.kedudukan ? newPeserta.kedudukan.trim() : "",
      alamat: newPeserta.alamat ? newPeserta.alamat.trim() : "",
      penerimaan: newPeserta.penerimaan || 0,
      pph21: Math.round((newPeserta.penerimaan || 0) * (pph21Persen / 100)),
      jumlahPenerimaan: netAmount
    };

    setPesertaList([...pesertaList, created]);
    setNewPeserta({ nama: "", kedudukan: "", alamat: "", penerimaan: 100000 });
  };

  // Delete participant
  const handleHapusPeserta = (id: string) => {
    setPesertaList(pesertaList.filter(p => p.id !== id));
  };

  // Load standard 7 members of BPD (Badan Permusyawaratan Desa) for rapid testing
  const handleLoadDefaultBPD = () => {
    const currentCount = pesertaList.filter(p => p.kegiatanId === selectedKegiatanId).length;
    const defaultBPD = [
      { nama: "Supardi", kedudukan: "Ketua BPD", alamat: "Dusun Krajan RT 01/RW 01" },
      { nama: "Endang Sulastri", kedudukan: "Wakil Ketua BPD", alamat: "Dusun Krajan RT 03/RW 01" },
      { nama: "Bambang Wijaya", kedudukan: "Sekretaris BPD", alamat: "Dusun Timur RT 02/RW 02" },
      { nama: "Siti Aminah", kedudukan: "Anggota BPD", alamat: "Dusun Krajan RT 01/RW 02" },
      { nama: "Wawan Hermawan", kedudukan: "Anggota BPD", alamat: "Dusun Barat RT 04/RW 03" },
      { nama: "Rudi Hartono", kedudukan: "Anggota BPD", alamat: "Dusun Krajan RT 02/RW 01" },
      { nama: "Dewi Lestari", kedudukan: "Tokoh Masyarakat", alamat: "Dusun Timur RT 05/RW 02" }
    ];

    const added: Peserta[] = defaultBPD.map((b, i) => {
      const penerimaan = 100000;
      const pph = Math.round(penerimaan * (pph21Persen / 100));
      return {
        id: "peserta-bpd-" + i + "-" + Date.now(),
        kegiatanId: selectedKegiatanId,
        no: currentCount + i + 1,
        nama: b.nama,
        kedudukan: b.kedudukan,
        alamat: b.alamat,
        penerimaan,
        pph21: pph,
        jumlahPenerimaan: penerimaan - pph
      };
    });

    setPesertaList([...pesertaList, ...added]);
  };

  // Add a quick empty row for handwriting or custom fast editing
  const handleTambahBarisKosong = (count: number = 1) => {
    if (count <= 0) return;
    const currentCount = pesertaList.filter(p => p.kegiatanId === selectedKegiatanId).length;
    const nominal = 100000; // default nominal
    const pph = Math.round(nominal * (pph21Persen / 100));
    
    const newRows: Peserta[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: "peserta-blank-" + Date.now() + "-" + i + "-" + Math.random(),
        kegiatanId: selectedKegiatanId,
        no: currentCount + i + 1,
        nama: "",
        kedudukan: "",
        alamat: "",
        penerimaan: nominal,
        pph21: pph,
        jumlahPenerimaan: nominal - pph
      });
    }

    setPesertaList([...pesertaList, ...newRows]);
  };

  // Update allowance or tax rate
  const handleUpdatePenerimaan = (id: string, nominal: number) => {
    setPesertaList(pesertaList.map(p => {
      if (p.id === id) {
        const pph = Math.round(nominal * (pph21Persen / 100));
        return {
          ...p,
          penerimaan: nominal,
          pph21: pph,
          jumlahPenerimaan: nominal - pph
        };
      }
      return p;
    }));
  };

  const handleBatchUpdatePenerimaan = (nominal: number) => {
    setPesertaList(pesertaList.map(p => {
      if (p.kegiatanId === selectedKegiatanId) {
        const pph = Math.round(nominal * (pph21Persen / 100));
        return {
          ...p,
          penerimaan: nominal,
          pph21: pph,
          jumlahPenerimaan: nominal - pph
        };
      }
      return p;
    }));
  };

  const handleUpdatePph21Persen = (persen: number) => {
    setPph21Persen(persen);
    setPesertaList(pesertaList.map(p => {
      if (p.kegiatanId === selectedKegiatanId) {
        const pph = Math.round(p.penerimaan * (persen / 100));
        return {
          ...p,
          pph21: pph,
          jumlahPenerimaan: p.penerimaan - pph
        };
      }
      return p;
    }));
  };

  // Photo uploads
  const handleUploadFoto = (id: string, base64: string) => {
    setDokumentasiList(dokumentasiList.map(d => (d.id === id ? { ...d, fotoBase64: base64 } : d)));
  };

  const handleUpdateKeterangan = (id: string, keterangan: string) => {
    setDokumentasiList(dokumentasiList.map(d => (d.id === id ? { ...d, keterangan } : d)));
  };

  const handleTambahSlotFoto = () => {
    const id = "doc-" + Date.now();
    setDokumentasiList([...dokumentasiList, { id, kegiatanId: selectedKegiatanId, fotoBase64: "", keterangan: "" }]);
  };

  const handleHapusSlotFoto = (id: string) => {
    setDokumentasiList(dokumentasiList.filter(d => d.id !== id));
  };

  // Notulensi update
  const handleUpdateHasilRapat = (hasil: HasilRapatPoin[]) => {
    setNotulensiList(notulensiList.map(n => (n.kegiatanId === selectedKegiatanId ? { ...n, hasilRapat: hasil } : n)));
  };

  // Undangan recipient update
  const handleUpdatePenerimaUndangan = (penerima: string) => {
    setKegiatanList(prevList =>
      prevList.map(k => (k.id === selectedKegiatanId ? { ...k, penerimaUndangan: penerima } : k))
    );
  };

  // Reset all app settings to defaults
  const handleResetDefaults = () => {
    if (confirm("Apakah Anda yakin ingin mengatur ulang semua data aplikasi ke default pabrik? Semua kegiatan baru yang Anda buat akan hilang.")) {
      setInstansi(DEFAULT_INSTANSI);
      setKegiatanList([]);
      setPesertaList([]);
      setDokumentasiList([]);
      setNotulensiList([]);
      setPenandaTangan(DEFAULT_PENANDATANGAN(DEFAULT_INSTANSI));
      setPph21Persen(5);
      setSelectedKegiatanId("");
      setActiveTab("dashboard");
    }
  };

  // --- PRINT LOGIC ---
  const handlePrintViaNewWindow = () => {
    const contentEl = document.getElementById("printable-document-content");
    if (!contentEl) {
      alert("Error: Konten dokumen tidak ditemukan!");
      return;
    }

    // Open a completely clean window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Sistem Cetak Jendela Baru diblokir oleh browser! Silakan izinkan popup/pop-up di browser Anda agar dokumen dapat dicetak dengan sempurna.");
      return;
    }

    // Collect all stylesheets and styles
    let stylesHtml = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((styleEl) => {
      stylesHtml += styleEl.outerHTML;
    });

    const isLandscape = printTarget?.docType === "dokumentasi";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Dokumen - A4 Normal</title>
          ${stylesHtml}
          <style>
            /* Core print reset for absolute purity */
            body {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide all UI element classes */
            .no-print, nav, sidebar, header, button {
              display: none !important;
            }

            /* Retain padding on document wrapper so that we have nice margin on the page since @page margin is 0 */
            .document-container,
            .daftar-hadir-container,
            .tanda-terima-container {
              padding: 2cm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: 0 !important;
            }

            /* Force keep background colors/header backgrounds */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Force margin: 0 to hide default browser headers and footers (date, URL, page title) */
            @page {
              size: A4 ${isLandscape ? "landscape" : "portrait"} !important;
              margin: 0 !important;
            }

            @page :left {
              margin: 0 !important;
            }
            @page :right {
              margin: 0 !important;
            }

            /* Enforce clean page breaks */
            .page-break {
              page-break-before: always !important;
              break-before: page !important;
              margin-top: 0 !important;
            }

            /* Table layout print fixes */
            table {
              display: table !important;
              width: 100% !important;
              border-collapse: collapse !important;
            }
            thead {
              display: table-header-group !important;
            }
            tbody {
              display: table-row-group !important;
            }
            tr {
              display: table-row !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            th, td {
              display: table-cell !important;
            }

            .print-area {
              width: 100% !important;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="print-area">
            ${contentEl.innerHTML}
          </div>
          <script>
            window.onload = function() {
              // Allow fonts, styles, and external logo image resources to completely settle
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 600);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadPdf = async () => {
    const contentEl = document.getElementById("printable-document-content");
    if (!contentEl) {
      alert("Error: Konten dokumen tidak ditemukan!");
      return;
    }

    setIsExportingPdf(true);

    try {
      // Dynamic imports for performance and TS compatibility
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const isLandscape = printTarget?.docType === "dokumentasi";
      const orientation = isLandscape ? "landscape" : "portrait";

      if (printTarget?.docType === "all") {
        // Multi-page document export (Undangan, Daftar Hadir, etc. printed sequentially)
        const wrapper = contentEl.firstElementChild;
        const pages = wrapper ? Array.from(wrapper.children) : [contentEl];
        
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        let pageIndex = 0;
        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i] as HTMLElement;
          if (pageEl.classList.contains("no-print")) continue;

          // Index 2 is DokumentasiDoc which is landscape
          const isPageLandscape = i === 2;
          const pageOrientation = isPageLandscape ? "landscape" : "portrait";
          const pdfWidth = isPageLandscape ? 297 : 210;
          const pdfHeight = isPageLandscape ? 210 : 297;

          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          
          if (pageIndex > 0) {
            pdf.addPage("a4", pageOrientation);
          }
          
          pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
          pageIndex++;
        }

        const title = activeKegiatan?.namaKegiatan ? activeKegiatan.namaKegiatan.replace(/[^a-z0-9]/gi, '_').toLowerCase() : "dokumen";
        pdf.save(`semua_dokumen_${title}.pdf`);
      } else {
        // Single document (could span multiple pages, e.g. multi-row attendee lists)
        const canvas = await html2canvas(contentEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgWidth = isLandscape ? 297 : 210;
        const pageHeight = isLandscape ? 210 : 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF({
          orientation: orientation,
          unit: "mm",
          format: "a4",
        });

        let heightLeft = imgHeight;
        let position = 0;
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage("a4", orientation);
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
          heightLeft -= pageHeight;
        }

        const title = activeKegiatan?.namaKegiatan ? activeKegiatan.namaKegiatan.replace(/[^a-z0-9]/gi, '_').toLowerCase() : "dokumen";
        const docName = printTarget?.docType || "dokumen";
        pdf.save(`${docName}_${title}.pdf`);
      }
    } catch (error) {
      console.error("Gagal mengekspor PDF:", error);
      alert("Gagal membuat PDF. Silakan coba cetak langsung menggunakan tombol browser.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleTriggerPrint = (docType: string) => {
    setPrintTarget({ kegiatanId: selectedKegiatanId, docType });
  };

  // Watch after print finishes
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintTarget(null);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // --- DERIVED SELECTORS ---
  const activeKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId) || kegiatanList[0] || {
    id: "",
    nomorSurat: "",
    namaKegiatan: "Belum Ada Kegiatan",
    hari: "",
    tanggal: "",
    waktuMulai: "",
    waktuSelesai: "",
    tempat: "",
    acara: "",
    catatan: "",
    pemimpinRapat: "",
    notulis: "",
    tahunKegiatan: ""
  };
  const activePesertaList = pesertaList.filter((p) => p.kegiatanId === selectedKegiatanId);
  const activeDokumentasiList = dokumentasiList.filter((d) => d.kegiatanId === selectedKegiatanId);
  const activeNotulensi = notulensiList.find((n) => n.kegiatanId === selectedKegiatanId) || { kegiatanId: selectedKegiatanId, hasilRapat: [] };

  // Calculate completeness status for each kegiatan card on dashboard
  const getCompletenessStatus = (kId: string) => {
    const hasPeserta = pesertaList.some(p => p.kegiatanId === kId);
    const hasPhoto = dokumentasiList.some(d => d.kegiatanId === kId && d.fotoBase64);
    const hasNotulensi = (notulensiList.find(n => n.kegiatanId === kId)?.hasilRapat.length || 0) > 0;
    const hasTransport = pesertaList.some(p => p.kegiatanId === kId && p.penerimaan > 0);

    let docs = 1; // Undangan is always complete
    if (hasPeserta) docs++;
    if (hasPhoto) docs++;
    if (hasTransport) docs++;
    if (hasNotulensi) docs++;

    return {
      count: docs,
      hasPeserta,
      hasPhoto,
      hasNotulensi,
      hasTransport
    };
  };

  const isInsideIframe = typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      {/* MOBILE TOPBAR (Hidden on native print and on desktop) */}
      <header className="lg:hidden bg-emerald-950 text-white px-4 py-3.5 flex items-center justify-between shadow-md border-b border-emerald-900 no-print sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          {instansi.logoUrl ? (
            <img src={instansi.logoUrl} alt="Logo Desa" className="w-7 h-7 object-contain rounded-full bg-white/10 p-0.5" referrerPolicy="no-referrer" />
          ) : (
            <Building2 className="text-yellow-400 w-7 h-7 flex-shrink-0" />
          )}
          <div>
            <h1 className="font-black text-sm tracking-tight leading-none text-white">Klik Beres</h1>
            <p className="text-[8px] text-yellow-400 font-bold tracking-wider mt-0.5 uppercase">Otomasi Dokumen Desa</p>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-emerald-900 rounded-lg text-white transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
          aria-label="Buka Menu Navigasi"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* 1. SCREEN SIDEBAR (Hidden on native print) */}
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden no-print"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <nav
        aria-label="Navigasi Utama"
        className={`bg-emerald-950 text-white flex-shrink-0 flex flex-col justify-between border-r border-emerald-900 shadow-xl no-print transition-all duration-300 z-50 overflow-y-auto
          lg:static lg:flex lg:w-64 lg:translate-x-0
          fixed inset-y-0 left-0 w-64 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 bg-emerald-900/60 border-b border-emerald-800/80 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {instansi.logoUrl ? (
                <img src={instansi.logoUrl} alt="Logo Desa" className="w-8 h-8 object-contain rounded-full bg-white/10 p-0.5" referrerPolicy="no-referrer" />
              ) : (
                <Building2 className="text-yellow-400 w-8 h-8 flex-shrink-0" />
              )}
              <div>
                <h1 className="font-black text-lg tracking-tight leading-none text-white">Klik Beres</h1>
                <p className="text-[9px] text-yellow-400 font-bold tracking-wider mt-0.5 uppercase">Otomasi Dokumen Desa</p>
              </div>
            </div>
            <p className="text-[10px] text-emerald-200/80 leading-normal font-medium">
              Sistem Otomasi Dokumen Pertanggungjawaban Kegiatan Desa
            </p>
          </div>

          {/* Nav links */}
          <div className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Grid size={16} className={activeTab === "dashboard" ? "text-yellow-400" : "text-emerald-400"} />
                DASHBOARD KEGIATAN
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>

            <button
              onClick={() => {
                setActiveTab("kegiatan-baru");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "kegiatan-baru"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Plus size={16} className={activeTab === "kegiatan-baru" ? "text-yellow-400" : "text-emerald-400"} />
                BUAT KEGIATAN BARU (1 PAKET)
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>

            {/* SECTION: DOKUMEN MANDIRI */}
            <div className="pt-3 pb-1 px-4">
              <p className="text-[9px] font-black tracking-widest text-emerald-300 uppercase opacity-75">BUAT DOKUMEN MANDIRI</p>
            </div>

            <button
              onClick={() => {
                setActiveTab("dokumen-mandiri");
                setStandaloneDocType("undangan");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "dokumen-mandiri" && standaloneDocType === "undangan"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} className={activeTab === "dokumen-mandiri" && standaloneDocType === "undangan" ? "text-yellow-400" : "text-emerald-400"} />
                BUAT UNDANGAN MANDIRI
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>

            <button
              onClick={() => {
                setActiveTab("dokumen-mandiri");
                setStandaloneDocType("daftarHadir");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "dokumen-mandiri" && standaloneDocType === "daftarHadir"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} className={activeTab === "dokumen-mandiri" && standaloneDocType === "daftarHadir" ? "text-yellow-400" : "text-emerald-400"} />
                BUAT DAFTAR HADIR
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>

            <button
              onClick={() => {
                setActiveTab("dokumen-mandiri");
                setStandaloneDocType("tandaTerima");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "dokumen-mandiri" && standaloneDocType === "tandaTerima"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} className={activeTab === "dokumen-mandiri" && standaloneDocType === "tandaTerima" ? "text-yellow-400" : "text-emerald-400"} />
                BUAT TRANSPORT MANDIRI
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>

            <button
              onClick={() => {
                setActiveTab("dokumen-mandiri");
                setStandaloneDocType("notulensi");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "dokumen-mandiri" && standaloneDocType === "notulensi"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} className={activeTab === "dokumen-mandiri" && standaloneDocType === "notulensi" ? "text-yellow-400" : "text-emerald-400"} />
                BUAT NOTULENSI MANDIRI
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>

            {/* DIVIDER */}
            <div className="border-t border-emerald-900/60 my-2"></div>

            <button
              onClick={() => {
                setActiveTab("pengaturan");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "pengaturan"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings size={16} className={activeTab === "pengaturan" ? "text-yellow-400" : "text-emerald-400"} />
                PENGATURAN INSTANSI
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>

            <button
              onClick={() => {
                setActiveTab("tentang-kami");
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "tentang-kami"
                  ? "bg-emerald-800 text-white shadow-md border-l-4 border-yellow-400 pl-3"
                  : "text-emerald-100/85 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Info size={16} className={activeTab === "tentang-kami" ? "text-yellow-400" : "text-emerald-400"} />
                TENTANG KAMI
              </div>
              <ChevronRight size={12} className="opacity-50" />
            </button>
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-emerald-900/80 bg-emerald-950/50 text-[10px] text-emerald-300 font-mono space-y-1.5">
          {isInstallable ? (
            <button
              onClick={handleInstallApp}
              className="w-full mb-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-sans font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-[10.5px] transition-all uppercase tracking-wider"
              type="button"
            >
              <Sparkles size={13} />
              Pasang Aplikasi
            </button>
          ) : (
            <div className="mb-2 p-2 bg-emerald-900/40 rounded-lg text-[9px] text-emerald-200 font-sans leading-normal">
              💡 <span className="font-bold text-yellow-400">PWA Aktif:</span> Pasang aplikasi lewat menu browser (Chrome: titik tiga &gt; Install; Safari: bagikan &gt; Tambah ke Layar Utama) untuk akses offline.
            </div>
          )}
          <p className="font-semibold text-white">Desa: {instansi.namaDesa}</p>
          <p>Kec: {instansi.kecamatan}</p>
          <div className="pt-2 border-t border-emerald-900/45 flex flex-col gap-0.5 text-gray-400 text-[9px]">
            <p className="font-bold text-emerald-400">Klik Beres v1.0</p>
            <p>© 2026 Pemerintah Desa {instansi.namaDesa}</p>
          </div>
        </div>
      </nav>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-grow overflow-y-auto p-4 md:p-8 no-print" style={{ contentVisibility: "auto" }}>
        <AnimatePresence mode="wait">
          {/* A. DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-5 border-b border-gray-200 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-emerald-550 text-emerald-800 bg-emerald-50 text-[10px] font-black tracking-wider uppercase rounded-md border border-emerald-100 shadow-sm flex items-center gap-1">
                      <Building2 size={11} className="text-emerald-700" /> Pemerintah Desa {instansi.namaDesa}
                    </span>
                    <span className="text-xs text-slate-400 font-bold font-mono">Kec. {instansi.kecamatan}</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">Klik Beres</h2>
                  <p className="text-xs text-slate-500 font-medium">Sistem Otomasi Dokumen Pertanggungjawaban Kegiatan Desa</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Profil Kepala Desa Widget */}
                  <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-shadow">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                      <Building2 size={15} />
                    </div>
                    <div className="text-left leading-none">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Kepala Desa</span>
                      <span className="text-xs font-black text-slate-800 block max-w-[150px] truncate" title={instansi.namaKepalaDesa}>{instansi.namaKepalaDesa}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("kegiatan-baru")}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer ml-auto lg:ml-0"
                  >
                    <Plus size={16} />
                    Buat Kegiatan Baru
                  </button>
                </div>
              </div>

              {/* Google Sheets Sync Widget */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sheetUrl ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                      {sheetUrl ? <Cloud size={20} /> : <CloudOff size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-gray-900">Database Google Sheets</h4>
                        {sheetUrl ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 text-[9px] font-black tracking-wider uppercase rounded-md flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> Terhubung
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black tracking-wider uppercase rounded-md">Lokal</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {sheetUrl 
                          ? `Terhubung ke Spreadsheet Anda. Terakhir sinkronisasi: ${lastSynced || "Belum pernah"}`
                          : "Gunakan Google Sheets sebagai database online untuk mencatat semua lalulintas data secara aman."
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {sheetUrl ? (
                      <>
                        <button
                          type="button"
                          disabled={syncStatus === "loading"}
                          onClick={() => handlePullFromSheets()}
                          className="flex-grow sm:flex-grow-0 px-3 py-1.5 bg-gray-150 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-gray-200"
                        >
                          <RefreshCw size={13} className={syncStatus === "loading" ? "animate-spin" : ""} />
                          Tarik Data dari Spreadsheet
                        </button>
                        <button
                          type="button"
                          disabled={syncStatus === "loading"}
                          onClick={() => handlePushToSheets()}
                          className="flex-grow sm:flex-grow-0 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm animate-pulse-slow"
                        >
                          <Database size={13} />
                          Simpan Data ke Spreadsheet
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab("pengaturan")}
                        className="w-full sm:w-auto px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-emerald-950 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Settings size={13} />
                        Hubungkan Google Sheets
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Status Message */}
                {syncStatus !== "idle" && syncMessage && (
                  <div className={`text-xs px-3.5 py-2.5 rounded-lg border flex items-start gap-2.5 ${
                    syncStatus === "loading" ? "bg-blue-50 text-blue-800 border-blue-100 animate-pulse" :
                    syncStatus === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                    "bg-red-50 text-red-800 border-red-100"
                  }`}>
                    {syncStatus === "loading" ? (
                      <RefreshCw size={14} className="animate-spin text-blue-600 mt-0.5 flex-shrink-0" />
                    ) : syncStatus === "success" ? (
                      <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="font-semibold">{syncMessage}</span>
                  </div>
                )}
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                    <FileText size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Kegiatan</span>
                    <span className="text-2xl font-black text-gray-900">{kegiatanList.length}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                    <Users size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Peserta Terdaftar</span>
                    <span className="text-2xl font-black text-gray-900">
                      {pesertaList.length} <span className="text-xs font-medium text-gray-400">Orang</span>
                    </span>
                  </div>
                </div>
              </div>

               {/* Kegiatan Grid */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400">Daftar Dokumen Kegiatan</h3>
                
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {kegiatanList.length === 0 ? (
                    <div className="p-10 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                        <FileText size={28} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-base">Belum Ada Kegiatan Pertanggungjawaban</h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                          Silakan klik tombol <span className="font-bold">Tarik Data dari Spreadsheet</span> di atas jika spreadsheet sudah terisi, atau klik tombol <span className="font-bold">Buat Kegiatan Baru</span> di atas untuk menginput kegiatan secara mandiri.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("kegiatan-baru")}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus size={14} />
                          Buat Kegiatan Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">
                            <th className="py-3 px-5 w-12 text-center">No</th>
                            <th className="py-3 px-4">Nama Kegiatan & Surat</th>
                            <th className="py-3 px-4">Waktu & Tempat</th>
                            <th className="py-3 px-4">Status Berkas (5)</th>
                            <th className="py-3 px-5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {kegiatanList.map((kegiatan, index) => {
                            const status = getCompletenessStatus(kegiatan.id);
                            return (
                              <tr key={kegiatan.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-5 text-center text-xs font-bold text-slate-400">
                                  {index + 1}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="font-extrabold text-sm text-slate-900 hover:text-emerald-800 cursor-pointer"
                                        onClick={() => {
                                          setSelectedKegiatanId(kegiatan.id);
                                          setDetailSubTab(kegiatan.tipeDokumen && kegiatan.tipeDokumen !== "bundling" ? kegiatan.tipeDokumen : "undangan");
                                          setActiveTab("detail");
                                        }}
                                      >
                                        {kegiatan.namaKegiatan}
                                      </span>
                                      {kegiatan.id === "dummy-1" && (
                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black tracking-wider uppercase rounded flex items-center gap-0.5">
                                          <Sparkles size={8} /> Dummy
                                        </span>
                                      )}
                                      {kegiatan.tipeDokumen && kegiatan.tipeDokumen !== "bundling" && (
                                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 text-[8px] font-black tracking-wider uppercase rounded flex items-center gap-0.5">
                                          <FileText size={8} /> Mandiri
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                      No: {kegiatan.nomorSurat}
                                      {kegiatan.tipeDokumen && kegiatan.tipeDokumen !== "bundling" && (
                                        <span className="text-amber-700 font-extrabold ml-1 font-sans">
                                          ({kegiatan.tipeDokumen === "undangan" ? "Undangan" :
                                            kegiatan.tipeDokumen === "daftarHadir" ? "Daftar Hadir" :
                                            kegiatan.tipeDokumen === "tandaTerima" ? "Transport" : "Notulen"})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="space-y-1 text-xs text-slate-600">
                                    <p className="font-semibold flex items-center gap-1">
                                      <CalendarDays size={12} className="text-emerald-600" />
                                      {kegiatan.hari}, {formatIndonesianDate(kegiatan.tanggal)}
                                    </p>
                                    <p className="text-slate-400 flex items-center gap-1 text-[11px]">
                                      <MapPin size={11} />
                                      {kegiatan.tempat}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="space-y-2">
                                    {!kegiatan.tipeDokumen || kegiatan.tipeDokumen === "bundling" ? (
                                      <>
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase rounded-md border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle size={11} className="text-emerald-700" />
                                            {status.count}/5 Dokumen Lengkap
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm" title="Undangan: Selesai">
                                            <Check size={8} className="stroke-[3]" /> Undangan
                                          </span>
                                          
                                          {status.hasPeserta ? (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm" title="Daftar Hadir: Selesai">
                                              <Check size={8} className="stroke-[3]" /> Hadir ({pesertaList.filter(p => p.kegiatanId === kegiatan.id).length})
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200/80" title="Daftar Hadir: Belum">
                                              <span className="w-1 h-1 rounded-full bg-slate-300"></span> Hadir
                                            </span>
                                          )}

                                          {status.hasPhoto ? (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm" title="Dokumentasi: Selesai">
                                              <Check size={8} className="stroke-[3]" /> Foto
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200/80" title="Dokumentasi: Belum">
                                              <span className="w-1 h-1 rounded-full bg-slate-300"></span> Foto
                                            </span>
                                          )}

                                          {status.hasTransport ? (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm" title="Transport: Selesai">
                                              <Check size={8} className="stroke-[3]" /> Transport
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200/80" title="Transport: Belum">
                                              <span className="w-1 h-1 rounded-full bg-slate-300"></span> Transport
                                            </span>
                                          )}

                                          {status.hasNotulensi ? (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm" title="Notulensi: Selesai">
                                              <Check size={8} className="stroke-[3]" /> Notulen
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200/80" title="Notulensi: Belum">
                                              <span className="w-1 h-1 rounded-full bg-slate-300"></span> Notulen
                                            </span>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                                            <CheckCircle size={11} className="text-amber-700" />
                                            Dokumen Mandiri Aktif
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {kegiatan.tipeDokumen === "undangan" && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm">
                                              <Check size={8} className="stroke-[3]" /> Undangan Selesai
                                            </span>
                                          )}
                                          {kegiatan.tipeDokumen === "daftarHadir" && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm">
                                              <Check size={8} className="stroke-[3]" /> Daftar Hadir Selesai ({pesertaList.filter(p => p.kegiatanId === kegiatan.id).length})
                                            </span>
                                          )}
                                          {kegiatan.tipeDokumen === "tandaTerima" && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm">
                                              <Check size={8} className="stroke-[3]" /> Transport Selesai
                                            </span>
                                          )}
                                          {kegiatan.tipeDokumen === "notulensi" && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black shadow-sm">
                                              <Check size={8} className="stroke-[3]" /> Notulen Selesai
                                            </span>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedKegiatanId(kegiatan.id);
                                        setDetailSubTab(kegiatan.tipeDokumen && kegiatan.tipeDokumen !== "bundling" ? kegiatan.tipeDokumen : "undangan");
                                        setActiveTab("detail");
                                      }}
                                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-extrabold rounded-lg cursor-pointer transition-all shadow-sm"
                                    >
                                      Kelola Dokumen
                                    </button>
                                    {kegiatan.id !== "dummy-1" && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteKegiatan(kegiatan.id)}
                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 rounded-lg cursor-pointer transition-colors"
                                        title="Hapus Kegiatan"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* B. KEGIATAN BARU WIZARD TAB */}
          {activeTab === "kegiatan-baru" && (
            <motion.div
              key="kegiatan-baru"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-7xl"
            >
              <div className="pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Buat Kegiatan Pertanggungjawaban Baru</h2>
                <p className="text-xs text-slate-500 font-medium">Isi data pokok kegiatan satu kali, seluruh 5 dokumen pertanggungjawaban akan terisi otomatis!</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleCreateKegiatan} className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nomor Surat */}
                    <div>
                      <label htmlFor="nomorSurat" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Nomor Surat Undangan / Kegiatan <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="nomorSurat"
                        type="text"
                        value={newKegiatan.nomorSurat}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, nomorSurat: e.target.value })}
                        placeholder="Contoh: 005/16/403.401.02/2026"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Nama Kegiatan */}
                    <div>
                      <label htmlFor="namaKegiatan" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Nama Kegiatan <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="namaKegiatan"
                        type="text"
                        value={newKegiatan.namaKegiatan}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, namaKegiatan: e.target.value })}
                        placeholder="Contoh: Rapat Koordinasi dan Evaluasi BPD"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Tanggal */}
                    <div>
                      <label htmlFor="tanggal" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Tanggal Pelaksanaan <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="tanggal"
                        type="date"
                        value={newKegiatan.tanggal}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, tanggal: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Waktu */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="waktuMulai" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          Jam Mulai <span className="text-red-500 font-black ml-0.5">*</span>
                        </label>
                        <input
                          id="waktuMulai"
                          type="text"
                          value={newKegiatan.waktuMulai}
                          onChange={(e) => setNewKegiatan({ ...newKegiatan, waktuMulai: e.target.value })}
                          placeholder="Contoh: 09:00"
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="waktuSelesai" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          Jam Selesai <span className="text-red-500 font-black ml-0.5">*</span>
                        </label>
                        <input
                          id="waktuSelesai"
                          type="text"
                          value={newKegiatan.waktuSelesai}
                          onChange={(e) => setNewKegiatan({ ...newKegiatan, waktuSelesai: e.target.value })}
                          placeholder="Contoh: 12:00"
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Tempat */}
                    <div className="md:col-span-2">
                      <label htmlFor="tempat" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Tempat Kegiatan / Rapat <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="tempat"
                        type="text"
                        value={newKegiatan.tempat}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, tempat: e.target.value })}
                        placeholder="Contoh: Balai Pertemuan Desa Kecindung"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Pemimpin Rapat & Notulis */}
                    <div>
                      <label htmlFor="pemimpinRapat" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Pemimpin Rapat (Ketua) <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="pemimpinRapat"
                        type="text"
                        value={newKegiatan.pemimpinRapat}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, pemimpinRapat: e.target.value })}
                        placeholder="Contoh: H. ACHMAD HUDORI"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="notulis" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Notulis Rapat (Sekretaris) <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="notulis"
                        type="text"
                        value={newKegiatan.notulis}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, notulis: e.target.value })}
                        placeholder="Contoh: Mulyadi, S.Sos"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Acara Uraian */}
                    <div className="md:col-span-2">
                      <label htmlFor="acara" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Uraian Pokok Acara / Pembahasan <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="acara"
                        type="text"
                        value={newKegiatan.acara}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, acara: e.target.value })}
                        placeholder="Contoh: Pembahasan Anggaran Triwulan I & Realisasi Dana Desa"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Catatan Undangan */}
                    <div className="md:col-span-2">
                      <label htmlFor="catatan" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Catatan Khusus Undangan (Opsional)</label>
                      <textarea
                        id="catatan"
                        value={newKegiatan.catatan}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, catatan: e.target.value })}
                        placeholder="Contoh: Hadir tepat waktu dan membawa draf usulan pembangunan dusun."
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("dashboard")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Buat Kegiatan & Buka Berkas
                    </button>
                  </div>
                </form>

                {/* Bagian Ilustrasi Alur Administrasi */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                    {/* Background Subtle Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-100/30 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none" />

                    <div className="relative space-y-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-700 text-white shadow-xs">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Alur Administrasi Otomatis</h3>
                          <p className="text-[10px] text-emerald-800 font-extrabold tracking-wider uppercase">Konsep Satu Kali Input Klik Beres</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Sistem memproses data pokok yang Anda masukkan untuk menerbitkan <strong className="text-emerald-950">5 berkas laporan pertanggungjawaban</strong> yang saling terhubung secara otomatis dan instan.
                      </p>

                      {/* Visual Flow Stepper */}
                      <div className="space-y-4 pt-2 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[17px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-300 via-emerald-200 to-teal-300" />

                        {/* Step 1 */}
                        <div className="flex gap-3 items-start relative group">
                          <div className="w-9 h-9 rounded-full bg-white border-2 border-emerald-500 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs z-10">
                            1
                          </div>
                          <div className="bg-white/80 backdrop-blur-xs border border-emerald-100/80 rounded-xl p-3 flex-grow shadow-xs">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Langkah Kesatu</span>
                            <h4 className="font-bold text-xs text-slate-900 mb-1">Formulir Data Kegiatan</h4>
                            <p className="text-[11px] text-slate-500 leading-normal font-medium">
                              Isi detail pokok (Nomor Surat, Nama Rapat, Waktu, Lokasi, Pemimpin & Notulis) pada formulir di samping.
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-3 items-start relative group">
                          <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs z-10">
                            <RefreshCw size={13} className="animate-spin" style={{ animationDuration: "12s" }} />
                          </div>
                          <div className="bg-emerald-800 text-white rounded-xl p-3 flex-grow shadow-xs">
                            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">Langkah Kedua</span>
                            <h4 className="font-bold text-xs mb-1">Otomasi Pengolahan Data</h4>
                            <p className="text-[11px] text-emerald-100/90 leading-normal font-medium">
                              Sistem memetakan data secara cerdas ke template standar dinas, memperbarui draf dokumen, serta menyinkronkan data langsung ke Google Sheets.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-3 items-start relative group">
                          <div className="w-9 h-9 rounded-full bg-white border-2 border-teal-500 text-teal-700 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs z-10">
                            3
                          </div>
                          <div className="bg-white/80 backdrop-blur-xs border border-teal-100/80 rounded-xl p-3.5 flex-grow shadow-xs">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Hasil Akhir</span>
                            <h4 className="font-bold text-xs text-slate-900 mb-2">Terbit 5 Berkas Pertanggungjawaban</h4>
                            
                            {/* Inner List of Generated Docs */}
                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-teal-50/50 border border-teal-100/50 text-[10.5px] font-semibold text-teal-950">
                                <span className="flex-shrink-0 w-5 h-5 rounded bg-white flex items-center justify-center border border-teal-100 text-xs shadow-2xs">📩</span>
                                <span>Undangan Resmi & Lampiran</span>
                              </div>
                              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-teal-50/50 border border-teal-100/50 text-[10.5px] font-semibold text-teal-950">
                                <span className="flex-shrink-0 w-5 h-5 rounded bg-white flex items-center justify-center border border-teal-100 text-xs shadow-2xs">📋</span>
                                <span>Daftar Hadir Absensi Peserta</span>
                              </div>
                              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-teal-50/50 border border-teal-100/50 text-[10.5px] font-semibold text-teal-950">
                                <span className="flex-shrink-0 w-5 h-5 rounded bg-white flex items-center justify-center border border-teal-100 text-xs shadow-2xs">📸</span>
                                <span>Dokumentasi Foto Laporan</span>
                              </div>
                              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-teal-50/50 border border-teal-100/50 text-[10.5px] font-semibold text-teal-950">
                                <span className="flex-shrink-0 w-5 h-5 rounded bg-white flex items-center justify-center border border-teal-100 text-xs shadow-2xs">💵</span>
                                <span>Daftar Penerimaan Uang Transport</span>
                              </div>
                              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-teal-50/50 border border-teal-100/50 text-[10.5px] font-semibold text-teal-950">
                                <span className="flex-shrink-0 w-5 h-5 rounded bg-white flex items-center justify-center border border-teal-100 text-xs shadow-2xs">📝</span>
                                <span>Notulensi & Risalah Rapat Baku</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informative Tips Footer */}
                      <div className="pt-2 flex items-start gap-2 text-[10.5px] text-slate-500 leading-relaxed font-medium bg-white/40 p-3 rounded-xl border border-slate-200/50">
                        <HelpCircle size={14} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Tips Tambahan:</strong> Setelah kegiatan berhasil dibuat, Anda dapat langsung mengunduh/mencetak dokumen secara kolektif maupun individu dalam ukuran kertas standar kerja A4.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* C2. BUAT DOKUMEN MANDIRI TAB */}
          {activeTab === "dokumen-mandiri" && (
            <motion.div
              key="dokumen-mandiri"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-7xl"
            >
              <div className="pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  {standaloneDocType === "undangan" && "Buat Undangan Mandiri (Terpisah)"}
                  {standaloneDocType === "daftarHadir" && "Buat Daftar Hadir Mandiri (Terpisah)"}
                  {standaloneDocType === "tandaTerima" && "Buat Penerimaan Transport Mandiri (Terpisah)"}
                  {standaloneDocType === "notulensi" && "Buat Notulensi Mandiri (Terpisah)"}
                </h2>
                <p className="text-xs text-slate-500 font-medium font-sans">
                  {standaloneDocType === "undangan" && "Isi data pokok di bawah untuk menerbitkan dokumen Undangan saja secara mandiri tanpa bundling berkas lainnya."}
                  {standaloneDocType === "daftarHadir" && "Isi data pokok di bawah untuk menerbitkan dokumen Daftar Hadir saja secara mandiri tanpa bundling berkas lainnya."}
                  {standaloneDocType === "tandaTerima" && "Isi data pokok di bawah untuk menerbitkan dokumen Penerimaan Transport saja secara mandiri tanpa bundling berkas lainnya."}
                  {standaloneDocType === "notulensi" && "Isi data pokok di bawah untuk menerbitkan dokumen Notulensi saja secara mandiri tanpa bundling berkas lainnya."}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form to create Standalone Document */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newKegiatan.namaKegiatan.trim()) return;

                    const id = "kegiatan-mandiri-" + Date.now();
                    const hari = getIndonesianDay(newKegiatan.tanggal);
                    const tahunKegiatan = new Date(newKegiatan.tanggal).getFullYear().toString();

                    const created: Kegiatan = {
                      ...newKegiatan,
                      id,
                      hari,
                      tahunKegiatan,
                      tipeDokumen: standaloneDocType, // Set the standalone document type!
                    };

                    setKegiatanList([...kegiatanList, created]);

                    // Initialize appropriate sub-structures
                    if (standaloneDocType === "notulensi") {
                      const emptyPoints: HasilRapatPoin[] = [];
                      const count = standaloneJumlahBaris > 0 ? standaloneJumlahBaris : 5;
                      for (let i = 0; i < count; i++) {
                        emptyPoints.push({ poin: "", uraian: "" });
                      }
                      const newNotulensi: Notulensi = {
                        kegiatanId: id,
                        hasilRapat: emptyPoints
                      };
                      setNotulensiList([...notulensiList, newNotulensi]);
                    } else if (standaloneDocType === "daftarHadir" || standaloneDocType === "tandaTerima") {
                      const count = standaloneJumlahBaris > 0 ? standaloneJumlahBaris : 10;
                      const addedRows: Peserta[] = [];
                      const isTransport = standaloneDocType === "tandaTerima";
                      const nominal = isTransport ? standaloneBesaranTransport : 0;
                      const tax = isTransport ? Math.round(nominal * (pph21Persen / 100)) : 0;
                      
                      for (let i = 0; i < count; i++) {
                        addedRows.push({
                          id: "peserta-mandiri-" + Date.now() + "-" + i + "-" + Math.random(),
                          kegiatanId: id,
                          no: i + 1,
                          nama: "",
                          kedudukan: "",
                          alamat: "",
                          penerimaan: nominal,
                          pph21: tax,
                          jumlahPenerimaan: nominal - tax
                        });
                      }
                      setPesertaList([...pesertaList, ...addedRows]);
                      if (standaloneDocType === "daftarHadir") {
                        setDaftarHadirUseRealData(true);
                      } else {
                        setTandaTerimaUseRealData(true);
                      }
                    }

                    // For transport or attendance lists, they are driven by participants (Peserta), which is empty by default but the user can add them
                    // Docs are also created if needed
                    const defaultDocs: Dokumentasi[] = [
                      { id: "doc-1-" + id, kegiatanId: id, fotoBase64: "", keterangan: "" },
                      { id: "doc-2-" + id, kegiatanId: id, fotoBase64: "", keterangan: "" },
                      { id: "doc-3-" + id, kegiatanId: id, fotoBase64: "", keterangan: "" }
                    ];
                    setDokumentasiList([...dokumentasiList, ...defaultDocs]);

                    // Redirect directly to details with the appropriate tab active
                    setSelectedKegiatanId(id);
                    setDetailSubTab(standaloneDocType);
                    setActiveTab("detail");

                    // Show success toast
                    showToast(
                      `Dokumen ${
                        standaloneDocType === "undangan" ? "Undangan" :
                        standaloneDocType === "daftarHadir" ? "Daftar Hadir" :
                        standaloneDocType === "tandaTerima" ? "Penerimaan Transport" : "Notulensi"
                      } Mandiri berhasil dibuat!`,
                      "success"
                    );

                    // Reset form
                    setNewKegiatan({
                      nomorSurat: `005/${kegiatanList.length + 18}/403.401.02/2026`,
                      namaKegiatan: "",
                      tanggal: new Date().toISOString().split("T")[0],
                      waktuMulai: "09:00",
                      waktuSelesai: "12:00",
                      tempat: "",
                      acara: "",
                      catatan: "Harap hadir tepat waktu.",
                      pemimpinRapat: instansi.namaKepalaDesa,
                      notulis: ""
                    });
                  }}
                  className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nomor Surat */}
                    <div>
                      <label htmlFor="nomorSuratStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Nomor Surat / Berkas <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="nomorSuratStand"
                        type="text"
                        value={newKegiatan.nomorSurat}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, nomorSurat: e.target.value })}
                        placeholder="Contoh: 005/16/403.401.02/2026"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Nama Kegiatan */}
                    <div>
                      <label htmlFor="namaKegiatanStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Nama Kegiatan / Hal Dokumen <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="namaKegiatanStand"
                        type="text"
                        value={newKegiatan.namaKegiatan}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, namaKegiatan: e.target.value })}
                        placeholder="Contoh: Rapat Koordinasi dan Evaluasi BPD"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Tanggal */}
                    <div>
                      <label htmlFor="tanggalStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Tanggal Pelaksanaan / Tanggal Dokumen <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="tanggalStand"
                        type="date"
                        value={newKegiatan.tanggal}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, tanggal: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {/* Waktu */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="waktuMulaiStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          Jam Mulai <span className="text-red-500 font-black ml-0.5">*</span>
                        </label>
                        <input
                          id="waktuMulaiStand"
                          type="text"
                          value={newKegiatan.waktuMulai}
                          onChange={(e) => setNewKegiatan({ ...newKegiatan, waktuMulai: e.target.value })}
                          placeholder="Contoh: 09:00"
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="waktuSelesaiStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          Jam Selesai <span className="text-red-500 font-black ml-0.5">*</span>
                        </label>
                        <input
                          id="waktuSelesaiStand"
                          type="text"
                          value={newKegiatan.waktuSelesai}
                          onChange={(e) => setNewKegiatan({ ...newKegiatan, waktuSelesai: e.target.value })}
                          placeholder="Contoh: 12:00"
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Tempat */}
                    <div className="md:col-span-2">
                      <label htmlFor="tempatStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Tempat Kegiatan <span className="text-red-500 font-black ml-0.5">*</span>
                      </label>
                      <input
                        id="tempatStand"
                        type="text"
                        value={newKegiatan.tempat}
                        onChange={(e) => setNewKegiatan({ ...newKegiatan, tempat: e.target.value })}
                        placeholder="Contoh: Balai Pertemuan Desa"
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        required
                      />
                    </div>

                    {standaloneDocType === "undangan" && (
                      <div className="md:col-span-2">
                        <label htmlFor="acaraStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          Acara Pada Undangan <span className="text-red-500 font-black ml-0.5">*</span>
                        </label>
                        <input
                          id="acaraStand"
                          type="text"
                          value={newKegiatan.acara}
                          onChange={(e) => setNewKegiatan({ ...newKegiatan, acara: e.target.value })}
                          placeholder="Contoh: Sosialisasi Pengelolaan Dana Desa"
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                          required={standaloneDocType === "undangan"}
                        />
                      </div>
                    )}

                    {standaloneDocType === "undangan" && (
                      <div className="md:col-span-2">
                        <label htmlFor="catatanStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          Catatan / Lampiran Undangan
                        </label>
                        <textarea
                          id="catatanStand"
                          rows={2}
                          value={newKegiatan.catatan}
                          onChange={(e) => setNewKegiatan({ ...newKegiatan, catatan: e.target.value })}
                          placeholder="Contoh: Membawa fotokopi KTP dan lembar kerja."
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        />
                      </div>
                    )}

                    {standaloneDocType === "notulensi" && (
                      <>
                        <div>
                          <label htmlFor="pemimpinRapatStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                            Pimpinan Rapat <span className="text-red-500 font-black ml-0.5">*</span>
                          </label>
                          <input
                            id="pemimpinRapatStand"
                            type="text"
                            value={newKegiatan.pemimpinRapat}
                            onChange={(e) => setNewKegiatan({ ...newKegiatan, pemimpinRapat: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                            required={standaloneDocType === "notulensi"}
                          />
                        </div>
                        <div>
                          <label htmlFor="notulisStand" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                            Notulis Rapat <span className="text-red-500 font-black ml-0.5">*</span>
                          </label>
                          <input
                            id="notulisStand"
                            type="text"
                            value={newKegiatan.notulis}
                            onChange={(e) => setNewKegiatan({ ...newKegiatan, notulis: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                            required={standaloneDocType === "notulensi"}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* CUSTOM QUANTITY AND TRANSPORT SETUP FOR STANDALONE DOCS */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {standaloneDocType === "daftarHadir" && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Settings size={13} />
                          Prosedur & Inisialisasi Daftar Hadir
                        </h4>
                        <div>
                          <label htmlFor="standaloneJumlahBarisHadir" className="block text-xs font-bold text-slate-700 mb-1.5">
                            Jumlah Baris Daftar Hadir (Peserta) <span className="text-red-500 font-black ml-0.5">*</span>
                          </label>
                          <input
                            id="standaloneJumlahBarisHadir"
                            type="number"
                            min={1}
                            max={100}
                            value={standaloneJumlahBaris}
                            onChange={(e) => setStandaloneJumlahBaris(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full md:w-1/2 border border-emerald-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 font-semibold"
                            required
                          />
                          <p className="text-[10px] text-emerald-700 mt-1.5 font-medium leading-relaxed">
                            💡 Sistem akan otomatis menghasilkan <strong>{standaloneJumlahBaris} baris kosong</strong> pada berkas Daftar Hadir baru ini agar siap diisi secara langsung atau dicetak untuk tanda tangan fisik.
                          </p>
                        </div>
                      </div>
                    )}

                    {standaloneDocType === "tandaTerima" && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
                        <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Settings size={13} />
                          Prosedur & Inisialisasi Transport
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="standaloneJumlahBarisTransport" className="block text-xs font-bold text-slate-700 mb-1.5">
                              Jumlah Baris Penerima Transport <span className="text-red-500 font-black ml-0.5">*</span>
                            </label>
                            <input
                              id="standaloneJumlahBarisTransport"
                              type="number"
                              min={1}
                              max={100}
                              value={standaloneJumlahBaris}
                              onChange={(e) => setStandaloneJumlahBaris(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full border border-emerald-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 font-semibold"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="standaloneBesaranTransport" className="block text-xs font-bold text-slate-700 mb-1.5">
                              Besaran Uang Transport (Rp per Orang) <span className="text-red-500 font-black ml-0.5">*</span>
                            </label>
                            <input
                              id="standaloneBesaranTransport"
                              type="number"
                              min={0}
                              step={5000}
                              value={standaloneBesaranTransport}
                              onChange={(e) => setStandaloneBesaranTransport(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full border border-emerald-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 font-semibold"
                              required
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                          💡 Sistem akan otomatis menghasilkan <strong>{standaloneJumlahBaris} baris data tanda terima</strong> dengan nominal uang masing-masing sebesar <strong>Rp {(standaloneBesaranTransport).toLocaleString("id-ID")}</strong> (termasuk potongan PPh 21 sebesar {pph21Persen}% secara otomatis).
                        </p>
                      </div>
                    )}

                    {standaloneDocType === "notulensi" && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Settings size={13} />
                          Prosedur & Inisialisasi Poin Pembahasan
                        </h4>
                        <div>
                          <label htmlFor="standaloneJumlahBarisNotulensi" className="block text-xs font-bold text-slate-700 mb-1.5">
                            Jumlah Baris Poin Pembahasan / Hasil Rapat <span className="text-red-500 font-black ml-0.5">*</span>
                          </label>
                          <input
                            id="standaloneJumlahBarisNotulensi"
                            type="number"
                            min={1}
                            max={30}
                            value={standaloneJumlahBaris}
                            onChange={(e) => setStandaloneJumlahBaris(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full md:w-1/2 border border-emerald-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 font-semibold"
                            required
                          />
                          <p className="text-[10px] text-emerald-700 mt-1.5 font-medium leading-relaxed">
                            💡 Sistem akan otomatis menyediakan <strong>{standaloneJumlahBaris} baris poin kosong</strong> di dalam berkas Notulensi Anda sehingga Anda tinggal menuliskan ringkasan pembahasan pada masing-masing baris secara praktis.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("dashboard")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-150 text-gray-700 text-xs font-bold rounded-lg transition-all cursor-pointer border border-gray-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                    >
                      Buat Dokumen Sekarang
                    </button>
                  </div>
                </form>

                {/* Right Column Illustration */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-100/30 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none" />

                    <div className="relative space-y-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-700 text-white shadow-xs">
                          <FileText size={16} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Dokumen Mandiri</h3>
                          <p className="text-[10px] text-emerald-800 font-extrabold tracking-wider uppercase">Konsep Mandiri Tanpa Bundling</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Anda sedang membuat dokumen pertanggungjawaban secara <strong className="text-emerald-950">terpisah/mandiri</strong>.
                      </p>

                      <div className="space-y-4 pt-2 relative">
                        <div className="absolute left-[17px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-300 via-emerald-200 to-teal-300" />

                        <div className="flex gap-3 items-start relative group">
                          <div className="w-9 h-9 rounded-full bg-white border-2 border-emerald-500 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs z-10">
                            1
                          </div>
                          <div className="bg-white/80 backdrop-blur-xs border border-emerald-100/80 rounded-xl p-3 flex-grow shadow-xs">
                            <h4 className="font-bold text-xs text-slate-900 mb-1">Isi Formulir</h4>
                            <p className="text-[11px] text-slate-500 leading-normal font-medium">
                              Isi data pokok yang dibutuhkan untuk dokumen spesifik pilihan Anda.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start relative group">
                          <div className="w-9 h-9 rounded-full bg-white border-2 border-teal-500 text-teal-700 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs z-10">
                            2
                          </div>
                          <div className="bg-white/80 backdrop-blur-xs border border-emerald-100/80 rounded-xl p-3 flex-grow shadow-xs">
                            <h4 className="font-bold text-xs text-slate-900 mb-1">Sesuaikan Dokumen</h4>
                            <p className="text-[11px] text-slate-500 leading-normal font-medium">
                              Sistem akan langsung membuka dokumen tersebut secara detail dan siap cetak.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-start gap-2 text-[10.5px] text-slate-500 leading-relaxed font-medium bg-white/40 p-3 rounded-xl border border-slate-200/50">
                        <HelpCircle size={14} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                        <span>
                          Dokumen mandiri ini terdaftar di Dashboard Utama dan bisa Anda kelola, edit, ataupun cetak secara langsung kapan saja.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* C. PENGATURAN INSTANSI TAB */}
          {activeTab === "pengaturan" && (
            <motion.div
              key="pengaturan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-7xl"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">Pengaturan Instansi Pemerintahan Desa</h2>
                  <p className="text-xs text-slate-500 font-medium">Lengkapi data pokok desa Anda. Data ini dicetak di KOP SURAT semua dokumen pertanggungjawaban.</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  Reset ke Default Pabrik
                </button>
              </div>

              {/* Single Unified Settings Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                  
                  {/* Bagian Kiri: Pengaturan Instansi (7 columns) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Data Pokok Instansi</h3>
                      <p className="text-[10px] text-emerald-800 font-extrabold tracking-wider uppercase">Identitas & Legalitas Desa</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Nama Desa */}
                      <div>
                        <label htmlFor="namaDesa-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Nama Desa</label>
                        <input
                          id="namaDesa-input"
                          type="text"
                          value={instansi.namaDesa}
                          onChange={(e) => handleNamaDesaChangeInSettings(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-bold"
                        />
                      </div>

                      {/* Kecamatan */}
                      <div>
                        <label htmlFor="kecamatan-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Kecamatan</label>
                        <input
                          id="kecamatan-input"
                          type="text"
                          value={instansi.kecamatan}
                          onChange={(e) => setInstansi({ ...instansi, kecamatan: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        />
                      </div>

                      {/* Kabupaten */}
                      <div>
                        <label htmlFor="kabupaten-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Kabupaten</label>
                        <input
                          id="kabupaten-input"
                          type="text"
                          value={instansi.kabupaten}
                          onChange={(e) => setInstansi({ ...instansi, kabupaten: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        />
                      </div>

                      {/* Kode Pos */}
                      <div>
                        <label htmlFor="kodePos-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Kode Pos</label>
                        <input
                          id="kodePos-input"
                          type="text"
                          value={instansi.kodePos}
                          onChange={(e) => setInstansi({ ...instansi, kodePos: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-mono font-medium"
                        />
                      </div>

                      {/* Alamat Kantor */}
                      <div className="md:col-span-2">
                        <label htmlFor="alamatKantor-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Alamat Kantor Desa (Nama Jalan & Nomor)</label>
                        <input
                          id="alamatKantor-input"
                          type="text"
                          value={instansi.alamatKantor}
                          onChange={(e) => setInstansi({ ...instansi, alamatKantor: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        />
                      </div>

                      {/* Email Desa */}
                      <div>
                        <label htmlFor="emailDesa-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Email Desa</label>
                        <input
                          id="emailDesa-input"
                          type="email"
                          value={instansi.emailDesa}
                          onChange={(e) => setInstansi({ ...instansi, emailDesa: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        />
                      </div>

                      {/* Website Desa */}
                      <div>
                        <label htmlFor="websiteDesa-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Website Desa</label>
                        <input
                          id="websiteDesa-input"
                          type="text"
                          value={instansi.websiteDesa}
                          onChange={(e) => setInstansi({ ...instansi, websiteDesa: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        />
                      </div>

                      {/* Nama Kepala Desa */}
                      <div className="md:col-span-2 border-t border-slate-100 pt-3.5">
                        <label htmlFor="namaKepalaDesa-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">Nama Kepala Desa (Penanda Tangan Utama)</label>
                        <input
                          id="namaKepalaDesa-input"
                          type="text"
                          value={instansi.namaKepalaDesa}
                          onChange={(e) => handleKepalaDesaChangeInSettings(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/30 text-slate-900 placeholder-slate-500 font-bold"
                        />
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          Nama ini dicetak sebagai penanda tangan utama (KOP & TTD) di seluruh dokumen pertanggungjawaban kegiatan.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Kanan: Logo & Integrasi Sistem (5 columns, unified layout inside) */}
                  <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8 space-y-6">
                    {/* Header Sub-seksi Logo & Integrasi */}
                    <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
                        <Database size={16} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Logo & Integrasi Database</h3>
                        <p className="text-[10px] text-emerald-800 font-extrabold tracking-wider uppercase">Penyimpanan & Visual Aset</p>
                      </div>
                    </div>

                    {/* SEKSI 1: LINK URL LOGO */}
                    <div className="space-y-3.5 pb-5 border-b border-slate-100">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-full border border-emerald-800 bg-slate-50/50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                          {instansi.logoUrl ? (
                            <img src={instansi.logoUrl} alt="Logo Desa" className="w-11 h-11 object-contain rounded-full" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[8px] font-bold text-slate-400 font-mono">NO LOGO</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <label htmlFor="logo-url-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-0.5">
                            Link URL Logo Desa / Kabupaten <span className="text-red-500 font-black ml-0.5">*</span>
                          </label>
                          <p className="text-[10px] text-slate-500 font-medium leading-normal">
                            Tautan logo online untuk KOP SURAT semua dokumen pertanggungjawaban.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          id="logo-url-input"
                          type="text"
                          value={instansi.logoUrl || ""}
                          onChange={(e) => setInstansi({ ...instansi, logoUrl: e.target.value })}
                          placeholder="Contoh: https://domain.com/logo_desa.png"
                          className="flex-grow border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                        />
                        {instansi.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setInstansi({ ...instansi, logoUrl: "" })}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-gray-200"
                          >
                            Kosongkan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SEKSI 2: INTEGRASI GOOGLE SHEETS */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="sheet-url-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                          URL Web App Google Apps Script
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="sheet-url-input"
                            type="text"
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className="flex-grow border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono bg-gray-50/30 text-slate-900 placeholder-slate-500 font-medium"
                          />
                          {sheetUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setSheetUrl("");
                                localStorage.removeItem("desa_sheet_url");
                              }}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Putuskan
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-normal">
                          Format harus diawali dengan <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[9.5px]">https://script.google.com/macros/s/</code>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={syncStatus === "loading"}
                          onClick={() => handlePullFromSheets()}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-slate-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-gray-200 shadow-2xs"
                        >
                          <RefreshCw size={13} className={syncStatus === "loading" ? "animate-spin text-emerald-600" : "text-slate-500"} />
                          Tarik Data
                        </button>
                        <button
                          type="button"
                          disabled={syncStatus === "loading"}
                          onClick={() => handlePushToSheets()}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Database size={13} className="text-emerald-100" />
                          Simpan Data
                        </button>
                      </div>

                      {/* Sync status alert inside Settings */}
                      {syncStatus !== "idle" && syncMessage && (
                        <div className={`text-xs px-3.5 py-3 rounded-lg border flex items-start gap-2.5 ${
                          syncStatus === "loading" ? "bg-blue-50 text-blue-800 border-blue-100 animate-pulse" :
                          syncStatus === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                          "bg-red-50 text-red-800 border-red-100"
                        }`}>
                          {syncStatus === "loading" ? (
                            <RefreshCw size={13} className="animate-spin text-blue-600 mt-0.5 flex-shrink-0" />
                          ) : syncStatus === "success" ? (
                            <CheckCircle size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle size={13} className="text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-grow min-w-0">
                            <p className="font-bold text-[11px] uppercase tracking-wider">Status Sinkronisasi</p>
                            <p className="text-[11px] mt-0.5 font-medium leading-relaxed break-words">{syncMessage}</p>
                            {lastSynced && <p className="text-[9px] text-slate-400 mt-1 font-semibold">Sinkronisasi terakhir: {lastSynced}</p>}
                          </div>
                        </div>
                      )}

                      {/* Collapsible Apps Script Quick Guide */}
                      <details className="bg-slate-50/50 border border-slate-200/50 rounded-lg p-3 group">
                        <summary className="list-none flex items-center justify-between font-extrabold text-[11px] text-emerald-800 uppercase tracking-wide cursor-pointer select-none">
                          <span className="flex items-center gap-1.5">
                            <FileCode size={13} />
                            Petunjuk Cepat Google Apps Script
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-400 group-open:hidden">Tampilkan ▾</span>
                          <span className="text-[9.5px] font-bold text-slate-400 hidden group-open:inline">Sembunyikan ▴</span>
                        </summary>
                        <div className="mt-2.5 text-[10.5px] text-slate-600 space-y-2 border-t border-slate-200/50 pt-2.5 leading-relaxed">
                          <ol className="list-decimal list-inside space-y-1.5">
                            <li>Buka Google Sheets (spreadsheet baru).</li>
                            <li>Pilih menu <b>Ekstensi &gt; Apps Script</b>.</li>
                            <li>Ganti seluruh isi file script dengan kode yang ada di tab file <code>google-apps-script.gs</code> di aplikasi ini.</li>
                            <li>Simpan proyek, lalu klik <b>Terapkan (Deploy) &gt; Terapkan Baru (New Deployment)</b>.</li>
                            <li>Pilih jenis tipe: <b>Aplikasi Web (Web App)</b>.</li>
                            <li>Isi setelan: Jalankan sebagai <b>Saya (Me)</b> dan Siapa saja yang memiliki akses ke <b>Siapa Saja (Anyone)</b>.</li>
                            <li>Salin URL Aplikasi Web yang dihasilkan dan tempel di kotak isian di atas!</li>
                          </ol>
                        </div>
                      </details>
                    </div>
                  </div>

                </div>

                {/* Footer status bar inside the unified card */}
                <div className="flex justify-end pt-5 mt-6 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs">
                    <CheckCircle size={14} /> Pengaturan Tersimpan Otomatis (localStorage)
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* C.2. TENTANG KAMI TAB */}
          {activeTab === "tentang-kami" && (
            <motion.div
              key="tentang-kami"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-gray-200 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-wider uppercase rounded-md border border-emerald-100 shadow-sm flex items-center gap-1">
                      <Info size={11} className="text-emerald-700" /> Informasi Sistem & Profil
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">Tentang Kami</h2>
                  <p className="text-xs text-slate-500 font-medium">Informasi detail aplikasi Klik Beres dan profil singkat pengembang.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Bagian Kiri: Deskripsi & Fitur Aplikasi (7 columns) */}
                <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Klik Beres v1.0</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      <strong className="text-emerald-800">Klik Beres</strong> adalah sistem aplikasi terpadu yang dirancang khusus untuk mempermudah, mempercepat, dan mengotomasi penyusunan seluruh dokumen pertanggungjawaban (SPJ) kegiatan di tingkat pemerintahan desa/kelurahan. Aplikasi ini menjembatani kebutuhan administrasi yang tertib, cepat, dan akurat dengan antarmuka yang sangat mudah digunakan oleh perangkat desa.
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Dengan dukungan penyimpanan ganda, data Anda disimpan secara aman di perangkat lokal (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 text-[11px] font-mono font-semibold">localStorage</code>) dan dapat disinkronkan secara realtime ke cloud menggunakan spreadsheet <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 text-[11px] font-mono font-semibold">Google Sheets</code> Anda sendiri, menjamin keamanan data tanpa biaya server tambahan.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 tracking-wider uppercase">Fitur Unggulan Sistem</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fitur 1 */}
                      <div className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 mt-0.5">
                          <FileText size={15} />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-extrabold text-xs text-slate-900">Otomasi Berkas SPJ</h5>
                          <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                            Menghasilkan Undangan, Daftar Hadir, Dokumentasi, Tanda Terima, dan Notulensi secara otomatis dalam satu klik.
                          </p>
                        </div>
                      </div>

                      {/* Fitur 2 */}
                      <div className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 mt-0.5">
                          <Database size={15} />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-extrabold text-xs text-slate-900">Koneksi Google Sheets</h5>
                          <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                            Integrasi cloud database dua arah (push/pull) yang andal, aman, awet, dan sinkron antar-perangkat.
                          </p>
                        </div>
                      </div>

                      {/* Fitur 3 */}
                      <div className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 mt-0.5">
                          <Users size={15} />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-extrabold text-xs text-slate-900">Penerimaan & Pajak</h5>
                          <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                            Penghitungan tanda terima transport peserta rapat lengkap dengan perhitungan PPh 21 otomatis.
                          </p>
                        </div>
                      </div>

                      {/* Fitur 4 */}
                      <div className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 mt-0.5">
                          <Printer size={15} />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-extrabold text-xs text-slate-900">Siap Cetak Sempurna</h5>
                          <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                            Layout cetak presisi tinggi yang disesuaikan dengan standar dokumen negara ukuran A4 tanpa terpotong.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Profil Pengembang (5 columns) */}
                <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6 flex flex-col items-center text-center">
                  <div className="space-y-4 w-full">
                    <h4 className="text-xs font-black text-slate-400 tracking-wider uppercase text-left border-b border-slate-100 pb-2">Profil Pengembang</h4>
                    
                    <div className="flex justify-center py-4">
                      <div className="w-28 h-28 rounded-2xl border border-slate-150 p-2 bg-slate-50/50 flex items-center justify-center shadow-2xs overflow-hidden">
                        <img 
                          src="https://res.cloudinary.com/maswardi/image/upload/v1775745397/akm_yq9a7m.png" 
                          alt="Arunika Kreatif Media Logo" 
                          className="w-full h-full object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-black text-base text-slate-900 leading-tight">Arunika Kreatif Media</h3>
                      <p className="text-[10px] text-emerald-800 font-extrabold tracking-wider uppercase">Solusi Digitalisasi Pemerintahan Desa</p>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed font-medium text-justify px-2">
                      <strong className="text-slate-900">Arunika Kreatif Media</strong> berdedikasi tinggi dalam menghadirkan solusi teknologi informasi inovatif dan digitalisasi yang ramah pengguna bagi instansi pemerintahan, khususnya di tingkat desa. Kami berfokus pada penyederhanaan birokrasi, otomatisasi administrasi, dan peningkatan efisiensi kinerja aparat desa demi tercapainya pelayanan publik yang prima, transparan, dan akuntabel di seluruh pelosok Indonesia.
                    </p>

                    <div className="border-t border-slate-100 pt-5 w-full text-left space-y-2.5">
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="p-1 rounded bg-slate-100 text-slate-500 flex-shrink-0">
                          <Building2 size={13} />
                        </div>
                        <span className="font-semibold text-slate-700">Aplikasi Pemerintahan & Custom Software</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="p-1 rounded bg-slate-100 text-slate-500 flex-shrink-0">
                          <MessageSquare size={13} className="text-emerald-600" />
                        </div>
                        <a 
                          href="https://wa.me/6285150617732" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-bold text-emerald-800 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-1 font-mono"
                        >
                          WhatsApp: 085150617732 <ExternalLink size={10} className="inline opacity-70" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* D. DETAIL KEGIATAN & TAB BERKAS */}
          {activeTab === "detail" && activeKegiatan && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Top Navigation Bar / Breadcrumb */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-100 px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    Kembali ke Dashboard
                  </button>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">
                    {activeKegiatan.namaKegiatan}
                  </h2>
                  <p className="text-xs text-gray-500">
                    No. Surat: {activeKegiatan.nomorSurat} &nbsp;|&nbsp; Pelaksanaan: {activeKegiatan.hari}, {formatIndonesianDate(activeKegiatan.tanggal)}
                  </p>
                </div>

                {/* Combined Printing Trigger Bar */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={syncStatus === "loading"}
                    onClick={() => handlePushToSheets()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Database size={14} className={syncStatus === "loading" ? "animate-spin" : ""} />
                    {syncStatus === "loading" ? "Menyimpan..." : "Simpan Perubahan ke Spreadsheet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerPrint(detailSubTab)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Printer size={14} />
                    Cetak Berkas Aktif (A4)
                  </button>
                  {(!activeKegiatan.tipeDokumen || activeKegiatan.tipeDokumen === "bundling") && (
                    <button
                      type="button"
                      onClick={() => handleTriggerPrint("all")}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                    >
                      <Download size={14} />
                      Cetak Semua Berkas Sekaligus
                    </button>
                  )}
                </div>
              </div>

              {/* Sub tabs bar (Undangan, Daftar Hadir, Dokumentasi, Tanda Terima, Notulensi) */}
              <div className="flex border-b border-gray-200 overflow-x-auto pb-px bg-white p-1 rounded-xl shadow-sm gap-1">
                {(["undangan", "daftarHadir", "dokumentasi", "tandaTerima", "notulensi"] as const)
                  .filter((tab) => {
                    if (!activeKegiatan.tipeDokumen || activeKegiatan.tipeDokumen === "bundling") return true;
                    return activeKegiatan.tipeDokumen === tab;
                  })
                  .map((tab) => {
                    const labelMap = {
                      undangan: "📩 Undangan Kegiatan",
                      daftarHadir: "📋 Daftar Hadir",
                      dokumentasi: "📸 Dokumentasi Foto",
                      tandaTerima: "💵 Penerimaan Transport",
                      notulensi: "📝 Notulensi Rapat"
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => setDetailSubTab(tab)}
                        className={`px-4 py-2.5 rounded-lg font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                          detailSubTab === tab
                            ? "bg-emerald-800 text-white shadow-sm"
                            : "text-gray-500 hover:text-emerald-800 hover:bg-gray-50"
                        }`}
                      >
                        {labelMap[tab]}
                      </button>
                    );
                  })}
              </div>

              {/* Main side-by-side editing layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* A. SIDEBAR CONFIG PANEL per document - hidden on print */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Participant controller inside Daftar Hadir / Tanda Terima */}
                  {(detailSubTab === "daftarHadir" || detailSubTab === "tandaTerima") && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                          <Users size={16} className="text-emerald-700" />
                          Daftar Peserta Rapat
                        </h3>
                        <p className="text-[11px] text-gray-500">Kelola baris tabel peserta rapat di sini.</p>
                      </div>

                      {/* Atur Tampilan Tabel Section */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3.5 space-y-3">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Konfigurasi Lembar Cetak</p>
                        
                        <div className="flex flex-col gap-2 bg-white p-2.5 rounded border border-gray-100">
                          <label className="text-[11px] font-bold text-gray-700 flex justify-between items-center">
                            <span>Metode Pengisian:</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-850 font-black">
                              {detailSubTab === "daftarHadir" 
                                ? (daftarHadirUseRealData ? "DATA ASLI" : "KOSONG (A4)") 
                                : (tandaTerimaUseRealData ? "DATA ASLI" : "KOSONG (A4)")
                              }
                            </span>
                          </label>
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (detailSubTab === "daftarHadir") setDaftarHadirUseRealData(false);
                                else setTandaTerimaUseRealData(false);
                              }}
                              className={`py-1 text-[11px] font-bold rounded cursor-pointer transition-all border ${
                                (detailSubTab === "daftarHadir" ? !daftarHadirUseRealData : !tandaTerimaUseRealData)
                                  ? "bg-emerald-700 text-white border-emerald-700"
                                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              Default Kosong
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (detailSubTab === "daftarHadir") setDaftarHadirUseRealData(true);
                                else setTandaTerimaUseRealData(true);
                              }}
                              className={`py-1 text-[11px] font-bold rounded cursor-pointer transition-all border ${
                                (detailSubTab === "daftarHadir" ? daftarHadirUseRealData : tandaTerimaUseRealData)
                                  ? "bg-emerald-700 text-white border-emerald-700"
                                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              Gunakan Data Asli
                            </button>
                          </div>
                        </div>

                        {/* Row count input */}
                        {!(detailSubTab === "daftarHadir" ? daftarHadirUseRealData : tandaTerimaUseRealData) && (
                          <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded border border-gray-100">
                            <span className="text-[11px] font-bold text-gray-700">Jumlah Baris Kosong:</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={detailSubTab === "daftarHadir" ? daftarHadirRowCount : tandaTerimaRowCount}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                if (detailSubTab === "daftarHadir") setDaftarHadirRowCount(val);
                                else setTandaTerimaRowCount(val);
                              }}
                              className="w-16 border border-gray-300 rounded px-2 py-0.5 text-center text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                              title="Jumlah Baris"
                            />
                          </div>
                        )}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex flex-col gap-2">
                        {activePesertaList.length === 0 && (
                          <button
                            type="button"
                            onClick={handleLoadDefaultBPD}
                            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Plus size={14} />
                            Isi Cepat BPD (7 Anggota)
                          </button>
                        )}
                        
                        <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg space-y-1.5">
                          <label className="block text-[11px] font-bold text-emerald-900">
                            Tambah Baris Kosong:
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex items-center flex-grow">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={blankRowsCount}
                                onChange={(e) => setBlankRowsCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full border border-emerald-200 rounded-lg px-2.5 py-1.5 text-center text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none bg-white"
                                placeholder="5"
                                title="Jumlah Baris"
                              />
                              <span className="absolute right-2 text-[10px] text-gray-400 font-bold select-none">baris</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleTambahBarisKosong(blankRowsCount)}
                              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Plus size={13} />
                              Terapkan
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Participant list with delete option */}
                      {activePesertaList.length > 0 && (
                        <div className="border border-gray-100 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-100">
                          {activePesertaList.map((p, index) => (
                            <div key={p.id} className="p-2.5 flex justify-between items-center text-xs hover:bg-gray-50">
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-gray-900 truncate">
                                  {index + 1}. {p.nama || <span className="text-gray-400 italic font-normal">Baris Kosong (Dotted)</span>}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {(p.kedudukan || p.alamat) ? `${p.kedudukan || "-"} | ${p.alamat || "-"}` : "Hanya Transport: " + (p.penerimaan ? `Rp ${p.penerimaan.toLocaleString("id-ID")}` : "Rp 0")}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleHapusPeserta(p.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 cursor-pointer"
                                title="Hapus Peserta"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new Participant form */}
                      <form onSubmit={handleAddPeserta} className="border-t border-gray-100 pt-3 space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tambah Anggota Manual</p>
                        <div>
                          <input
                            type="text"
                            placeholder="Nama Lengkap (Opsional)"
                            value={newPeserta.nama}
                            onChange={(e) => setNewPeserta({ ...newPeserta, nama: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-50/30"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Kedudukan / Jabatan"
                            value={newPeserta.kedudukan}
                            onChange={(e) => setNewPeserta({ ...newPeserta, kedudukan: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-50/30"
                          />
                          <input
                            type="text"
                            placeholder="Alamat / Dusun"
                            value={newPeserta.alamat}
                            onChange={(e) => setNewPeserta({ ...newPeserta, alamat: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-50/30"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <span className="absolute left-2.5 top-1.5 text-[10px] text-gray-400 font-bold">Rp</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Nominal Transport"
                              value={newPeserta.penerimaan}
                              onChange={(e) => setNewPeserta({ ...newPeserta, penerimaan: Number(e.target.value) })}
                              className="w-full border border-gray-300 rounded pl-7 pr-2 py-1 text-xs bg-gray-50/30 font-mono font-bold"
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer"
                          >
                            Tambah
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Penandatangan Edit Form - per document tab */}
                  {detailSubTab !== "dokumentasi" && detailSubTab !== "notulensi" && detailSubTab !== "undangan" && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                          <FileText size={16} className="text-emerald-700" />
                          Penanda Tangan Berkas
                        </h3>
                        <p className="text-[11px] text-gray-500">Sesuaikan nama/jabatan penanda tangan dokumen sebelum cetak.</p>
                      </div>

                      {detailSubTab === "undangan" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Jabatan Penutup</label>
                            <input
                              type="text"
                              value={penandaTangan.undangan.jabatan}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                undangan: { ...penandaTangan.undangan, jabatan: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-1 font-bold"
                              title="Jabatan Penutup Undangan"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                            <input
                              type="text"
                              value={penandaTangan.undangan.nama}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                undangan: { ...penandaTangan.undangan, nama: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-1 font-bold"
                              title="Nama Lengkap Penandatangan Undangan"
                            />
                          </div>
                        </div>
                      )}

                      {detailSubTab === "daftarHadir" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Label Kiri Footer</label>
                            <textarea
                              value={penandaTangan.daftarHadir.jabatanPenutup}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                daftarHadir: { ...penandaTangan.daftarHadir, jabatanPenutup: e.target.value }
                              })}
                              rows={2}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-1 font-bold resize-none"
                              title="Label Kiri Footer Daftar Hadir"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                            <input
                              type="text"
                              value={penandaTangan.daftarHadir.nama}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                daftarHadir: { ...penandaTangan.daftarHadir, nama: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-1 font-bold"
                              title="Nama Lengkap Penandatangan Daftar Hadir"
                            />
                          </div>
                        </div>
                      )}

                      {detailSubTab === "notulensi" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Jabatan Penutup</label>
                            <input
                              type="text"
                              value={penandaTangan.notulensi.jabatan}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                notulensi: { ...penandaTangan.notulensi, jabatan: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-1 font-bold"
                              title="Jabatan Penutup Notulensi"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                            <input
                              type="text"
                              value={penandaTangan.notulensi.nama}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                notulensi: { ...penandaTangan.notulensi, nama: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-1 font-bold"
                              title="Nama Lengkap Penandatangan Notulensi"
                            />
                          </div>
                        </div>
                      )}

                      {detailSubTab === "tandaTerima" && (
                        <div className="space-y-4">
                          {/* Kiri */}
                          <div className="border-b border-gray-100 pb-2">
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1">Kolom Kiri (Kepala Desa selaku PKPKD)</p>
                            <input
                              type="text"
                              placeholder="Label Jabatan"
                              value={penandaTangan.tandaTerima.kiri.label}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                tandaTerima: {
                                  ...penandaTangan.tandaTerima,
                                  kiri: { ...penandaTangan.tandaTerima.kiri, label: e.target.value }
                                }
                              })}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-semibold mb-1"
                              title="Label Jabatan Kolom Kiri"
                            />
                            <input
                              type="text"
                              placeholder="Nama Lengkap"
                              value={penandaTangan.tandaTerima.kiri.nama}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                tandaTerima: {
                                  ...penandaTangan.tandaTerima,
                                  kiri: { ...penandaTangan.tandaTerima.kiri, nama: e.target.value }
                                }
                              })}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs"
                              title="Nama Lengkap Kolom Kiri"
                            />
                          </div>

                          {/* Tengah */}
                          <div className="border-b border-gray-100 pb-2">
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1">Kolom Tengah (Sekretaris Desa selaku PPKD)</p>
                            <input
                              type="text"
                              placeholder="Label Jabatan"
                              value={penandaTangan.tandaTerima.tengah.label}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                tandaTerima: {
                                  ...penandaTangan.tandaTerima,
                                  tengah: { ...penandaTangan.tandaTerima.tengah, label: e.target.value }
                                }
                              })}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-semibold mb-1"
                              title="Label Jabatan Kolom Tengah"
                            />
                            <input
                              type="text"
                              placeholder="Nama Lengkap"
                              value={penandaTangan.tandaTerima.tengah.nama}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                tandaTerima: {
                                  ...penandaTangan.tandaTerima,
                                  tengah: { ...penandaTangan.tandaTerima.tengah, nama: e.target.value }
                                }
                              })}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs"
                              title="Nama Lengkap Kolom Tengah"
                            />
                          </div>

                          {/* Kanan */}
                          <div>
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1">Kolom Kanan (Bendahara Desa)</p>
                            <input
                              type="text"
                              placeholder="Label Jabatan"
                              value={penandaTangan.tandaTerima.kanan.label}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                tandaTerima: {
                                  ...penandaTangan.tandaTerima,
                                  kanan: { ...penandaTangan.tandaTerima.kanan, label: e.target.value }
                                }
                              })}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-semibold mb-1"
                              title="Label Jabatan Kolom Kanan"
                            />
                            <input
                              type="text"
                              placeholder="Nama Lengkap"
                              value={penandaTangan.tandaTerima.kanan.nama}
                              onChange={(e) => setPenandaTangan({
                                ...penandaTangan,
                                tandaTerima: {
                                  ...penandaTangan.tandaTerima,
                                  kanan: { ...penandaTangan.tandaTerima.kanan, nama: e.target.value }
                                }
                              })}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs"
                              title="Nama Lengkap Kolom Kanan"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Persistent Save Card to Spreadsheet */}
                  {detailSubTab !== "dokumentasi" && detailSubTab !== "notulensi" && detailSubTab !== "undangan" && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3.5 border-l-4 border-l-emerald-600 no-print">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-emerald-50 text-emerald-800">
                          <Database size={16} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-950 uppercase tracking-wide">Penyimpanan Spreadsheet</h4>
                          <p className="text-[10px] text-gray-400">Simpan perubahan Anda secara permanen</p>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Perubahan pada berkas undangan, daftar hadir, foto dokumentasi, penerimaan transport, dan notulensi akan disimpan permanen ke Google Spreadsheet Anda.
                      </p>

                      <button
                        type="button"
                        disabled={syncStatus === "loading"}
                        onClick={() => handlePushToSheets()}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Database size={13} className={syncStatus === "loading" ? "animate-spin" : ""} />
                        {syncStatus === "loading" ? "Sedang Menyimpan..." : "Simpan ke Spreadsheet"}
                      </button>
                      
                      {lastSynced && (
                        <p className="text-[9px] text-slate-400 text-center font-semibold">
                          Sinkronisasi Terakhir: {lastSynced}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* B. DYNAMIC SHEET RENDER PANEL (A4 Previews) */}
                <div className={`${(detailSubTab === "dokumentasi" || detailSubTab === "notulensi" || detailSubTab === "undangan") ? "lg:col-span-12" : "lg:col-span-8"} flex justify-center w-full overflow-x-auto pb-4`}>
                  {detailSubTab === "undangan" && (
                    <UndanganDoc
                      instansi={instansi}
                      kegiatan={activeKegiatan}
                      undanganPenandatangan={penandaTangan.undangan}
                      onUpdatePenerima={handleUpdatePenerimaUndangan}
                    />
                  )}

                  {detailSubTab === "daftarHadir" && (
                    <DaftarHadirDoc
                      instansi={instansi}
                      kegiatan={activeKegiatan}
                      pesertaList={activePesertaList}
                      daftarHadirPenandatangan={penandaTangan.daftarHadir}
                      rowCount={daftarHadirRowCount}
                      useRealData={daftarHadirUseRealData}
                    />
                  )}

                  {detailSubTab === "dokumentasi" && (
                    <DokumentasiDoc
                      instansi={instansi}
                      kegiatan={activeKegiatan}
                      dokumentasiList={activeDokumentasiList}
                      onUploadFoto={handleUploadFoto}
                      onUpdateKeterangan={handleUpdateKeterangan}
                      onTambahSlot={handleTambahSlotFoto}
                      onHapusSlot={handleHapusSlotFoto}
                    />
                  )}

                  {detailSubTab === "tandaTerima" && (
                    <TandaTerimaDoc
                      instansi={instansi}
                      kegiatan={activeKegiatan}
                      pesertaList={activePesertaList}
                      onUpdatePenerimaan={handleUpdatePenerimaan}
                      onUpdatePph21Persen={handleUpdatePph21Persen}
                      onBatchUpdatePenerimaan={handleBatchUpdatePenerimaan}
                      pph21Persen={pph21Persen}
                      tandaTerimaPenandatangan={penandaTangan.tandaTerima}
                      rowCount={tandaTerimaRowCount}
                      useRealData={tandaTerimaUseRealData}
                    />
                  )}

                  {detailSubTab === "notulensi" && (
                    <NotulensiDoc
                      instansi={instansi}
                      kegiatan={activeKegiatan}
                      pesertaList={activePesertaList}
                      hasilRapat={activeNotulensi.hasilRapat}
                      onUpdateHasilRapat={handleUpdateHasilRapat}
                      notulensiPenandatangan={penandaTangan.notulensi}
                      daftarHadirRowCount={daftarHadirRowCount}
                      daftarHadirUseRealData={daftarHadirUseRealData}
                      tandaTerimaRowCount={tandaTerimaRowCount}
                      tandaTerimaUseRealData={tandaTerimaUseRealData}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. NATIVE PRINT AREA PORTAL OVERLAY (Visible during print, and also shown as preview when active) */}
      {printTarget && (
        <div className="fixed inset-0 bg-slate-900/95 z-[999] overflow-y-auto print:relative print:inset-auto print:bg-white print:text-black print:text-[12px] print:font-sans print-area flex flex-col items-center">
          {/* Instruction header (Hidden on physical print) */}
          <div className="no-print sticky top-0 left-0 right-0 w-full bg-emerald-950 text-white py-3.5 px-6 shadow-md flex flex-col xl:flex-row justify-between items-center gap-3 border-b border-emerald-900 z-50">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
                </span>
                <p className="text-xs font-bold text-gray-200">
                  Mode Pratinjau Cetak &bull; Tekan <kbd className="bg-emerald-900 px-1.5 py-0.5 rounded text-yellow-300 font-mono text-[10px]">Ctrl + P</kbd> jika dialog tidak otomatis terbuka.
                </p>
              </div>
              {isInsideIframe && (
                <div className="bg-yellow-500/20 border border-yellow-500/40 rounded px-2.5 py-1 text-[11px] text-yellow-200 font-semibold flex items-center gap-1.5 animate-pulse">
                  <AlertCircle size={13} className="text-yellow-400 flex-shrink-0" />
                  <span>iFrame Terdeteksi! Gunakan <b>Tab Baru</b> untuk cetak sempurna bebas hambatan browser.</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isInsideIframe && (
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-md flex items-center gap-1.5 cursor-pointer transition-all shadow-md transform hover:scale-[1.02]"
                  title="Buka di Tab Baru agar fungsi cetak browser bekerja 100% sempurna tanpa hambatan iFrame"
                >
                  <ExternalLink size={13} />
                  Buka di Tab Baru
                </button>
              )}
              <button
                type="button"
                onClick={handlePrintViaNewWindow}
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-emerald-950 text-xs font-extrabold rounded-md flex items-center gap-1.5 cursor-pointer transition-all shadow-sm transform hover:scale-[1.02]"
              >
                <Printer size={13} />
                Cetak Dokumen
              </button>
              <button
                type="button"
                onClick={() => setPrintTarget(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                Tutup &amp; Kembali
              </button>
            </div>
          </div>

          {/* Printable document page(s) centered */}
          <div 
            id="printable-document-content" 
            className={`p-4 sm:p-12 w-full ${
              printTarget.docType === "dokumentasi" ? "max-w-[297mm]" : "max-w-[210mm]"
            } print:max-w-none print:p-0 bg-white shadow-2xl print:shadow-none my-8 print:my-0 rounded-xl print:rounded-none flex-grow`}
          >
            {printTarget.docType === "all" ? (
              <div className="space-y-0 w-full">
                {/* Page 1: Undangan */}
                <div className="w-full">
                  <UndanganDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    undanganPenandatangan={penandaTangan.undangan}
                    isPrintPreview={true}
                    onUpdatePenerima={handleUpdatePenerimaUndangan}
                  />
                </div>

                {/* Page 2: Daftar Hadir */}
                <div className="page-break w-full">
                  <DaftarHadirDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    pesertaList={activePesertaList}
                    daftarHadirPenandatangan={penandaTangan.daftarHadir}
                    isPrintPreview={true}
                    rowCount={daftarHadirRowCount}
                    useRealData={daftarHadirUseRealData}
                  />
                </div>

                {/* Page 3: Dokumentasi */}
                <div className="page-break w-full">
                  <DokumentasiDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    dokumentasiList={activeDokumentasiList}
                    onUploadFoto={handleUploadFoto}
                    onUpdateKeterangan={handleUpdateKeterangan}
                    onTambahSlot={handleTambahSlotFoto}
                    onHapusSlot={handleHapusSlotFoto}
                    isPrintPreview={true}
                  />
                </div>

                {/* Page 4: Tanda Terima */}
                <div className="page-break w-full">
                  <TandaTerimaDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    pesertaList={activePesertaList}
                    onUpdatePenerimaan={handleUpdatePenerimaan}
                    onUpdatePph21Persen={handleUpdatePph21Persen}
                    onBatchUpdatePenerimaan={handleBatchUpdatePenerimaan}
                    pph21Persen={pph21Persen}
                    tandaTerimaPenandatangan={penandaTangan.tandaTerima}
                    isPrintPreview={true}
                    rowCount={tandaTerimaRowCount}
                    useRealData={tandaTerimaUseRealData}
                  />
                </div>

                {/* Page 5: Notulensi */}
                <div className="page-break w-full">
                  <NotulensiDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    pesertaList={activePesertaList}
                    hasilRapat={activeNotulensi.hasilRapat}
                    onUpdateHasilRapat={handleUpdateHasilRapat}
                    notulensiPenandatangan={penandaTangan.notulensi}
                    isPrintPreview={true}
                    daftarHadirRowCount={daftarHadirRowCount}
                    daftarHadirUseRealData={daftarHadirUseRealData}
                    tandaTerimaRowCount={tandaTerimaRowCount}
                    tandaTerimaUseRealData={tandaTerimaUseRealData}
                  />
                </div>
              </div>
            ) : (
              /* Single document print rendering */
              <div className="w-full">
                {printTarget.docType === "undangan" && (
                  <UndanganDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    undanganPenandatangan={penandaTangan.undangan}
                    isPrintPreview={true}
                    onUpdatePenerima={handleUpdatePenerimaUndangan}
                  />
                )}
                {printTarget.docType === "daftarHadir" && (
                  <DaftarHadirDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    pesertaList={activePesertaList}
                    daftarHadirPenandatangan={penandaTangan.daftarHadir}
                    isPrintPreview={true}
                    rowCount={daftarHadirRowCount}
                    useRealData={daftarHadirUseRealData}
                  />
                )}
                {printTarget.docType === "dokumentasi" && (
                  <DokumentasiDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    dokumentasiList={activeDokumentasiList}
                    onUploadFoto={handleUploadFoto}
                    onUpdateKeterangan={handleUpdateKeterangan}
                    onTambahSlot={handleTambahSlotFoto}
                    onHapusSlot={handleHapusSlotFoto}
                    isPrintPreview={true}
                  />
                )}
                {printTarget.docType === "tandaTerima" && (
                  <TandaTerimaDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    pesertaList={activePesertaList}
                    onUpdatePenerimaan={handleUpdatePenerimaan}
                    onUpdatePph21Persen={handleUpdatePph21Persen}
                    onBatchUpdatePenerimaan={handleBatchUpdatePenerimaan}
                    pph21Persen={pph21Persen}
                    tandaTerimaPenandatangan={penandaTangan.tandaTerima}
                    isPrintPreview={true}
                    rowCount={tandaTerimaRowCount}
                    useRealData={tandaTerimaUseRealData}
                  />
                )}
                {printTarget.docType === "notulensi" && (
                  <NotulensiDoc
                    instansi={instansi}
                    kegiatan={activeKegiatan}
                    pesertaList={activePesertaList}
                    hasilRapat={activeNotulensi.hasilRapat}
                    onUpdateHasilRapat={handleUpdateHasilRapat}
                    notulensiPenandatangan={penandaTangan.notulensi}
                    isPrintPreview={true}
                    daftarHadirRowCount={daftarHadirRowCount}
                    daftarHadirUseRealData={daftarHadirUseRealData}
                    tandaTerimaRowCount={tandaTerimaRowCount}
                    tandaTerimaUseRealData={tandaTerimaUseRealData}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GLOBAL TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 flex items-start gap-3 border-l-4 border-l-emerald-600 no-print">
          <div className="p-1 rounded-full bg-emerald-50 text-emerald-800">
            <CheckCircle size={18} />
          </div>
          <div className="flex-grow space-y-1">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Notifikasi</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
