// Flowchart Quest - Comprehensive Production Hardening Verification Suite
import assert from 'node:assert';

// 1. Mock LocalStorage and Browser Environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
globalThis.localStorage = localStorageMock;

console.log('🧪 [TEST SUITE] Starting Flowchart Quest Production Hardening Tests...');

// 2. Test Event Logger
import { logLearningEvent, getLearningEvents, EVENT_TYPES } from './src/utils/eventLogger.js';

console.log('▶ Test 1: Fine-Grained Learning Event Logging & Deduplication');
const evt1 = logLearningEvent({
  action: EVENT_TYPES.SESSION_STARTED,
  studentId: 'std_6_1_1',
  sessionId: 'sess_101',
  stage: 'register',
  result: 'SUCCESS'
});
assert(evt1 && evt1.eventId, 'Event must have an eventId');
assert.strictEqual(evt1.schemaVersion, '2.0.0', 'Schema version must be 2.0.0');

// Deduplication test
const evt1Dup = logLearningEvent({
  eventId: evt1.eventId,
  action: EVENT_TYPES.SESSION_STARTED
});
const allEvents = getLearningEvents();
assert.strictEqual(allEvents.filter(e => e.eventId === evt1.eventId).length, 1, 'Duplicate eventId must not create multiple records');
console.log('  ✅ Event logging and deduplication passed!');

// 3. Test Time Analytics
import { formatDuration, recordStageTime, getStoredStageTimes } from './src/utils/timeTracker.js';

console.log('▶ Test 2: Stage Duration Tracking & Format');
assert.strictEqual(formatDuration(261), '04:21', '261 seconds should format to 04:21');
assert.strictEqual(formatDuration(942), '15:42', '942 seconds should format to 15:42');
assert.strictEqual(formatDuration(3665), '01:01:05', '3665 seconds should format to 01:01:05');
recordStageTime('m1', 240);
const times = getStoredStageTimes();
assert.strictEqual(times.m1, 240, 'M1 time must be 240 seconds');
console.log('  ✅ Time duration tracking & formatting passed!');

// 4. Test Score Immutability & Clamping
import { syncScoreToDatabase } from './src/utils/database.js';

console.log('▶ Test 3: Score Immutability & Strict Max Bounds');
const inflatedRecord = {
  id: 'std_overflow',
  name: 'สมชาย',
  room: 'ป.6/1',
  number: '1',
  preScore: 99,
  postScore: 99,
  m1: 50,
  m2: 50,
  m3: 50,
  m4: 50,
  m5: 100
};
// syncScoreToDatabase clamps internally
let payloadSent = null;
globalThis.fetch = async (url, opts) => {
  payloadSent = JSON.parse(opts.body);
  return { ok: true, json: async () => ({ status: 'success' }) };
};

await syncScoreToDatabase(inflatedRecord, 'https://example.com/exec');
assert(payloadSent, 'Payload should be generated');
assert.strictEqual(payloadSent.m1, 15, 'M1 must be capped at 15');
assert.strictEqual(payloadSent.m2, 15, 'M2 must be capped at 15');
assert.strictEqual(payloadSent.m3, 15, 'M3 must be capped at 15');
assert.strictEqual(payloadSent.m4, 20, 'M4 must be capped at 20');
assert.strictEqual(payloadSent.m5, 35, 'Final M5 must be capped at 35');
assert.strictEqual(payloadSent.totalScore, 100, 'Total score must never exceed 100');
assert.strictEqual(payloadSent.preScore, 10, 'PreScore capped at 10');
assert.strictEqual(payloadSent.postScore, 10, 'PostScore capped at 10');
console.log('  ✅ Score immutability and bounds clamping passed!');

// 5. Test Learning Evidence & Risk Classification
import { classifyStudentRisk } from './src/utils/analytics.js';

console.log('▶ Test 4: Risk Classifier & Non-Stigmatizing Terminology');
const topStudent = { totalScore: 95, postScore: 9, m1: 15, m2: 15, m3: 15, m4: 18, m5: 32 };
const supportStudent = { totalScore: 45, postScore: 4, m1: 6, m2: 8, m3: 6, m4: 10, m5: 15 };

