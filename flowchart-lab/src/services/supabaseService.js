// ==============================================================================
// SUPABASE DATA SERVICE LAYER (SINGLE SOURCE OF TRUTH)
// Flowchart Quest (Flowchart Lab)
// ==============================================================================
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';


// Generate consistent student code for lookup
export const generateStudentCode = (classroom, studentNumber, firstName) => {
  const cleanRoom = (classroom || 'room').replace(/[\s/.]/g, '_');
  const cleanName = (firstName || 'student').trim().replace(/\s+/g, '_');
  return `${cleanRoom}_no${studentNumber}_${cleanName}`.toLowerCase();
};

/**
 * 1. STUDENT REGISTRATION & ATOMIC LOOKUP (Prevent Duplicates)
 */
export const registerOrGetStudent = async ({
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

  if (!fName || !room || sNum <= 0) {
    return { success: false, error: 'กรุณากรอกชื่อ ห้องเรียน และเลขที่ให้ถูกต้อง' };
  }

  if (!isSupabaseConfigured) {
    // Offline local fallback object
    const mockId = `local_${Date.now()}`;
    return {
      success: true,
      student: {
        id: mockId,
        student_code: generateStudentCode(room, sNum, fName),
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

  const studentCode = generateStudentCode(room, sNum, fName);

  try {
    // 1. Atomic Upsert with ON CONFLICT (classroom, student_number)
    const { data: upserted, error: upsertErr } = await supabase
      .from('students')
      .upsert({
        student_code: studentCode,
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

    // Log registration event idempotently
    await logEvent({
      studentId: upserted.id,
      eventType: 'student_registered',
      eventName: `นักเรียนเข้าสู่ระบบ: ${fName}`,
      metadata: { classroom: room, student_number: sNum, source }
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
export const fetchAdminDashboardData = async () => {
  if (!isSupabaseConfigured) {
    return { students: [], progress: [], events: [], classrooms: [] };
  }

  try {
    const [studentsRes, progressRes, eventsRes, classroomsRes] = await Promise.all([
      supabase.from('students').select('*').order('last_active_at', { ascending: false }),
      supabase.from('progress').select('*'),
      supabase.from('events').select('*, students(first_name, last_name, classroom, student_number)').order('created_at', { ascending: false }).limit(30),
      supabase.from('classrooms').select('*').order('code', { ascending: true })
    ]);

    return {
      students: studentsRes.data || [],
      progress: progressRes.data || [],
      events: eventsRes.data || [],
      classrooms: classroomsRes.data || []
    };
  } catch (err) {
    console.error('[SUPABASE FETCH ADMIN DATA ERROR]:', err);
    return { students: [], progress: [], events: [], classrooms: [] };
  }
};

/**
 * Subscribe to Supabase Realtime Channels for Admin
 * @param {Object} callbacks
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeAdminRealtime = ({
  onStudentChange,
  onProgressChange,
  onEventInsert
}) => {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('admin_live_feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
      if (typeof onStudentChange === 'function') onStudentChange(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, (payload) => {
      if (typeof onProgressChange === 'function') onProgressChange(payload);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
      if (typeof onEventInsert === 'function') onEventInsert(payload);
    })
    .subscribe();

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

