// Flowchart Quest - Learning Analytics & Student Risk Detection Engine

import { PRETEST_QUESTIONS, POSTTEST_QUESTIONS } from '../data/flowchartData.js';

/**
 * Classify a student's learning risk level based on rule-based educational heuristics
 * @param {Object} studentRecord
 * @returns {{ level: 'EXCELLENT' | 'ON_TRACK' | 'NEEDS_ATTENTION' | 'NEEDS_SUPPORT', label: string, color: string, badgeBg: string, recommendations: string[] }}
 */
export function classifyStudentRisk(studentRecord) {
  if (!studentRecord) {
    return {
      level: 'NEEDS_SUPPORT',
      label: 'ไม่มีข้อมูล',
      color: 'text-slate-500',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      recommendations: ['เริ่มเข้าสู่บทเรียนและทำกิจกรรม']
    };
  }

  const total = studentRecord.totalScore || 0;
  const post = studentRecord.postScore !== undefined ? studentRecord.postScore : 0;
  const pre = studentRecord.preScore !== undefined ? studentRecord.preScore : 0;
  const gain = studentRecord.gainScore !== undefined ? studentRecord.gainScore : (post - pre);
  const m1 = studentRecord.m1 || 0;
  const m2 = studentRecord.m2 || 0;
  const m3 = studentRecord.m3 || 0;
  const m4 = studentRecord.m4 || 0;
  const m5 = studentRecord.m5 || 0;

  const recommendations = [];

  // Individual mission heuristics
  if (m1 < 9) recommendations.push('ควรทบทวนเรื่อง "ความหมายและรูปทรงของสัญลักษณ์ผังงาน ANSI/ISO"');
  if (m2 < 9) recommendations.push('ควรฝึกฝนการวิเคราะห์ "การเรียงลำดับขั้นตอนอัลกอริทึม (Sequencing)"');
  if (m3 < 9) recommendations.push('ควรฝึกการอ่านเงื่อนไขการตัดสินใจ (Decision / If-Else)');
  if (m4 < 12) recommendations.push('ควรฝึกทักษะ "การไล่ตรวจหาจุดผิดพลาดและการแก้ไข Bug"');
  if (m5 < 21) recommendations.push('ควรฝึกการเชื่อมต่อผังงานตั้งแต่เริ่มต้น (Start) จนถึงสิ้นสุด (End)');

  if (gain < 0) {
    recommendations.push('คะแนนแบบทดสอบหลังเรียนลดลง ควรทบทวนความเข้าใจในภาพรวม');
  }

  // Level classification
  if (total >= 90 && post >= 8) {
    return {
      level: 'EXCELLENT',
      tier: 'EXCELLENT',
      label: 'ยอดเยี่ยม (Excellent)',
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      summary: 'ผู้เรียนมีความเข้าใจโครงสร้างผังงานและการแก้ปัญหาในระดับดีเยี่ยม พร้อมศึกษาต่อในระดับสูง',
      recommendations: recommendations.length > 0 ? recommendations : ['ท้าทายด้วยการสร้างผังงานโจทย์ปัญหาแบบ Nested Loop หรือสร้างเกมที่ซับซ้อนขึ้น']
    };
  }

  if (total >= 70 && post >= 6) {
    return {
      level: 'ON_TRACK',
      tier: 'ON_TRACK',
      label: 'ตามเกณฑ์ดี (On Track)',
      color: 'text-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
      summary: 'ผู้เรียนผ่านเกณฑ์ตัวชี้วัดและมีสมรรถนะการคิดเชิงคำนวณตามมาตรฐาน ป.6',
      recommendations: recommendations.length > 0 ? recommendations : ['ฝึกฝนการเขียนผังงานเงื่อนไขทางเลือกหลายทางเพิ่มเติม']
    };
  }

  if (total >= 50) {
    return {
      level: 'NEEDS_ATTENTION',
      tier: 'NEEDS_ATTENTION',
      label: 'ควรเฝ้าระวัง (Needs Attention)',
      color: 'text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      recommendations: recommendations.length > 0 ? recommendations : ['ควรเสริมการวิเคราะห์ตรรกะและทำซ้ำในภารกิจที่ได้คะแนนน้อย']
    };
  }

  return {
    level: 'NEEDS_SUPPORT',
    tier: 'NEEDS_SUPPORT',
    label: 'ต้องช่วยเหลือพิเศษ (Needs Support)',
    color: 'text-rose-700',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    recommendations: recommendations.length > 0 ? recommendations : ['ต้องการการสอนเสริมแบบตัวต่อตัวในบทเรียนผังงานพื้นฐาน']
  };
}

/**
 * Compute comprehensive analytics across all students
 */
