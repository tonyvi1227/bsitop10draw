import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  Table, 
  Sparkles,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileArchive,
  Database,
  Search
} from 'lucide-react';
import { BsiItem, BsiReportMetadata, CategoryType, FormatType } from '../../types/bsi';
import { renderCanvasToBlob, downloadCanvasImage } from '../../utils/canvasRenderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface QCStudioProps {
  items: BsiItem[];
  allCategoryItems: Record<CategoryType, BsiItem[]>;
  metadata: BsiReportMetadata;
  templateAssets: Record<string, HTMLImageElement>;
  onSelectCategory: (cat: CategoryType) => void;
  onSelectFormat: (format: FormatType) => void;
}

export const QCStudio: React.FC<QCStudioProps> = ({
  items,
  allCategoryItems,
  metadata,
  templateAssets,
  onSelectCategory,
  onSelectFormat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryType>(metadata.category);
  const [activeFormat, setActiveFormat] = useState<FormatType>(metadata.format);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Keep internal state aligned with props
  useEffect(() => {
    setActiveCategory(metadata.category);
    setActiveFormat(metadata.format);
  }, [metadata.category, metadata.format]);

  // Render high-res QC canvas whenever category, format or items change
  useEffect(() => {
    const renderQC = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);

      const targetItems = allCategoryItems[activeCategory] || items;
      const targetMetadata: BsiReportMetadata = {
        ...metadata,
        category: activeCategory,
        format: activeFormat,
      };

      await renderCanvasToBlob(canvasRef.current, targetItems, targetMetadata, templateAssets);
      setIsRendering(false);
    };

    renderQC();
  }, [activeCategory, activeFormat, allCategoryItems, items, metadata, templateAssets]);

  const handleCategoryChange = (cat: CategoryType) => {
    setActiveCategory(cat);
    onSelectCategory(cat);
  };

  const handleFormatChange = (fmt: FormatType) => {
    setActiveFormat(fmt);
    onSelectFormat(fmt);
  };

  const handleDownloadSinglePNG = () => {
    if (!canvasRef.current) return;
    const filename = `BSITOP10_${activeCategory}_${activeFormat}_${metadata.month}-${metadata.year}.png`;
    downloadCanvasImage(canvasRef.current, filename);
  };

  const handleDownloadAll12ZIP = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const categories: CategoryType[] = ['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'];
      const formats: FormatType[] = ['CHART', 'TABLE', 'COMBINATION'];

      const offscreenCanvas = document.createElement('canvas');

      for (const cat of categories) {
        const catItems = allCategoryItems[cat] || [];
        const folder = zip.folder(cat);

        for (const fmt of formats) {
          const meta: BsiReportMetadata = { ...metadata, category: cat, format: fmt };
          const blob = await renderCanvasToBlob(offscreenCanvas, catItems, meta, templateAssets);

          const fmtName = fmt === 'CHART' ? '01_CHART' : fmt === 'TABLE' ? '02_TABLE' : '03_COMBO';
          const filename = `BSITOP10_${cat}_${fmtName}_${metadata.month}-${metadata.year}.png`;
          if (folder) {
            folder.file(filename, blob);
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `BSI_TOP10_TRON_BO_12_ANH_QC_${metadata.month}_${metadata.year}.zip`);
    } catch (err) {
      console.error('ZIP Export Error:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const currentCategoryItems = allCategoryItems[activeCategory] || items;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar Navigation for QC Station */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Bước 3: QC và Xuất Ảnh BSI TOP10 (Quality Control & Export Station)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
                READY FOR EXPORT
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Đối chiếu bảng số liệu Data thực tế với ảnh render đồ họa 4K trước khi bấm xuất file PNG / ZIP
            </p>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSinglePNG}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-buzz-orange" />
            <span>Xuất 1 Ảnh PNG</span>
          </button>

          <button
            onClick={handleDownloadAll12ZIP}
            disabled={isExportingZip}
            className="px-4 py-2 bg-buzz-orange hover:bg-buzz-orange-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-buzz-orange/20 disabled:opacity-50"
          >
            {isExportingZip ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileArchive className="w-4 h-4" />
            )}
            <span>Xuất Trọn Bộ 12 Ảnh (ZIP)</span>
          </button>
        </div>
      </div>

      {/* QC Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Selectors & Live Data Table Inspector Panel */}
        <div className="w-[420px] bg-slate-900/80 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-buzz-orange" />
              Chọn Hạng Mục Kiểm Tra
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition border text-center ${
                    activeCategory === cat
                      ? 'bg-buzz-orange text-white border-buzz-orange shadow-md shadow-buzz-orange/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cat === 'INFLUENCERS' ? 'CELEBS' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-buzz-orange" />
              Chọn Định Dạng Xem QC
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CHART', label: '1. Chart', icon: BarChart3 },
                { id: 'TABLE', label: '2. Table', icon: Table },
                { id: 'COMBINATION', label: '3. Combo', icon: Layers },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleFormatChange(id as FormatType)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 border ${
                    activeFormat === id
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

          <hr className="border-slate-800" />

          {/* BẢNG DATA KIỂM TRA LẠI 1 LẦN NỮA (LIVE DATA TABLE INSPECTOR) */}
          <div className="flex-1 flex flex-col space-y-2.5 min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-buzz-orange" />
                Bảng Data Kiểm Tra Số Liệu ({activeCategory})
              </h3>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                10 Rows Ready
              </span>
            </div>

            {/* Scrollable Mini Table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 min-w-[120px]">Tên đối tượng</th>
                    <th className="py-2 px-2 text-right text-buzz-orange">BSI</th>
                    <th className="py-2 px-2 text-right text-sky-400">CFQU</th>
                    <th className="py-2 px-2 text-center w-12">Avatar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
                  {currentCategoryItems.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition">
                      <td className="py-2 px-2 text-center">
                        <span className="w-5 h-5 rounded-full bg-buzz-orange/20 text-buzz-orange font-bold text-[10px] inline-flex items-center justify-center border border-buzz-orange/40">
                          {item.rank}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="font-bold text-white leading-tight text-[11px] max-w-[150px] truncate" title={item.name}>
                          {item.name}
                        </div>
                        {item.brandName && (
                          <div className="text-[10px] text-slate-400 font-normal">{item.brandName}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-buzz-orange font-bold text-[11px]">
                        {item.bsiScore.toLocaleString('en-US')}
                      </td>
                      <td className="py-2 px-2 text-right text-sky-400 font-bold text-[11px]">
                        {(item.contentFromQu || 0).toLocaleString('en-US')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {item.croppedImageData || item.imageUrl ? (
                          <img
                            src={item.croppedImageData || item.imageUrl}
                            alt="Logo"
                            className="w-6 h-6 rounded-full object-cover border border-emerald-500/50 mx-auto"
                          />
                        ) : (
                          <span className="text-[9px] text-amber-400 font-mono">No img</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zoom Control Box */}
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs shrink-0">
            <span className="font-semibold text-slate-400">Tỷ lệ xem Canvas</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-buzz-orange font-bold px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-white font-mono ml-1"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        {/* Center High-Res Canvas Viewport */}
        <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center overflow-auto relative">
          {isRendering && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl shadow-2xl">
                <RefreshCw className="w-5 h-5 text-buzz-orange animate-spin" />
                <span className="text-xs font-bold text-white">Đang Render Hình Ảnh 4K QC...</span>
              </div>
            </div>
          )}

          <div
            className="relative transition-transform duration-200 shadow-2xl rounded-lg border border-slate-800/80 overflow-hidden bg-white"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <canvas ref={canvasRef} className="block max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};
