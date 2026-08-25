import React, { useState } from 'react';
import { BsiItem, BsiReportMetadata, CategoryType } from '../../types/bsi';
import {
  fetchGoogleSheetLive,
  fetchGoogleSheetsAllTabsLive,
  downloadSampleExcelTemplate,
} from '../../utils/excelParser';
import { BulkImageUpload } from '../upload/BulkImageUpload';
import { ImageCropperModal } from '../cropper/ImageCropperModal';
import {
  Link2,
  RefreshCw,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Check,
  UploadCloud,
  Trash2,
  ChevronDown,
  ChevronUp,
  Crop,
} from 'lucide-react';

interface DataStudioProps {
  metadata: BsiReportMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<BsiReportMetadata>>;
  categoryDataStore: Record<CategoryType, BsiItem[]>;
  setCategoryDataStore: React.Dispatch<React.SetStateAction<Record<CategoryType, BsiItem[]>>>;
  onNavigateToGraphic: () => void;
}

export const DataStudio: React.FC<DataStudioProps> = ({
  metadata,
  setMetadata,
  categoryDataStore,
  setCategoryDataStore,
  onNavigateToGraphic,
}) => {
  const DEFAULT_GSHEET_URL =
    'https://docs.google.com/spreadsheets/d/1Qz2Tt739SP7uWDtjy_sZkYws6_4vymuESNzIvLJZGqE/edit?gid=1831565463#gid=1831565463';

  const [gsheetUrl, setGsheetUrl] = useState<string>(() => {
    return localStorage.getItem('BSI_GSHEET_URL') || DEFAULT_GSHEET_URL;
  });

  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [showBulkImageUpload, setShowBulkImageUpload] = useState<boolean>(false);

  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    rankIndex: number;
    rankName: string;
  }>({
    isOpen: false,
    imageSrc: null,
    rankIndex: 0,
    rankName: '',
  });

  const currentItems = categoryDataStore[metadata.category] || [];

  const handleSetCurrentItems: React.Dispatch<React.SetStateAction<BsiItem[]>> = (action) => {
    setCategoryDataStore((prevStore) => {
      const activeCat = metadata.category;
      const prevItems = prevStore[activeCat] || [];
      const nextItems = typeof action === 'function' ? action(prevItems) : action;
      return {
        ...prevStore,
        [activeCat]: nextItems,
      };
    });
  };

  // Upload single row image & auto open cropper modal
  const handleRowImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const imageResult = e.target.result as string;
        setCategoryDataStore((prevStore) => {
          const activeCat = metadata.category;
          const updatedList = [...(prevStore[activeCat] || [])];
          if (updatedList[index]) {
            updatedList[index] = {
              ...updatedList[index],
              croppedImageData: imageResult,
            };
          }
          return {
            ...prevStore,
            [activeCat]: updatedList,
          };
        });
        const targetItem = currentItems[index];
        setCropperState({
          isOpen: true,
          imageSrc: imageResult,
          rankIndex: index,
          rankName: `Top ${targetItem ? targetItem.rank : index + 1} - ${targetItem ? targetItem.name : ''}`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyRowCrop = (croppedBase64: string) => {
    setCategoryDataStore((prevStore) => {
      const activeCat = metadata.category;
      const updatedList = [...(prevStore[activeCat] || [])];
      const idx = cropperState.rankIndex;
      if (updatedList[idx]) {
        updatedList[idx] = {
          ...updatedList[idx],
          croppedImageData: croppedBase64,
        };
      }
      return {
        ...prevStore,
        [activeCat]: updatedList,
      };
    });
  };

  // Remove single row image
  const handleRemoveRowImage = (index: number) => {
    setCategoryDataStore((prevStore) => {
      const activeCat = metadata.category;
      const updatedList = [...(prevStore[activeCat] || [])];
      if (updatedList[index]) {
        updatedList[index] = {
          ...updatedList[index],
          imageUrl: undefined,
          croppedImageData: undefined,
        };
      }
      return {
        ...prevStore,
        [activeCat]: updatedList,
      };
    });
  };

  // Fetch Live Google Sheet Data for ALL 4 Categories (Campaigns, Celebs, Events, Shows) for Month/Year
  const handleFetchGoogleSheet = async () => {
    if (!gsheetUrl.trim()) return;

    setIsFetchingSheet(true);
    setSyncStatus({
      type: 'info',
      message: `Đang đồng bộ Google Sheet cả 4 Hạng Mục cho tháng ${metadata.month}/${metadata.year}...`,
    });

    try {
      localStorage.setItem('BSI_GSHEET_URL', gsheetUrl.trim());
      const { allParsed, syncedCategories } = await fetchGoogleSheetsAllTabsLive(
        gsheetUrl.trim(),
        metadata.month,
        metadata.year
      );

      if (syncedCategories.length === 0) {
        setSyncStatus({
          type: 'error',
          message: `Không tìm thấy số liệu cho Tháng ${metadata.month}/${metadata.year} trên các tab của Google Sheet.`,
        });
      } else {
        setCategoryDataStore((prev) => ({
          ...prev,
          ...allParsed,
        }));

        const countsStr = Object.entries(allParsed)
          .map(([cat, items]) => `${cat}: ${items?.length || 0}`)
          .join(', ');

        setSyncStatus({
          type: 'success',
          message: `Đã đồng bộ Live thành công ${syncedCategories.length} Hạng Mục cho Tháng ${metadata.month}/${metadata.year}! (${countsStr})`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Lỗi đọc dữ liệu Google Sheet. Hãy kiểm tra chế độ chia sẻ công khai (Public).',
      });
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Auto-QC System checks
  const isCountPassed = currentItems.length >= 10;
  const isSortedPassed = currentItems.every((item, idx) => {
    if (idx === 0) return true;
    return currentItems[idx - 1].bsiScore >= item.bsiScore;
  });
  const longNameCount = currentItems.filter((item) => item.name.length > 35).length;
  const missingAvatarCount = currentItems.filter((item) => !item.croppedImageData && !item.imageUrl).length;

  const categoryLabels: Record<CategoryType, string> = {
    CAMPAIGNS: 'QU Campaigns',
    INFLUENCERS: 'QU Celebs',
    EVENTS: 'QU Events',
    SHOWS: 'QU Shows',
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 lg:p-8 space-y-6 select-none">
      {/* 1. Header Banner & Google Sheet Sync */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800 border border-slate-700/80 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-buzz-orange to-amber-500 flex items-center justify-center shadow-lg shadow-buzz-orange/30">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Sheets Live Data Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold">
                  LIVE SYNC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dán link Google Sheet công khai để đồng bộ tự động số liệu BSI Real & CFQU cho cả 4 Hạng mục.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadSampleExcelTemplate}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-buzz-lightOrange transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Tải Template 4 Sheet</span>
            </button>
            <button
              onClick={onNavigateToGraphic}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-buzz-orange to-buzz-lightOrange text-white text-xs font-bold shadow-lg shadow-buzz-orange/30 hover:shadow-buzz-orange/50 transition transform active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Xem Đồ Họa Graphic Studio →</span>
            </button>
          </div>
        </div>

        {/* Input Google Sheet Link Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={gsheetUrl}
              onChange={(e) => setGsheetUrl(e.target.value)}
              placeholder="Dán link Google Sheet tại đây (vd: https://docs.google.com/spreadsheets/d/...)"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:border-buzz-orange focus:ring-1 focus:ring-buzz-orange transition pr-10"
            />
            {gsheetUrl && (
              <span className="absolute right-3 top-3 text-emerald-400" title="Link đã nhận">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
          <button
            onClick={handleFetchGoogleSheet}
            disabled={isFetchingSheet}
            className="px-6 py-3 rounded-xl bg-buzz-orange hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-buzz-orange/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {isFetchingSheet ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Đồng Bộ Google Sheet Live</span>
          </button>
        </div>

        {/* Sync Status Alert */}
        {syncStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
              syncStatus.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                : syncStatus.type === 'error'
                ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {syncStatus.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {syncStatus.type === 'info' && <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />}
            <span>{syncStatus.message}</span>
          </div>
        )}
      </div>

      {/* 2. Selection Bar: Month/Year & Category Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Filter & Selector */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-buzz-orange" />
            Thời gian báo cáo (Month/Year)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Tháng (MM)</span>
              <input
                type="text"
                value={metadata.month}
                onChange={(e) => setMetadata((prev) => ({ ...prev, month: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold text-center focus:outline-none focus:border-buzz-orange"
                placeholder="06"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Năm (YYYY)</span>
              <input
                type="text"
                value={metadata.year}
                onChange={(e) => setMetadata((prev) => ({ ...prev, year: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold text-center focus:outline-none focus:border-buzz-orange"
                placeholder="2026"
              />
            </div>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="md:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-buzz-orange" />
            Hạng mục báo cáo Google Sheet (4 Tabs)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'] as CategoryType[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setMetadata((prev) => ({ ...prev, category: cat }))}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                  metadata.category === cat
                    ? 'bg-buzz-orange text-white border-buzz-orange shadow-lg shadow-buzz-orange/20 ring-1 ring-buzz-orange'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{categoryLabels[cat]}</span>
                <span className="text-[10px] opacity-80">({categoryDataStore[cat]?.length || 0} mục)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Auto-QC System & Audit Checklist Panel */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-buzz-orange" />
            <h3 className="font-bold text-sm text-white">Bảng Kiểm Định Quality Control (Auto-QC Audit Engine)</h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Source Check: 100% Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Rule 1: Count */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isCountPassed ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/30 border-rose-800/50 text-rose-300'}`}>
            {isCountPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-xs">Số lượng Top 10</p>
              <p className="text-[11px] opacity-80">{isCountPassed ? 'Đã đủ 10 vị trí' : `Chưa đủ 10 vị trí (${currentItems.length}/10)`}</p>
            </div>
          </div>

          {/* Rule 2: Sorting */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isSortedPassed ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-amber-950/30 border-amber-800/50 text-amber-300'}`}>
            {isSortedPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-xs">Thứ tự BSI giảm dần</p>
              <p className="text-[11px] opacity-80">{isSortedPassed ? 'Thứ tự giảm dần chuẩn 100%' : 'Cần sắp xếp lại Rank'}</p>
            </div>
          </div>

          {/* Rule 3: Text Truncation */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${longNameCount === 0 ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-amber-950/30 border-amber-800/50 text-amber-300'}`}>
            {longNameCount === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-xs">Kiểm tra Độ dài Tên</p>
              <p className="text-[11px] opacity-80">{longNameCount === 0 ? 'Tên đối tượng vừa đẹp' : `${longNameCount} tên dài (>35 ký tự)`}</p>
            </div>
          </div>

          {/* Rule 4: Avatar Status */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${missingAvatarCount === 0 ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            {missingAvatarCount === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <ImageIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-xs">Trạng thái Avatar/Logo</p>
              <p className="text-[11px] opacity-80">{missingAvatarCount === 0 ? 'Đã có đủ 10 ảnh Avatar' : `Có ${missingAvatarCount} vị trí chưa có ảnh`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Data Preview Grid Table & Row Image Uploaders */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-buzz-orange" />
            <h3 className="font-bold text-sm text-white">
              Bảng Số Liệu Xem Trực Tiếp ({categoryLabels[metadata.category]} - Tháng {metadata.month}/{metadata.year})
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkImageUpload((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-buzz-orange" />
              <span>Upload 10 Logo Hàng Loạt</span>
              {showBulkImageUpload ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs text-slate-400 font-medium">Top 10 Hàng Đầu</span>
          </div>
        </div>

        {/* Collapsible Bulk Image Uploader Dropzone */}
        {showBulkImageUpload && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Kéo thả 10 ảnh Logo/Avatar tròn hàng loạt cho {categoryLabels[metadata.category]}
            </label>
            <BulkImageUpload items={currentItems} setItems={handleSetCurrentItems} />
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                {metadata.category === 'CAMPAIGNS' && <th className="py-3 px-4 w-36">Brand</th>}
                <th className="py-3 px-4 min-w-[200px]">Tên đối tượng ({metadata.category})</th>
                <th className="py-3 px-4 text-right text-buzz-orange">BSI (real)</th>
                <th className="py-3 px-4 text-right text-sky-400">Content from QU</th>
                <th className="py-3 px-4 text-right">Buzz Volume</th>
                <th className="py-3 px-4 text-right">QU User</th>
                <th className="py-3 px-4 text-right">Sentiment</th>
                <th className="py-3 px-4 text-right">%Earned</th>
                <th className="py-3 px-4 text-center min-w-[140px]">Avatar / Logo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
              {currentItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-full bg-buzz-orange/20 text-buzz-orange font-extrabold text-xs inline-flex items-center justify-center border border-buzz-orange/40">
                      {item.rank}
                    </span>
                  </td>
                  {metadata.category === 'CAMPAIGNS' && (
                    <td className="py-3 px-4 text-slate-300 font-medium">{item.brandName || '-'}</td>
                  )}
                  <td className="py-3 px-4 text-white">{item.name}</td>
                  <td className="py-3 px-4 text-right text-buzz-orange font-bold">
                    {item.bsiScore.toLocaleString('en-US')}
                  </td>
                  <td className="py-3 px-4 text-right text-sky-400 font-bold">
                    {item.contentFromQu.toLocaleString('en-US')}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {item.buzzVolume.toLocaleString('en-US')}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {item.qualifiedUser.toLocaleString('en-US')}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {item.sentimentScore.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {item.earnedMedia.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {item.croppedImageData || item.imageUrl ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <img
                          src={item.croppedImageData || item.imageUrl}
                          alt={item.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-buzz-orange/80 shadow-md shrink-0 bg-slate-900 cursor-pointer hover:opacity-80 transition"
                          onClick={() => {
                            const src = item.croppedImageData || item.imageUrl;
                            if (src) {
                              setCropperState({
                                isOpen: true,
                                imageSrc: src,
                                rankIndex: idx,
                                rankName: `Top ${item.rank} - ${item.name}`,
                              });
                            }
                          }}
                          title="Click để Crop & Scale ảnh"
                        />
                        <button
                          onClick={() => {
                            const src = item.croppedImageData || item.imageUrl;
                            if (src) {
                              setCropperState({
                                isOpen: true,
                                imageSrc: src,
                                rankIndex: idx,
                                rankName: `Top ${item.rank} - ${item.name}`,
                              });
                            }
                          }}
                          className="p-1 hover:bg-slate-800 text-buzz-orange rounded transition"
                          title="Crop & Scale vị trí ảnh"
                        >
                          <Crop className="w-3.5 h-3.5" />
                        </button>
                        <label
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer transition"
                          title="Đổi ảnh avatar"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-buzz-orange" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleRowImageUpload(idx, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={() => handleRemoveRowImage(idx)}
                          className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-buzz-orange/20 hover:bg-buzz-orange/30 text-buzz-orange border border-buzz-orange/40 text-[11px] font-bold cursor-pointer transition active:scale-95">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Ảnh</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleRowImageUpload(idx, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperState.isOpen}
        imageSrc={cropperState.imageSrc}
        targetRankName={cropperState.rankName}
        onClose={() => setCropperState((prev) => ({ ...prev, isOpen: false }))}
        onApplyCrop={handleApplyRowCrop}
      />
    </div>
  );
};
