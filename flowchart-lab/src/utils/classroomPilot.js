// Flowchart Quest - Classroom Pilot & Readiness Engine
// Standards: 100% Isolated Test Data, Pre-Class Backup, Class Session Tracking, Cascade Student Deletion

import { generateFullBackup } from './backupRestore.js';
import { logActivity } from './auditLogger.js';
import { computeClassroomAnalytics } from './analytics.js';

export const CHECKLIST_ITEMS = [
  { id: 'sheets', label: 'Google Sheets Connected', desc: 'เชื่อมต่อ Webhook URL เพื่อซิงก์คะแนนขึ้นคลาวด์' },
  { id: 'offline', label: 'Offline Mode Ready', desc: 'ระบบ LocalStorage Cache พร้อมทำงานเมื่อเน็ตหลุด' },
  { id: 'queue', label: 'Sync Queue Empty', desc: 'ไม่มีข้อมูลตกค้างในคิวรอส่ง' },
  { id: 'backup', label: 'Pre-Class Backup Created', desc: 'ดาวน์โหลดไฟล์สำรองข้อมูลก่อนเริ่มคาบเรียน' },
  { id: 'roster', label: 'Student Roster Ready', desc: 'รายชื่อนักเรียนในทะเบียนห้องเรียนครบถ้วน' },
  { id: 'lessons', label: 'Lessons Ready', desc: 'บทเรียนมาตรฐาน 5 บทพร้อมภาพประกอบ' },
  { id: 'questions', label: 'Question Bank Ready', desc: 'ข้อสอบ Pre-Test & Post-Test 10 ข้อถูกต้อง' },
  { id: 'cert', label: 'Certificate Ready', desc: 'ระบบออกใบประกาศนียบัตรพร้อมดาวน์โหลด PNG/Print' },
  { id: 'browser', label: 'Browser Tested', desc: 'ทดสอบการทำงานบน Chrome / Edge / Safari ผ่าน' },
  { id: 'mobile', label: 'Mobile/Tablet Tested', desc: 'รองรับการแตะเลือกบล็อก (Tap-to-Place) บนจอสัมผัส' },
  { id: 'auth', label: 'Teacher Login Ready', desc: 'รหัสผ่านแอดมิน/ครูผู้สอนพร้อมใช้งาน' }
];

/**
 * Generate Pre-Class Backup file with timestamp YYYY-MM-DD_HH-mm
 */
