import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  Table, 
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  FileArchive,
  Database,
  Download
} from 'lucide-react';
import { BsiItem, BsiReportMetadata, CategoryType, FormatType } from '../../types/bsi';
import { 
  preloadItemImages, 
  preloadTemplateAssets, 
  renderCanvasReport, 
  ensureFontsLoaded 
} from '../../utils/canvasRenderer';
import { exportAll12ReportsZip } from '../../utils/zipExporter';
import { saveAs } from 'file-saver';

interface QCStudioProps {
  items: BsiItem[];
  allCategoryItems: Record<CategoryType, BsiItem[]>;
  metadata: BsiReportMetadata;
  templateAssets?: Record<string, HTMLImageElement>;
  onSelectCategory: (cat: CategoryType) => void;
  onSelectFormat: (format: FormatType) => void;
}

export const QCStudio: React.FC<QCStudioProps> = ({
  items,
  allCategoryItems,
  metadata,
  onSelectCategory,
  onSelectFormat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeCategory, setActiveCategory] = useState<CategoryType>(metadata.category);
  const [activeFormat, setActiveFormat] = useState<FormatType>(metadata.format);
  const [zoomScale, setZoomScale] = useState<number>(0.35);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isExportingSingle, setIsExportingSingle] = useState<boolean>(false);

  // Mouse Drag / Pan State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // ZIP export progress state
  const [zipProgress, setZipProgress] = useState<{
    isExporting: boolean;
    current: number;
    total: number;
    message: string;
  }>({
    isExporting: false,
    current: 0,
    total: 12,
    message: '',
  });

  const baseWidth = activeFormat === 'TABLE' ? 4000 : 3000;
  const baseHeight = activeFormat === 'COMBINATION' ? 2400 : (activeFormat === 'TABLE' ? 2099 : 2000);

  // Keep internal state aligned with props
  useEffect(() => {
    setActiveCategory(metadata.category);
    setActiveFormat(metadata.format);
  }, [metadata.category, metadata.format]);

  // Adjust zoom auto-fit container
  const handleAutoFit = () => {
    if (containerRef.current) {
      const padding = 48;
      const containerW = containerRef.current.clientWidth - padding;
      const containerH = containerRef.current.clientHeight - padding;

      if (containerW > 0 && containerH > 0) {
        const fitScaleW = containerW / baseWidth;
        const fitScaleH = containerH / baseHeight;
        const fitZoom = Math.min(fitScaleW, fitScaleH);
        const clampedZoom = Number(Math.min(Math.max(fitZoom, 0.15), 1.0).toFixed(2));
        setZoomScale(clampedZoom);

        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = (containerRef.current.scrollWidth - containerRef.current.clientWidth) / 2;
            containerRef.current.scrollTop = (containerRef.current.scrollHeight - containerRef.current.clientHeight) / 2;
          }
        }, 50);
      }
    }
  };

  useEffect(() => {
    handleAutoFit();
    window.addEventListener('resize', handleAutoFit);
    return () => window.removeEventListener('resize', handleAutoFit);
  }, [activeFormat, baseWidth, baseHeight]);

  // Render high-res QC canvas whenever category, format or items change
  useEffect(() => {
    let isCancelled = false;

    const renderQC = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);

      try {
        await ensureFontsLoaded();
        const targetItems = allCategoryItems[activeCategory] || items;
        const targetMetadata: BsiReportMetadata = {
          ...metadata,
          category: activeCategory,
          format: activeFormat,
        };

        const [templates, loadedImages] = await Promise.all([
          preloadTemplateAssets(),
          preloadItemImages(targetItems),
        ]);

        if (isCancelled || !canvasRef.current) return;

        await renderCanvasReport({
          canvas: canvasRef.current,
          items: targetItems,
          metadata: targetMetadata,
          loadedImages,
          templateAssets: templates,
          scale: metadata.highDpiScale || 2,
        });
      } catch (err) {
        console.error('QC Render Error:', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    renderQC();

    return () => {
      isCancelled = true;
    };
  }, [activeCategory, activeFormat, allCategoryItems, items, metadata]);

  const handleCategoryChange = (cat: CategoryType) => {
    setActiveCategory(cat);
    onSelectCategory(cat);
  };

  const handleFormatChange = (fmt: FormatType) => {
    setActiveFormat(fmt);
    onSelectFormat(fmt);
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsPanning(true);
    setPanStart({
      x: e.pageX,
      y: e.pageY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !containerRef.current) return;
    e.preventDefault();
    const walkX = e.pageX - panStart.x;
    const walkY = e.pageY - panStart.y;
    containerRef.current.scrollLeft = panStart.scrollLeft - walkX;
    containerRef.current.scrollTop = panStart.scrollTop - walkY;
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  // Export Single PNG at full high DPI
  const handleDownloadSinglePNG = async () => {
    setIsExportingSingle(true);
    try {
      await ensureFontsLoaded();
      const targetItems = allCategoryItems[activeCategory] || items;
      const targetMetadata: BsiReportMetadata = {
        ...metadata,
        category: activeCategory,
        format: activeFormat,
        highDpiScale: metadata.highDpiScale || 2,
      };

      const [templates, loadedImages] = await Promise.all([
        preloadTemplateAssets(),
        preloadItemImages(targetItems),
      ]);

      const offscreen = document.createElement('canvas');
      await renderCanvasReport({
        canvas: offscreen,
        items: targetItems,
        metadata: targetMetadata,
        loadedImages,
        templateAssets: templates,
        scale: targetMetadata.highDpiScale,
      });

      offscreen.toBlob(
        (blob) => {
          if (blob) {
            const filename = `BSITOP10_${activeCategory}_${activeFormat}_${metadata.month}-${metadata.year}.png`;
            saveAs(blob, filename);
          }
          setIsExportingSingle(false);
        },
        'image/png',
        1.0
      );
    } catch (err) {
      console.error('Download PNG Error:', err);
      setIsExportingSingle(false);
    }
  };

  // Export All 12 Reports ZIP
  const handleDownloadAll12ZIP = async () => {
    setZipProgress({ isExporting: true, current: 0, total: 12, message: 'Bắt đầu kết xuất 12 báo cáo...' });
    try {
      await ensureFontsLoaded();
      await exportAll12ReportsZip(
        metadata,
        items,
        (current, total, message) => {
          setZipProgress({ isExporting: true, current, total, message });
        },
        allCategoryItems
      );
      setZipProgress({ isExporting: false, current: 12, total: 12, message: 'Đã hoàn tất xuất 12 ảnh ZIP!' });
    } catch (err) {
      console.error('ZIP Export Error:', err);
      setZipProgress({ isExporting: false, current: 0, total: 12, message: 'Có lỗi xảy ra khi nén file ZIP.' });
    }
  };

  const currentCategoryItems = allCategoryItems[activeCategory] || items;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Bar Navigation for QC Station */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Bước 3: QC và Xuất Ảnh BSI TOP10
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
            disabled={isExportingSingle}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            {isExportingSingle ? (
              <RefreshCw className="w-4 h-4 animate-spin text-buzz-orange" />
            ) : (
              <Download className="w-4 h-4 text-buzz-orange" />
            )}
            <span>Xuất 1 Ảnh PNG</span>
          </button>

          <button
            onClick={handleDownloadAll12ZIP}
            disabled={zipProgress.isExporting}
            className="px-4 py-2 bg-buzz-orange hover:bg-buzz-orange-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-buzz-orange/20 disabled:opacity-50"
          >
            {zipProgress.isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileArchive className="w-4 h-4" />
            )}
            <span>Xuất Trọn Bộ 12 Ảnh (ZIP)</span>
          </button>
        </div>
      </div>

      {/* ZIP Export Progress Banner */}
      {zipProgress.isExporting && (
        <div className="bg-slate-900/90 border-b border-buzz-orange/40 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-buzz-orange animate-spin" />
            <span className="text-xs font-semibold text-slate-200">
              {zipProgress.message}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-buzz-orange h-full transition-all duration-300"
                style={{ width: `${(zipProgress.current / zipProgress.total) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-buzz-orange">
              {zipProgress.current}/{zipProgress.total}
            </span>
          </div>
        </div>
      )}

      {/* QC Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Compact Controls & Highlighted Live Data Inspector Panel */}
        <div className="w-[440px] bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col gap-3 shrink-0">
          
          {/* Compact Category & Format Controls */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 shrink-0">
            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 w-16">
                Hạng Mục:
              </span>
              <div className="flex-1 grid grid-cols-4 gap-1">
                {(['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'] as CategoryType[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`py-1 px-1.5 rounded text-[11px] font-bold transition border text-center whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-buzz-orange text-white border-buzz-orange shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cat === 'INFLUENCERS' ? 'CELEBS' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 w-16">
                Định Dạng:
              </span>
              <div className="flex-1 grid grid-cols-3 gap-1">
                {[
                  { id: 'CHART', label: '1. Chart' },
                  { id: 'TABLE', label: '2. Table' },
                  { id: 'COMBINATION', label: '3. Combo' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => handleFormatChange(id as FormatType)}
                    className={`py-1 px-2 rounded text-[11px] font-bold transition border text-center ${
                      activeFormat === id
                        ? 'bg-slate-800 text-buzz-orange border-buzz-orange ring-1 ring-buzz-orange'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HIGHLIGHTED LIVE DATA TABLE INSPECTOR */}
          <div className="flex-1 flex flex-col space-y-2 min-h-0 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-buzz-orange" />
                Bảng Data Kiểm Tra Số Liệu ({activeCategory})
              </h3>
            </div>

            {/* Scrollable Data Table */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 min-w-[130px]">Tên đối tượng</th>
                    <th className="py-2 px-2 text-right text-buzz-orange">BSI</th>
                    <th className="py-2 px-2 text-right text-sky-400">CFQU</th>
                    <th className="py-2 px-2 text-center w-12">Avatar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
                  {currentCategoryItems.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition">
                      <td className="py-2 px-2 text-center">
                        <span className="w-5 h-5 rounded-full bg-buzz-orange/20 text-buzz-orange font-bold text-[10px] inline-flex items-center justify-center border border-buzz-orange/40">
                          {item.rank}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="font-bold text-white leading-tight text-[11px] max-w-[160px] truncate" title={item.name}>
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
                onClick={() => setZoomScale((z) => Math.max(0.15, z - 0.05))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-buzz-orange font-bold px-1 min-w-[45px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((z) => Math.min(1.0, z + 0.05))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleAutoFit}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition border-l border-slate-800 ml-1 pl-2"
                title="Vừa màn hình (Auto Fit)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center High-Res Canvas Viewport with Drag/Pan */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex-1 bg-slate-950 p-8 flex items-center justify-center overflow-auto relative select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {isRendering && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-20 pointer-events-none">
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl shadow-2xl">
                <RefreshCw className="w-5 h-5 text-buzz-orange animate-spin" />
                <span className="text-xs font-bold text-white">Đang Render Hình Ảnh 4K QC...</span>
              </div>
            </div>
          )}

          <div
            className="shadow-2xl rounded-2xl transition-transform duration-200 ease-out border border-slate-700/60 overflow-hidden shrink-0 bg-white"
            style={{
              width: baseWidth * zoomScale,
              height: baseHeight * zoomScale,
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain block"
              style={{
                width: `${baseWidth}px`,
                height: `${baseHeight}px`,
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
