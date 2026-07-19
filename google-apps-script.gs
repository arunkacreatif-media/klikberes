/**
 * GOOGLE APPS SCRIPT DATABASE CONNECTOR FOR DESA PERTANGGUNGJAWABAN
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets (spreadsheet baru).
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus kode default yang ada di editor, lalu paste seluruh kode di bawah ini.
 * 4. Ganti judul proyek (misal: "Database Desa Pertanggungjawaban").
 * 5. Klik ikon simpan (💾).
 * 6. Klik tombol "Terapkan" (Deploy) -> "Terapkan Baru" (New Deployment).
 * 7. Pilih tipe: "Aplikasi Web" (Web App).
 * 8. Konfigurasi:
 *    - Jalankan sebagai (Execute as): "Saya" (Me - email Anda).
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone).
 * 9. Klik "Terapkan" (Deploy). Berikan izin akses jika diminta (Authorize).
 * 10. Salin URL Aplikasi Web yang dihasilkan (Web App URL) dan masukkan ke dalam
 *     Pengaturan Aplikasi di website untuk menghubungkan database secara realtime!
 */

function doGet(e) {
  var action = e.parameter.action;
  
  // CORS header setup
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // Pastikan sheet telah diinisialisasi
    initDatabaseIfNeeded();
    
    var data = readAllTables();
    var response = {
      status: "success",
      data: data
    };
    
    output.setContent(JSON.stringify(response));
    return appendCorsHeaders(output);
    
  } catch(err) {
    var errResponse = {
      status: "error",
      message: err.toString()
    };
    output.setContent(JSON.stringify(errResponse));
    return appendCorsHeaders(output);
  }
}

function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    initDatabaseIfNeeded();
    
    var postData = JSON.parse(e.postData.contents);
    
    if (postData.instansi) {
      writeTable("Instansi", [postData.instansi]);
    }
    if (postData.kegiatanList) {
      writeTable("Kegiatan", postData.kegiatanList);
    }
    if (postData.pesertaList) {
      writeTable("Peserta", postData.pesertaList);
    }
    if (postData.dokumentasiList) {
      writeTable("Dokumentasi", postData.dokumentasiList);
    }
    if (postData.notulensiList) {
      writeTable("Notulensi", postData.notulensiList.map(function(n) {
        return {
          kegiatanId: n.kegiatanId,
          hasilRapat: JSON.stringify(n.hasilRapat) // stringified JSON
        };
      }));
    }
    if (postData.penandaTangan) {
      writeTable("PenandaTangan", [{
        id: "main_config",
        data: JSON.stringify(postData.penandaTangan) // stringified JSON
      }]);
    }
    
    var response = {
      status: "success",
      message: "Data berhasil disimpan ke Google Sheets!"
    };
    output.setContent(JSON.stringify(response));
    return appendCorsHeaders(output);
    
  } catch(err) {
    var errResponse = {
      status: "error",
      message: err.toString()
    };
    output.setContent(JSON.stringify(errResponse));
    return appendCorsHeaders(output);
  }
}

/**
 * Handle CORS requests for Web Apps
 */
function appendCorsHeaders(output) {
  // Apps Script Web App returns this and Google infrastructure proxies it
  // But setting these helps with cross-origin client queries
  return output;
}

/**
 * Inisialisasi Database dengan 6 sheets utama & Data Dummy jika kosong
 */
