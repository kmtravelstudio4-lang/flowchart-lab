// ==============================================================================
// STUDENT PROFILE & REAL-TIME LEARNING PROGRESS TIMELINE MODAL
// Flowchart Quest (Supabase Learning Analytics)
// ==============================================================================
import React from 'react';
import { 
  X, GraduationCap, CheckCircle2, Clock, 
  Layers, BookOpen, User, Calendar
} from 'lucide-react';
import { computeOnlineStatus } from '../services/supabaseService';

export default function StudentProfileModal({ student, onClose }) {
  if (!student) return null;

  const onlineStatus = computeOnlineStatus(student.lastActiveAt || student.last_active_at);

  // Learning stages progress
  const timelineStages = [
    { id: 'registered', label: '1. ลงทะเบียนเรียน', desc: 'สร้างตัวตนในระบบเรียบร้อย', isDone: true },
    { id: 'lesson', label: '2. ศึกษาบทเรียนผังงาน', desc: 'เรียนรู้เนื้อหาและดูสื่อ PDF', isDone: Boolean(student.m1 || student.currentStage) },
    { id: 'm1', label: '3. ด่าน 1: สัญลักษณ์ผังงาน', desc: 'ทดสอบการจับคู่สัญลักษณ์', isDone: Boolean(student.m1 && student.m1 > 0) },
    { id: 'm2', label: '4. ด่าน 2: ลำดับขั้นตอน', desc: 'เรียงลำดับการทำงาน', isDone: Boolean(student.m2 && student.m2 > 0) },
    { id: 'm3', label: '5. ด่าน 3: การตัดสินใจ', desc: 'ตรวจสอบเงื่อนไข จริง/เท็จ', isDone: Boolean(student.m3 && student.m3 > 0) },
    { id: 'm4', label: '6. ด่าน 4: นักสืบ Bug', desc: 'ตรวจหาจุดผิดพลาดในผังงาน', isDone: Boolean(student.m4 && student.m4 > 0) },
    { id: 'final', label: '7. ด่าน Final: ออกแบบผังงาน', desc: 'สร้างและตรวจสอบผังงานสมบูรณ์', isDone: Boolean(student.m5 && student.m5 > 0) },
    { id: 'completed', label: '8. จบหลักสูตร', desc: 'ผ่านครบทุกกิจกรรมการเรียนรู้', isDone: Boolean(student.completedAt || (student.m5 && student.m5 > 0)) }
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
                  {student.name || `${student.first_name || ''} ${student.last_name || ''}`}
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                  ห้อง {student.room || student.classroom} {student.number || student.student_number ? `• เลขที่ ${student.number || student.student_number}` : ''}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${onlineStatus.color}`}>
                  ● {onlineStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center space-x-2">
                <span>ที่มา: {student.source === 'self_registration' || student.registration_source === 'self_registration' ? '👤 นักเรียนกรอกเอง' : '👩‍🏫 ครูนำเข้า'}</span>
                <span>•</span>
                <span>Active ล่าสุด: {student.lastActiveAt || student.last_active_at ? new Date(student.lastActiveAt || student.last_active_at).toLocaleTimeString('th-TH') : '-'}</span>
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

        {/* Progress Summary Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-950 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>ความคืบหน้าการเรียนรู้โดยรวม (Learning Progress)</span>
            </span>
            <span className="text-xs font-black text-blue-700">{progressPercent}%</span>
          </div>

          <div className="w-full bg-blue-200/60 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-1">
            <span>สำเร็จแล้ว: <strong className="text-blue-900 font-bold">{completedCount}</strong> จาก {timelineStages.length} ขั้นตอน</span>
            <span>สถานะ: <strong className="text-indigo-900 font-bold">{completedCount === timelineStages.length ? '✅ จบหลักสูตร' : '📖 กำลังเรียนรู้'}</strong></span>
          </div>
        </div>

        {/* Timeline Stages List */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>เส้นทางการเรียนรู้แบบเรียลไทม์ (Learning Timeline)</span>
          </h4>

          <div className="space-y-2.5">
            {timelineStages.map((stage, idx) => (
              <div 
                key={stage.id} 
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                  stage.isDone 
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950' 
                    : 'bg-slate-50/50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    stage.isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {stage.isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <div className={`text-xs font-black ${stage.isDone ? 'text-slate-900' : 'text-slate-500'}`}>
                      {stage.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {stage.desc}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  stage.isDone 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {stage.isDone ? 'สำเร็จ' : 'ยังไม่ถึง'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
