// Flowchart Quest - Comprehensive Real-Time Firestore Database Engine (Full Cloud Migration Certified)
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from '../lib/firebase.js';
import { formatEmbedPdfUrl } from '../utils/pdfHelper.js';


// Collection Names (All 10 Core Educational & Progress Domains)
export const COLLECTIONS = {
  LESSONS: 'lessons',
  STUDENTS: 'students',
  SCORES: 'scores',
  PROGRESS: 'progress',
  LEARNING_EVIDENCE: 'learningEvidence',
  EVENTS: 'events',
  SESSIONS: 'sessions',
  CLASSROOMS: 'classrooms',
  SYSTEM_CONFIG: 'systemConfig',
  CERTIFICATES: 'certificates',
  QUESTION_BANK: 'questionBank'
};

/**
 * =========================================================================
 * 1. LESSONS MANAGEMENT (Real-Time Single Source of Truth)
 * =========================================================================
 */

export function subscribeLessons(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const lessonsCol = collection(db, COLLECTIONS.LESSONS);
    const q = query(lessonsCol, orderBy('chapterNum', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const lessons = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const rawPdf = (d.pdfUrl || d.drivePdfUrl || d.driveUrl || d.googleDriveUrl || '').trim();
        lessons.push({
          id: docSnap.id,
          ...d,
          pdfUrl: rawPdf,
          embedUrl: rawPdf ? formatEmbedPdfUrl(rawPdf) : (d.embedUrl || '')
        });
      });

      console.log('[FIRESTORE LESSON SNAPSHOT]', {
        timestamp: new Date().toLocaleTimeString('th-TH'),
        docCount: lessons.length,
        fromCache: snapshot.metadata.fromCache
      });

      if (lessons.length > 0 && typeof onUpdate === 'function') {
        onUpdate(lessons, { fromCache: snapshot.metadata.fromCache, size: lessons.length });
      }
    }, (err) => {
      console.warn('[FIRESTORE LESSONS LISTENER ERROR]:', err.message);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE LESSONS INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveLesson(lessonId, lessonData) {
  if (!lessonId) return { success: false, message: 'กรุณาระบุรหัสบทเรียน (lessonId)' };
  try {
    const db = getFirebaseDb();
    const lessonRef = doc(db, COLLECTIONS.LESSONS, lessonId);
    const rawPdf = (lessonData.pdfUrl || lessonData.drivePdfUrl || lessonData.driveUrl || lessonData.googleDriveUrl || '').trim();
    const embedUrl = rawPdf ? formatEmbedPdfUrl(rawPdf) : '';
    const nextVersion = Number(lessonData.version || 1) + 1;

    const payload = {
      ...lessonData,
      id: lessonId,
      pdfUrl: rawPdf,
      embedUrl,
      updatedAt: serverTimestamp(),
      version: nextVersion,
      active: lessonData.active !== false
    };

    await setDoc(lessonRef, payload, { merge: true });

    // Read-back verification
    const verifySnap = await getDoc(lessonRef);
    if (!verifySnap.exists()) {
      throw new Error('Read-back verification failed: Document not found in Firestore after write');
    }

    const savedData = verifySnap.data();
    return {
      success: true,
      data: savedData,
      message: `✅ บันทึกบทเรียน ${lessonData.title || lessonId} ลง Firestore สำเร็จ (Version ${nextVersion})!`
    };
  } catch (err) {
    console.error('[FIRESTORE SAVE LESSON ERROR]:', err);
    return { success: false, message: `🔴 บันทึกบทเรียนไม่สำเร็จ: ${err.message}` };
  }
}

export async function seedDefaultLessonsIfEmpty(defaultList) {
  if (!Array.isArray(defaultList) || defaultList.length === 0) return { seeded: false, count: 0 };
  try {
    const db = getFirebaseDb();
    const snapshot = await getDocs(collection(db, COLLECTIONS.LESSONS));
    if (!snapshot.empty && snapshot.size > 0) {
      return { seeded: false, count: snapshot.size };
    }

    const batch = writeBatch(db);
    defaultList.forEach((ch, idx) => {
      const chId = ch.id || `ch${idx + 1}`;
      const chRef = doc(db, COLLECTIONS.LESSONS, chId);
      const rawPdf = (ch.pdfUrl || ch.drivePdfUrl || ch.driveUrl || ch.googleDriveUrl || '').trim();
      batch.set(chRef, {
        ...ch,
        id: chId,
        chapterNum: ch.chapterNum || (idx + 1),
        pdfUrl: rawPdf,
        embedUrl: rawPdf ? formatEmbedPdfUrl(rawPdf) : '',
        updatedAt: serverTimestamp(),
        version: 1,
        active: true
      }, { merge: true });
    });

    await batch.commit();
    return { seeded: true, count: defaultList.length };
  } catch (err) {
    console.warn('[FIRESTORE SEED LESSONS WARNING]:', err.message);
    return { seeded: false, count: 0, error: err.message };
  }
}

/**
 * =========================================================================
 * 2. CLASSROOMS MANAGEMENT (Real-Time Classrooms & Room PINs)
 * =========================================================================
 */

export function subscribeClassrooms(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.CLASSROOMS);
    return onSnapshot(col, (snapshot) => {
      const rooms = [];
      snapshot.forEach((d) => rooms.push({ id: d.id, ...d.data() }));
      if (rooms.length > 0 && typeof onUpdate === 'function') {
        onUpdate(rooms);
      }
    }, (err) => {
      console.warn('[FIRESTORE CLASSROOMS LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE CLASSROOMS INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveClassroom(roomData) {
  const roomId = roomData.id || `room_${roomData.code || Date.now()}`;
  try {
    const db = getFirebaseDb();
    const rRef = doc(db, COLLECTIONS.CLASSROOMS, roomId);
    await setDoc(rRef, {
      ...roomData,
      id: roomId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE CLASSROOM ERROR]:', err);
    return false;
  }
}

export async function seedDefaultClassroomsIfEmpty(defaultRooms) {
  if (!Array.isArray(defaultRooms) || defaultRooms.length === 0) return { seeded: false, count: 0 };
  try {
    const db = getFirebaseDb();
    const snapshot = await getDocs(collection(db, COLLECTIONS.CLASSROOMS));
    if (!snapshot.empty && snapshot.size > 0) return { seeded: false, count: snapshot.size };

    const batch = writeBatch(db);
    defaultRooms.forEach((r) => {
      const rRef = doc(db, COLLECTIONS.CLASSROOMS, r.id);
      batch.set(rRef, { ...r, updatedAt: serverTimestamp() }, { merge: true });
    });
    await batch.commit();
    return { seeded: true, count: defaultRooms.length };
  } catch (err) {
    console.warn('[FIRESTORE SEED CLASSROOMS WARNING]:', err);
    return { seeded: false, count: 0 };
  }
}

/**
 * =========================================================================
 * 3. STUDENTS & ROSTER MANAGEMENT (Real-Time Student Profiles)
 * =========================================================================
 */

export function subscribeStudents(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.STUDENTS);
    return onSnapshot(col, (snapshot) => {
      const students = [];
      snapshot.forEach((d) => students.push({ id: d.id, ...d.data() }));
      if (typeof onUpdate === 'function') onUpdate(students);
    }, (err) => {
      console.warn('[FIRESTORE STUDENTS LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE STUDENTS INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveStudent(studentData) {
  const studentKey = studentData.studentId || studentData.id;
  if (!studentKey) return false;
  try {
    const db = getFirebaseDb();
    const sRef = doc(db, COLLECTIONS.STUDENTS, studentKey);
    await setDoc(sRef, {
      ...studentData,
      studentId: studentKey,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE STUDENT ERROR]:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 4. SCORES & ASSESSMENT REAL-TIME
 * =========================================================================
 */

export function subscribeScores(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.SCORES);
    return onSnapshot(col, (snapshot) => {
      const scores = [];
      snapshot.forEach((d) => scores.push({ id: d.id, ...d.data() }));
      if (typeof onUpdate === 'function') onUpdate(scores);
    }, (err) => {
      console.warn('[FIRESTORE SCORES LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE SCORES INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveScore(scoreData) {
  const studentKey = scoreData?.studentId || scoreData?.id;
  if (!studentKey) return false;

  try {
    const db = getFirebaseDb();
    const scoreRef = doc(db, COLLECTIONS.SCORES, studentKey);

    const preTest = Math.min(10, Math.max(0, Number(scoreData.preTest ?? scoreData.preScore ?? 0)));
    const postTest = Math.min(10, Math.max(0, Number(scoreData.postTest ?? scoreData.postScore ?? 0)));
    const m1 = Math.min(15, Math.max(0, Number(scoreData.m1 ?? 0)));
    const m2 = Math.min(15, Math.max(0, Number(scoreData.m2 ?? 0)));
    const m3 = Math.min(15, Math.max(0, Number(scoreData.m3 ?? 0)));
    const m4 = Math.min(20, Math.max(0, Number(scoreData.m4 ?? 0)));
    const finalScore = Math.min(35, Math.max(0, Number(scoreData.finalScore ?? scoreData.m5 ?? 0)));
    const totalScore = Math.min(100, m1 + m2 + m3 + m4 + finalScore);
    const gainScore = Math.max(0, postTest - preTest);

    const payload = {
      studentId: studentKey,
      studentName: scoreData.studentName || scoreData.name || '',
      classroom: scoreData.classroom || scoreData.room || '',
      studentNumber: scoreData.studentNumber || scoreData.number || '',
      preTest,
      postTest,
      m1,
      m2,
      m3,
      m4,
      finalScore,
      totalScore,
      gainScore,
      isPassed: totalScore >= 60,
      sessionId: scoreData.sessionId || '',
      source: scoreData.source || 'self_registration',
      stageTimes: scoreData.stageTimes || {},
      completedAt: scoreData.completedAt || new Date().toISOString(),
      updatedAt: serverTimestamp()
    };


    await setDoc(scoreRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE SCORE ERROR]:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 5. LIVE STUDENT PROGRESS & XP TRACKING
 * =========================================================================
 */

export function subscribeProgress(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.PROGRESS);
    return onSnapshot(col, (snapshot) => {
      const progressList = [];
      snapshot.forEach((d) => progressList.push({ id: d.id, ...d.data() }));
      if (typeof onUpdate === 'function') onUpdate(progressList);
    }, (err) => {
      console.warn('[FIRESTORE PROGRESS LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE PROGRESS INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveProgress(progressData) {
  const studentKey = progressData?.studentId || progressData?.id;
  if (!studentKey) return false;

  try {
    const db = getFirebaseDb();
    const pRef = doc(db, COLLECTIONS.PROGRESS, studentKey);
    await setDoc(pRef, {
      ...progressData,
      studentId: studentKey,
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE PROGRESS ERROR]:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 6. LEARNING EVIDENCE & RUBRICS
 * =========================================================================
 */

export function subscribeEvidence(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.LEARNING_EVIDENCE);
    const q = query(col, orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      if (typeof onUpdate === 'function') onUpdate(list);
    }, (err) => {
      console.warn('[FIRESTORE EVIDENCE LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE EVIDENCE INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveEvidence(evidenceData) {
  const evidenceId = evidenceData.evidenceId || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const db = getFirebaseDb();
    const evRef = doc(db, COLLECTIONS.LEARNING_EVIDENCE, evidenceId);
    await setDoc(evRef, {
      ...evidenceData,
      evidenceId,
      createdAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE EVIDENCE ERROR]:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 7. EVENT LOGS & ACTIVITY TELEMETRY
 * =========================================================================
 */

export function subscribeEvents(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.EVENTS);
    const q = query(col, orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      if (typeof onUpdate === 'function') onUpdate(list);
    }, (err) => {
      console.warn('[FIRESTORE EVENTS LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE EVENTS INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveEvent(eventData) {
  const eventId = eventData.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const db = getFirebaseDb();
    const evRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await setDoc(evRef, {
      ...eventData,
      eventId,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE EVENT ERROR]:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 8. SESSIONS MANAGEMENT
 * =========================================================================
 */

export function subscribeSessions(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.SESSIONS);
    const q = query(col, orderBy('lastPingAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      if (typeof onUpdate === 'function') onUpdate(list);
    }, (err) => {
      console.warn('[FIRESTORE SESSIONS LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE SESSIONS INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveSession(sessionData) {
  const sessionId = sessionData.sessionId || `sess_${Date.now()}`;
  try {
    const db = getFirebaseDb();
    const sRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await setDoc(sRef, {
      ...sessionData,
      sessionId,
      lastPingAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE SESSION ERROR]:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 9. SYSTEM CONFIGURATION
 * =========================================================================
 */

export function subscribeSystemConfig(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const configRef = doc(db, COLLECTIONS.SYSTEM_CONFIG, 'system_master_config');
    return onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists() && typeof onUpdate === 'function') {
        onUpdate(snapshot.data());
      }
    }, (err) => {
      console.warn('[FIRESTORE SYSTEM CONFIG LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE SYSTEM CONFIG INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveSystemConfig(configData) {
  try {
    const db = getFirebaseDb();
    const configRef = doc(db, COLLECTIONS.SYSTEM_CONFIG, 'system_master_config');
    await setDoc(configRef, {
      ...configData,
      id: 'system_master_config',
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE SYSTEM CONFIG ERROR]:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 10. CERTIFICATES VERIFICATION METADATA
 * =========================================================================
 */

export function subscribeCertificates(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const col = collection(db, COLLECTIONS.CERTIFICATES);
    const q = query(col, orderBy('issuedAt', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      if (typeof onUpdate === 'function') onUpdate(list);
    }, (err) => {
      console.warn('[FIRESTORE CERTIFICATES LISTENER ERROR]:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[FIRESTORE CERTIFICATES INIT FAILED]:', err);
    return () => {};
  }
}

export async function saveCertificate(certData) {
  const certId = certData.certificateId || `cert_${certData.studentId || Date.now()}`;
  try {
    const db = getFirebaseDb();
    const cRef = doc(db, COLLECTIONS.CERTIFICATES, certId);
    await setDoc(cRef, {
      ...certData,
      certificateId: certId,
      issuedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FIRESTORE SAVE CERTIFICATE ERROR]:', err);
    return false;
  }
}

