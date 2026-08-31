import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== RUNNING GAME E2E TELEMETRY TEST ===\n');

async function runTest() {
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  }

  // 1. Create Test Student
  const testNum = Math.floor(Math.random() * 900) + 100;
  const { data: student, error: stdErr } = await supabase
    .from('students')
    .insert({
      first_name: 'น้องเกม',
      last_name: `ทดสอบ${testNum}`,
      classroom: 'ห้อง ป.6/1',
      student_number: testNum
    })
    .select()
    .single();

  assert(!stdErr && student?.id, 'Created test student for game telemetry');
  const studentId = student?.id;

  // 2. Record Wrong Attempt (Learning Attempt)
  const { data: wrongAttempt, error: wrongErr } = await supabase
    .from('activity_attempts')
    .insert({
      student_id: studentId,
      activity_id: 'mission1_symbol_hunter',
      answer: {
        stage_id: 'mission1',
        elapsed_seconds: 45,
        placed: { slot1: 'process', slot2: 'decision' }
      },
      is_correct: false,
      attempt_number: 1
    })
    .select()
    .single();

  assert(!wrongErr && wrongAttempt?.is_correct === false, 'Recorded wrong attempt as learning evidence');

  // 3. Record Correct Attempt on retry
  const { data: correctAttempt, error: corrErr } = await supabase
    .from('activity_attempts')
    .insert({
      student_id: studentId,
      activity_id: 'mission1_symbol_hunter',
      answer: {
        stage_id: 'mission1',
        elapsed_seconds: 90,
        placed: { slot1: 'terminal', slot2: 'process' }
      },
      is_correct: true,
      attempt_number: 2
    })
    .select()
    .single();

  assert(!corrErr && correctAttempt?.is_correct === true, 'Recorded second attempt as correct');

  // 4. Update Progress after attempt
  const { data: progress, error: progErr } = await supabase
    .from('progress')
    .upsert({
      student_id: studentId,
      lesson_id: 'ch1',
      current_stage: 'mission2',
      status: 'in_progress',
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,lesson_id' })
    .select()
    .single();

  assert(!progErr && progress?.current_stage === 'mission2', 'Updated student stage to mission2 without blocking');

  // 5. Verify Attempts Count
  const { data: attempts, error: fetchErr } = await supabase
    .from('activity_attempts')
    .select('*')
    .eq('student_id', studentId);

  assert(!fetchErr && attempts.length === 2, `Student has 2 tracked attempts (${attempts?.length || 0})`);

  // Cleanup test student (Cascade deletes attempts & progress)
  await supabase.from('students').delete().eq('id', studentId);
  console.log('🧹 Cleaned up test student cascade');

  console.log(`\n=== E2E TEST SUMMARY: ${passed}/${total} PASSED ===`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
