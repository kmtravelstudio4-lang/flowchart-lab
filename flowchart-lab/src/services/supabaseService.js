// ==============================================================================
// SUPABASE DATA SERVICE LAYER (SINGLE SOURCE OF TRUTH)
// Flowchart Quest (Flowchart Lab)
// ==============================================================================
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { DEFAULT_STUDENT_ROSTER } from '../data/defaultRoster.js';
import { COMPLETED_EXPERIMENT_SCORES, getFullStudentExperimentRecords } from '../data/completedExperimentScores.js';


// Generate consistent student code for lookup
export const generateStudentCode = (classroom, studentNumber, firstName) => {
  const cleanRoom = (classroom || 'room').replace(/[\s/.]/g, '_');
  const cleanName = (firstName || 'student').trim().replace(/\s+/g, '_');
  return `${cleanRoom}_no${studentNumber}_${cleanName}`.toLowerCase();
};

/**
 * 1. STUDENT LOOKUP BY STUDENT CODE / ID / NAME
 * Fast atomic lookup for student entrance by student_code with master roster fallback
 */
export const getStudentByCode = async (studentCode) => {
  const raw = (studentCode || '').trim();
  if (!raw) return { success: false, error: 'กรุณากรอกเลขประจำตัวนักเรียน' };

  const code = raw.toLowerCase();

  // Find in master default roster (120 students from CSV)
  const masterMatch = DEFAULT_STUDENT_ROSTER.find(s => {
    const sCode = String(s.studentCode || '').trim().toLowerCase();
    const sName = String(s.name || '').trim().toLowerCase();
    const sFirst = String(s.firstName || '').trim().toLowerCase();
    const sCleanName = sName.replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*/, '');
    const rawClean = code.replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*/, '');
    
    return sCode === code ||
           sName === code ||
           sFirst === code ||
           sCleanName === rawClean ||
           (rawClean.length >= 3 && sCleanName.includes(rawClean)) ||
           `${s.room}_no${s.number}`.toLowerCase() === code;
  });

  if (!isSupabaseConfigured) {
    if (masterMatch) {
      return {
        success: true,
        student: {
          id: `master_${masterMatch.studentCode}`,
          student_code: masterMatch.studentCode,
          first_name: masterMatch.firstName,
          last_name: masterMatch.lastName || '',
          classroom: masterMatch.room,
          student_number: masterMatch.number,
          created_at: new Date().toISOString()
        }
      };
    }

    try {
      const roster = JSON.parse(localStorage.getItem('flowchart_student_roster') || '[]');
      const found = roster.find(s => 
        (s.studentCode && String(s.studentCode).trim().toLowerCase() === code) ||
        (s.studentId && String(s.studentId).trim().toLowerCase() === code) ||
        (s.name && String(s.name).trim().toLowerCase() === code) ||
        (s.number && String(s.number).trim() === code)
      );
      if (found) {
        return {
          success: true,
          student: {
            id: found.studentId || `local_${found.studentCode || found.number}`,
            student_code: found.studentCode || found.number,
            first_name: found.name.split(' ')[0] || found.name,
            last_name: found.name.split(' ').slice(1).join(' ') || '',
            classroom: found.room,
            student_number: parseInt(found.number, 10) || 1,
            created_at: found.createdAt || new Date().toISOString()
          }
        };
      }
    } catch { /* ignore */ }
    return { success: false, error: `ไม่พบเลขประจำตัว "${raw}" ในระบบทะเบียนนักเรียน` };
  }

  try {
    // 1. Direct query in Supabase by student_code
    let { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('student_code', raw)
      .maybeSingle();

    if (!student) {
      const { data: list } = await supabase
        .from('students')
        .select('*')
        .ilike('student_code', raw);

      if (list && list.length > 0) {
        student = list[0];
      }
    }

    // 2. Query by first name or code match if still not found
    if (!student) {
      const cleanSearch = raw.replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*/, '');
      const { data: nameMatches } = await supabase
        .from('students')
        .select('*')
        .or(`first_name.ilike.%${cleanSearch}%,student_code.ilike.%${raw}%`);

      if (nameMatches && nameMatches.length > 0) {
        student = nameMatches[0];
      }
    }

    // 3. If found in Supabase database, return
    if (student) {
      return { success: true, student };
    }

    // 4. If not yet in Supabase table but exists in master roster, auto-register to Supabase!
    if (masterMatch) {
      const regRes = await registerOrGetStudent({
        studentCode: masterMatch.studentCode,
        firstName: masterMatch.firstName,
        lastName: masterMatch.lastName || '',
        classroom: masterMatch.room,
        studentNumber: masterMatch.number,
        source: 'master_roster_auto'
      });

      if (regRes && regRes.success && regRes.student) {
        return { success: true, student: regRes.student };
      }

      // If network registration had an issue, fallback to master match object
      return {
        success: true,
        student: {
          id: `master_${masterMatch.studentCode}`,
          student_code: masterMatch.studentCode,
          first_name: masterMatch.firstName,
          last_name: masterMatch.lastName || '',
          classroom: masterMatch.room,
          student_number: masterMatch.number,
          created_at: new Date().toISOString()
        }
      };
    }

    return { success: false, error: `ไม่พบเลขประจำตัว "${raw}" ในระบบทะเบียนนักเรียน` };
  } catch (err) {
    console.error('[SUPABASE GET STUDENT BY CODE ERROR]:', err);
    if (masterMatch) {
      return {
        success: true,
        student: {
          id: `master_${masterMatch.studentCode}`,
          student_code: masterMatch.studentCode,
          first_name: masterMatch.firstName,
          last_name: masterMatch.lastName || '',
          classroom: masterMatch.room,
          student_number: masterMatch.number,
          created_at: new Date().toISOString()
        }
      };
    }
    return { success: false, error: err.message };
  }
};

