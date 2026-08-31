import React from 'react';
import { Award, CheckCircle, Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { formatTimeMMSS } from '../../engine/gameEngine.js';

export default function GameResultModal({
  isOpen = false,
  stageTitle = 'ภารกิจเสร็จสิ้น',
  stageNumber = 1,
  elapsedSeconds = 0,
  attemptCount = 1,
  correctCount = 1,
  status = 'completed',
  onNextStage = () => {},
  isLastStage = false
}) {
  if (!isOpen) return null;

  const isTimeUp = status === 'time_up';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5 animate-scaleUp">
        {/* Header Icon */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-4xl shadow-lg mb-2">
            🏆
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTimeUp ? '⏰ ภารกิจสิ้นสุดตามเวลา' : `🎯 ด่านที่ ${stageNumber} สำเร็จสมบูรณ์`}</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-black text-slate-800">
            {stageTitle}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isTimeUp
              ? 'คุณได้เรียนรู้และพยายามทำกิจกรรมอย่างเต็มที่ สามารถเดินทางสู่ด่านถัดไปได้ทันที'
              : 'ยอดเยี่ยมมาก! คุณได้ทำภารกิจและเก็บเกี่ยวหลักการคิดเชิงคำนวณผ่านผังงานเรียบร้อยแล้ว'}
          </p>
        </div>

        {/* Learning Evidence Cards (No Total Scores, Pure Learning Metric) */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left">
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" /> เวลาที่ใช้
            </span>
            <span className="text-sm font-black text-slate-800 font-mono mt-0.5 block">
              {formatTimeMMSS(elapsedSeconds)}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-500" /> พยายาม
            </span>
            <span className="text-sm font-black text-slate-800 mt-0.5 block">
              {attemptCount} ครั้ง
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> ตอบถูก
            </span>
            <span className="text-sm font-black text-emerald-600 mt-0.5 block">
              {correctCount} ด่าน
            </span>
          </div>
        </div>

        {/* Next Stage Button */}
        <button
          type="button"
          onClick={onNextStage}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition text-sm flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
        >
          <span>{isLastStage ? 'รับเกียรติบัตรและสรุปผล 🎓' : 'ไปต่อด่านถัดไป →'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
