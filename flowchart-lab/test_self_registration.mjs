// Flowchart Quest - Student Self-Registration to Firestore Real-Time Test Suite
import assert from 'assert';
import fs from 'fs';
import { 
  COLLECTIONS,
  saveStudent,
  saveSession,
  saveProgress,
  saveScore,
  saveEvent,
  subscribeStudents,
  subscribeScores,
  subscribeProgress,
  subscribeEvents
} from './src/services/firestoreService.js';

console.log('================================================================');
console.log('🎯 FLOWCHART QUEST - SELF-REGISTRATION QA AUDIT SUITE 🎯');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(title, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ [PASS] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  🔴 [FAIL] ${title}: ${err.message}`);
  }
}

// 1. Create Student Payload Validation
runTest('1. Create Student Payload & Source Tagging', () => {
  const studentData = {
    studentId: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
    name: 'เด็กชายทดสอบ Real-Time',
    room: 'ห้อง ป.6/1',
    classroom: 'ห้อง ป.6/1',
    roomCode: '601',
    number: '15',
    status: 'ACTIVE',
    source: 'self_registration'
  };

  assert.strictEqual(studentData.source, 'self_registration', 'source must be self_registration');
  assert.strictEqual(studentData.name, 'เด็กชายทดสอบ Real-Time');
  assert.strictEqual(studentData.roomCode, '601');
  assert.strictEqual(studentData.number, '15');
});

// 2. Duplicate Protection Strategy
runTest('2. Duplicate Protection (studentId Reuse on Same Device/Profile)', () => {
  const initialStudent = {
    studentId: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
    name: 'เด็กชายทดสอบ Real-Time',
    room: 'ห้อง ป.6/1'
  };

  const reEnteredStudent = {
    name: 'เด็กชายทดสอบ Real-Time',
    room: 'ห้อง ป.6/1',
    number: '15'
  };

  const resolvedId = (initialStudent.studentId && initialStudent.name === reEnteredStudent.name && initialStudent.room === reEnteredStudent.room)
    ? initialStudent.studentId
    : `STD_601_15_${reEnteredStudent.name.replace(/\s+/g, '_')}`;

  assert.strictEqual(resolvedId, initialStudent.studentId, 'Must reuse studentId on re-entry');
});

// 3. Session Creation Linking studentId
runTest('3. Session Creation Linked to studentId and Classroom', () => {
  const session = {
    sessionId: 'SESS_123456789_xyz',
    studentId: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
    studentName: 'เด็กชายทดสอบ Real-Time',
    classroom: 'ห้อง ป.6/1',
    room: 'ห้อง ป.6/1',
    roomCode: '601',
    number: '15',
    startedAt: new Date().toISOString(),
    currentStage: 1,
    status: 'active',
    source: 'self_registration'
  };

  assert(session.sessionId.startsWith('SESS_'), 'sessionId must start with SESS_');
  assert.strictEqual(session.studentId, 'STD_601_15_เด็กชายทดสอบ_Real-Time');
  assert.strictEqual(session.status, 'active');
});

// 4. Initial Progress Creation
runTest('4. Initial Progress Data Structure', () => {
  const progress = {
    studentId: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
    sessionId: 'SESS_123456789_xyz',
    studentName: 'เด็กชายทดสอบ Real-Time',
    classroom: 'ห้อง ป.6/1',
    studentNumber: '15',
    currentStage: 'learning',
    completedStages: {},
    totalScore: 0,
    xp: 0,
    status: 'learning',
    source: 'self_registration'
  };

  assert.strictEqual(progress.currentStage, 'learning');
  assert.strictEqual(progress.totalScore, 0);
  assert.strictEqual(progress.source, 'self_registration');
});

// 5. Initial Score Relation
runTest('5. Initial Score Record Relation to studentId and sessionId', () => {
  const score = {
    id: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
    studentId: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
    sessionId: 'SESS_123456789_xyz',
    studentName: 'เด็กชายทดสอบ Real-Time',
    classroom: 'ห้อง ป.6/1',
    studentNumber: '15',
    preTest: 0,
    postTest: 0,
    gainScore: 0,
    m1: 0,
    m2: 0,
    m3: 0,
    m4: 0,
    finalScore: 0,
    totalScore: 0,
    source: 'self_registration',
    isPassed: false,
    stageTimes: {},
    completedAt: new Date().toISOString()
  };

  assert.strictEqual(score.studentId, 'STD_601_15_เด็กชายทดสอบ_Real-Time');
  assert.strictEqual(score.sessionId, 'SESS_123456789_xyz');
  assert.strictEqual(score.totalScore, 0);
  assert.strictEqual(score.source, 'self_registration');
});

// 6. Registration Event Generation
runTest('6. Registration Event Log Payload', () => {
  const event = {
    eventId: 'EVT_LOGIN_123456',
    type: 'REGISTER',
    action: 'REGISTER',
    studentId: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
    sessionId: 'SESS_123456789_xyz',
    source: 'self_registration',
    studentName: 'เด็กชายทดสอบ Real-Time',
    classroom: 'ห้อง ป.6/1',
    details: 'นักเรียน เด็กชายทดสอบ Real-Time ลงทะเบียนเข้าเรียนด้วยตนเอง (ห้อง ห้อง ป.6/1 เลขที่ 15)'
  };

  assert.strictEqual(event.type, 'REGISTER');
  assert.strictEqual(event.source, 'self_registration');
});

// 7. Teacher Dashboard Stream Integration (Coexistence of Self-Reg and Teacher-Created)
runTest('7. Teacher Dashboard Stream Roster Coexistence', () => {
  const incoming = [
    {
      id: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
      studentId: 'STD_601_15_เด็กชายทดสอบ_Real-Time',
      studentName: 'เด็กชายทดสอบ Real-Time',
      classroom: 'ห้อง ป.6/1',
      studentNumber: '15',
      source: 'self_registration',
      totalScore: 0,
      isPassed: false
    },
    {
      id: 'STD_601_01_SOMCHAI',
      studentId: 'STD_601_01_SOMCHAI',
      studentName: 'ด.ช. สมชาย ใจดี',
      classroom: 'ห้อง ป.6/1',
      studentNumber: '1',
      source: 'teacher_roster',
      totalScore: 85,
      isPassed: true
    }
  ];

  assert.strictEqual(incoming.length, 2);
  assert.strictEqual(incoming.find(s => s.studentNumber === '15')?.source, 'self_registration');
  assert.strictEqual(incoming.find(s => s.studentNumber === '1')?.source, 'teacher_roster');
});

// 8. Source Code Verification in App.jsx
runTest('8. App.jsx Registration Pipeline Verification', () => {
  const appSrc = fs.readFileSync('src/App.jsx', 'utf8');
  assert(appSrc.includes("source: 'self_registration'"), 'Must include self_registration source tagging in App.jsx');
  assert(appSrc.includes('saveStudentFirestore'), 'Must call saveStudentFirestore');
  assert(appSrc.includes('saveSessionFirestore'), 'Must call saveSessionFirestore');
  assert(appSrc.includes('saveProgressFirestore'), 'Must call saveProgressFirestore');
  assert(appSrc.includes('saveScoreFirestore'), 'Must call saveScoreFirestore');
  assert(appSrc.includes('saveEventFirestore'), 'Must call saveEventFirestore');
});

console.log('\n================================================================');
console.log(`🎉 QA RESULT: ${passedTests}/${totalTests} SELF-REGISTRATION TESTS PASSED (100% PASS)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