/**
 * 2. STUDENT REGISTRATION & ATOMIC LOOKUP (Prevent Duplicates)
 */
export const registerOrGetStudent = async ({
  studentCode = '',
  firstName,
  lastName = '',
  classroom,
  studentNumber,
  source = 'self_registration'
}) => {
  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  const room = (classroom || '').trim();
  const sNum = parseInt(studentNumber, 10) || 0;
  const sCode = (studentCode || '').trim() || generateStudentCode(room, sNum, fName);

  if (!fName || !room || sNum <= 0) {
    return { success: false, error: 'กรุณากรอกชื่อ ห้องเรียน และเลขที่ให้ถูกต้อง' };
  }

  if (!isSupabaseConfigured) {
    const mockId = `local_${Date.now()}`;
    return {
      success: true,
      student: {
        id: mockId,
        student_code: sCode,
        first_name: fName,
        last_name: lName,
        classroom: room,
        student_number: sNum,
        registration_source: source,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      },
      isNew: true
    };
  }

  try {
    const { data: upserted, error: upsertErr } = await supabase
      .from('students')
      .upsert({
        student_code: sCode,
        first_name: fName,
        last_name: lName,
        classroom: room,
        student_number: sNum,
        registration_source: source,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'classroom,student_number'
      })
      .select()
      .single();

    if (upsertErr) {
      console.warn('[SUPABASE UPSERT NOTICE, FALLBACK TO SELECT]:', upsertErr);
      const { data: fallback, error: selErr } = await supabase
        .from('students')
        .select('*')
        .eq('classroom', room)
        .eq('student_number', sNum)
        .maybeSingle();

      if (fallback) {
        return { success: true, student: fallback, isNew: false };
      }
      throw selErr || upsertErr;
    }

    await logEvent({
      studentId: upserted.id,
      eventType: 'student_registered',
      eventName: `นักเรียนเข้าสู่ระบบ: ${fName}`,
      metadata: { student_code: sCode, classroom: room, student_number: sNum, source }
    });

    return { success: true, student: upserted, isNew: true };
  } catch (err) {
    console.error('[SUPABASE REGISTER STUDENT EXCEPTION]:', err);
    return { success: false, error: err.message };
  }
};


/**
 * 2. SESSION LIFECYCLE & HEARTBEAT
 */
export const createSession = async (studentId, deviceId = 'web_client') => {
  if (!isSupabaseConfigured || !studentId) return { success: false };

  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        student_id: studentId,
        device_id: deviceId,
        started_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, session: data };
  } catch (err) {
    console.warn('[SUPABASE CREATE SESSION ERROR]:', err);
    return { success: false, error: err.message };
  }
};

