export interface CsvValidationResult<T> {
  validRows: T[];
  errorRows: { rowNumber: number; data: any; errors: string[] }[];
  totalRows: number;
}

/**
 * Parses raw CSV text string into array of object records
 */
export function parseCsvText(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    // Simple CSV parser handling quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentValue = '';

    for (let c = 0; c < currentLine.length; c++) {
      const char = currentLine[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim().replace(/^"|"$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^"|"$/g, ''));

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index] : '';
    });

    records.push(record);
  }

  return records;
}

/**
 * Validates parsed student CSV rows
 */
export function validateStudentCsv(
  records: Record<string, string>[],
  classes: { id: string; name: string }[]
): CsvValidationResult<any> {
  const validRows: any[] = [];
  const errorRows: { rowNumber: number; data: any; errors: string[] }[] = [];

  const classMap = new Map<string, string>();
  classes.forEach((c) => {
    classMap.set(c.name.toLowerCase(), c.id);
  });

  records.forEach((record, idx) => {
    const errors: string[] = [];
    const rowNumber = idx + 2; // +1 for 1-based index, +1 for header line

    const nis = record['NIS'] || record['nis'] || '';
    const nisn = record['NISN'] || record['nisn'] || '';
    const name = record['Nama'] || record['nama'] || record['Nama Siswa'] || '';
    const gender = (record['Jenis Kelamin'] || record['JK'] || record['gender'] || '').toUpperCase();
    const className = record['Kelas'] || record['kelas'] || '';
    const email = record['Email'] || record['email'] || '';
    const phone = record['No HP'] || record['phone_number'] || '';

    if (!nis) errors.push('NIS wajib diisi');
    if (!nisn) errors.push('NISN wajib diisi');
    if (!name) errors.push('Nama siswa wajib diisi');
    if (!gender || !['L', 'P'].includes(gender)) errors.push('Jenis kelamin harus L atau P');
    
    let classId = '';
    if (!className) {
      errors.push('Nama kelas wajib diisi');
    } else {
      const foundId = classMap.get(className.toLowerCase());
      if (!foundId) {
        errors.push(`Kelas "${className}" tidak ditemukan di database`);
      } else {
        classId = foundId;
      }
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
        email: email || `${nis}@smkn13bdg.sch.id`,
        phone_number: phone || null,
        pkl_status: 'belum_ditempatkan',
        is_eligible: true,
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
 * Generates and triggers download of CSV template
 */
export function downloadCsvTemplate(
  filename: string,
  headers: string[],
  sampleRows: string[][]
) {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
