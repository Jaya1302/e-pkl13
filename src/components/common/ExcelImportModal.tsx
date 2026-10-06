import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText
} from 'lucide-react';
import { parseExcelFile, ExcelValidationResult } from '../../utils/excelParser';

export interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  templateFileName: string;
  onDownloadTemplate: () => void;
  onValidate: (records: Record<string, any>[]) => ExcelValidationResult<any>;
  onImport: (validRecords: any[]) => Promise<void>;
  previewColumns: { header: string; accessor: (row: any) => React.ReactNode }[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title,
  description = 'Unggah file Excel (.xlsx) sesuai template resmi untuk menambahkan data secara massal.',
  templateFileName,
  onDownloadTemplate,
  onValidate,
  onImport,
  previewColumns,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<ExcelValidationResult<any> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'error'>('all');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setIsParsing(false);
    setIsSubmitting(false);
    setActiveTab('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileProcess = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Harap unggah file dengan ekstensi .xlsx atau .xls');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    try {
      const records = await parseExcelFile(file);
      if (records.length === 0) {
        alert('File Excel kosong atau tidak memiliki baris data.');
        handleReset();
        return;
      }
      const result = onValidate(records);
      setValidationResult(result);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses file Excel.');
      handleReset();
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    setIsSubmitting(true);
    try {
      await onImport(validationResult.validRows);
      handleClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data ke sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="3xl">
      <div className="space-y-6">
        <p className="text-sm text-slate-500">{description}</p>

        {/* Step 1: Download Template Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-950">
                Format Template Excel (.xlsx)
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Unduh format resmi agar susunan kolom sesuai dengan sistem.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDownloadTemplate}
            leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100/60 shrink-0 font-medium"
          >
            Unduh Template .xlsx
          </Button>
        </div>

        {/* Step 2: Upload Zone */}
        {!validationResult ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                <UploadCloud className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {isParsing ? 'Sedang membaca file Excel...' : 'Pilih atau seret file Excel (.xlsx) ke sini'}
                </p>
                <p className="text-xs text-slate-500">Mendukung format Microsoft Excel .xlsx dan .xls (Maks. 10 MB)</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="primary"
                isLoading={isParsing}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Pilih File Excel
              </Button>
            </div>
          </div>
        ) : (
          /* Step 3: Validation & Preview Result */
          <div className="space-y-4">
            {/* File info bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="truncate max-w-[240px] sm:max-w-md">{selectedFile?.name}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">
                  {validationResult.totalRows} Baris
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs h-7 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Ganti File
              </Button>
            </div>

            {/* Validation Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div
                onClick={() => setActiveTab('all')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeTab === 'all'
                    ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <p className="text-xs font-medium opacity-80">Total Baris</p>
                <p className="text-lg font-bold mt-0.5">{validationResult.totalRows}</p>
              </div>

              <div
                onClick={() => setActiveTab('valid')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeTab === 'valid'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Siap Diimpor</p>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-lg font-bold mt-0.5">{validationResult.validRows.length}</p>
              </div>

              <div
                onClick={() => setActiveTab('error')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeTab === 'error'
                    ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                    : 'border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 text-rose-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Baris Error</p>
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                <p className="text-lg font-bold mt-0.5">{validationResult.errorRows.length}</p>
              </div>
            </div>

            {/* Error banner warning if any */}
            {validationResult.errorRows.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Terdapat <strong>{validationResult.errorRows.length} baris</strong> yang tidak memenuhi kriteria validasi. Baris yang error akan dilewati dan hanya <strong>{validationResult.validRows.length} baris valid</strong> yang akan disimpan ke database.
                </span>
              </div>
            )}

            {/* Table Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-inner bg-slate-50/40">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-14">Status</th>
                    {previewColumns.map((col, cIdx) => (
                      <th key={cIdx} className="py-2.5 px-3">
                        {col.header}
                      </th>
                    ))}
                    <th className="py-2.5 px-3">Catatan / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {/* Valid Rows */}
                  {(activeTab === 'all' || activeTab === 'valid') &&
                    validationResult.validRows.map((row, rIdx) => (
                      <tr key={`v-${rIdx}`} className="hover:bg-emerald-50/30">
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        </td>
                        {previewColumns.map((col, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 font-medium text-slate-800">
                            {col.accessor(row)}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-slate-400 italic">Siap disimpan</td>
                      </tr>
                    ))}

                  {/* Error Rows */}
                  {(activeTab === 'all' || activeTab === 'error') &&
                    validationResult.errorRows.map((errRow, eIdx) => (
                      <tr key={`e-${eIdx}`} className="bg-rose-50/40 hover:bg-rose-50">
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3" /> Baris {errRow.rowNumber}
                          </span>
                        </td>
                        {previewColumns.map((col, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 text-slate-600">
                            {col.accessor(errRow.data)}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-rose-600 font-medium">
                          {errRow.errors.join(', ')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Batal
          </Button>

          {validationResult && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={validationResult.validRows.length === 0}
              isLoading={isSubmitting}
              onClick={handleExecuteImport}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Impor {validationResult.validRows.length} Data Valid
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
