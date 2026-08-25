import React, { useState } from 'react';
import { BsiItem } from '../../types/bsi';
import { UploadCloud, Image as ImageIcon, Crop, Trash2 } from 'lucide-react';
import { ImageCropperModal } from '../cropper/ImageCropperModal';
import { saveAvatarToCache } from '../../utils/avatarCache';

interface BulkImageUploadProps {
  items: BsiItem[];
  setItems: React.Dispatch<React.SetStateAction<BsiItem[]>>;
}

export const BulkImageUpload: React.FC<BulkImageUploadProps> = ({ items, setItems }) => {
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

  const [isDragOver, setIsDragOver] = useState(false);

  // Handle Drag & Drop of multiple image files
  const handleFilesDropped = (files: FileList) => {
    const updated = [...items];
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));

    imageFiles.forEach((file, idx) => {
      if (idx < 10 && updated[idx]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const dataUrl = e.target.result as string;
            updated[idx] = {
              ...updated[idx],
              croppedImageData: dataUrl,
            };
            setItems([...updated]);

            // Save to avatar cache
            if (updated[idx].name) {
              saveAvatarToCache(updated[idx].name, dataUrl);
            }
            if (updated[idx].brandName) {
              saveAvatarToCache(updated[idx].brandName, dataUrl);
            }

            // Automatically open cropper modal for the first uploaded file immediately
            if (idx === 0) {
              setCropperState({
                isOpen: true,
                imageSrc: dataUrl,
                rankIndex: idx,
                rankName: `Top ${updated[idx].rank} - ${updated[idx].name}`,
              });
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleOpenCropper = (index: number) => {
    const item = items[index];
    const src = item.croppedImageData || item.imageUrl;
    if (src) {
      setCropperState({
        isOpen: true,
        imageSrc: src,
        rankIndex: index,
        rankName: `Top ${item.rank} - ${item.name}`,
      });
    }
  };

  const handleApplyCrop = (croppedBase64: string) => {
    const updated = [...items];
    const targetItem = updated[cropperState.rankIndex];

    if (targetItem) {
      targetItem.croppedImageData = croppedBase64;
      if (targetItem.name) {
        saveAvatarToCache(targetItem.name, croppedBase64);
      }
      if (targetItem.brandName) {
        saveAvatarToCache(targetItem.brandName, croppedBase64);
      }
    }
    setItems(updated);
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      imageUrl: undefined,
      croppedImageData: undefined,
    };
    setItems(updated);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) {
            handleFilesDropped(e.dataTransfer.files);
          }
        }}
        className={`p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition cursor-pointer ${
          isDragOver
            ? 'border-buzz-orange bg-buzz-orange/10'
            : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
        }`}
      >
        <UploadCloud className="w-8 h-8 text-buzz-orange mb-2 animate-bounce" />
        <p className="text-xs font-bold text-slate-200">
          Kéo thả đồng thời 10 hình ảnh / logo vào đây
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Hệ thống sẽ tự động gán lần lượt từ Top 1 đến Top 10 và mở ngay trình Crop & Scale
        </p>

        <label className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer transition">
          <span>Chọn file ảnh</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFilesDropped(e.target.files);
              }
            }}
          />
        </label>
      </div>

      {/* Grid of 10 Image Slots */}
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {items.slice(0, 10).map((item, idx) => {
          const hasImg = item.croppedImageData || item.imageUrl;

          return (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-5 h-5 rounded-full bg-buzz-orange/20 text-buzz-orange font-bold text-[10px] flex items-center justify-center shrink-0 border border-buzz-orange/40">
                  {item.rank}
                </span>

                {hasImg ? (
                  <img
                    src={item.croppedImageData || item.imageUrl}
                    alt={item.name}
                    className="w-8 h-8 rounded-full object-cover border border-buzz-orange shrink-0 cursor-pointer hover:opacity-80 transition"
                    onClick={() => handleOpenCropper(idx)}
                    title="Click để Crop & Scale ảnh"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}

                <span className="text-xs font-semibold text-slate-300 truncate">
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {hasImg ? (
                  <>
                    <button
                      onClick={() => handleOpenCropper(idx)}
                      className="px-2 py-1 rounded bg-buzz-orange/20 hover:bg-buzz-orange/30 text-buzz-orange border border-buzz-orange/40 text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                      title="Chỉnh sửa vị trí & phóng to thu nhỏ ảnh"
                    >
                      <Crop className="w-3 h-3" />
                      <span>Crop & Scale</span>
                    </button>
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 rounded hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition">
                    <ImageIcon className="w-3.5 h-3.5 text-buzz-orange" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              const dataUrl = ev.target.result as string;
                              const updated = [...items];
                              updated[idx] = {
                                ...updated[idx],
                                croppedImageData: dataUrl,
                              };
                              setItems(updated);
                              setCropperState({
                                isOpen: true,
                                imageSrc: dataUrl,
                                rankIndex: idx,
                                rankName: `Top ${items[idx].rank} - ${items[idx].name}`,
                              });
                            }
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
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
