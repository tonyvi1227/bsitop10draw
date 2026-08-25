import React, { useState } from 'react';
import { BsiItem, CategoryType } from '../../types/bsi';
import { parseExcelFileMultiSheet, parseCsvFile, downloadSampleExcelTemplate } from '../../utils/excelParser';
import { FileSpreadsheet, Download, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExcelUploadProps {
  activeCategory: CategoryType;
  setItems: React.Dispatch<React.SetStateAction<BsiItem[]>>;
  onBulkUpdateAllCategories?: (dataMap: Partial<Record<CategoryType, BsiItem[]>>) => void;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
  activeCategory,
  setItems,
  onBulkUpdateAllCategories,
}) => {
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Đang đọc số liệu các Sheet Excel...' });

    try {
      if (file.name.endsWith('.csv')) {
        const parsedItems = await parseCsvFile(file);
        if (parsedItems.length === 0) {
          setStatusMessage({
            type: 'error',
            text: 'Không tìm thấy dữ liệu hợp lệ trong file CSV.',
          });
        } else {
          setItems(parsedItems);
          setStatusMessage({
            type: 'success',
            text: `Đã tự động nạp ${parsedItems.length} vị trí BSI Top10 cho hạng mục ${activeCategory}!`,
          });
        }
      } else {
        const result = await parseExcelFileMultiSheet(file, activeCategory);

        if (result.totalParsedCount === 0) {
          setStatusMessage({
            type: 'error',
            text: 'Không tìm thấy dữ liệu hợp lệ trong các Sheet của file Excel.',
          });
        } else {
          if (onBulkUpdateAllCategories && Object.keys(result.allParsed).length > 0) {
            onBulkUpdateAllCategories(result.allParsed);
          }

          if (result.matchedCategories.length > 1) {
            setStatusMessage({
              type: 'success',
              text: `Thành công! Đã tự động nạp dữ liệu cho cả ${result.matchedCategories.length} hạng mục (${result.matchedCategories.join(', ')}) và áp dụng cho tất cả 3 định dạng thiết kế!`,
            });
          } else {
            if (result.activeCategoryParsed.length > 0) {
              setItems(result.activeCategoryParsed);
            }
            setStatusMessage({
              type: 'success',
              text: `Đã nạp ${result.totalParsedCount} vị trí BSI Top10 thành công!`,
            });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Lỗi đọc file Excel: ' + (err.message || 'File không đúng cấu trúc.'),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Nhập dữ liệu Excel / CSV</span>
          </div>

          <button
            onClick={downloadSampleExcelTemplate}
            className="flex items-center gap-1 text-[11px] font-semibold text-buzz-lightOrange hover:text-buzz-orange transition"
            title="Tải File mẫu Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Template</span>
          </button>
        </div>

        <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-emerald-500 rounded-lg bg-slate-900/60 cursor-pointer transition">
          <UploadCloud className="w-6 h-6 text-emerald-400 mb-1" />
          <span className="text-xs font-semibold text-slate-300">
            Tải lên file Excel (.xlsx, .csv)
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Cột: Rank, Name, BSI_Score, Buzz_Volume, QU, Content_QU...
          </span>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
        </label>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/60 border border-rose-700/60 text-rose-300'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
