// Flowchart Quest - Comprehensive Student Profile & Learning Timeline Modal

import React from 'react';
import { 
  X, GraduationCap, Trophy, Sparkles, 
  Clock, AlertCircle, Printer, TrendingUp
} from 'lucide-react';
import { classifyStudentRisk } from '../utils/analytics';

export default function StudentProfileModal({ student, onClose }) {
  if (!student) return null;

  const risk = classifyStudentRisk(student);
  const total = student.totalScore || 0;
  const isPassed = student.isPassed !== undefined ? student.isPassed : (total >= 60);

  // 9-Stage Progress Timeline items
  const timelineStages = [
    { label: '1. Pre-Test', score: `${student.preScore !== undefined ? student.preScore : '-'}/10`, isDone: student.preScore !== null },
    { label: '2. บทเรียนผังงาน', score: 'สำเร็จ', isDone: true },
    { label: '3. M1: สัญลักษณ์', score: `${student.m1 || 0}/15`, isDone: (student.m1 || 0) > 0 },
    { label: '4. M2: ลำดับขั้นตอน', score: `${student.m2 || 0}/15`, isDone: (student.m2 || 0) > 0 },
    { label: '5. M3: อ่านผังงาน', score: `${student.m3 || 0}/15`, isDone: (student.m3 || 0) > 0 },
    { label: '6. M4: นักสืบ Bug', score: `${student.m4 || 0}/20`, isDone: (student.m4 || 0) > 0 },
    { label: '7. Final: ออกแบบผัง', score: `${student.m5 || 0}/35`, isDone: (student.m5 || 0) > 0 },
    { label: '8. Post-Test', score: `${student.postScore !== undefined ? student.postScore : '-'}/10`, isDone: student.postScore !== null },
    { label: '9. เกียรติบัตร', score: isPassed ? 'ผ่านเกณฑ์' : 'รอปรับปรุง', isDone: true }
  ];

  const completedCount = timelineStages.filter(s => s.isDone).length;
  const progressPercent = Math.round((completedCount / timelineStages.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
              {student.name ? student.name.charAt(0) : '👤'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {student.name}
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                  ห้อง {student.room} {student.number ? `• เลขที่ ${student.number}` : ''}
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black border ${risk.badgeBg}`}>
                  {risk.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center space-x-2">
                <span>บันทึกเมื่อ: {student.completedAt ? new Date(student.completedAt).toLocaleString('th-TH') : '-'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress & Overall Score Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-blue-600" />
              <span>คะแนนรวมกิจกรรม</span>
            </span>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-blue-950">{total}</span>
              <span className="text-xs text-blue-600 font-bold">/ 100</span>
            </div>
            <span className={`text-[10px] font-extrabold mt-1 ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isPassed ? '✅ ผ่านเกณฑ์มาตรฐาน (>=60%)' : '⚠️ ต้องให้การช่วยเหลือ'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>พัฒนาการ (Gain Score)</span>
            </span>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-indigo-950">
                {(student.gainScore || (student.postScore - student.preScore)) >= 0 ? `+${student.gainScore || (student.postScore - student.preScore)}` : (student.gainScore || (student.postScore - student.preScore))}
              </span>
              <span className="text-xs text-indigo-600 font-medium">
                (Pre: {student.preScore || 0} ➔ Post: {student.postScore || 0})
              </span>
            </div>
            <span className="text-[10px] text-indigo-700 font-bold mt-1">
              ผลต่างก่อน-หลังเรียน
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>ความก้าวหน้าในบทเรียน</span>
            </span>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-slate-900">{progressPercent}%</span>
              <span className="text-xs text-slate-500 font-medium">({completedCount}/9 ด่าน)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Detailed Score Breakdown */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>รายละเอียดคะแนนรายภารกิจ (Score Breakdown)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">M1: สัญลักษณ์</div>
              <div className="font-black text-sm text-slate-900 mt-1">{student.m1 || 0}/15</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">M2: ลำดับขั้นตอน</div>
              <div className="font-black text-sm text-slate-900 mt-1">{student.m2 || 0}/15</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">M3: อ่านผังงาน</div>
              <div className="font-black text-sm text-slate-900 mt-1">{student.m3 || 0}/15</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">M4: แก้บั๊ก</div>
              <div className="font-black text-sm text-slate-900 mt-1">{student.m4 || 0}/20</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">Final: ออกแบบ</div>
              <div className="font-black text-sm text-slate-900 mt-1">{student.m5 || 0}/35</div>
            </div>
          </div>
        </div>

        {/* 9-Stage Learning Timeline */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>เส้นทางการเรียนรู้ 9 ขั้นตอน (Learning Journey Timeline)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {timelineStages.map((stage, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                stage.isDone ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    stage.isDone ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-bold">{stage.label}</span>
                </div>
                <span className="font-extrabold text-[11px]">{stage.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pedagogical Action Recommendations */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
          <h4 className="font-black text-xs text-amber-900 flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>คำแนะนำและแนวทางช่วยเหลือสำหรับคุณครู (Teacher Action Guidance)</span>
          </h4>
          <ul className="space-y-1 text-xs text-amber-900 font-medium pl-5 list-disc">
            {risk.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงานผู้เรียน</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
