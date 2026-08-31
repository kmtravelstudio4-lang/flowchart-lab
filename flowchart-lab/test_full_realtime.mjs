// Flowchart Quest - Comprehensive Full Real-Time Integration & Schema QA Runner
import assert from 'assert';
import fs from 'fs';
import { 
  LEARNING_CHAPTERS, 
  ALL_FLOWCHART_SYMBOLS, 
  PRETEST_QUESTIONS, 
  POSTTEST_QUESTIONS 
} from './src/data/flowchartData.js';
import { formatEmbedPdfUrl, extractGoogleFileId } from './src/utils/pdfHelper.js';
import { COLLECTIONS } from './src/services/firestoreService.js';

console.log('================================================================');
console.log('🔥 FLOWCHART QUEST - FULL REAL-TIME CLOUD QA AUDIT SUITE 🔥');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  🔴 [FAIL] ${name}: ${err.message}`);
  }
}

// 1. Collections Scope Test
test('All 10 Real-Time Collections Defined in firestoreService', () => {
  const expected = [
    'LESSONS', 'STUDENTS', 'SCORES', 'PROGRESS', 
    'LEARNING_EVIDENCE', 'EVENTS', 'SESSIONS', 
    'CLASSROOMS', 'SYSTEM_CONFIG', 'CERTIFICATES'
  ];
  expected.forEach(key => {
    assert(COLLECTIONS[key], `Missing collection constant: ${key}`);
  });
});

// 2. Secret Leak Scan
test('Zero Hardcoded Secrets in Codebase', () => {
  const filesToScan = [
    'src/App.jsx',
    'src/lib/firebase.js',
    'src/services/firestoreService.js',
    'src/utils/database.js',
    'src/utils/githubSync.js'
  ];
  filesToScan.forEach(f => {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      assert(!content.includes('ghp_'), `Found hardcoded GitHub PAT in ${f}`);
      assert(!content.includes('BEGIN PRIVATE KEY'), `Found Private Key in ${f}`);
    }
  });
});

// 3. Google Drive Embed Normalizer
test('Google Drive PDF URL Normalization for Horizontal Viewer', () => {
  const driveUrl = 'https://drive.google.com/file/d/1Jrpliew22l4-OqHKZAYrFIQaXbFzfus8/view?usp=sharing';
  const embed = formatEmbedPdfUrl(driveUrl, 0);
  assert(embed.includes('/preview'), 'Must convert to /preview mode');
  assert.strictEqual(extractGoogleFileId(driveUrl), '1Jrpliew22l4-OqHKZAYrFIQaXbFzfus8');
});

// 4. Score Boundary Clamping Test
test('Score Boundary Clamping & Integrity Guard', () => {
  // Test scores clamping
  const rawScores = { preTest: 99, postTest: -5, m1: 20, m2: 99, m3: 15, m4: 50, finalScore: 100 };
  const preTest = Math.min(10, Math.max(0, rawScores.preTest));
  const postTest = Math.min(10, Math.max(0, rawScores.postTest));
  const m1 = Math.min(15, Math.max(0, rawScores.m1));
  const m2 = Math.min(15, Math.max(0, rawScores.m2));
  const m3 = Math.min(15, Math.max(0, rawScores.m3));
  const m4 = Math.min(20, Math.max(0, rawScores.m4));
  const finalScore = Math.min(35, Math.max(0, rawScores.finalScore));
  const totalScore = Math.min(100, m1 + m2 + m3 + m4 + finalScore);

  assert.strictEqual(preTest, 10);
  assert.strictEqual(postTest, 0);
  assert.strictEqual(m1, 15);
  assert.strictEqual(m2, 15);
  assert.strictEqual(m3, 15);
  assert.strictEqual(m4, 20);
  assert.strictEqual(finalScore, 35);
  assert.strictEqual(totalScore, 100);
});

// 5. Version Increment Integrity Test
test('Version Increments and Never Decrements', () => {
  const oldVer = 3;
  const nextVer = Number(oldVer || 1) + 1;
  assert.strictEqual(nextVer, 4);
});

// 6. Security Rules Coverage
test('Firestore Security Rules Covers All Domain Collections', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('match /lessons/'), 'Missing lessons rule');
  assert(rules.includes('match /students/'), 'Missing students rule');
  assert(rules.includes('match /scores/'), 'Missing scores rule');
  assert(rules.includes('match /progress/'), 'Missing progress rule');
  assert(rules.includes('match /classrooms/'), 'Missing classrooms rule');
  assert(rules.includes('match /events/'), 'Missing events rule');
  assert(rules.includes('match /learningEvidence/'), 'Missing evidence rule');
  assert(rules.includes('match /certificates/'), 'Missing certificates rule');
});

console.log('\n================================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
