import React, { useState } from 'react';
import { BsiItem, BsiReportMetadata, CategoryType, FormatType } from '../../types/bsi';
import { CATEGORY_CONFIG } from '../../constants/branding';
import { ExcelUpload } from '../upload/ExcelUpload';
import { BulkImageUpload } from '../upload/BulkImageUpload';
import { ImageCropperModal } from '../cropper/ImageCropperModal';
import { BarChart3, Table, Layers, Calendar, Image as ImageIcon, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, UploadCloud, Crop } from 'lucide-react';

interface ControlSidebarProps {
  metadata: BsiReportMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<BsiReportMetadata>>;
  items: BsiItem[];
  setItems: React.Dispatch<React.SetStateAction<BsiItem[]>>;
  onLoadSampleData: (category: CategoryType) => void;
  onBulkUpdateAllCategories?: (dataMap: Partial<Record<CategoryType, BsiItem[]>>) => void;
  onlyTop10Edit?: boolean;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  metadata,
  setMetadata,
  items,
  setItems,
  onLoadSampleData,
  onBulkUpdateAllCategories,
  onlyTop10Edit = false,
}) => {
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'BULK'>('MANUAL');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

  const handleItemChange = (index: number, field: keyof BsiItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        handleItemChange(index, 'croppedImageData', dataUrl);
        setCropperState({
          isOpen: true,
          imageSrc: dataUrl,
          rankIndex: index,
          rankName: `Top ${items[index].rank} - ${items[index].name}`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = (croppedBase64: string) => {
    handleItemChange(cropperState.rankIndex, 'croppedImageData', croppedBase64);
  };

  return (
    <div className="w-[450px] bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none shrink-0">
      {/* App Header (Shown only when not in compact Top 10 edit mode) */}
      {!onlyTop10Edit && (
        <>
          <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-buzz-orange to-buzz-lightOrange flex items-center justify-center shadow-lg shadow-buzz-orange/30">
                <span className="font-extrabold text-white text-lg tracking-wider">BSI</span>
              </div>
              <div>
                <h1 className="font-bold text-base text-white leading-tight">Buzzmetrics BSI Top10</h1>
                <p className="text-xs text-slate-400 font-medium">Graphic Automation Studio</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-buzz-orange/20 text-buzz-orange border border-buzz-orange/30">
              Phase 3
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="px-5 pt-4 flex items-center gap-2 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('MANUAL')}
              className={`flex-1 py-2 text-xs font-bold rounded-t-lg transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'MANUAL'
                  ? 'border-buzz-orange text-buzz-orange bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nhập liệu trực tiếp</span>
            </button>
            <button
              onClick={() => setActiveTab('BULK')}
              className={`flex-1 py-2 text-xs font-bold rounded-t-lg transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'BULK'
                  ? 'border-buzz-orange text-buzz-orange bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Excel & 10 Ảnh</span>
            </button>
          </div>
        </>
      )}

      {/* Main Form Fields (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {!onlyTop10Edit && (
          <>
            {/* 1. Category Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-buzz-orange" />
                Hạng mục báo cáo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'] as CategoryType[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setMetadata((prev) => ({ ...prev, category: cat }));
                      onLoadSampleData(cat);
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center border ${
                      metadata.category === cat
                        ? 'bg-buzz-orange text-white border-buzz-orange shadow-md shadow-buzz-orange/20'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-buzz-orange" />
                Định dạng thiết kế (Format)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CHART', label: '1. Chart', icon: BarChart3 },
                  { id: 'TABLE', label: '2. Table', icon: Table },
                  { id: 'COMBINATION', label: '3. Combo', icon: Layers },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMetadata((prev) => ({ ...prev, format: id as FormatType }))}
                    className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                      metadata.format === id
                        ? 'bg-slate-800 text-buzz-orange border-buzz-orange ring-1 ring-buzz-orange'
                        : 'bg-slate-800/50 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Date Configuration */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-buzz-orange" />
                Thời gian báo cáo (MM/YYYY)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Tháng (MM)</span>
                  <select
                    value={metadata.month}
                    onChange={(e) => setMetadata((prev) => ({ ...prev, month: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-buzz-orange font-semibold cursor-pointer"
                  >
                    {[
                      { val: '01', label: 'Tháng 01 (Jan)' },
                      { val: '02', label: 'Tháng 02 (Feb)' },
                      { val: '03', label: 'Tháng 03 (Mar)' },
                      { val: '04', label: 'Tháng 04 (Apr)' },
                      { val: '05', label: 'Tháng 05 (May)' },
                      { val: '06', label: 'Tháng 06 (Jun)' },
                      { val: '07', label: 'Tháng 07 (Jul)' },
                      { val: '08', label: 'Tháng 08 (Aug)' },
                      { val: '09', label: 'Tháng 09 (Sep)' },
                      { val: '10', label: 'Tháng 10 (Oct)' },
                      { val: '11', label: 'Tháng 11 (Nov)' },
                      { val: '12', label: 'Tháng 12 (Dec)' },
                    ].map((opt) => (
                      <option key={opt.val} value={opt.val}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Năm (YYYY)</span>
                  <select
                    value={metadata.year}
                    onChange={(e) => setMetadata((prev) => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-buzz-orange font-semibold cursor-pointer"
                  >
                    {['2024', '2025', '2026', '2027', '2028'].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Top 10 Editor Section Header when in onlyTop10Edit mode */}
        {onlyTop10Edit && (
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-buzz-lightOrange flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-buzz-orange" />
              Chỉnh Sửa Chi Tiết Top 10 ({metadata.category})
            </span>
            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
              {metadata.format}
            </span>
          </div>
        )}

        {/* Dynamic Content based on Active Tab */}
        {activeTab === 'BULK' ? (
          <div className="space-y-6 pt-2 border-t border-slate-800">
            <ExcelUpload
              activeCategory={metadata.category}
              setItems={setItems}
              onBulkUpdateAllCategories={onBulkUpdateAllCategories}
            />

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-buzz-orange" />
                Upload 10 Logo / Hình ảnh tròn
              </label>
              <BulkImageUpload items={items} setItems={setItems} />
            </div>
          </div>
        ) : (
          /* Manual Edit Mode */
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-buzz-orange" />
                Chỉnh sửa Top 10 ({CATEGORY_CONFIG[metadata.category].objectName})
              </label>
              <button
                onClick={() => onLoadSampleData(metadata.category)}
                className="text-[11px] font-semibold text-buzz-orange hover:underline"
              >
                Reset Sample
              </button>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {items.slice(0, 10).map((item, idx) => {
                const isExpanded = expandedIndex === idx;

                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-800/60 border border-slate-700/60 overflow-hidden transition"
                  >
                    {/* Item Row Main Header: Rank | Name | BSI Score | Content from QU */}
                    <div className="p-3 flex items-center justify-between gap-2">
                      <span className="w-6 h-6 rounded-full bg-buzz-orange/20 text-buzz-orange font-bold text-xs flex items-center justify-center border border-buzz-orange/40 shrink-0">
                        {item.rank}
                      </span>
                      
                      {/* Name / Brand Input (Hỗ trợ nút Enter xuống dòng trực tiếp!) */}
                      {metadata.category === 'CAMPAIGNS' ? (
                        <div className="flex-1 flex gap-1.5 min-w-0">
                          <textarea
                            rows={2}
                            value={item.brandName || ''}
                            onChange={(e) => handleItemChange(idx, 'brandName', e.target.value)}
                            className="w-1/3 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:border-buzz-orange min-w-0 resize-none"
                            placeholder="Brand"
                            title="Tên Thương Hiệu (Brand) - Nhấn Enter để xuống dòng"
                          />
                          <textarea
                            rows={2}
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:border-buzz-orange min-w-0 resize-none"
                            placeholder="Chiến dịch (Nhấn Enter xuống dòng)"
                            title="Tên Chiến Dịch - Nhấn Enter để ngắt dòng chủ động"
                          />
                        </div>
                      ) : (
                        <textarea
                          rows={2}
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-buzz-orange min-w-0 resize-none"
                          placeholder="Tên đối tượng (Nhấn Enter xuống dòng)"
                          title="Tên đối tượng - Nhấn Enter để ngắt dòng chủ động"
                        />
                      )}

                      {/* BSI Score Input */}
                      <div className="w-[72px] shrink-0">
                        <span className="text-[9px] text-slate-400 block text-center font-semibold mb-0.5">BSI</span>
                        <input
                          type="number"
                          step="0.1"
                          value={item.bsiScore}
                          onChange={(e) =>
                            handleItemChange(idx, 'bsiScore', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-md px-1.5 py-1 text-xs font-bold text-buzz-orange text-right focus:outline-none focus:border-buzz-orange"
                          placeholder="BSI"
                        />
                      </div>

                      {/* Content from QU Input (Dedicated Field Right on Item Row!) */}
                      <div className="w-[82px] shrink-0">
                        <span className="text-[9px] text-sky-400 block text-center font-semibold mb-0.5">Content QU</span>
                        <input
                          type="number"
                          value={item.contentFromQu}
                          onChange={(e) =>
                            handleItemChange(idx, 'contentFromQu', parseInt(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-sky-500/50 rounded-md px-1.5 py-1 text-xs font-bold text-sky-400 text-right focus:outline-none focus:border-sky-400"
                          placeholder="Content QU"
                        />
                      </div>

                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white shrink-0 mt-3"
                        title="Mở rộng thêm chỉ số"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded Additional Metrics */}
                    {isExpanded && (
                      <div className="p-3 bg-slate-900/80 border-t border-slate-700/50 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Buzz Volume</span>
                          <input
                            type="number"
                            value={item.buzzVolume}
                            onChange={(e) =>
                              handleItemChange(idx, 'buzzVolume', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Qualified User</span>
                          <input
                            type="number"
                            value={item.qualifiedUser}
                            onChange={(e) =>
                              handleItemChange(idx, 'qualifiedUser', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Earned Media (%)</span>
                          <input
                            type="number"
                            value={item.earnedMedia}
                            onChange={(e) =>
                              handleItemChange(idx, 'earnedMedia', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Sentiment Index</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.sentimentScore}
                            onChange={(e) =>
                              handleItemChange(idx, 'sentimentScore', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Relevance Score</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.relevanceScore}
                            onChange={(e) =>
                              handleItemChange(idx, 'relevanceScore', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                          />
                        </div>
                      </div>
                    )}

                    {/* Avatar Upload Footer */}
                    <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-700/30 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-slate-400" /> Image/Logo:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(item.croppedImageData || item.imageUrl) && (
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
                            className="px-2 py-0.5 rounded bg-buzz-orange/20 hover:bg-buzz-orange/30 text-buzz-orange border border-buzz-orange/40 text-[10px] font-bold flex items-center gap-1 transition"
                            title="Crop & Scale ảnh"
                          >
                            <Crop className="w-3 h-3" />
                            <span>Crop & Scale</span>
                          </button>
                        )}
                        <label className="cursor-pointer text-[10px] font-semibold text-buzz-lightOrange hover:text-buzz-orange bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          <span>{item.croppedImageData || item.imageUrl ? 'Đổi ảnh' : 'Upload ảnh'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleImageUpload(idx, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperState.isOpen}
        imageSrc={cropperState.imageSrc}
        targetRankName={cropperState.rankName}
        onClose={() => setCropperState((prev) => ({ ...prev, isOpen: false }))}
        onApplyCrop={handleApplyCrop}
      />
    </div>
  );
};
