import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ImportPreview, normalizeSection, isValidSection } from '../../types/student';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RotateCcw,
  Check,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreview: (rows: Array<{ name: string; registerNumber: string; section: string; year: string; role: string; dateOfBirth: string }>) => ImportPreview;
  onConfirmImport: (preview: ImportPreview) => Promise<{ added: number; failed: number } | null>;
}

const normalizeHeader = (h: string): string =>
  h.toLowerCase().replace(/[^a-z0-9]/g, '');

const REQUIRED_COLUMNS = ['name', 'registernumber', 'section', 'year', 'dateofbirth'];

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onPreview,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; failed: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setPreview(null);
    setParseError(null);
    setImportResult(null);
    setShowErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = (file: File) => {
    setParseError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

        if (rawRows.length < 2) {
          setParseError('The file appears to be empty. Add at least one student row after the header.');
          return;
        }

        // Map headers
        const headers = (rawRows[0] as unknown[]).map(h => normalizeHeader(String(h || '')));
        const missingCols = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missingCols.length > 0) {
          setParseError(
            `Missing columns: ${missingCols.join(', ')}.\n\nRequired columns (case-insensitive):\nName, Register Number, Section (1, 2, or 3), Year, Role (optional), Date of Birth`
          );
          return;
        }

        const dataRows = rawRows.slice(1) as unknown[][];
        const parsed = dataRows
          .filter(row => (row as unknown[]).some(cell => String(cell || '').trim()))
          .map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[String(h)] = String((row as unknown[])[i] || '').trim(); });
            const secRaw = obj['section'] || '';
            const secNormalized = isValidSection(secRaw) ? normalizeSection(secRaw) : secRaw;
            return {
              name: obj['name'] || '',
              registerNumber: obj['registernumber'] || '',
              section: secNormalized,
              year: obj['year'] || '',
              role: obj['role'] || obj['designation'] || 'Student',
              dateOfBirth: obj['dateofbirth'] || '',
            };
          });

        if (parsed.length === 0) {
          setParseError('No student data rows found after the header.');
          return;
        }

        const previewResult = onPreview(parsed);
        setPreview(previewResult);
        setStep('preview');
      } catch (err: any) {
        setParseError(`Failed to parse file: ${err.message || 'Unknown error'}. Ensure it is a valid .xlsx, .xls, or .csv file.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setIsImporting(true);
    const res = await onConfirmImport(preview);
    setIsImporting(false);
    if (res) {
      setImportResult(res);
      setStep('result');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-taras-950/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-taras-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-taras-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Import ECE Students Master Excel</h3>
            <p className="text-[11px] text-taras-300 mt-0.5">
              Step {step === 'upload' ? '1: Upload' : step === 'preview' ? '2: Preview & Validate' : '3: Results'} — ECE Department (Sections 1, 2, 3)
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-taras-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-taras-300 hover:border-taras-900 bg-taras-50/50 hover:bg-taras-50 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-2"
              >
                <FileSpreadsheet className="w-12 h-12 text-taras-400 mx-auto" />
                <p className="text-sm font-bold text-taras-900">Click to browse or drag &amp; drop Excel file</p>
                <p className="text-[11px] text-taras-500">Supports .xlsx, .xls, and .csv files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              {parseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Import Error</span>
                  </div>
                  <pre className="text-[11px] whitespace-pre-wrap font-sans mt-1">{parseError}</pre>
                </div>
              )}

              {/* Format Guide */}
              <div className="p-4 bg-taras-50 border border-taras-200 rounded-xl space-y-2">
                <p className="font-bold text-taras-800 text-xs">Expected Excel Columns (Case-Insensitive):</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border border-taras-200 bg-white rounded-lg">
                    <thead className="bg-taras-100 text-taras-800 font-bold">
                      <tr>
                        <th className="p-2 border-b border-r border-taras-200">Name</th>
                        <th className="p-2 border-b border-r border-taras-200">Register Number</th>
                        <th className="p-2 border-b border-r border-taras-200">Section (1, 2, or 3)</th>
                        <th className="p-2 border-b border-r border-taras-200">Year (I, II, III, IV)</th>
                        <th className="p-2 border-b border-r border-taras-200">Role (e.g. Lead, Coordinator)</th>
                        <th className="p-2 border-b border-taras-200">Date of Birth (DD-MM-YYYY)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-taras-100 text-taras-600">
                      <tr>
                        <td className="p-2 border-r border-taras-200">Arun Kumar</td>
                        <td className="p-2 border-r border-taras-200 font-mono">24ECE001</td>
                        <td className="p-2 border-r border-taras-200 text-center font-bold">1</td>
                        <td className="p-2 border-r border-taras-200 text-center">III</td>
                        <td className="p-2 border-r border-taras-200 font-semibold text-emerald-700">Coordinator</td>
                        <td className="p-2 font-mono">12-05-2005</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-taras-500">
                  Note: Department is automatically locked to <strong>ECE</strong>. Initial login passwords are automatically generated from DOB.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-taras-50 rounded-lg border border-taras-200">
                  <span className="font-bold text-base text-taras-900 block">{preview.total}</span>
                  <span className="text-[10px] text-taras-500">Total Rows</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="font-bold text-base text-emerald-700 block">{preview.valid}</span>
                  <span className="text-[10px] text-emerald-600">Valid &amp; Ready</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-bold text-base text-amber-700 block">{preview.duplicates}</span>
                  <span className="text-[10px] text-amber-600">Duplicates (Skipped)</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="font-bold text-base text-rose-700 block">{preview.invalid}</span>
                  <span className="text-[10px] text-rose-600">Errors</span>
                </div>
              </div>

              {preview.invalid > 0 && (
                <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  <span>{preview.invalid} rows have formatting issues and will be skipped.</span>
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="underline text-[11px] font-bold text-rose-900"
                  >
                    {showErrors ? 'Show All Rows' : 'Show Only Errors'}
                  </button>
                </div>
              )}

              {/* Rows Table */}
              <div className="border border-taras-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-taras-50 border-b border-taras-200 text-taras-700 font-semibold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Reg. No</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Sec</th>
                      <th className="p-2">Year</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">DOB</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-taras-100 font-medium">
                    {preview.rows
                      .filter(r => (showErrors ? !r.isValid : true))
                      .map(r => (
                        <tr key={r.rowIndex} className={!r.isValid ? 'bg-rose-50/50' : 'hover:bg-taras-50/50'}>
                          <td className="p-2 text-taras-400 font-mono">#{r.rowIndex}</td>
                          <td className="p-2 font-mono font-bold text-taras-900">{r.registerNumber || '—'}</td>
                          <td className="p-2 text-taras-900">{r.name || '—'}</td>
                          <td className="p-2 font-bold text-taras-700">{r.section || '—'}</td>
                          <td className="p-2 text-taras-600">{r.year || '—'}</td>
                          <td className="p-2 text-emerald-700 font-semibold">{r.role || 'Student'}</td>
                          <td className="p-2 font-mono text-taras-700">{r.dateOfBirth || '—'}</td>
                          <td className="p-2">
                            {r.isValid ? (
                              <span className="text-emerald-700 flex items-center gap-1 font-bold text-[11px]">
                                <Check className="w-3.5 h-3.5" /> Ready
                              </span>
                            ) : (
                              <span className="text-rose-700 text-[10px] block" title={r.errors.join(', ')}>
                                {r.errors.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && importResult && (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-taras-900">Import Complete</h4>
                <p className="text-xs text-taras-600 mt-1">
                  Successfully imported <strong>{importResult.added}</strong> ECE students into the system.
                  {importResult.failed > 0 && ` (${importResult.failed} failed/skipped)`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-taras-200 bg-taras-50/50 flex items-center justify-between">
          {step === 'preview' ? (
            <>
              <button
                onClick={reset}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Upload Another File
              </button>
              <button
                onClick={handleConfirm}
                disabled={isImporting || !preview || preview.valid === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-taras-900 hover:bg-taras-800 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                <span>{isImporting ? 'Importing...' : `Confirm & Import (${preview?.valid ?? 0} Students)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : step === 'result' ? (
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2 rounded-lg bg-taras-900 text-white text-xs font-bold"
            >
              Done
            </button>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 text-xs font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
