import React, { useEffect } from 'react';
import { 
  BookOpen, 
  Database, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Lightbulb, 
  CheckCircle2,
  Crop,
  X,
  FileArchive,
  WrapText
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-buzz-orange to-amber-500 flex items-center justify-center shadow-md shadow-buzz-orange/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Hướng Dẫn Sử Dụng BSI Top10 Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-buzz-orange/20 text-buzz-orange font-mono font-bold border border-buzz-orange/30">
                  Ver 2026
                </span>
              </h2>
              <p className="text-xs text-slate-400">Quy trình 3 bước tự động hóa đồ họa và các mẹo thao tác nhanh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200 text-xs">
          {/* SECTION 1: QUY TRÌNH 3 BƯỚC RÚT GỌN */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-buzz-lightOrange flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-buzz-orange" />
              Quy Trình 3 Bước Thực Hiện
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Bước 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-buzz-orange/20 text-buzz-orange border border-buzz-orange/30 uppercase">
                    Bước 1
                  </span>
                  <Database className="w-4 h-4 text-buzz-orange" />
                </div>
                <h4 className="font-bold text-white text-xs">1. Nhập Liệu Data</h4>
                <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                    <span>Dán link Google Sheet & bấm <strong>Đồng Bộ Live</strong> (4 tab).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                    <span>Upload file Excel mẫu hoặc tải 10 logo cùng lúc.</span>
                  </li>
                </ul>
              </div>

              {/* Bước 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-buzz-orange/20 text-buzz-orange border border-buzz-orange/30 uppercase">
                    Bước 2
                  </span>
                  <Sparkles className="w-4 h-4 text-buzz-orange" />
                </div>
                <h4 className="font-bold text-white text-xs">2. Graphic Studio</h4>
                <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                    <span>Chọn format: <strong>Chart</strong>, <strong>Table</strong> hoặc <strong>Combo</strong>.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                    <span>Dùng <code className="bg-slate-900 px-1 py-0.5 rounded text-buzz-lightOrange font-mono font-bold">||</code> hoặc phím <code className="bg-slate-900 px-1 py-0.5 rounded text-buzz-lightOrange font-mono font-bold">Enter</code> để xuống dòng tên.</span>
                  </li>
                </ul>
              </div>

              {/* Bước 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    Bước 3
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-bold text-white text-xs">3. QC & Xuất Báo Cáo</h4>
                <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Đối chiếu bảng số liệu Data thực tế với ảnh render 4K.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tải <strong>1 ảnh PNG</strong> hoặc xuất trọn bộ <strong>12 ảnh (ZIP)</strong>.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION 2: MẸO HAY & LƯU Ý QUAN TRỌNG */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Mẹo Hay Thao Tác Nhanh
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Tip 1: Ngắt dòng */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-buzz-orange/10 border border-buzz-orange/30 text-buzz-orange shrink-0">
                  <WrapText className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-xs">Xuống Dòng Tên Bằng Ký Tự ||</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Nhập <code className="bg-slate-900 px-1 py-0.5 rounded text-buzz-lightOrange font-mono font-bold">||</code> (ví dụ: <code className="text-slate-400">Đêm Nhạc || Vượt Ngàn || Chông Gai</code>) hoặc gõ phím <code className="font-mono text-buzz-lightOrange">Enter</code> để chủ động ngắt dòng hiển thị cân đối trên Canvas.
                  </p>
                </div>
              </div>

              {/* Tip 2: Crop logo */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Crop className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-xs">Tự Động Crop & Ghi Nhớ Logo</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Kéo thả logo để crop tròn và chỉnh zoom. Hệ thống tự động ghi nhớ avatar theo tên đối tượng để tái sử dụng cho các tháng sau mà không cần tải lại.
                  </p>
                </div>
              </div>

              {/* Tip 3: Chuẩn Google Sheet */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-xs">Chuẩn 4 Tab Google Sheet</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Đặt link Google Sheet ở chế độ Public và có đủ 4 tab: <code className="text-sky-300">QU Campaigns</code>, <code className="text-sky-300">QU Celebs</code>, <code className="text-sky-300">QU Events</code>, <code className="text-sky-300">QU Shows</code>.
                  </p>
                </div>
              </div>

              {/* Tip 4: Xuất 12 ảnh */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                  <FileArchive className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-xs">Xuất 12 Báo Cáo ZIP Siêu Tốc</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tại trạm QC, bấm <strong>Xuất Trọn Bộ 12 Ảnh (ZIP)</strong> để tự động kết xuất toàn bộ 4 hạng mục x 3 format với độ phân giải cao 4K.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Esc</kbd> hoặc nút Đóng để thoát</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-buzz-orange hover:bg-buzz-orange-dark text-white rounded-xl text-xs font-bold transition shadow-md shadow-buzz-orange/20"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
