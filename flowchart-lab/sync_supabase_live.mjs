import { createClient } from '@supabase/supabase-js';
import { DEFAULT_STUDENT_ROSTER } from './src/data/defaultRoster.js';
import { COMPLETED_EXPERIMENT_SCORES } from './src/data/completedExperimentScores.js';

const SUPABASE_URL = 'https://kqmfwczskodgxyyqyovf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_55TrLUCje5v9M3f54V2wgA_44snz7Wd';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sync() {
  console.log('🔄 Checking Supabase connection and students table...');
  const { data: currentStudents, error: fetchErr } = await supabase.from('students').select('*');
  if (fetchErr) {
    console.error('Error fetching students:', fetchErr);
    return;
  }
  console.log(`Current students in Supabase: ${currentStudents.length}`);

  // Upsert all 120 students
  console.log(`Upserting ${DEFAULT_STUDENT_ROSTER.length} students from master roster...`);
  for (const s of DEFAULT_STUDENT_ROSTER) {
    const { error: upsertErr } = await supabase.from('students').upsert({
      student_code: s.studentCode,
      first_name: s.firstName,
      last_name: s.lastName || '',
      classroom: s.room,
      student_number: Number(s.number),
      registration_source: 'master_roster_sync',
      last_active_at: new Date().toISOString()
    }, {
      onConflict: 'classroom,student_number'
    });

    if (upsertErr) {
      console.warn(`Error upserting ${s.room} no.${s.number} (${s.name}):`, upsertErr.message);
    }
  }

  // Check if there are any students in Supabase that are no longer in master roster
  const validKeys = new Set(DEFAULT_STUDENT_ROSTER.map(s => `${s.room}_${s.number}`));
  const toDelete = currentStudents.filter(s => !validKeys.has(`${s.classroom}_${s.student_number}`));
  if (toDelete.length > 0) {
    console.log(`Found ${toDelete.length} legacy students to clean up:`, toDelete.map(d => `${d.classroom} no.${d.student_number} ${d.first_name}`));
    for (const d of toDelete) {
      const { error: delErr } = await supabase.from('students').delete().eq('id', d.id);
      if (delErr) console.warn(`Error deleting ${d.id}:`, delErr.message);
      else console.log(`Deleted legacy student: ${d.classroom} no.${d.student_number} ${d.first_name}`);
    }
  }

  // Also sync completed experiment score events for each student
  console.log('Syncing score events...');
  const { data: updatedStudents } = await supabase.from('students').select('*');
  for (const s of updatedStudents) {
    const exp = COMPLETED_EXPERIMENT_SCORES.find(e => e.room === s.classroom && Number(e.number) === Number(s.student_number));
    if (exp) {
      await supabase.from('events').insert({
        student_id: s.id,
        event_type: 'score_updated',
        event_name: `บันทึกคะแนนสมบูรณ์: ${s.first_name}`,
        metadata: {
          scores: {
            preScore: exp.preScore,
            postScore: exp.postScore,
            gainScore: exp.gainScore,
            m1: exp.m1,
            m2: exp.m2,
            m3: exp.m3,
            m4: exp.m4,
            m5: exp.m5,
            finalScore: exp.m5,
            total: exp.totalScore,
            totalScore: exp.totalScore,
            isPassed: exp.isPassed,
            performanceLevel: exp.performanceLevel
          }
        }
      });
    }
  }

  const { data: finalStudents } = await supabase.from('students').select('*');
  console.log(`✅ Synchronization complete! Total students in Supabase: ${finalStudents.length}`);
}

sync();
