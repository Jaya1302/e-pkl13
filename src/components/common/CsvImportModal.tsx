import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { parseCsvText, validateStudentCsv, downloadCsvTemplate, CsvValidationResult } from '../../utils/csvParser';
import { Upload, Download, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: { id: string; name: string }[];
  onBatchInsert: (data: any[]) => Promise<{ count: number }>;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classes,
  onBatchInsert,
}) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<CsvValidationResult<any> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(
      'template_import_siswa_epkl.csv',
      ['NIS', 'NISN', 'Nama Siswa', 'Jenis Kelamin', 'Kelas', 'No HP', 'Email'],
      [
        ['222310010', '0061234580', 'Ahmad Dani Pratama', 'L', 'XI RPL 1', '081234567890', 'ahmad.dani@smkn13bdg.sch.id'],
        ['222310011', '0061234581', 'Dewi Lestari', 'P', 'XI RPL 1', '081234567891', 'dewi.lestari@smkn13bdg.sch.id'],
      ]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      showToast('Harap unggah file berformat .CSV', 'error');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const records = parseCsvText(text);
      if (records.length === 0) {
        showToast('File CSV kosong atau format header tidak valid.', 'error');
        return;
      }
      const result = validateStudentCsv(records, classes);
      setValidationResult(result);
    };
    reader.readAsText(selectedFile);
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      showToast('Tidak ada data valid yang dapat diimpor.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await onBatchInsert(validationResult.validRows);
      showToast(`Berhasil mengimpor ${res.count} data siswa!`, 'success');
      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengimpor data siswa.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationResult(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impor Data Siswa via CSV"
      description="Unggah file CSV sesuai format template untuk menambahkan siswa secara massal."
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Step 1: Upload and Template */}
        {!validationResult ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-brand-600" />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Belum punya template CSV?</span>
                  <span className="text-slate-400">Unduh format template resmi untuk menghindari error.</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Unduh Template
              </Button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-800">
                Pilih atau seret file CSV ke area ini
              </p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">
                Maksimal ukuran file 5 MB
              </p>

              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center font-medium rounded-xl bg-brand-600 text-white px-4 py-2.5 text-xs shadow-sm hover:bg-brand-700 transition-colors">
                  Pilih File CSV
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        ) : (
          /* Step 2: Preview & Validation */
          <div className="space-y-4">
            {/* Validation Summary Bar */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Baris</span>
                <p className="text-xl font-extrabold text-slate-800">{validationResult.totalRows}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
                <p className="text-xl font-extrabold text-emerald-700">{validationResult.validRows.length}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-[10px] text-rose-700 font-bold uppercase flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Error
                </span>
                <p className="text-xl font-extrabold text-rose-700">{validationResult.errorRows.length}</p>
              </div>
            </div>

            {/* Error Review if any */}
            {validationResult.errorRows.length > 0 && (
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-1.5 max-h-36 overflow-y-auto text-xs">
                <span className="font-bold text-rose-800 block text-[11px]">Daftar Baris Error (Akan Dilewati):</span>
                {validationResult.errorRows.map((err, idx) => (
                  <div key={idx} className="text-rose-700 text-[11px]">
                    <strong>Baris {err.rowNumber}:</strong> {err.errors.join(', ')}
                  </div>
                ))}
              </div>
            )}

            {/* Preview Valid Records */}
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Pratinjau Data Valid ({validationResult.validRows.length} siswa)
              </span>
              <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-200/80">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>NIS</TableHeaderCell>
                      <TableHeaderCell>NISN</TableHeaderCell>
                      <TableHeaderCell>Nama Siswa</TableHeaderCell>
                      <TableHeaderCell>JK</TableHeaderCell>
                      <TableHeaderCell>Kelas</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationResult.validRows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{row.nis}</TableCell>
                        <TableCell className="font-mono text-xs">{row.nisn}</TableCell>
                        <TableCell className="font-bold text-xs">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="neutral" size="sm">{row.gender}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{row.className}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {validationResult.validRows.length > 10 && (
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Menampilkan 10 dari {validationResult.validRows.length} data valid.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button size="sm" variant="ghost" onClick={handleReset} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Ganti File CSV
              </Button>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmImport}
                  isLoading={isProcessing}
                  disabled={validationResult.validRows.length === 0}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Impor {validationResult.validRows.length} Siswa
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