export const updateHeartbeat = async (studentId, sessionId = null) => {
  if (!isSupabaseConfigured || !studentId) return;

  const now = new Date().toISOString();
  try {
    await supabase
      .from('students')
      .update({ last_active_at: now })
      .eq('id', studentId);

    if (sessionId) {
      await supabase
        .from('sessions')
        .update({ last_seen_at: now })
        .eq('id', sessionId);
    }
  } catch (err) {
    // Non-blocking heartbeat failure
    console.debug('[HEARTBEAT TICK]:', err);
  }
};

/**
 * 3. PROGRESS TRACKING (Upsert on student_id + lesson_id)
 */
export const updateStudentProgress = async ({
  studentId,
  lessonId = 'ch1',
  currentStage = 'intro',
  status = 'in_progress'
}) => {
  if (!studentId) return { success: false, error: 'Student ID is required' };
  if (!isSupabaseConfigured) return { success: true, localOnly: true };

  const isCompleted = status === 'completed';
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('progress')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        current_stage: currentStage,
        status: status,
        updated_at: now,
        completed_at: isCompleted ? now : null
      }, {
        onConflict: 'student_id,lesson_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Log progress event
    await logEvent(studentId, isCompleted ? 'lesson_completed' : 'stage_changed', `ความคืบหน้า: ${lessonId} -> ${currentStage}`, {
      lesson_id: lessonId,
      current_stage: currentStage,
      status: status
    });

    return { success: true, progress: data };
  } catch (err) {
    console.error('[SUPABASE UPDATE PROGRESS ERROR]:', err);
    return { success: false, error: err.message };
  }
};

export const fetchStudentProgress = async (studentId) => {
  if (!isSupabaseConfigured || !studentId) return [];

  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[SUPABASE FETCH PROGRESS ERROR]:', err);
    return [];
  }
};

/**
 * 4. ACTIVITY ATTEMPTS TRACKING
 */
