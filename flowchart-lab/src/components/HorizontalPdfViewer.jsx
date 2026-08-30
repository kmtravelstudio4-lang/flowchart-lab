// Flowchart Quest - Horizontal Google Drive PDF & Slide Presentation Viewer
import React, { useState } from 'react';
import { ExternalLink, RotateCw, BookOpen, Sparkles, RefreshCw, AlertTriangle, Eye } from 'lucide-react';
import { formatEmbedPdfUrl, extractGoogleFileId } from '../utils/pdfHelper';

export default function HorizontalPdfViewer({
  pdfUrl,
  title = 'เอกสารประกอบการสอน',
  chapterNum = 1,
  onOpenAdmin = null
}) {
  const [strategyIndex, setStrategyIndex] = useState(0); // 0: preview, 1: viewer, 2: gview
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const embedUrl = formatEmbedPdfUrl(pdfUrl, strategyIndex);
  const fileId = extractGoogleFileId(pdfUrl);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleSwitchStrategy = () => {
    setIsLoading(true);
    setStrategyIndex(prev => (prev + 1) % 3);
    setIframeKey(prev => prev + 1);
  };

  const handleOpenNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!pdfUrl || !embedUrl) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-3xl p-8 border-2 border-dashed border-blue-200 text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center text-2xl shadow-inner">
          📄
        </div>
        <div>
          <h4 className="font-black text-slate-800 text-base">ยังไม่มีเอกสาร PDF / สไลด์จาก Google Drive สำหรับบทนี้</h4>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
            คุณครูผู้สอนสามารถใส่ลิงก์ Google Drive PDF ของบทเรียนนี้ได้ในแผงจัดการบทเรียน (Admin Panel)
          </p>
        </div>

        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition action-btn-hover"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ไปที่หน้าแอดมินเพื่อใส่ลิงก์ Google Drive</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Viewer Header Controls */}
      <div className="glass-panel rounded-2xl px-4 py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border border-blue-100">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            PDF
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                สไลด์เอกสารแนวนอน (Google Drive Presentation)
              </h4>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.2 rounded-full border border-rose-200 shrink-0">
                บทที่ {chapterNum}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {title} • เลื่อนดูหน้าสไลด์แนวนอนได้โดยตรง
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
          {/* Switch Embed Server Strategy Button */}
          <button
            type="button"
            onClick={handleSwitchStrategy}
            title="สลับโหมดการแสดงผลกรณีหน้าจอขาว (Switch Embed Engine)"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden lg:inline">สลับโหมดแสดงผล (โหมด {strategyIndex + 1})</span>
          </button>

          <button
            type="button"
            onClick={handleReload}
            title="โหลดเอกสารใหม่ (Reload PDF)"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            title="เปิดดูใน Google Drive หรือแท็บใหม่ (Open in Fullscreen Tab)"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-xs transition flex items-center space-x-1.5 action-btn-hover"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดเต็มจอใน Google Drive</span>
          </button>
        </div>
      </div>

      {/* Landscape / Horizontal Iframe Viewport Container */}
      <div className="relative w-full rounded-3xl bg-slate-950 border-2 border-slate-800/80 shadow-2xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] min-h-[480px] sm:min-h-[580px] max-h-[750px]">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 text-white">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <div className="font-black text-sm text-blue-200">กำลังโหลดเอกสาร Google Drive PDF...</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">กรุณารอสักครู่ ระบบกำลังดึงไฟล์สไลด์แนวนอน</div>
            </div>
          </div>
        )}

        {/* Embedded Google Drive Preview Iframe */}
        <iframe
          key={iframeKey}
          src={embedUrl}
          title={`Google Drive PDF - ${title}`}
          className="w-full h-full border-0 bg-white"
          allow="autoplay; encrypted-media; fullscreen"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}