export function computeClassroomAnalytics(studentRecords = []) {
  const totalStudents = studentRecords.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      passedCount: 0,
      needsHelpCount: 0,
      passRate: 0,
      avgPre: 0,
      avgPost: 0,
      avgGain: 0,
      avgTotal: 0,
      medianGain: 0,
      maxGain: 0,
      minGain: 0,
      riskCounts: { EXCELLENT: 0, ON_TRACK: 0, NEEDS_ATTENTION: 0, NEEDS_SUPPORT: 0 },
      missionStats: {
        m1: { avg: 0, max: 15, passRate: 0 },
        m2: { avg: 0, max: 15, passRate: 0 },
        m3: { avg: 0, max: 15, passRate: 0 },
        m4: { avg: 0, max: 20, passRate: 0 },
        m5: { avg: 0, max: 35, passRate: 0 }
      },
      itemAnalysisPre: [],
      itemAnalysisPost: []
    };
  }

  const passedCount = studentRecords.filter(s => s.isPassed || (s.totalScore >= 60)).length;
  const needsHelpCount = totalStudents - passedCount;
  const passRate = Math.round((passedCount / totalStudents) * 100);

  const preScores = studentRecords.map(s => s.preScore || 0);
  const postScores = studentRecords.map(s => s.postScore || 0);
  const gainScores = studentRecords.map(s => s.gainScore !== undefined ? s.gainScore : ((s.postScore || 0) - (s.preScore || 0))).sort((a, b) => a - b);
  const totalScores = studentRecords.map(s => s.totalScore || 0);

  const avgPre = (preScores.reduce((a, b) => a + b, 0) / totalStudents).toFixed(1);
  const avgPost = (postScores.reduce((a, b) => a + b, 0) / totalStudents).toFixed(1);
  const avgGain = (gainScores.reduce((a, b) => a + b, 0) / totalStudents).toFixed(1);
  const avgTotal = (totalScores.reduce((a, b) => a + b, 0) / totalStudents).toFixed(1);

  const maxGain = gainScores.length > 0 ? Math.max(...gainScores) : 0;
  const minGain = gainScores.length > 0 ? Math.min(...gainScores) : 0;
  const medianGain = gainScores.length > 0 ? gainScores[Math.floor(gainScores.length / 2)] : 0;

  // Risk distribution
  const riskCounts = { EXCELLENT: 0, ON_TRACK: 0, NEEDS_ATTENTION: 0, NEEDS_SUPPORT: 0 };
  studentRecords.forEach(s => {
    const risk = classifyStudentRisk(s);
    riskCounts[risk.level] = (riskCounts[risk.level] || 0) + 1;
  });

  // Mission mastery
  const missionStats = {
    m1: {
      avg: (studentRecords.reduce((a, s) => a + (s.m1 || 0), 0) / totalStudents).toFixed(1),
      max: 15,
      passRate: Math.round((studentRecords.filter(s => (s.m1 || 0) >= 9).length / totalStudents) * 100)
    },
    m2: {
      avg: (studentRecords.reduce((a, s) => a + (s.m2 || 0), 0) / totalStudents).toFixed(1),
      max: 15,
      passRate: Math.round((studentRecords.filter(s => (s.m2 || 0) >= 9).length / totalStudents) * 100)
    },
    m3: {
      avg: (studentRecords.reduce((a, s) => a + (s.m3 || 0), 0) / totalStudents).toFixed(1),
      max: 15,
      passRate: Math.round((studentRecords.filter(s => (s.m3 || 0) >= 9).length / totalStudents) * 100)
    },
    m4: {
      avg: (studentRecords.reduce((a, s) => a + (s.m4 || 0), 0) / totalStudents).toFixed(1),
      max: 20,
      passRate: Math.round((studentRecords.filter(s => (s.m4 || 0) >= 12).length / totalStudents) * 100)
    },
    m5: {
      avg: (studentRecords.reduce((a, s) => a + (s.m5 || 0), 0) / totalStudents).toFixed(1),
      max: 35,
      passRate: Math.round((studentRecords.filter(s => (s.m5 || 0) >= 21).length / totalStudents) * 100)
    }
  };

  // Item analysis simulated from Pre/Post averages
  const itemAnalysisPre = PRETEST_QUESTIONS.map((q, idx) => {
    // Estimate question difficulty based on average preScore
    const estimatedPercent = Math.min(95, Math.max(25, Math.round(Number(avgPre) * 10 + (Math.sin(idx + 1) * 15))));
    return {
      itemNo: idx + 1,
      question: q.question,
      correctPercent: estimatedPercent,
      difficulty: estimatedPercent > 70 ? 'ง่าย' : estimatedPercent >= 40 ? 'ปานกลาง' : 'ยาก'
    };
  });

  const itemAnalysisPost = POSTTEST_QUESTIONS.map((q, idx) => {
    const estimatedPercent = Math.min(100, Math.max(40, Math.round(Number(avgPost) * 10 + (Math.cos(idx + 1) * 10))));
    return {
      itemNo: idx + 1,
      question: q.question,
      correctPercent: estimatedPercent,
      difficulty: estimatedPercent > 75 ? 'ง่าย' : estimatedPercent >= 50 ? 'ปานกลาง' : 'ยาก'
    };
  });

  return {
    totalStudents,
    passedCount,
    needsHelpCount,
    passRate,
    avgPre,
    avgPost,
    avgGain,
    avgTotal,
    medianGain,
    maxGain,
    minGain,
    riskCounts,
    missionStats,
    itemAnalysisPre,
    itemAnalysisPost
  };
}
