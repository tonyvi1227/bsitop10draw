import React from 'react';
import { 
  BookOpen, 
  Database, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  FileSpreadsheet, 
  UploadCloud, 
  Layers, 
  Lightbulb, 
  CheckCircle2,
  Crop,
  FileArchive,
  ArrowRightLeft
} from 'lucide-react';

interface UserGuideProps {
  onNavigateToTab?: (tab: 'DATA_STUDIO' | 'GRAPHIC_STUDIO' | 'QC_STUDIO') => void;
}

export const UserGuide: React.FC<UserGuideProps> = () => {
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto select-none">
      {/* Top Banner Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-5 shrink-0 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-buzz-orange to-amber-500 flex items-center justify-center shadow-lg shadow-buzz-orange/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2.5">
                Hướng Dẫn Sử Dụng & Mẹo Vặt (User Guide & Tips)
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-buzz-orange/20 text-buzz-orange font-mono font-extrabold border border-buzz-orange/30">
                  Ver 2026.2
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Quy trình tự động hóa đồ họa BSI Top10 rút gọn trong 1 trang duy nhất
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single Page Content Container */}
      <div className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-10">
        
        {/* SECTION 1: USER GUIDE (QUY TRÌNH 4 BƯỚC) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-buzz-orange" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              1. User Guide - Quy Trình 4 Bước Thực Hiện
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-buzz-orange/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-buzz-orange/20 text-buzz-orange border border-buzz-orange/30 uppercase">
                  Bước 1
                </span>
                <Database className="w-5 h-5 text-buzz-orange" />
              </div>
              <h3 className="font-bold text-sm text-white">1. Nhập Liệu Data</h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                  <span>Dán link Google Sheet và bấm <strong>Đồng Bộ Live</strong> (4 Tab).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                  <span>Hoặc upload file Excel Template 4 sheet (.xlsx).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                  <span>Upload 10 logo cùng lúc hoặc upload từng dòng.</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-buzz-orange/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-buzz-orange/20 text-buzz-orange border border-buzz-orange/30 uppercase">
                  Bước 2
                </span>
                <Sparkles className="w-5 h-5 text-buzz-orange" />
              </div>
              <h3 className="font-bold text-sm text-white">2. Graphic Studio</h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                  <span>Chọn định dạng thiết kế: <strong>Chart</strong>, <strong>Table</strong>, hoặc <strong>Combo</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                  <span>Nhấn phím <code>Enter</code> tại ô tên để ngắt dòng trực tiếp.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-buzz-orange shrink-0 mt-0.5" />
                  <span>Canvas tự động căn giữa và co cột thông minh.</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Bước 3
                </span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-sm text-white">3. Quality Control</h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Đối chiếu bảng số liệu Data Live cạnh ảnh render 4K.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hệ thống Auto-QC tự động kiểm tra Rank & thứ tự BSI.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Cảnh báo tên quá dài hoặc thiếu ảnh logo.</span>
                </li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-sky-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase">
                  Bước 4
                </span>
                <Download className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="font-bold text-sm text-white">4. Xuất Báo Cáo</h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>Tải ảnh đơn lẻ dạng <strong>PNG (4K High-DPI)</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>Xuất trọn bộ <strong>12 Báo Cáo ZIP</strong> (4 Hạng mục × 3 Format).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>Nén tự động siêu tốc chỉ trong vài giây.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: TIPS TO USE (MẸO HAY VÀ LƯU Ý QUAN TRỌNG) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              2. Tips to Use - Mẹo Hay & Lưu Ý Quan Trọng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tip 1 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-buzz-lightOrange">
                <Crop className="w-4 h-4 text-buzz-orange shrink-0" />
                <span>Trình Crop & Scale Ảnh Tròn Tự Động</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ngay sau khi chọn file ảnh, trình Crop & Scale sẽ tự mở. Bạn có thể kéo thả để di chuyển vị trí và chỉnh thanh trượt zoom để chọn góc ảnh đẹp nhất.
              </p>
            </div>

            {/* Tip 2 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-buzz-lightOrange">
                <Layers className="w-4 h-4 text-buzz-orange shrink-0" />
                <span>Ngắt Dòng Bằng Phím Enter</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gõ phím <code>Enter</code> trực tiếp tại ô tên (ví dụ: <code>Khởi Đầu [Enter] Dịu Nhẹ</code>) để ngắt dòng chủ động. Hệ thống sẽ tự giãn dòng đều đẹp và không bị đè chữ.
              </p>
            </div>

            {/* Tip 3 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Chuẩn Format Google Sheet (4 Tab)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đảm bảo file Google Sheet để chế độ xem công khai và có đủ 4 tab: <code>QU Campaigns</code>, <code>QU Celebs</code>, <code>QU Events</code>, <code>QU Shows</code>.
              </p>
            </div>

            {/* Tip 4 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <UploadCloud className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Upload 10 Logo Hàng Loạt</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kéo thả đồng thời 10 file ảnh logo vào khung Bulk Upload. Hệ thống sẽ tự động gán lần lượt theo thứ tự từ Rank 1 đến Rank 10.
              </p>
            </div>

            {/* Tip 5 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Màu Nét Trendline & Đồ Họa</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đường linechart ở dạng Combo sử dụng độ dày 6pt đậm nét và chuẩn mã màu cam <code>#e68228</code> với các nút data node hình tròn cam nổi bật.
              </p>
            </div>

            {/* Tip 6 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-buzz-orange">
                <FileArchive className="w-4 h-4 text-buzz-orange shrink-0" />
                <span>Xuất File Nén ZIP 12 Báo Cáo</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tại Trạm QC, bấm nút <strong>Xuất Trọn Bộ 12 Ảnh ZIP</strong> để tải file nén sẵn 12 ảnh 4K cho toàn bộ tháng báo cáo một cách nhanh chóng.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
