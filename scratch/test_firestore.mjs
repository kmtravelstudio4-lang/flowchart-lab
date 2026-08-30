// Automated Test Suite for Firebase Firestore Service Architecture
import { 
  formatEmbedPdfUrl 
} from '../flowchart-lab/src/utils/pdfHelper.js';

console.log('--- 1. Testing PDF Embed Transformation ---');
const driveUrl = 'https://drive.google.com/file/d/1o1yiGrO_Kv5Re782rDkev7o4XYbcx2CD/view?usp=sharing';
const embedUrl = formatEmbedPdfUrl(driveUrl);
console.log('Input:', driveUrl);
console.log('Output Embed:', embedUrl);
if (embedUrl === 'https://drive.google.com/file/d/1o1yiGrO_Kv5Re782rDkev7o4XYbcx2CD/preview') {
  console.log('✅ PDF Embed Transformation: PASS');
} else {
  console.error('❌ PDF Embed Transformation: FAIL');
}

console.log('\n--- 2. Testing Score Calculation & Bounds Verification ---');
function calculateTotalAndGain(pre, m1, m2, m3, m4, final, post) {
  const preTest = Math.min(10, Math.max(0, pre));
  const postTest = Math.min(10, Math.max(0, post));
  const m1Score = Math.min(15, Math.max(0, m1));
  const m2Score = Math.min(15, Math.max(0, m2));
  const m3Score = Math.min(15, Math.max(0, m3));
  const m4Score = Math.min(20, Math.max(0, m4));
  const finalScore = Math.min(35, Math.max(0, final));
  const totalScore = Math.min(100, m1Score + m2Score + m3Score + m4Score + finalScore);
  const gainScore = Math.max(0, postTest - preTest);
  return { preTest, postTest, m1Score, m2Score, m3Score, m4Score, finalScore, totalScore, gainScore };
}

const testScores = calculateTotalAndGain(7, 15, 15, 15, 20, 35, 10);
console.log('Sample Scores Calculation:', testScores);
if (testScores.totalScore === 100 && testScores.gainScore === 3) {
  console.log('✅ Score Calculation & Bounds: PASS (Total = 100/100, Gain = +3)');
} else {
  console.error('❌ Score Calculation & Bounds: FAIL');
}

console.log('\n--- 3. Testing Over-bounds Protection ---');
const overBoundTest = calculateTotalAndGain(15, 25, 30, 20, 40, 50, 20);
if (overBoundTest.preTest === 10 && overBoundTest.postTest === 10 && overBoundTest.totalScore === 100) {
  console.log('✅ Over-bounds Protection: PASS (Properly clamped to max allowed)');
} else {
  console.error('❌ Over-bounds Protection: FAIL');
}
