import * as XLSX from 'xlsx';

export interface ExcelValidationResult<T> {
  validRows: T[];
  errorRows: { rowNumber: number; data: any; errors: string[] }[];
  totalRows: number;
}

/**
 * Parses an Excel (.xlsx / .xls) or CSV file into an array of object records.
 */
export async function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve([]);
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Convert sheet to JSON with string trim
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false, // Ensures dates and numbers are converted to string format
        });

        // Clean up keys and trim values
        const cleanedRecords = rawJson.map((row) => {
          const cleanRow: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim();
            const val = row[key];
            cleanRow[cleanKey] = typeof val === 'string' ? val.trim() : val;
          });
          return cleanRow;
        });

        resolve(cleanedRecords);
      } catch (err) {
        reject(new Error('Gagal membaca file Excel. Pastikan format file .xlsx valid.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file dari komputer.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and triggers instant download of an official .xlsx template
 */
export function downloadExcelTemplate(
  filename: string,
  sheetName: string,
  headers: string[],
  sampleRows: (string | number)[][],
  colWidths?: number[]
) {
  const wb = XLSX.utils.book_new();

  // Combine headers and sample rows into an Array of Arrays
  const data = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths if provided, or calculate reasonable defaults
  if (colWidths && colWidths.length > 0) {
    ws['!cols'] = colWidths.map((w) => ({ wch: w }));
  } else {
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 5, 18) }));
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Template');

  // Trigger file download
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Helper to safely parse and normalize Excel dates (serial numbers or string formats) into YYYY-MM-DD
 */
export function parseExcelDateString(val: any): string | null {
  if (val === null || val === undefined) return null;
  
  // If Excel serial number (e.g. 45474)
  if (typeof val === 'number' && val > 20000 && val < 60000) {
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    return dateInfo.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  if (!str) return null;

  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // Format: YYYY/MM/DD or YYYY.MM.DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return str;
}

/**
 * Validates parsed student records from Excel
 */
export function validateStudentExcel(
  records: Record<string, any>[],
  classes: { id: string; name: string }[]
): ExcelValidationResult<any> {
  const validRows: any[] = [];
  const errorRows: { rowNumber: number; data: any; errors: string[] }[] = [];

  const classMap = new Map<string, string>();
  classes.forEach((c) => {
    classMap.set(c.name.toLowerCase().trim(), c.id);
  });

  records.forEach((record, idx) => {
    const errors: string[] = [];
    const rowNumber = idx + 2; // +1 for 1-based index, +1 for header

    const nis = String(record['NIS'] || record['nis'] || '').trim();
    const nisn = String(record['NISN'] || record['nisn'] || '').trim();
    const name = String(record['Nama'] || record['nama'] || record['Nama Siswa'] || record['Nama Lengkap'] || '').trim();
    const gender = String(record['Jenis Kelamin'] || record['JK'] || record['gender'] || '').toUpperCase().trim();
    const className = String(record['Kelas'] || record['kelas'] || record['Rombel'] || '').trim();
    const email = String(record['Email'] || record['email'] || '').trim();
    const phone = String(record['No HP'] || record['No Telepon'] || record['phone_number'] || '').trim();
    const address = String(record['Alamat'] || record['alamat'] || '').trim();

    // Kolom Tambahan PKL & DUDI
    const dudiName = String(
      record['Tempat PKL'] ||
      record['tempat_pkl'] ||
      record['Nama Perusahaan'] ||
      record['Nama DUDI'] ||
      record['DUDI'] ||
      record['Perusahaan'] ||
      ''
    ).trim();
    const dudiAddress = String(
      record['Alamat Perusahaan'] ||
      record['alamat_perusahaan'] ||
      record['Alamat DUDI'] ||
      ''
    ).trim();
    const startDateRaw = record['Tanggal Mulai PKL'] || record['tgl_mulai_pkl'] || record['Tgl Mulai'] || record['start_date'] || '';
    const endDateRaw = record['Tanggal Selesai PKL'] || record['tgl_selesai_pkl'] || record['Tgl Selesai'] || record['end_date'] || '';

    const startDate = parseExcelDateString(startDateRaw);
    const endDate = parseExcelDateString(endDateRaw);

    if (!nis) errors.push('NIS wajib diisi');
    if (!nisn) errors.push('NISN wajib diisi');
    if (!name) errors.push('Nama siswa wajib diisi');
    if (!gender || !['L', 'P'].includes(gender)) errors.push('Jenis kelamin harus "L" (Laki-laki) atau "P" (Perempuan)');

    let classId = '';
    if (!className) {
      errors.push('Nama kelas wajib diisi');
    } else {
      const foundId = classMap.get(className.toLowerCase());
      if (!foundId) {
        errors.push(`Kelas "${className}" tidak ditemukan di database master kelas`);
      } else {
        classId = foundId;
      }
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errors.push('Tanggal selesai PKL tidak boleh lebih awal dari tanggal mulai');
    }

    if (errors.length > 0) {
      errorRows.push({ rowNumber, data: record, errors });
    } else {
      validRows.push({
        nis,
        nisn,
        name,
        gender,
        class_id: classId,
        className,
        email: email || `${nis}@siswa.smkn13bdg.sch.id`,
        phone_number: phone || null,
        address: address || null,
        pkl_status: dudiName ? 'sedang_pkl' : 'belum_ditempatkan',
        is_eligible: true,
        is_active: true,
        // DUDI & Placement metadata
        dudi_name: dudiName || null,
        dudi_address: dudiAddress || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
    }
  });

  return {
    validRows,
    errorRows,
    totalRows: records.length,
  };
}

/**
 * Validates parsed teacher records from Excel
 */
export function validateTeacherExcel(
  records: Record<string, any>[],
  majors: { id: string; code: string; name: string }[]
): ExcelValidationResult<any> {
  const validRows: any[] = [];
  const errorRows: { rowNumber: number; data: any; errors: string[] }[] = [];

  const majorMap = new Map<string, string>();
  majors.forEach((m) => {
    majorMap.set(m.code.toLowerCase().trim(), m.id);
    majorMap.set(m.name.toLowerCase().trim(), m.id);
  });

  records.forEach((record, idx) => {
    const errors: string[] = [];
    const rowNumber = idx + 2;

    const nip = String(record['NIP'] || record['nip'] || '').trim();
    const name = String(record['Nama'] || record['nama'] || record['Nama Guru'] || record['Nama Lengkap'] || '').trim();
    const email = String(record['Email'] || record['email'] || '').trim();
    const phone = String(record['No HP'] || record['No Telepon'] || record['phone_number'] || '').trim();
    const majorCodeOrName = String(record['Jurusan'] || record['Kode Jurusan'] || record['major'] || '').trim();

    if (!name) errors.push('Nama guru wajib diisi');
    if (!email) errors.push('Email guru wajib diisi');

    let majorId = majors[0]?.id || null;
    if (majorCodeOrName) {
      const foundId = majorMap.get(majorCodeOrName.toLowerCase());
      if (foundId) {
        majorId = foundId;
      } else {
        errors.push(`Jurusan "${majorCodeOrName}" tidak ditemukan di database`);
      }
    }

    if (errors.length > 0) {
      errorRows.push({ rowNumber, data: record, errors });
    } else {
      validRows.push({
        nip: nip || null,
        name,
        email,
        phone_number: phone || null,
        major_id: majorId,
        is_active: true,
      });
    }
  });

  return {
    validRows,
    errorRows,
    totalRows: records.length,
  };
}

/**
 * Validates parsed class records from Excel
 */
export function validateClassExcel(
  records: Record<string, any>[],
  majors: { id: string; code: string; name: string }[],
  teachers: { id: string; name: string }[]
): ExcelValidationResult<any> {
  const validRows: any[] = [];
  const errorRows: { rowNumber: number; data: any; errors: string[] }[] = [];

  const majorMap = new Map<string, string>();
  majors.forEach((m) => {
    majorMap.set(m.code.toLowerCase().trim(), m.id);
    majorMap.set(m.name.toLowerCase().trim(), m.id);
  });

  const teacherMap = new Map<string, string>();
  teachers.forEach((t) => {
    teacherMap.set(t.name.toLowerCase().trim(), t.id);
  });

  records.forEach((record, idx) => {
    const errors: string[] = [];
    const rowNumber = idx + 2;

    const name = String(record['Nama Kelas'] || record['Kelas'] || record['name'] || '').trim();
    const levelRaw = String(record['Tingkat'] || record['level'] || 'XI').toUpperCase().trim();
    const majorCode = String(record['Jurusan'] || record['Kode Jurusan'] || record['major'] || '').trim();
    const homeroomTeacher = String(record['Wali Kelas'] || record['wali_kelas'] || '').trim();
    const academicYear = String(record['Tahun Ajaran'] || record['academic_year'] || '2026/2027').trim();

    if (!name) errors.push('Nama kelas wajib diisi');
    
    const level = ['X', 'XI', 'XII'].includes(levelRaw) ? levelRaw : 'XI';

    let majorId = '';
    if (!majorCode) {
      errors.push('Jurusan wajib diisi');
    } else {
      const foundMajor = majorMap.get(majorCode.toLowerCase());
      if (!foundMajor) {
        errors.push(`Jurusan "${majorCode}" tidak cocok dengan data master`);
      } else {
        majorId = foundMajor;
      }
    }

    let homeroomTeacherId = null;
    if (homeroomTeacher) {
      const foundTeacher = teacherMap.get(homeroomTeacher.toLowerCase());
      if (foundTeacher) {
        homeroomTeacherId = foundTeacher;
      }
    }

    if (errors.length > 0) {
      errorRows.push({ rowNumber, data: record, errors });
    } else {
      validRows.push({
        name,
        level,
        major_id: majorId,
        homeroom_teacher_id: homeroomTeacherId,
        academic_year: academicYear,
        is_active: true,
      });
    }
  });

  return {
    validRows,
    errorRows,
    totalRows: records.length,
  };
}

/**
 * Validates parsed DUDI mitra records from Excel
 */
export function validateDudiExcel(
  records: Record<string, any>[]
): ExcelValidationResult<any> {
  const validRows: any[] = [];
  const errorRows: { rowNumber: number; data: any; errors: string[] }[] = [];

  records.forEach((record, idx) => {
    const errors: string[] = [];
    const rowNumber = idx + 2;

    const name = String(record['Nama Perusahaan / DUDI'] || record['Nama DUDI'] || record['name'] || '').trim();
    const sector = String(record['Bidang Usaha'] || record['Sektor'] || record['sector'] || 'Umum & Industri').trim();
    const address = String(record['Alamat'] || record['address'] || '').trim();
    const city = String(record['Kota / Kabupaten'] || record['Kota'] || record['city'] || 'Karawang').trim();
    const contactPerson = String(record['Kontak Person (PIC)'] || record['PIC'] || record['contact_person'] || '').trim();
    const phone = String(record['No Telepon / HP'] || record['No HP'] || record['phone_number'] || '').trim();
    const email = String(record['Email'] || record['email'] || '').trim();
    const quota = parseInt(String(record['Kuota PKL'] || record['Kuota'] || record['quota'] || '5'), 10) || 5;

    if (!name) errors.push('Nama DUDI wajib diisi');
    if (!address) errors.push('Alamat DUDI wajib diisi');

    if (errors.length > 0) {
      errorRows.push({ rowNumber, data: record, errors });
    } else {
      validRows.push({
        name,
        sector,
        address,
        city,
        contact_person: contactPerson || 'Pimpinan Perusahaan',
        phone_number: phone || null,
        email: email || null,
        quota,
        latitude: -6.3052,
        longitude: 107.3021,
        radius_meters: 150,
        is_active: true,
      });
    }
  });

  return {
    validRows,
    errorRows,
    totalRows: records.length,
  };
}