export function downloadPreClassBackup() {
  const backup = generateFullBackup();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (typeof document !== 'undefined' && typeof URL !== 'undefined') {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FlowchartQuest_ClassBackup_${dateStr}_${timeStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  logActivity({
    user: 'Teacher/Admin',
    role: 'Admin',
    action: 'PRE_CLASS_BACKUP',
    target: `Records: ${backup.data.studentRecords.length}`,
    result: 'SUCCESS'
  });

  return backup;
}

/**
 * Generate Test Dataset for Classroom Pilot (5, 10, or 30 students)
 * Clearly marked with isTestData = true
 */
export function generatePilotTestData(count = 10, room = 'ป.6/1') {
  const testStudents = [];
  const now = new Date();

  for (let i = 1; i <= count; i++) {
    const pre = Math.min(10, Math.max(3, 4 + (i % 6)));
    const post = Math.min(10, Math.max(pre, 7 + (i % 4)));
    const m1 = Math.min(15, 12 + (i % 4));
    const m2 = Math.min(15, 12 + (i % 4));
    const m3 = Math.min(15, 12 + (i % 4));
    const m4 = Math.min(20, 16 + (i % 5));
    const m5 = Math.min(35, 26 + (i % 10));
    const total = m1 + m2 + m3 + m4 + m5;

    testStudents.push({
      id: `test_std_${room.replace('/', '_')}_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: `evt_pilot_test_${room.replace('/', '_')}_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: `sess_pilot_${room.replace('/', '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `[TEST DATA] นักเรียนจำลอง #${i}`,
      room: room,
      number: String(i),
      preScore: pre,
      postScore: post,
      gainScore: post - pre,
      m1,
      m2,
      m3,
      m4,
      m5,
      totalScore: total,
      isPassed: total >= 60,
      isTestData: true,
      stageTimes: {
        pretest: 180,
        learning: 300,
        m1: 200,
        m2: 240,
        m3: 260,
        m4: 360,
        final: 600,
        posttest: 200,
        sessionTotal: 2340
      },
      schemaVersion: '2.0.0',
      contentVersion: '1.0.0',
      completedAt: new Date(now.getTime() - i * 60000).toISOString()
    });
  }

  return testStudents;
}

/**
 * Delete only Test Data from student records
 */
export function purgeTestData(records = []) {
  const cleaned = records.filter(r => !r.isTestData && !r.name.includes('[TEST DATA]'));
  localStorage.setItem('flowchart_student_records', JSON.stringify(cleaned));
  logActivity({
    user: 'Teacher/Admin',
    role: 'Admin',
    action: 'PURGE_TEST_DATA',
    target: `Removed ${records.length - cleaned.length} test records`,
    result: 'SUCCESS'
  });
  return cleaned;
}

/**
 * Cascade Delete a Student Record (Record + Roster + Associated Events)
 */
export function deleteStudentCascade(studentId, currentRecords = [], currentRoster = []) {
  const target = currentRecords.find(r => r.id === studentId || r.studentId === studentId);
  const targetName = target ? target.name : 'Unknown';

  const updatedRecords = currentRecords.filter(r => r.id !== studentId && r.studentId !== studentId);
  const updatedRoster = currentRoster.filter(r => r.studentId !== studentId && r.id !== studentId);

  localStorage.setItem('flowchart_student_records', JSON.stringify(updatedRecords));
  localStorage.setItem('flowchart_student_roster', JSON.stringify(updatedRoster));

  logActivity({
    user: 'Teacher/Admin',
    role: 'Admin',
    action: 'DELETE_STUDENT_CASCADE',
    target: `Student: ${targetName} (${studentId})`,
    result: 'SUCCESS'
  });

  return { updatedRecords, updatedRoster };
}

/**
 * Export Class Learning Report to CSV
 */
export function exportClassLearningReport(students = [], classroom = 'ทั้งหมด') {
  if (students.length === 0) {
    alert('ไม่มีข้อมูลนักเรียนสำหรับสร้างรายงานสรุปชั้นเรียน');
    return;
  }

  const analytics = computeClassroomAnalytics(students);
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH');

  const summaryHeaders = ['ตัวชี้วัด / สถิติชั้นเรียน', 'ค่าที่ได้'];
  const summaryRows = [
    ['ห้องเรียน', `"${classroom}"`],
    ['วันที่ออกรายงาน', `"${dateStr}"`],
    ['จำนวนนักเรียนทั้งหมด', students.length],
    ['จำนวนนักเรียนที่ผ่านเกณฑ์ (>=60%)', students.filter(s => s.isPassed).length],
    ['อัตราการผ่านเกณฑ์ (Pass Rate)', `"${analytics.passRate}%"`],
    ['คะแนนเฉลี่ยรวม (เต็ม 100)', analytics.avgTotal],
    ['คะแนนเฉลี่ย Pre-Test (เต็ม 10)', analytics.avgPre],
    ['คะแนนเฉลี่ย Post-Test (เต็ม 10)', analytics.avgPost],
    ['คะแนนพัฒนาการเฉลี่ย (Average Gain)', `"+${analytics.avgGain}"`],
    ['กลุ่มที่ควรได้รับการช่วยเหลือ (Needs Support)', students.filter(s => (s.totalScore || 0) < 60).length]
  ];

  const studentHeaders = ['ชื่อ-นามสกุล', 'ห้อง', 'เลขที่', 'Pre (10)', 'Post (10)', 'Gain', 'M1 (15)', 'M2 (15)', 'M3 (15)', 'M4 (20)', 'Final (35)', 'รวม (100)', 'สถานะประเมิน'];
  const studentRows = students.map(s => [
    `"${s.name}"`,
    `"${s.room}"`,
    `"${s.number}"`,
    s.preScore,
    s.postScore,
    s.gainScore,
    s.m1,
    s.m2,
    s.m3,
    s.m4,
    s.m5,
    s.totalScore,
    s.isPassed ? '"ผ่านเกณฑ์"' : '"ควรได้รับการช่วยเหลือ"'
  ]);

  const csvContent = "\uFEFF" + [
    '=== รายงานสรุปผลการเรียนรู้รายห้องเรียน (Class Learning Report) ===',
    summaryHeaders.join(','),
    ...summaryRows.map(r => r.join(',')),
    '',
    '=== รายละเอียดคะแนนนักเรียนรายบุคคล ===',
    studentHeaders.join(','),
    ...studentRows.map(r => r.join(','))
  ].join('\n');

  if (typeof document !== 'undefined' && typeof URL !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FlowchartQuest_ClassReport_${classroom.replace('/', '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
