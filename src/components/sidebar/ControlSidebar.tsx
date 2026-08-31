import React, { useState } from 'react';
import { BsiItem, BsiReportMetadata, CategoryType, FormatType } from '../../types/bsi';
import { CATEGORY_CONFIG } from '../../constants/branding';
import { ExcelUpload } from '../upload/ExcelUpload';
import { BulkImageUpload } from '../upload/BulkImageUpload';
import { ImageCropperModal } from '../cropper/ImageCropperModal';
import { saveAvatarToCache } from '../../utils/avatarCache';
import { BarChart3, Table, Layers, Calendar, Image as ImageIcon, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, UploadCloud, Crop, Lightbulb, WrapText } from 'lucide-react';

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

  const getItemFormatName = (item: BsiItem, format: FormatType): string => {
    if (format === 'TABLE') return item.tableName !== undefined ? item.tableName : item.name;
    if (format === 'CHART') return item.chartName !== undefined ? item.chartName : item.name;
    if (format === 'COMBINATION') return item.comboName !== undefined ? item.comboName : item.name;
    return item.name;
  };

  const handleItemFormatNameChange = (index: number, format: FormatType, value: string) => {
    const updated = [...items];
    const item = { ...updated[index] };
    if (format === 'TABLE') {
      item.tableName = value;
    } else if (format === 'CHART') {
      item.chartName = value;
    } else if (format === 'COMBINATION') {
      item.comboName = value;
    } else {
      item.name = value;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        handleItemChange(index, 'croppedImageData', dataUrl);

        const targetItem = items[index];
        if (targetItem) {
          if (targetItem.name) saveAvatarToCache(targetItem.name, dataUrl);
          if (targetItem.brandName) saveAvatarToCache(targetItem.brandName, dataUrl);
        }

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
    const targetItem = items[cropperState.rankIndex];
    if (targetItem) {
      if (targetItem.name) saveAvatarToCache(targetItem.name, croppedBase64);
      if (targetItem.brandName) saveAvatarToCache(targetItem.brandName, croppedBase64);
    }
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
          <div className={`space-y-3 ${onlyTop10Edit ? '' : 'pt-2 border-t border-slate-800'}`}>
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

            {/* Tip for Line Breaks using || or Enter */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                <span className="font-bold text-amber-300">Mẹo ngắt dòng:</span> Dùng ký tự <code className="bg-slate-900 text-buzz-lightOrange font-bold px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">||</code> hoặc phím <code className="bg-slate-900 text-buzz-lightOrange font-bold px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">Enter</code> trong ô tên để ngắt dòng hiển thị trên canvas.
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {items.slice(0, 10).map((item, idx) => {
                const isExpanded = expandedIndex === idx;
                const avatarSrc = item.croppedImageData || item.imageUrl;

                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-3 space-y-2.5 shadow-sm transition"
                  >
                    {/* ROW 1: Rank Circle + Brand & Name Inputs + Edit Detail Arrow */}
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-buzz-orange/20 text-buzz-orange font-extrabold text-xs flex items-center justify-center border border-buzz-orange/40 shrink-0">
                        {item.rank}
                      </span>

                      {metadata.category === 'CAMPAIGNS' ? (
                        <div className="flex-1 flex gap-2 min-w-0">
                          <textarea
                            rows={2}
                            value={item.brandName || ''}
                            onChange={(e) => handleItemChange(idx, 'brandName', e.target.value)}
                            className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-buzz-orange min-w-0 resize-none leading-snug"
                            placeholder="Brand"
                            title="Tên Thương Hiệu (Brand)"
                          />
                          <textarea
                            rows={2}
                            value={getItemFormatName(item, metadata.format)}
                            onChange={(e) => handleItemFormatNameChange(idx, metadata.format, e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-buzz-orange min-w-0 resize-none leading-snug"
                            placeholder={`Chiến dịch (${metadata.format})`}
                            title={`Tên Chiến Dịch (${metadata.format})`}
                          />
                        </div>
                      ) : (
                        <textarea
                          rows={2}
                          value={getItemFormatName(item, metadata.format)}
                          onChange={(e) => handleItemFormatNameChange(idx, metadata.format, e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-buzz-orange min-w-0 resize-none leading-snug"
                          placeholder={`Tên đối tượng (${metadata.format})`}
                          title={`Tên đối tượng (${metadata.format})`}
                        />
                      )}

                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="p-2 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-white shrink-0 self-center transition border border-slate-700/50"
                        title="Chỉnh sửa chi tiết chỉ số & Tên riêng theo Bảng"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-buzz-orange" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* ROW 2: BSI Input + Content QU Input + Image Avatar Upload/Crop Controls */}
                    <div className="flex items-center gap-2.5 pt-1 border-t border-slate-700/40">
                      {/* BSI Score */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5 uppercase tracking-wide">BSI Score</span>
                        <input
                          type="number"
                          step="0.1"
                          value={item.bsiScore}
                          onChange={(e) =>
                            handleItemChange(idx, 'bsiScore', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-extrabold text-buzz-orange text-right focus:outline-none focus:border-buzz-orange"
                          placeholder="BSI"
                        />
                      </div>

                      {/* Content QU */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-sky-400 font-bold block mb-0.5 uppercase tracking-wide">Content QU</span>
                        <input
                          type="number"
                          value={item.contentFromQu}
                          onChange={(e) =>
                            handleItemChange(idx, 'contentFromQu', parseInt(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-sky-500/40 rounded-lg px-2.5 py-1 text-xs font-extrabold text-sky-400 text-right focus:outline-none focus:border-sky-400"
                          placeholder="Content QU"
                        />
                      </div>

                      {/* Image / Logo Upload & Crop Controls */}
                      <div className="shrink-0 flex items-center gap-1.5 self-end">
                        {avatarSrc ? (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={avatarSrc}
                              alt="Avatar"
                              className="w-7 h-7 rounded-full object-cover border border-buzz-orange/60"
                            />
                            <button
                              onClick={() => {
                                setCropperState({
                                  isOpen: true,
                                  imageSrc: avatarSrc,
                                  rankIndex: idx,
                                  rankName: `Top ${item.rank} - ${item.name}`,
                                });
                              }}
                              className="p-1 rounded bg-buzz-orange/20 hover:bg-buzz-orange/30 text-buzz-orange border border-buzz-orange/40 text-[10px] font-bold transition"
                              title="Crop & Scale ảnh"
                            >
                              <Crop className="w-3.5 h-3.5" />
                            </button>
                            <label className="cursor-pointer text-[10px] font-bold text-slate-300 hover:text-white bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                              <span>Đổi</span>
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
                        ) : (
                          <label className="cursor-pointer text-[10px] font-bold text-buzz-lightOrange hover:text-buzz-orange bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-buzz-orange" />
                            <span>Ảnh</span>
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
                        )}
                      </div>
                    </div>

                    {/* Expanded Additional Metrics & Format-Specific Name Overrides */}
                    {isExpanded && (
                      <div className="p-3 bg-slate-900/80 border-t border-slate-700/50 space-y-3 text-xs">
                        {/* Format-Specific Name Overrides */}
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2">
                          <span className="text-[11px] font-bold text-buzz-orange block">
                            Tên hiển thị riêng biệt theo Dạng Báo Cáo (Format Name Overrides):
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5 font-semibold">📊 Bảng Chart</span>
                              <input
                                type="text"
                                value={item.chartName ?? ''}
                                onChange={(e) => handleItemChange(idx, 'chartName', e.target.value)}
                                placeholder={`Mặc định (${item.name})`}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-medium text-xs focus:border-buzz-orange"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5 font-semibold">📋 Bảng Table</span>
                              <input
                                type="text"
                                value={item.tableName ?? ''}
                                onChange={(e) => handleItemChange(idx, 'tableName', e.target.value)}
                                placeholder={`Mặc định (${item.name})`}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-medium text-xs focus:border-buzz-orange"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5 font-semibold">📈 Bảng Combo</span>
                              <input
                                type="text"
                                value={item.comboName ?? ''}
                                onChange={(e) => handleItemChange(idx, 'comboName', e.target.value)}
                                placeholder={`Mặc định (${item.name})`}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-medium text-xs focus:border-buzz-orange"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
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
                          <div className="col-span-2">
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
                      </div>
                    )}
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
