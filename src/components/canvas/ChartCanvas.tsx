import React, { useEffect, useRef, useState } from 'react';
import { BsiItem, BsiReportMetadata, CategoryType, FormatType } from '../../types/bsi';
import { preloadItemImages, preloadTemplateAssets, renderCanvasReport, ensureFontsLoaded } from '../../utils/canvasRenderer';
import { exportAll12ReportsZip } from '../../utils/zipExporter';
import { Download, RefreshCw, ZoomIn, ZoomOut, Maximize2, Archive, BarChart3, Table, Layers, SlidersHorizontal, Lightbulb } from 'lucide-react';
import { saveAs } from 'file-saver';

interface ChartCanvasProps {
  items: BsiItem[];
  metadata: BsiReportMetadata;
  setMetadata?: React.Dispatch<React.SetStateAction<BsiReportMetadata>>;
  categoryDataStore?: Record<CategoryType, BsiItem[]>;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  items,
  metadata,
  setMetadata,
  categoryDataStore,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, HTMLImageElement>>({});
  const [templateAssets, setTemplateAssets] = useState<Record<string, HTMLImageElement>>({});
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(0.4);
  const [isExportingSingle, setIsExportingSingle] = useState<boolean>(false);

  // Bulk ZIP export state
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

  // Load fonts, template PNGs, and avatar images
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAssets(true);

    const loadAssets = async () => {
      try {
        await ensureFontsLoaded();
        const templates = await preloadTemplateAssets();
        const avatars = await preloadItemImages(items);

        if (isMounted) {
          setTemplateAssets(templates);
          setLoadedImages(avatars);
          setIsLoadingAssets(false);
        }
      } catch (err) {
        console.error('Failed loading canvas assets:', err);
        if (isMounted) setIsLoadingAssets(false);
      }
    };

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, [items, metadata.category, metadata.format]);

  // Re-render canvas report on data/metadata/asset change
  useEffect(() => {
    if (canvasRef.current) {
      renderCanvasReport({
        canvas: canvasRef.current,
        items,
        metadata,
        loadedImages,
        templateAssets,
        scale: metadata.highDpiScale || 2,
      });
    }
  }, [items, metadata, loadedImages, templateAssets]);

  // Mouse Drag / Pan State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Adjust zoom auto-fit container (fits both width & height)
  const handleAutoFit = () => {
    if (containerRef.current) {
      const padding = 64;
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
  }, [metadata.canvasResolution, metadata.format]);

  // Mouse Handlers for Drag & Pan Preview
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

  // Export Single PNG
  const exportSinglePng = async () => {
    setIsExportingSingle(true);

    try {
      await ensureFontsLoaded();
      const offscreen = document.createElement('canvas');
      renderCanvasReport({
        canvas: offscreen,
        items,
        metadata,
        loadedImages,
        templateAssets,
        scale: metadata.highDpiScale || 2,
      });

      offscreen.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `BSI_TOP10_${metadata.category}_${metadata.format}_THANG_${metadata.month}_${metadata.year}.png`;
            saveAs(blob, fileName);
          }
          setIsExportingSingle(false);
        },
        'image/png',
        1.0
      );
    } catch (error) {
      console.error('Failed to export PNG:', error);
      setIsExportingSingle(false);
    }
  };

  // Export All 12 Reports ZIP
  const exportAllZip = async () => {
    setZipProgress({ isExporting: true, current: 0, total: 12, message: 'Bắt đầu xuất 12 báo cáo...' });

    try {
      await ensureFontsLoaded();
      await exportAll12ReportsZip(
        metadata,
        items,
        (current, total, message) => {
          setZipProgress({ isExporting: true, current, total, message });
        },
        categoryDataStore
      );

      setZipProgress({
        isExporting: false,
        current: 12,
        total: 12,
        message: 'Hoàn tất xuất 12 ảnh ZIP!',
      });
    } catch (error) {
      console.error('Failed exporting 12 zip reports:', error);
      setZipProgress({
        isExporting: false,
        current: 0,
        total: 12,
        message: 'Có lỗi xảy ra khi nén file ZIP.',
      });
    }
  };

  const baseWidth = metadata.format === 'TABLE' ? 4000 : 3000;
  const baseHeight = metadata.format === 'COMBINATION' ? 2400 : (metadata.format === 'TABLE' ? 2099 : 2000);

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Sleek Floating Graphic Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Sidebar Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isSidebarOpen
                  ? 'bg-buzz-orange text-white border-buzz-orange shadow-md shadow-buzz-orange/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
              title={isSidebarOpen ? 'Ẩn Side Panel Chỉnh Sửa' : 'Hiện Side Panel Chỉnh Sửa'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isSidebarOpen ? 'Ẩn Sidebar' : 'Hiện Sidebar Edit'}</span>
            </button>
          )}
          {/* Format Selector */}
          {setMetadata && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'CHART', label: '1. Chart', icon: BarChart3 },
                { id: 'TABLE', label: '2. Table', icon: Table },
                { id: 'COMBINATION', label: '3. Combo', icon: Layers },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMetadata((prev) => ({ ...prev, format: id as FormatType }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    metadata.format === id
                      ? 'bg-buzz-orange text-white shadow-md shadow-buzz-orange/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Category Selector */}
          {setMetadata && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMetadata((prev) => ({ ...prev, category: cat }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    metadata.category === cat
                      ? 'bg-slate-800 text-buzz-lightOrange border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'INFLUENCERS' ? 'CELEBS' : cat}
                </button>
              ))}
            </div>
          )}

          <span className="text-xs text-slate-400 font-medium hidden lg:inline">
            {baseWidth} x {baseHeight} px (Tháng {metadata.month}/{metadata.year})
          </span>

          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Mẹo: Gõ <strong className="font-mono text-amber-200">||</strong> hoặc <strong className="font-mono text-amber-200">Enter</strong> để ngắt dòng</span>
          </span>

          {isLoadingAssets && (
            <span className="flex items-center text-xs text-amber-400 gap-1.5 font-medium animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading assets...
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setZoomScale((prev) => Math.max(prev - 0.05, 0.15))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 min-w-[45px] text-center text-slate-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((prev) => Math.min(prev + 0.05, 1.0))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleAutoFit}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition border-l border-slate-800 ml-1 pl-2"
              title="Auto Fit Window"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ZIP Export Progress Banner */}
      {zipProgress.isExporting && (
        <div className="bg-slate-900/90 border-b border-buzz-orange/40 px-6 py-2.5 flex items-center justify-between">
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

      {/* Main Canvas Scroll View with Click-and-Drag Panning */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex-1 overflow-auto p-8 flex items-center justify-center bg-slate-950/60 relative select-none ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          className="shadow-2xl rounded-2xl transition-transform duration-200 ease-out border border-slate-700/50 overflow-hidden shrink-0"
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
  );
};