function initDatabaseIfNeeded() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetsNeeded = ["Instansi", "Kegiatan", "Peserta", "Dokumentasi", "Notulensi", "PenandaTangan"];
  var isBrandNew = false;
  
  sheetsNeeded.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      isBrandNew = true;
      
      // Setup headers
      var headers = [];
      if (sheetName === "Instansi") {
        headers = ["namaDesa", "kecamatan", "kabupaten", "alamatKantor", "kodePos", "emailDesa", "websiteDesa", "logoUrl", "namaKepalaDesa"];
      } else if (sheetName === "Kegiatan") {
        headers = ["id", "nomorSurat", "namaKegiatan", "hari", "tanggal", "waktuMulai", "waktuSelesai", "tempat", "acara", "catatan", "pemimpinRapat", "notulis", "tahunKegiatan", "penerimaUndangan"];
      } else if (sheetName === "Peserta") {
        headers = ["id", "kegiatanId", "no", "nama", "kedudukan", "alamat", "penerimaan", "pph21", "jumlahPenerimaan", "tandaTangan"];
      } else if (sheetName === "Dokumentasi") {
        headers = ["id", "kegiatanId", "fotoBase64", "keterangan"];
      } else if (sheetName === "Notulensi") {
        headers = ["kegiatanId", "hasilRapat"];
      } else if (sheetName === "PenandaTangan") {
        headers = ["id", "data"];
      }
      
      sheet.appendRow(headers);
      // Format header row to look professional
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1b5e20");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
  });
  
  // Hapus sheet bawaan "Sheet1" jika masih ada
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch(e) {}
  }
  
  // Jika database baru saja dibuat, biarkan kosong tanpa data dummy
  /*
  if (isBrandNew) {
    seedDummyData();
  }
  */
}

/**
 * Membaca seluruh tabel dan mengembalikannya dalam bentuk JSON
 */
function readAllTables() {
  return {
    instansi: readTable("Instansi")[0] || null,
    kegiatanList: readTable("Kegiatan"),
    pesertaList: readTable("Peserta"),
    dokumentasiList: readTable("Dokumentasi"),
    notulensiList: readTable("Notulensi").map(function(n) {
      var parsedHasil = [];
      try {
        parsedHasil = JSON.parse(n.hasilRapat);
      } catch(e) {
        parsedHasil = [];
      }
      return {
        kegiatanId: n.kegiatanId,
        hasilRapat: parsedHasil
      };
    }),
    penandaTangan: readPenandaTangan()
  };
}

function readPenandaTangan() {
  var rows = readTable("PenandaTangan");
  if (rows && rows.length > 0) {
    try {
      return JSON.parse(rows[0].data);
    } catch(e) {}
  }
  return null;
}

/**
 * Helper: Membaca sheet menjadi array of object
 */
function readTable(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return []; // Hanya ada header
  
  var headers = values[0];
  var data = [];
  
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var item = {};
    var hasValue = false;
    
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      item[headers[c]] = val;
      if (val !== "") hasValue = true;
    }
    
    if (hasValue) {
      // Cast numerical types appropriately
      if (item.no !== undefined) item.no = Number(item.no);
      if (item.penerimaan !== undefined) item.penerimaan = Number(item.penerimaan);
      if (item.pph21 !== undefined) item.pph21 = Number(item.pph21);
      if (item.jumlahPenerimaan !== undefined) item.jumlahPenerimaan = Number(item.jumlahPenerimaan);
      data.push(item);
    }
  }
  
  return data;
}

/**
 * Helper: Menulis array of object ke dalam sheet (Overwriting)
 */
