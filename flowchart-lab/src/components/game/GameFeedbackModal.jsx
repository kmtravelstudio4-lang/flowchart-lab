import React from 'react';
import { CheckCircle2, Lightbulb, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

export default function GameFeedbackModal({
  isOpen = false,
  isCorrect = false,
  title = '',
  message = '',
  attemptNumber = 1,
  onContinue = () => {},
  onRetry = null,
  isSubmitting = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5 animate-scaleUp">
        {/* Icon & Badge */}
        <div className="flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-md mb-3 border ${
              isCorrect
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            {isCorrect ? <CheckCircle2 className="w-9 h-9 text-emerald-600" /> : <Lightbulb className="w-9 h-9 text-amber-600" />}
          </div>

          <span
            className={`text-xs font-black px-3 py-1 rounded-full border ${
              isCorrect
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {isCorrect ? '✨ ยอดเยี่ยมมาก!' : `💡 บันทึกการเรียนรู้ (ครั้งที่ ${attemptNumber})`}
          </span>
        </div>

        {/* Title & Explanation */}
        <div>
          <h3 className="text-xl font-black text-slate-800">
            {title || (isCorrect ? 'ถูกต้องแล้วครับ!' : 'เรียนรู้จากคำตอบนี้')}
          </h3>
          <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onRetry}
              className="w-full sm:w-1/2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ลองทำใหม่อีกครั้ง</span>
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onContinue}
            className={`w-full ${onRetry ? 'sm:w-1/2' : 'w-full'} px-5 py-3.5 rounded-2xl font-black text-sm text-white shadow-md transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer disabled:opacity-50 ${
              isCorrect
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            <span>ไปต่อภารกิจถัดไป</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