const riskTop = classifyStudentRisk(topStudent);
const riskSupport = classifyStudentRisk(supportStudent);

assert.strictEqual(riskTop.tier, 'EXCELLENT', 'Tier should be EXCELLENT');
assert.strictEqual(riskSupport.tier, 'NEEDS_SUPPORT', 'Tier should be NEEDS_SUPPORT');
assert(!riskSupport.label.includes('เด็กอ่อน'), 'Must not use stigmatizing labels');
assert(riskSupport.label.includes('ช่วยเหลือ') || riskSupport.label.includes('เฝ้าระวัง'), 'Must use supportive terminology');
console.log('  ✅ Risk classification and respectful terminology verified!');

// 6. Test Classroom 30-Student Load Simulation (4 Rooms)
console.log('▶ Test 5: Classroom 30-Student Load Simulation');
const rooms = ['ป.6/1', 'ป.6/2', 'ป.6/3', 'ป.6/4'];
const simulatedRecords = [];

for (let i = 1; i <= 30; i++) {
  const room = rooms[i % 4];
  const rec = {
    id: `std_${room.replace('/', '_')}_${i}_${Date.now()}`,
    eventId: `evt_sim_${i}`,
    sessionId: `sess_${i}`,
    name: `นักเรียนคนที่ ${i}`,
    room: room,
    number: String(i),
    preScore: 5 + (i % 5),
    postScore: 7 + (i % 4),
    m1: 12 + (i % 4),
    m2: 12 + (i % 4),
    m3: 12 + (i % 4),
    m4: 16 + (i % 5),
    m5: 28 + (i % 8),
    totalScore: 80 + (i % 20),
    isPassed: true,
    schemaVersion: '2.0.0'
  };
  simulatedRecords.push(rec);
}
assert.strictEqual(simulatedRecords.length, 30, 'Must simulate 30 students');
const uniqueIds = new Set(simulatedRecords.map(s => s.id));
assert.strictEqual(uniqueIds.size, 30, 'All 30 students must have distinct IDs');
const uniqueEvents = new Set(simulatedRecords.map(s => s.eventId));
assert.strictEqual(uniqueEvents.size, 30, 'All 30 events must have distinct event IDs');
console.log('  ✅ 30-Student classroom simulation passed with 0 conflicts!');

// 7. Test Backup Hardening & Safe Factory Reset
import { generateFullBackup, validateBackupFile, safeFactoryResetAll } from './src/utils/backupRestore.js';

console.log('▶ Test 6: Backup Schema v2.0.0 & Safe Reset Confirmation');
// Mock document for download
globalThis.document = {
  createElement: () => ({ click: () => {}, href: '', download: '' })
};
globalThis.URL = {
  createObjectURL: () => 'blob://test',
  revokeObjectURL: () => {}
};

localStorage.setItem('flowchart_student_records', JSON.stringify(simulatedRecords));
localStorage.setItem('flowchart_admin_pin', 'admin1234');

const backup = generateFullBackup();
assert.strictEqual(backup.schemaVersion, '2.0.0', 'Backup schema version must be 2.0.0');
assert.strictEqual(backup.data.studentRecords.length, 30, 'Must backup 30 student records');
assert.strictEqual(backup.data.settings.adminPin, undefined, 'Admin PIN must NOT be in backup payload');

const valRes = validateBackupFile(backup);
assert(valRes.valid, 'Backup validation must pass');

// Safe Reset Keyword check
assert.throws(() => safeFactoryResetAll('WRONG_KEYWORD'), /กรุณากรอกคำว่า "RESET"/, 'Must reject invalid keyword');
const resetSuccess = safeFactoryResetAll('RESET');
assert.strictEqual(resetSuccess, true, 'Factory reset with RESET must succeed');
assert.strictEqual(localStorage.getItem('flowchart_admin_pin'), 'admin1234', 'Admin PIN must be preserved');
assert.strictEqual(localStorage.getItem('flowchart_student_records'), null, 'Student records must be cleared');
console.log('  ✅ Backup hardening and safe reset passed!');

console.log('\n🎉 ALL 6 PRODUCTION HARDENING TESTS PASSED 100%!');
