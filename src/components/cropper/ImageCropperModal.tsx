import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';
import { BUZZ_COLORS } from '../../constants/branding';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  targetRankName: string;
  onClose: () => void;
  onApplyCrop: (croppedBase64: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  targetRankName,
  onClose,
  onApplyCrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image when imageSrc changes
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImgObj(img);
        setScale(1);
        setOffsetX(0);
        setOffsetY(0);
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // Render crop preview canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !imgObj) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Clear background
    ctx.clearRect(0, 0, size, size);

    ctx.save();

    // Dark background mask around circle
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, size, size);

    // Circular Clip Path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.clip();

    // Background inside circle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Compute scaled dimensions & draw centered image
    const minDim = Math.min(imgObj.width, imgObj.height);
    const drawW = (imgObj.width / minDim) * size * scale;
    const drawH = (imgObj.height / minDim) * size * scale;

    const posX = (size - drawW) / 2 + offsetX;
    const posY = (size - drawH) / 2 + offsetY;

    ctx.drawImage(imgObj, posX, posY, drawW, drawH);
    ctx.restore();

    // Outer Orange Circle Ring Guide
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.strokeStyle = BUZZ_COLORS.primaryOrange;
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [isOpen, imgObj, scale, offsetX, offsetY]);

  if (!isOpen || !imageSrc) return null;

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate High-Res Cropped Circular Image
  const handleSave = () => {
    if (!imgObj) return;

    const exportSize = 300;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Clip Circle
    ctx.beginPath();
    ctx.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill white bg
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    // Draw Image
    const minDim = Math.min(imgObj.width, imgObj.height);
    const drawW = (imgObj.width / minDim) * exportSize * scale;
    const drawH = (imgObj.height / minDim) * exportSize * scale;

    const posX = (exportSize - drawW) / 2 + offsetX;
    const posY = (exportSize - drawH) / 2 + offsetY;

    ctx.drawImage(imgObj, posX, posY, drawW, drawH);

    const croppedUrl = exportCanvas.toDataURL('image/png', 1.0);
    onApplyCrop(croppedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Chỉnh sửa Crop ảnh tròn</h3>
            <p className="text-xs text-slate-400 font-medium">{targetRankName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/60">
          <div
            className="relative cursor-move rounded-full overflow-hidden shadow-2xl border-2 border-slate-700 hover:border-buzz-orange transition"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="block w-[280px] h-[280px]" />
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Kéo thả chuột trên khung tròn để di chuyển vị trí ảnh
          </p>
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 bg-slate-900 border-t border-slate-800">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-buzz-orange cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300 w-10 text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                setScale(1);
                setOffsetX(0);
                setOffsetY(0);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-buzz-orange hover:bg-amber-600 text-white text-xs font-bold shadow-lg shadow-buzz-orange/20 flex items-center gap-1.5 transition transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
