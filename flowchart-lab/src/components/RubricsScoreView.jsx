import React, { useState } from 'react';
import { 
  ArrowLeft, Award, Printer, Copy, Check, Search, 
  Sparkles, GraduationCap, CheckCircle2, ChevronDown, 
  Layers, Trophy, AlertTriangle, BookOpen, ExternalLink, ShieldAlert
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { 
  COURSE_ASSESSMENT_BLUEPRINT, 
  ANALYTICAL_RUBRICS_5_PILLARS, 
  MASTERY_LEVELS_SCALE, 
  PA_SUCCESS_CRITERIA, 
  FULL_RUBRICS_PLAIN_TEXT 
} from '../data/rubricsData';

export default function RubricsScoreView({ onBackToGame, onGoToDashboard, soundEnabled = true }) {
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'blueprint' | 'pillars' | 'scale' | 'pa'
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('all');

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(FULL_RUBRICS_PLAIN_TEXT);
      setCopied(true);
      playSound('success', soundEnabled);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    playSound('click', soundEnabled);
    window.print();
  };

  const filteredPillars = ANALYTICAL_RUBRICS_5_PILLARS.filter(p => {
    if (selectedPillar !== 'all' && p.id !== selectedPillar) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || 
      p.levels.some(l => l.criteria.toLowerCase().includes(q) || l.gradeLabel.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-16 print:p-0 print:space-y-4">
      {/* Top Header Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { onBackToGame?.(); playSound('click', soundEnabled); }}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs shadow-xs border border-slate-200/80 inline-flex items-center space-x-2 transition-all action-btn-hover cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>ย้อนกลับหน้าหลักภารกิจ</span>
          </button>

          <button
            onClick={() => { onGoToDashboard?.(); playSound('click', soundEnabled); }}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 inline-flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>ไปที่แดชบอร์ดคุณครู</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs inline-flex items-center space-x-2 transition-all shadow-sm cursor-pointer border ${
              copied 
                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'คัดลอกเกณฑ์รูบริกสำเร็จ!' : 'คัดลอกรูบริกทั้งหมด (Text)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs inline-flex items-center space-x-2 shadow-md shadow-blue-500/20 transition-all action-btn-hover cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>พิมพ์ / บันทึก PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-white/10 print:bg-white print:text-black print:border-slate-300 print:shadow-none print:p-4">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-3.5 py-1 rounded-full text-xs font-black print:bg-slate-100 print:text-slate-800 print:border-slate-300">
              <Award className="w-4 h-4 text-amber-300" />
              <span>เกณฑ์การวัดและประเมินผลตามสภาพจริง (Authentic Assessment Blueprint)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white print:text-black">
              ตารางรูบริกสกอร์และเกณฑ์การให้คะแนน (Scoring Rubrics)
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-3xl leading-relaxed print:text-slate-700">
              มาตรฐาน ว 4.2 ป.6/1: การออกแบบและเขียนผังงานเพื่อแก้ปัญหาในชีวิตประจำวัน (Flowchart Quest) 
              คะแนนเต็ม 100 คะแนน เกณฑ์ผ่านขั้นต่ำ 70% สอดคล้องตามข้อตกลงในการพัฒนางาน (PA)
            </p>
          </div>

          {/* Mini Summary Stats */}
          <div className="grid grid-cols-3 gap-2 shrink-0 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center print:border-slate-300 print:bg-slate-50">
            <div className="p-2">
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider print:text-slate-600">คะแนนเต็ม</p>
              <p className="text-xl font-black text-amber-300 print:text-slate-900">100p</p>
            </div>
            <div className="p-2 border-x border-white/15 print:border-slate-300">
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider print:text-slate-600">เกณฑ์ผ่าน</p>
              <p className="text-xl font-black text-emerald-400 print:text-emerald-700">70%</p>
            </div>
            <div className="p-2">
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider print:text-slate-600">มิติรูบริก</p>
              <p className="text-xl font-black text-sky-300 print:text-slate-900">5 ด้าน</p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (In-Page) */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10 print:hidden text-xs font-bold">
          <span className="text-indigo-200/80 mr-1">เลือกหมวดหมู่:</span>
          {[
            { id: 'all', label: '📌 แสดงทั้งหมด' },
            { id: 'blueprint', label: '1. ผังโครงสร้าง 100 คะแนน' },
            { id: 'pillars', label: '2. รูบริก 5 มิติ (35p)' },
            { id: 'scale', label: '3. ระดับคุณภาพ 4 ระดับ' },
            { id: 'pa', label: '4. เกณฑ์ข้อตกลง ว PA' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveSection(tab.id); playSound('click', soundEnabled); }}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-white text-indigo-900 shadow-md font-black scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= SECTION 1: COURSE ASSESSMENT BLUEPRINT (100 P) ================= */}
      {(activeSection === 'all' || activeSection === 'blueprint') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5 print:p-0 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs bg-blue-100 text-blue-700 font-extrabold px-3 py-0.5 rounded-full border border-blue-200">
                หมวดที่ 1: ผังโครงสร้างคะแนนรวม
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                ผังโครงสร้างการประเมินผลการเรียนรู้ (Course Assessment Blueprint 100 คะแนน)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                สัดส่วนการวัดและประเมินผลระหว่างเรียน (Formative 65%) + ปลายทาง (Summative 35% รวม Post-test)
              </p>
            </div>
            <span className="text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-2xl self-start sm:self-auto">
              🎯 เกณฑ์ผ่านรวม: 70 คะแนน (70%)
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-700 font-black border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">กิจกรรม / ขั้นตอนการประเมิน</th>
                  <th className="py-3 px-3 text-center">ประเภทการวัด</th>
                  <th className="py-3 px-3 text-center">จำนวนข้อ / ด่าน</th>
                  <th className="py-3 px-3 text-center">คะแนนเต็ม</th>
                  <th className="py-3 px-3 text-center">น้ำหนัก</th>
                  <th className="py-3 px-3 text-center">เกณฑ์ผ่าน (70%)</th>
                  <th className="py-3 px-4">คำอธิบายและแนวทางการให้คะแนน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {COURSE_ASSESSMENT_BLUEPRINT.map((item, idx) => (
                  <tr key={item.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="py-3 px-4 font-black text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span>{item.stageName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${item.categoryBadge}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{item.itemCount}</td>
                    <td className="py-3 px-3 text-center font-black text-blue-600 text-sm">{item.maxScore}p</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-600">{item.weightPercent}</td>
                    <td className="py-3 px-3 text-center font-black text-emerald-600">{item.passingThreshold}</td>
                    <td className="py-3 px-4 text-[11px] leading-relaxed">
                      <p className="text-slate-800 font-bold">{item.description}</p>
                      <p className="text-slate-500 mt-0.5 text-[10px]">💡 {item.scoringRule}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs">
                  <td className="py-3.5 px-4" colSpan={3}>
                    รวมคะแนนวัดผลสัมฤทธิ์ตลอดหลักสูตร (Total Assessment Score)
                  </td>
                  <td className="py-3.5 px-3 text-center text-amber-400 text-sm">100 คะแนน</td>
                  <td className="py-3.5 px-3 text-center text-indigo-300">100%</td>
                  <td className="py-3.5 px-3 text-center text-emerald-400">70 คะแนน (70%)</td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-300">
                    * นักเรียนต้องได้คะแนนรวมไม่น้อยกว่า 70 คะแนน จึงจะถือว่าผ่านเกณฑ์มาตรฐาน ว 4.2 ป.6/1
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: 5-PILLAR ANALYTICAL RUBRICS (35 P) ================= */}
      {(activeSection === 'all' || activeSection === 'pillars') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs bg-purple-100 text-purple-700 font-extrabold px-3 py-0.5 rounded-full border border-purple-200">
                หมวดที่ 2: เกณฑ์รูบริก 5 มิติ
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                เกณฑ์การประเมินแบบแยกส่วน 5 มิติ (Analytical Rubrics - 35 คะแนน)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                สำหรับประเมินการออกแบบและเขียนผังงานแก้ปัญหาในภารกิจสุดท้าย (Final Mission) และแฟ้มสะสมงาน
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold print:hidden">
              <span className="text-slate-400 text-[11px] mr-1">เลือกมิติ:</span>
              <button
                onClick={() => setSelectedPillar('all')}
                className={`px-3 py-1 rounded-xl border transition ${
                  selectedPillar === 'all' ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                }`}
              >
                ทั้งหมด (5 ด้าน)
              </button>
              {ANALYTICAL_RUBRICS_5_PILLARS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPillar(p.id)}
                  className={`px-3 py-1 rounded-xl border transition ${
                    selectedPillar === p.id ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {p.icon} ด้าน {p.number}
                </button>
              ))}
            </div>
          </div>

          {/* Pillars List */}
          <div className="space-y-6">
            {filteredPillars.map((pillar) => (
              <div 
                key={pillar.id}
                className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-purple-300 transition-all bg-slate-50/30"
              >
                {/* Pillar Header */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{pillar.icon}</span>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-white">
                        มิติที่ {pillar.number}: {pillar.title}
                      </h3>
                      <p className="text-[10px] text-indigo-300 font-semibold">Analytical Rubric Scoring Criteria (Full Weight: {pillar.weight})</p>
                    </div>
                  </div>
                  <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-xl font-black text-xs shadow-2xs">
                    คะแนนเต็ม {pillar.weight}
                  </span>
                </div>

                {/* 4 Quality Levels Grid */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {pillar.levels.map((lvl) => {
                    const levelColors = {
                      4: { bg: 'bg-emerald-50/90 border-emerald-200 text-emerald-950', badge: 'bg-emerald-600 text-white', label: 'ระดับ 4 (ดีเยี่ยม)', borderTop: 'border-t-4 border-t-emerald-500' },
                      3: { bg: 'bg-blue-50/90 border-blue-200 text-blue-950', badge: 'bg-blue-600 text-white', label: 'ระดับ 3 (ดี - เป้าหมาย)', borderTop: 'border-t-4 border-t-blue-500' },
                      2: { bg: 'bg-amber-50/90 border-amber-200 text-amber-950', badge: 'bg-amber-600 text-white', label: 'ระดับ 2 (พอใช้)', borderTop: 'border-t-4 border-t-amber-500' },
                      1: { bg: 'bg-rose-50/90 border-rose-200 text-rose-950', badge: 'bg-rose-600 text-white', label: 'ระดับ 1 (ปรับปรุง)', borderTop: 'border-t-4 border-t-rose-500' }
                    }[lvl.level];

                    return (
                      <div 
                        key={lvl.level}
                        className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 ${levelColors.bg} ${levelColors.borderTop} shadow-2xs`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${levelColors.badge}`}>
                              {levelColors.label}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {lvl.scoreRange}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed">
                            {lvl.criteria}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                          <span>ระดับคุณภาพ: L{lvl.level}</span>
                          <span>{lvl.gradeLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 3: MASTERY LEVEL CONVERSION SCALE ================= */}
      {(activeSection === 'all' || activeSection === 'scale') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5 print:p-0 print:border-none print:shadow-none">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs bg-amber-100 text-amber-800 font-extrabold px-3 py-0.5 rounded-full border border-amber-200">
              หมวดที่ 3: เกณฑ์ระดับคุณภาพ
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              เกณฑ์การตัดสินระดับคุณภาพคะแนนรวม (Mastery Level Grading Scale)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              การเทียบค่าคะแนนรวม 100 คะแนน แปลงเป็นระดับคุณภาพ 4 ระดับ (L1 - L4)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MASTERY_LEVELS_SCALE.map((scale) => (
              <div 
                key={scale.level}
                className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 ${scale.cardBg} transition-transform hover:-translate-y-0.5`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{scale.icon}</span>
                    <span className={`text-[11px] font-black px-3 py-0.5 rounded-full shadow-2xs ${scale.badgeColor}`}>
                      ระดับ {scale.level}
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-950">{scale.name}</h3>
                  <div className="flex items-center space-x-2 text-xs font-black">
                    <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900">
                      ช่วงคะแนน: {scale.range}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-semibold text-slate-700 pt-1">
                    {scale.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                  <span>สัดส่วนเทียบเคียง</span>
                  <span className="font-black text-slate-900">{scale.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 4: PA SUCCESS CRITERIA MATRIX ================= */}
      {(activeSection === 'all' || activeSection === 'pa') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-extrabold px-3 py-0.5 rounded-full border border-indigo-200">
              หมวดที่ 4: เกณฑ์ข้อตกลงในการพัฒนางาน
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              เกณฑ์ความสำเร็จตามข้อตกลงในการพัฒนางาน (PA Success Criteria Matrix)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              รหัสตัวชี้วัด: {PA_SUCCESS_CRITERIA.standardCode} — {PA_SUCCESS_CRITERIA.standardTitle} ({PA_SUCCESS_CRITERIA.targetAudience})
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quantitative Indicators */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
              <div className="flex items-center space-x-2 text-blue-900 font-black text-base border-b border-blue-200 pb-2.5">
                <span className="text-lg">📊</span>
                <h3>ตัวชี้วัดเชิงปริมาณ (Quantitative Indicators)</h3>
              </div>

              <div className="space-y-4">
                {PA_SUCCESS_CRITERIA.quantitative.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-xl p-4 border border-blue-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        ข้อที่ 2.1.{idx + 1}
                      </span>
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {q.benchmark}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900">{q.title}</h4>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{q.target}</p>
                    <div className="text-[10px] font-mono bg-slate-50 p-2 rounded-lg text-slate-600 border border-slate-200/60">
                      📐 สูตรคำนวณ: {q.formula}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Indicators */}
            <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 space-y-4">
              <div className="flex items-center space-x-2 text-purple-900 font-black text-base border-b border-purple-200 pb-2.5">
                <span className="text-lg">🌟</span>
                <h3>ตัวชี้วัดเชิงคุณภาพ (Qualitative Indicators)</h3>
              </div>

              <div className="space-y-4">
                {PA_SUCCESS_CRITERIA.qualitative.map((ql, idx) => (
                  <div key={ql.id} className="bg-white rounded-xl p-4 border border-purple-100 shadow-2xs space-y-2">
                    <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full inline-block">
                      ข้อที่ 2.2.{idx + 1}
                    </span>
                    <h4 className="text-xs font-black text-slate-900">{ql.title}</h4>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{ql.description}</p>
                    <div className="text-[10px] bg-slate-50 p-2 rounded-lg text-slate-600 border border-slate-200/60 font-bold flex items-center space-x-1.5">
                      <span>🔍 หลักฐานเชิงประจักษ์:</span>
                      <span className="text-indigo-700">ผลงานผังงานในภารกิจจริง, แบบทดสอบ, แบบบันทึกพฤติกรรม</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Print & Reference Notice */}
      <div className="bg-slate-100 rounded-2xl p-4 text-center text-xs text-slate-600 font-medium border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="font-bold text-slate-800">เอกสารประกอบการจัดการเรียนรู้:</span>
          <span>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี โรงเรียนเทศบาล ๔ (เพาะชำ)</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Flowchart Quest Assessment Framework v2.4 • สอดคล้องตามมาตรฐานหลักสูตรแกนกลางฯ
        </div>
      </div>
    </div>
  );
}
