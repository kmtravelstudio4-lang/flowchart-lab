import React from 'react';
import { Timer, Clock, Pause, Play, Award, HelpCircle } from 'lucide-react';
import { formatTimeMMSS, TIMER_STATES } from '../../engine/gameEngine.js';

export default function GameHeader({
  stageNumber = 1,
  totalStages = 8,
  title = '',
  subtitle = '',
  timeRemaining = 0,
  timerState = TIMER_STATES.RUNNING,
  onTogglePause = null,
  onOpenHelp = null
}) {
  const isTimeLow = timeRemaining <= 30 && timeRemaining > 0;
  const isTimeCritical = timeRemaining <= 10 && timeRemaining > 0;
  const isTimeUp = timerState === TIMER_STATES.TIME_UP || timeRemaining <= 0;
  const isPaused = timerState === TIMER_STATES.PAUSED;

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm mb-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Stage Title & Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
            {stageNumber}/{totalStages}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ด่านที่ {stageNumber} จาก {totalStages}
              </span>
              {isPaused && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  ⏸ พักเวลาชั่วคราว
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight mt-0.5">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* Timer Display */}
          <div
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border font-black text-sm transition-all ${
              isTimeUp
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : isTimeCritical
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-bounce'
                : isTimeLow
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical || isTimeUp ? 'text-rose-600' : 'text-blue-600'}`} />
            <span className="font-mono text-base tracking-wider">
              {isTimeUp ? '00:00 (หมดเวลา)' : formatTimeMMSS(timeRemaining)}
            </span>
          </div>

          {/* Pause / Resume Button */}
          {onTogglePause && timerState !== TIMER_STATES.TIME_UP && timerState !== TIMER_STATES.COMPLETED && (
            <button
              type="button"
              onClick={onTogglePause}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition active:scale-95"
              title={isPaused ? 'เริ่มจับเวลาต่อ' : 'พักเวลาชั่วคราว'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {/* Help Button */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition active:scale-95"
              title="ดูคำแนะนำภารกิจ"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
