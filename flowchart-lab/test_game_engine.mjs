import { 
  STAGES_CONFIG, 
  TIMER_STATES, 
  formatTimeMMSS, 
  getStageConfig, 
  getContextualFeedback, 
  FEEDBACK_EXPLANATIONS 
} from './src/engine/gameEngine.js';

console.log('=== RUNNING GAME ENGINE TEST SUITE ===\n');

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

// 1. Test Timer Formatting
assert(formatTimeMMSS(180) === '03:00', 'formatTimeMMSS(180) should be 03:00');
assert(formatTimeMMSS(75) === '01:15', 'formatTimeMMSS(75) should be 01:15');
assert(formatTimeMMSS(5) === '00:05', 'formatTimeMMSS(5) should be 00:05');
assert(formatTimeMMSS(0) === '00:00', 'formatTimeMMSS(0) should be 00:00');
assert(formatTimeMMSS(-10) === '00:00', 'formatTimeMMSS(-10) should clamp to 00:00');

// 2. Test All 8 Stages Configuration
const stageKeys = ['pretest', 'learning', 'mission1', 'mission2', 'mission3', 'mission4', 'final', 'posttest'];
stageKeys.forEach((key, idx) => {
  const cfg = getStageConfig(key);
  assert(cfg.stageNumber === idx + 1, `Stage ${key} has correct stageNumber ${idx + 1}`);
  assert(typeof cfg.timeLimit === 'number' && cfg.timeLimit >= 120, `Stage ${key} has valid timeLimit >= 120s`);
  assert(cfg.allowContinueOnWrong === true, `Stage ${key} enforces allowContinueOnWrong: true`);
  assert(Boolean(cfg.title), `Stage ${key} has title`);
});

// 3. Test Contextual Feedback Engine (Non-blocking & Encouraging)
const concepts = ['terminal', 'process', 'decision', 'input_output', 'connector', 'flowline', 'default'];
concepts.forEach(concept => {
  const correctFb = getContextualFeedback(concept, true);
  assert(correctFb.canContinue === true, `Correct feedback for ${concept} canContinue is true`);
  assert(correctFb.title.includes('ยอดเยี่ยม') || correctFb.title.includes('ถูกต้อง'), `Correct feedback for ${concept} has positive title`);

  const wrongFb = getContextualFeedback(concept, false);
  assert(wrongFb.canContinue === true, `Wrong feedback for ${concept} canContinue is ALWAYS true (No lock)`);
  assert(wrongFb.title.includes('เรียนรู้'), `Wrong feedback for ${concept} is encouraging learning`);
  assert(Boolean(wrongFb.message), `Wrong feedback for ${concept} contains helpful explanation`);
});

// 4. Test Custom Explanation override
const customFb = getContextualFeedback('process', false, 'การคำนวณต้องใช้สี่เหลี่ยมผืนผ้า');
assert(customFb.message === 'การคำนวณต้องใช้สี่เหลี่ยมผืนผ้า', 'Custom explanation overrides default message');
assert(customFb.canContinue === true, 'Custom explanation still allows continue');

// 5. Test Timer States
assert(TIMER_STATES.NOT_STARTED === 'NOT_STARTED', 'TIMER_STATES.NOT_STARTED exists');
assert(TIMER_STATES.RUNNING === 'RUNNING', 'TIMER_STATES.RUNNING exists');
assert(TIMER_STATES.PAUSED === 'PAUSED', 'TIMER_STATES.PAUSED exists');
assert(TIMER_STATES.TIME_UP === 'TIME_UP', 'TIMER_STATES.TIME_UP exists');
assert(TIMER_STATES.COMPLETED === 'COMPLETED', 'TIMER_STATES.COMPLETED exists');

console.log(`\n=== TEST SUMMARY: ${passed}/${total} PASSED ===`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