export const recordActivityAttempt = async ({
  studentId,
  activityId,
  stageId = 'game',
  answer = null,
  isCorrect = false,
  attemptNumber = 1,
  elapsedSeconds = 0
}) => {
  if (!studentId || !activityId) return { success: false };
  if (!isSupabaseConfigured) return { success: true, localOnly: true };

  const answerPayload = typeof answer === 'object' && answer !== null ? answer : { value: answer };
  if (elapsedSeconds > 0) {
    answerPayload.elapsed_seconds = elapsedSeconds;
  }
  if (stageId) {
    answerPayload.stage_id = stageId;
  }

  try {
    const { data, error } = await supabase
      .from('activity_attempts')
      .insert({
        student_id: studentId,
        activity_id: activityId,
        answer: answerPayload,
        is_correct: isCorrect,
        attempt_number: attemptNumber,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log granular game telemetry events
    const eventType = isCorrect ? 'activity_correct' : 'activity_wrong';
    const eventTitle = isCorrect
      ? `✅ ตอบกิจกรรมถูกต้อง: ${activityId} (ด่าน ${stageId})`
      : `💡 ตอบกิจกรรม: ${activityId} (ด่าน ${stageId}, ครั้งที่ ${attemptNumber})`;

    await logEvent(studentId, eventType, eventTitle, {
      activity_id: activityId,
      stage_id: stageId,
      is_correct: isCorrect,
      attempt_number: attemptNumber,
      elapsed_seconds: elapsedSeconds
    });

    return { success: true, attempt: data };
  } catch (err) {
    console.error('[SUPABASE RECORD ACTIVITY ERROR]:', err);
    return { success: false, error: err.message };
  }
};


export const logEvent = async (param1, eventType, eventName, metadata = {}) => {
  if (!isSupabaseConfigured) return;

  let sId = param1;
  let eType = eventType;
  let eName = eventName;
  let meta = metadata;

  if (typeof param1 === 'object' && param1 !== null && !eventType) {
    sId = param1.studentId || param1.student_id;
    eType = param1.eventType || param1.event_type || param1.type || 'action';
    eName = param1.eventName || param1.event_name || param1.action || 'event';
    meta = param1.metadata || param1.details || {};
  }

  try {
    await supabase.from('events').insert({
      student_id: sId || null,
      event_type: eType || 'action',
      event_name: eName || 'event',
      metadata: meta || {},
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.debug('[EVENT LOG SUPPRESSED]:', err);
  }
};


export const fetchRecentEvents = async (limit = 30) => {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, students(first_name, last_name, classroom, student_number)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[SUPABASE FETCH EVENTS ERROR]:', err);
    return [];
  }
};

/**
 * 6. LESSONS MANAGEMENT (Google Drive PDFs)
 */
export const fetchLessons = async () => {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('chapter_num', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[SUPABASE FETCH LESSONS ERROR]:', err);
    return [];
  }
};

export const saveLessonPdfUrl = async (lessonId, pdfUrl) => {
  if (!isSupabaseConfigured || !lessonId) return { success: false };

  try {
    const { data, error } = await supabase
      .from('lessons')
      .update({
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, lesson: data };
  } catch (err) {
    console.error('[SUPABASE SAVE LESSON PDF ERROR]:', err);
    return { success: false, error: err.message };
  }
};

/**
 * 7. ADMIN OVERVIEW & REAL-TIME SUBSCRIPTIONS
 */
/**
 * Record student live score update to Supabase Events & Activity Attempts in Real-Time
 */
export const recordLiveScore = async ({
  studentId,
  sessionId = null,
  classroom = 'ห้อง ป.6/1',
  studentNumber = 1,
  stageId = 'game',
  scores = {}
}) => {
  if (!studentId) return { success: false };
  if (!isSupabaseConfigured) return { success: true, localOnly: true };

  const payload = {
    scores,
    stage_id: stageId,
    classroom,
    student_number: studentNumber,
    timestamp: new Date().toISOString()
  };

  try {
    const isCompleted = stageId === 'completed' || stageId === 'final' || scores.isCompleted;
    const eventType = isCompleted ? 'COURSE_COMPLETED' : 'score_updated';
    const eventName = isCompleted 
      ? `จบหลักสูตรและผ่านการประเมิน: ${scores.total || scores.totalScore || 0}/100` 
      : `อัปเดตคะแนนสด: ${scores.total || scores.totalScore || 0}/100`;

    // 1. Insert into events
    await supabase.from('events').insert({
      student_id: studentId,
      event_type: eventType,
      event_name: eventName,
      metadata: payload
    });

    // 2. Also update last_active_at on students table for real-time online status
    await supabase
      .from('students')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', studentId);

    return { success: true };
  } catch (err) {
    console.debug('[RECORD LIVE SCORE ERROR]:', err);
    return { success: false, error: err.message };
  }
};

export const fetchAdminDashboardData = async () => {
  if (!isSupabaseConfigured) {
    const fallbackStudents = getFullStudentExperimentRecords();
    return { students: fallbackStudents, progress: [], events: [], classrooms: [] };
  }

  try {
    const [studentsRes, progressRes, eventsRes, classroomsRes] = await Promise.all([
      supabase.from('students').select('*').order('last_active_at', { ascending: false }),
      supabase.from('progress').select('*'),
      supabase.from('events').select('*, students(first_name, last_name, classroom, student_number)').order('created_at', { ascending: false }).limit(2000),
      supabase.from('classrooms').select('*').order('code', { ascending: true })
    ]);

    const students = studentsRes.data || [];
    const events = eventsRes.data || [];

    // Correlate latest score events onto each student with completed experiment dataset fallback
    const studentsWithScores = students.map(s => {
      const studentEvents = events.filter(e => (e.student_id === s.id) && (e.event_type === 'score_updated' || e.event_type === 'COURSE_COMPLETED' || e.metadata?.scores));
      const latestScoreEvent = studentEvents[0]; // ordered desc
      let rawScores = latestScoreEvent?.metadata?.scores || latestScoreEvent?.metadata || {};

      // Fallback to static master completed experiment record if rawScores is empty
      if (!rawScores.total && !rawScores.totalScore && rawScores.m1 === undefined) {
        const expMatch = COMPLETED_EXPERIMENT_SCORES.find(e => e.room === s.classroom && Number(e.number) === Number(s.student_number));
        if (expMatch) {
          rawScores = {
            preScore: expMatch.preScore,
            postScore: expMatch.postScore,
            gainScore: expMatch.gainScore,
            m1: expMatch.m1,
            m2: expMatch.m2,
            m3: expMatch.m3,
            m4: expMatch.m4,
            m5: expMatch.m5,
            finalScore: expMatch.m5,
            total: expMatch.totalScore,
            totalScore: expMatch.totalScore,
            isPassed: expMatch.isPassed,
            performanceLevel: expMatch.performanceLevel
          };
        }
      }

      return {
        ...s,
        id: s.id,
        studentId: s.id,
        studentCode: s.student_code || '',
        name: `${s.first_name} ${s.last_name}`.trim(),
        room: s.classroom,
        number: s.student_number,
        preScore: rawScores.preScore !== undefined ? rawScores.preScore : null,
        postScore: rawScores.postScore !== undefined ? rawScores.postScore : null,
        gainScore: rawScores.gainScore !== undefined ? rawScores.gainScore : 0,
        m1: rawScores.m1 !== undefined ? rawScores.m1 : 0,
        m2: rawScores.m2 !== undefined ? rawScores.m2 : 0,
        m3: rawScores.m3 !== undefined ? rawScores.m3 : 0,
        m4: rawScores.m4 !== undefined ? rawScores.m4 : 0,
        m5: rawScores.m5 !== undefined ? rawScores.m5 : 0,
        totalScore: rawScores.total !== undefined ? rawScores.total : (rawScores.totalScore !== undefined ? rawScores.totalScore : 0),
        isPassed: rawScores.total !== undefined ? rawScores.total >= 60 : (rawScores.totalScore !== undefined ? rawScores.totalScore >= 60 : false),
        performanceLevel: rawScores.performanceLevel || (rawScores.total >= 90 ? 'ดีเยี่ยม / ผ่าน' : rawScores.total >= 80 ? 'ดี / ผ่าน' : rawScores.total >= 60 ? 'พอใช้ / ผ่าน' : 'ปรับปรุง')
      };
    });

    return {
      students: studentsWithScores,
      progress: progressRes.data || [],
      events: events,
      classrooms: classroomsRes.data || []
    };
  } catch (err) {
    console.error('[SUPABASE FETCH ADMIN DATA ERROR]:', err);
    return { students: getFullStudentExperimentRecords(), progress: [], events: [], classrooms: [] };
  }
};

/**
 * Subscribe to Supabase Realtime Channels for Admin & Teacher Dashboard
 * @param {Object} callbacks
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeAdminRealtime = ({
  onStudentChange,
  onProgressChange,
  onEventChange,
  onStatusChange
}) => {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('flowchart_quest_live_feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
      if (typeof onStudentChange === 'function') onStudentChange(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, (payload) => {
      if (typeof onProgressChange === 'function') onProgressChange(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
      if (typeof onEventChange === 'function') onEventChange(payload);
    })
    .subscribe((status) => {
      if (typeof onStatusChange === 'function') {
        onStatusChange(status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Check if a student is Active (heartbeat within 2 mins), Idle (2-10 mins), or Offline (> 10 mins)
 */
export const computeOnlineStatus = (lastActiveAt) => {
  if (!lastActiveAt) return { status: 'offline', label: 'ออฟไลน์', labelEn: 'Offline', color: 'bg-slate-100 text-slate-600 border border-slate-200' };

  const diffMs = Date.now() - new Date(lastActiveAt).getTime();
  const diffMins = diffMs / (1000 * 60);

  if (diffMins <= 2) {
    return { status: 'active', label: 'กำลังใช้งานสด', labelEn: 'Active', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
  }
  if (diffMins <= 10) {
    return { status: 'idle', label: 'ไม่ได้ใช้งานสักพัก', labelEn: 'Idle', color: 'bg-amber-100 text-amber-800 border border-amber-300' };
  }
  return { status: 'offline', label: 'ออฟไลน์', labelEn: 'Offline', color: 'bg-slate-100 text-slate-600 border border-slate-200' };
};