function writeTable(sheetName, dataList) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  // Simpan header
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  
  // Secara dinamis menambahkan header baru jika ada di dataList tetapi belum ada di kolom sheet
  if (dataList && dataList.length > 0) {
    var headersChanged = false;
    var updatedHeaders = [].concat(headers);
    dataList.forEach(function(item) {
      Object.keys(item).forEach(function(key) {
        if (updatedHeaders.indexOf(key) === -1) {
          updatedHeaders.push(key);
          headersChanged = true;
        }
      });
    });
    if (headersChanged) {
      headers = updatedHeaders;
      // Perbarui baris pertama sheet dengan header baru
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  
  // Bersihkan semua data baris di bawah header
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  if (!dataList || dataList.length === 0) return;
  
  // Siapkan data baris baru
  var rowsToWrite = [];
  
  dataList.forEach(function(item) {
    var row = [];
    headers.forEach(function(header) {
      var val = item[header];
      if (val === undefined || val === null) {
        row.push("");
      } else {
        if (typeof val === 'object') {
          row.push(JSON.stringify(val));
        } else {
          row.push(val);
        }
      }
    });
    rowsToWrite.push(row);
  });
  
  // Tulis sekaligus untuk optimasi performa
  sheet.getRange(2, 1, rowsToWrite.length, headers.length).setValues(rowsToWrite);
}

/**
 * Seed data dummy ke dalam spreadsheet yang baru terbentuk
 */
function seedDummyData() {
  // 1. Instansi
  var dummyInstansi = {
    namaDesa: "Kecindung",
    kecamatan: "Gading",
    kabupaten: "Probolinggo",
    alamatKantor: "Jl. Raya Kecindung No. 12",
    kodePos: "67278",
    emailDesa: "desa.kecindung@gmail.com",
    websiteDesa: "kecindung.desa.id",
    logoUrl: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"46\" fill=\"%231b5e20\" stroke=\"%23fbc02d\" stroke-width=\"3\" /><circle cx=\"50\" cy=\"50\" r=\"41\" fill=\"none\" stroke=\"%23fbc02d\" stroke-width=\"1\" stroke-dasharray=\"2 2\" /><path d=\"M38,70 C33,58 33,40 43,30 M43,30 C46,40 43,58 38,70\" fill=\"%23fbc02d\" /><path d=\"M62,70 C67,58 67,40 57,30 M57,30 C54,40 57,58 62,70\" fill=\"%23ffffff\" /><polygon points=\"50,38 53,45 61,45 54,49 57,56 50,51 43,56 46,49 39,45 47,45\" fill=\"%23fbc02d\" /><path d=\"M30,62 Q50,52 70,62\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"2\" /><path d=\"M25,68 Q50,58 75,68\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"2\" /><text x=\"50\" y=\"22\" font-family=\"Arial, sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"%23fbc02d\" text-anchor=\"middle\">PEMERINTAH</text><text x=\"50\" y=\"84\" font-family=\"Arial, sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"%23fbc02d\" text-anchor=\"middle\">DESA</text></svg>",
    namaKepalaDesa: "H. ACHMAD HUDORI"
  };
  writeTable("Instansi", [dummyInstansi]);
  
  // 2. Kegiatan
  var dummyKegiatan = {
    id: "dummy-1",
    nomorSurat: "005/16/403.401.02/2026",
    namaKegiatan: "Rapat Koordinasi dan Evaluasi Kinerja BPD Desa Kecindung",
    hari: "Kamis",
    tanggal: "2026-07-16",
    waktuMulai: "09:00",
    waktuSelesai: "12:00",
    tempat: "Balai Pertemuan Desa Kecindung",
    acara: "Pembahasan Evaluasi Realisasi APBDesa Triwulan I & Sinkronisasi Rencana Kerja Desa",
    catatan: "Harap hadir tepat waktu dan membawa dokumen pendukung laporan program kerja masing-masing bidang.",
    pemimpinRapat: "H. ACHMAD HUDORI",
    notulis: "Mulyadi, S.Sos",
    tahunKegiatan: "2026"
  };
  writeTable("Kegiatan", [dummyKegiatan]);
  
  // 3. Peserta
  var dummyPeserta = [
    { id: "p-1", kegiatanId: "dummy-1", no: 1, nama: "Supardi", kedudukan: "Ketua BPD", alamat: "RT 01 RW 01 Dusun Krajan", penerimaan: 150000, pph21: 7500, jumlahPenerimaan: 142500, tandaTangan: "" },
    { id: "p-2", kegiatanId: "dummy-1", no: 2, nama: "Endang Sulastri", kedudukan: "Wakil Ketua BPD", alamat: "RT 03 RW 01 Dusun Krajan", penerimaan: 150000, pph21: 7500, jumlahPenerimaan: 142500, tandaTangan: "" },
    { id: "p-3", kegiatanId: "dummy-1", no: 3, nama: "Bambang Wijaya", kedudukan: "Sekretaris BPD", alamat: "RT 02 RW 02 Dusun Timur", penerimaan: 150000, pph21: 7500, jumlahPenerimaan: 142500, tandaTangan: "" },
    { id: "p-4", kegiatanId: "dummy-1", no: 4, nama: "Siti Aminah", kedudukan: "Anggota BPD", alamat: "RT 01 RW 02 Dusun Krajan", penerimaan: 100000, pph21: 5000, jumlahPenerimaan: 95000, tandaTangan: "" },
    { id: "p-5", kegiatanId: "dummy-1", no: 5, nama: "Wawan Hermawan", kedudukan: "Anggota BPD", alamat: "RT 04 RW 03 Dusun Barat", penerimaan: 100000, pph21: 5000, jumlahPenerimaan: 95000, tandaTangan: "" },
    { id: "p-6", kegiatanId: "dummy-1", no: 6, nama: "Rudi Hartono", kedudukan: "Anggota BPD", alamat: "RT 02 RW 01 Dusun Krajan", penerimaan: 100000, pph21: 5000, jumlahPenerimaan: 95000, tandaTangan: "" },
    { id: "p-7", kegiatanId: "dummy-1", no: 7, nama: "Dewi Lestari", kedudukan: "Tokoh Masyarakat", alamat: "RT 05 RW 02 Dusun Timur", penerimaan: 100000, pph21: 5000, jumlahPenerimaan: 95000, tandaTangan: "" }
  ];
  writeTable("Peserta", dummyPeserta);
  
  // 4. Dokumentasi
  var dummyDokumentasi = [
    {
      id: "d-1",
      kegiatanId: "dummy-1",
      fotoBase64: "",
      keterangan: "Pembukaan Rapat Koordinasi dan Pengantar Evaluasi APBDesa oleh Kepala Desa Kecindung."
    },
    {
      id: "d-2",
      kegiatanId: "dummy-1",
      fotoBase64: "",
      keterangan: "Penyampaian tanggapan dan laporan evaluasi triwulan oleh Ketua BPD."
    }
  ];
  writeTable("Dokumentasi", dummyDokumentasi);
  
  // 5. Notulensi
  var dummyNotulensi = [
    {
      kegiatanId: "dummy-1",
      hasilRapat: JSON.stringify([
        { poin: "Persetujuan Laporan Triwulan I", uraian: "Seluruh anggota BPD menerima dan menyetujui Laporan Pertanggungjawaban Realisasi APBDesa Triwulan I Tahun Anggaran 2026 dengan beberapa rekomendasi perbaikan administrasi." },
        { poin: "Prioritas Pembangunan Jembatan Dusun Barat", uraian: "Pembangunan jembatan penghubung di RT 04 Dusun Barat disepakati menjadi prioritas utama pada APBDesa Perubahan demi kelancaran akses ekonomi warga." },
        { poin: "Pelatihan Digitalisasi Kader Posyandu", uraian: "Kader Posyandu akan diberikan pembekalan administrasi digital untuk pelaporan gizi balita dan diusulkan kenaikan dana operasional pada APBDesa tahun berikutnya." }
      ])
    }
  ];
  writeTable("Notulensi", dummyNotulensi);
  
  // 6. PenandaTangan
  var defaultPenandaTangan = {
    daftarHadir: {
      jabatanPenutup: "Mengetahui,\nKepala Desa Kecindung",
      nama: "H. ACHMAD HUDORI"
    },
    tandaTerima: {
      kiri: { label: "Mengetahui,\nKepala Desa Selaku PKPKD", nama: "H. ACHMAD HUDORI" },
      tengah: { label: "Setuju dibayar,\nSekretaris Desa Selaku Koordinator PPKD", nama: "Mulyadi, S.Sos" },
      kanan: { label: "Lunas Dibayar,\nBendahara Desa", nama: "Sri Wahyuni" }
    },
    undangan: {
      jabatan: "Kepala Desa Kecindung",
      nama: "H. ACHMAD HUDORI"
    },
    notulensi: {
      jabatan: "Kepala Desa Kecindung",
      nama: "H. ACHMAD HUDORI"
    }
  };
  writeTable("PenandaTangan", [{
    id: "main_config",
    data: JSON.stringify(defaultPenandaTangan)
  }]);
}
