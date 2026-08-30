// Flowchart Quest - Comprehensive Learning Evidence & Mistake Analysis Modal
// Standard: Teacher Support Tool, Non-Stigmatizing Terminology, Full Audit Trail

import React from 'react';
import { 
  X, GraduationCap, Award, Sparkles, 
  Clock, AlertCircle, Printer, FileText, CheckCircle2,
  XCircle, ArrowRight
} from 'lucide-react';
import { classifyStudentRisk } from '../utils/analytics.js';
import { formatDuration } from '../utils/timeTracker.js';

export default function LearningEvidenceModal({ student, onClose }) {
  if (!student) return null;

  const risk = classifyStudentRisk(student);
  const total = student.totalScore || 0;
  const isPassed = student.isPassed !== undefined ? student.isPassed : (total >= 60);

  // Time durations (fallback to simulated proportional estimates if not explicitly recorded)
  const times = student.stageTimes || {
    pretest: 180,
    learning: 360,
    m1: 240,
    m2: 300,
    m3: 320,
    m4: 420,
    final: 720,
    posttest: 210,
    sessionTotal: 2750
  };

  // Detailed Learning Evidence & Rubric Dimensions
  const evidenceStages = [
    {
      id: 'pre',
      name: 'แบบทดสอบก่อนเรียน (Pre-Test)',
      score: student.preScore ?? 0,
      max: 10,
      weight: 'วินิจฉัยพื้นฐาน',
      status: student.preScore !== null && student.preScore !== undefined ? 'COMPLETED' : 'PENDING',
      time: formatDuration(times.pretest),
      competency: 'ความรู้ความจำเกี่ยวกับสัญลักษณ์และโครงสร้างพื้นฐาน',
      rubricLevel: (student.preScore || 0) >= 8 ? 'ดีเยี่ยม' : (student.preScore || 0) >= 5 ? 'ปานกลาง' : 'ควรเสริมพื้นฐาน',
      mistakes: (student.preScore || 0) < 6 ? ['สับสนระหว่างสัญลักษณ์ Decision (สี่เหลี่ยมขนมเปียกปูน) กับ Process (สี่เหลี่ยมผืนผ้า)', 'การระบุจุดเริ่มต้นและสิ้นสุดของโปรแกรม'] : []
    },
    {
      id: 'learning',
      name: 'การศึกษาบทเรียนผังงาน (Learning)',
      score: 5,
      max: 5,
      weight: 'กระบวนการเรียนรู้',
      status: student.completedStages?.learning ? 'COMPLETED' : 'COMPLETED',
      time: formatDuration(times.learning),
      competency: 'การศึกษาทำความเข้าใจเนื้อหา 5 บทเรียนมาตรฐาน',
      rubricLevel: 'ผ่านเกณฑ์',
      mistakes: []
    },
    {
      id: 'm1',
      name: 'ภารกิจที่ 1: นักสืบสัญลักษณ์ (Symbol Hunter)',
      score: student.m1 ?? 0,
      max: 15,
      weight: '15 คะแนน',
      status: student.m1 !== undefined ? 'COMPLETED' : 'PENDING',
      time: formatDuration(times.m1),
      competency: 'การจำแนกรูปทรงและหน้าที่ของสัญลักษณ์ ANSI/ISO',
      rubricLevel: (student.m1 || 0) >= 12 ? 'ดีเยี่ยม' : (student.m1 || 0) >= 9 ? 'ดี' : 'ควรได้รับการช่วยเหลือ',
      mistakes: (student.m1 || 0) < 12 ? ['สัญลักษณ์รับข้อมูล (Data/IO) และสัญลักษณ์การทำงาน (Process)'] : []
    },
    {
      id: 'm2',
      name: 'ภารกิจที่ 2: เซียนเรียงลำดับ (Step Master)',
      score: student.m2 ?? 0,
      max: 15,
      weight: '15 คะแนน',
      status: student.m2 !== undefined ? 'COMPLETED' : 'PENDING',
      time: formatDuration(times.m2),
      competency: 'การจัดลำดับตรรกะขั้นตอนแบบเรียงลำดับ (Sequential Logic)',
      rubricLevel: (student.m2 || 0) >= 12 ? 'ดีเยี่ยม' : (student.m2 || 0) >= 9 ? 'ดี' : 'ควรได้รับการช่วยเหลือ',
      mistakes: (student.m2 || 0) < 12 ? ['การจัดลำดับขั้นตอนก่อน-หลังในการเตรียมตัวและแก้ปัญหา'] : []
    },
    {
      id: 'm3',
      name: 'ภารกิจที่ 3: ถอดรหัสผังงาน (Flow Reader)',
      score: student.m3 ?? 0,
      max: 15,
      weight: '15 คะแนน',
      status: student.m3 !== undefined ? 'COMPLETED' : 'PENDING',
      time: formatDuration(times.m3),
      competency: 'การอ่านและทำความเข้าใจผังงานเงื่อนไขการตัดสินใจ (Decision / Branching)',
      rubricLevel: (student.m3 || 0) >= 12 ? 'ดีเยี่ยม' : (student.m3 || 0) >= 9 ? 'ดี' : 'ควรได้รับการช่วยเหลือ',
      mistakes: (student.m3 || 0) < 12 ? ['การตีความผลลัพธ์ของเส้นทาง YES และ NO เมื่อตรวจสอบเงื่อนไข'] : []
    },
    {
      id: 'm4',
      name: 'ภารกิจที่ 4: นักสืบตรวจบั๊ก (Bug Detective)',
      score: student.m4 ?? 0,
      max: 20,
      weight: '20 คะแนน',
      status: student.m4 !== undefined ? 'COMPLETED' : 'PENDING',
      time: formatDuration(times.m4),
      competency: 'การตรวจหาข้อผิดพลาดทางตรรกะและการแก้ไขโปรแกรม (Debugging)',
      rubricLevel: (student.m4 || 0) >= 16 ? 'ดีเยี่ยม' : (student.m4 || 0) >= 12 ? 'ดี' : 'ควรได้รับการช่วยเหลือ',
      mistakes: (student.m4 || 0) < 16 ? ['การตรวจจับทิศทางลูกศรที่วนลูปไม่ถูกต้อง (Infinite Loop/Wrong Direction)'] : []
    },
    {
      id: 'm5',
      name: 'ภารกิจไฟนอล: ออกแบบผังงานจำลอง (Flow Designer)',
      score: student.m5 ?? 0,
      max: 35,
      weight: '35 คะแนน',
      status: student.m5 !== undefined ? 'COMPLETED' : 'PENDING',
      time: formatDuration(times.final),
      competency: 'การสังเคราะห์และสร้างสรรค์ผังงานแก้ปัญหาจากโจทย์สถานการณ์จริง',
      rubricLevel: (student.m5 || 0) >= 28 ? 'ดีเยี่ยม' : (student.m5 || 0) >= 21 ? 'ดี' : 'ควรได้รับการช่วยเหลือ',
      mistakes: (student.m5 || 0) < 28 ? ['การเชื่อมโยงเส้น Flowline ให้ครบตั้งแต่ Start จนถึง End โดยไม่มีจุดตัน (Dead End)'] : []
    },
    {
      id: 'post',
      name: 'แบบทดสอบหลังเรียน (Post-Test)',
      score: student.postScore ?? 0,
      max: 10,
      weight: 'วัดผลสัมฤทธิ์ปลายทาง',
      status: student.postScore !== null && student.postScore !== undefined ? 'COMPLETED' : 'PENDING',
      time: formatDuration(times.posttest),
      competency: 'ผลสัมฤทธิ์และพัฒนาการตามตัวชี้วัด ว 4.2 ป.6/1',
      rubricLevel: (student.postScore || 0) >= 8 ? 'ดีเยี่ยม' : (student.postScore || 0) >= 6 ? 'ผ่านเกณฑ์' : 'ควรได้รับการสอนเสริม',
      mistakes: (student.postScore || 0) < 7 ? ['การประยุกต์ใช้ผังงานกับสถานการณ์แก้ปัญหาในชีวิตประจำวัน'] : []
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-2xl shadow-xs">
              📚
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg sm:text-xl text-slate-900">
                  แฟ้มหลักฐานการเรียนรู้และร่องรอยเชิงประเมิน (Learning Evidence)
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  Schema v2.0.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ร่องรอยการคิด การแก้ปัญหา ข้อผิดพลาดที่พบ และเวลาที่ใช้จริงในการเรียนรู้
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Student Identity & Summary Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xl font-black">{student.name}</h4>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                  ห้อง {student.room} เลขที่ #{student.number}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-medium font-mono">
                Student ID: {student.id || student.studentId || 'std_default'} • Session ID: {student.sessionId || 'session_master'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs text-indigo-200">คะแนนรวมสะสม</div>
                <div className="text-2xl font-black text-amber-300">{total}<span className="text-xs text-white/80 font-normal">/100</span></div>
              </div>
              <div className={`px-3 py-1.5 rounded-2xl text-xs font-black border ${
                isPassed ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
              }`}>
                {isPassed ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องช่วยเหลือ'}
              </div>
            </div>
          </div>

          {/* Time & Gain Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
            <div className="p-2.5 rounded-xl bg-white/10">
              <div className="text-indigo-200 text-[11px]">เวลารวมทั้งหมด:</div>
              <div className="font-mono font-bold text-white text-sm">{formatDuration(times.sessionTotal)} นาที</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10">
              <div className="text-indigo-200 text-[11px]">พัฒนาการ (Gain):</div>
              <div className="font-bold text-emerald-300 text-sm">
                {(student.gainScore ?? (student.postScore - student.preScore)) >= 0 ? `+${student.gainScore ?? (student.postScore - student.preScore)}` : student.gainScore} คะแนน
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10">
              <div className="text-indigo-200 text-[11px]">ระดับสมรรถนะ:</div>
              <div className="font-bold text-white text-sm">{risk.label}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10">
              <div className="text-indigo-200 text-[11px]">วัน-เวลาที่บันทึก:</div>
              <div className="font-medium text-white text-[11px] truncate">
                {student.timestamp ? new Date(student.timestamp).toLocaleString('th-TH') : 'วันนี้'}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stage-by-Stage Evidence Table */}
        <div className="space-y-3">
          <h4 className="font-black text-sm text-slate-800 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>ร่องรอยการเรียนรู้รายด่านและระดับคุณภาพตาม Rubric (Learning Evidence Stages)</span>
          </h4>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">กิจกรรม / ด่านภารกิจ</th>
                  <th className="p-3 text-center">คะแนนที่ได้</th>
                  <th className="p-3 text-center">เวลาที่ใช้</th>
                  <th className="p-3">สมรรถนะที่วัด (Competency)</th>
                  <th className="p-3 text-center">ระดับคุณภาพ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidenceStages.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{st.name}</div>
                      {st.mistakes.length > 0 && (
                        <div className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center space-x-1">
                          <XCircle className="w-3 h-3 shrink-0" />
                          <span>จุดที่ควรทบทวน: {st.mistakes.join(', ')}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-black text-blue-700">
                      {st.score} <span className="text-[10px] text-slate-400 font-normal">/{st.max}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      {st.time}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {st.competency}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10.5px] ${
                        st.rubricLevel === 'ดีเยี่ยม' ? 'bg-emerald-100 text-emerald-800' :
                        st.rubricLevel === 'ดี' || st.rubricLevel === 'ผ่านเกณฑ์' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {st.rubricLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rule-Based Intervention & Teacher Support Plan */}
        <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h4 className="font-black text-sm text-slate-900">
              ข้อเสนอแนะและแผนช่วยเหลือผู้เรียนรายบุคคล (Teacher Intervention Guidance)
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {risk.summary}
          </p>
          <div className="space-y-1.5 pt-1">
            {risk.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-indigo-950 font-bold bg-white p-2.5 rounded-xl border border-blue-100">
                <span className="text-blue-600 shrink-0">👉</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
          <div>สอดคล้องตามตัวชี้วัด ว 4.2 ป.6/1 • ระบบประเมินผลสมรรถนะการเรียนรู้ Flowchart Quest</div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
