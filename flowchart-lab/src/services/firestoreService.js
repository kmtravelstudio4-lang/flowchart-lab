// Flowchart Quest - Firestore Database Service Layer
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
import { getFirebaseDb } from '../lib/firebase';
import { formatEmbedPdfUrl } from '../utils/pdfHelper';

// Collection Names
export const COLLECTIONS = {
  LESSONS: 'lessons',
  STUDENTS: 'students',
  SCORES: 'scores',
  SESSIONS: 'sessions',
  LEARNING_EVIDENCE: 'learningEvidence',
  EVENTS: 'events',
  SYSTEM_CONFIG: 'systemConfig'
};

/**
 * =========================================================================
 * 1. LESSONS MANAGEMENT (Real-Time Single Source of Truth)
 * =========================================================================
 */

/**
 * Subscribe to all lessons in real-time via onSnapshot
 * @param {Function} onUpdate - Callback when lessons change
 * @param {Function} onError - Callback on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeLessons(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const lessonsCol = collection(db, COLLECTIONS.LESSONS);
    const q = query(lessonsCol, orderBy('chapterNum', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lessons = [];
      snapshot.forEach((docSnap) => {
        lessons.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (lessons.length > 0) {
        onUpdate(lessons);
      }
    }, (err) => {
      console.warn('Firestore subscribeLessons notice:', err.message);
      if (onError) onError(err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to setup Firestore listener:', err);
    return () => {};
  }
}

/**
 * Fetch all lessons once
 */
export async function getLessons() {
  try {
    const db = getFirebaseDb();
    const snapshot = await getDocs(collection(db, COLLECTIONS.LESSONS));
    const lessons = [];
    snapshot.forEach((d) => lessons.push({ id: d.id, ...d.data() }));
    return lessons;
  } catch (err) {
    console.error('getLessons error:', err);
    return [];
  }
}

/**
 * Save / Update a Lesson with Read-Back Verification
 * @param {string} lessonId - e.g. 'ch1'
 * @param {Object} lessonData
 * @returns {Promise<{success: boolean, data?: Object, message: string}>}
 */
export async function saveLesson(lessonId, lessonData) {
  if (!lessonId) return { success: false, message: 'กรุณาระบุรหัสบทเรียน (lessonId)' };

  try {
    const db = getFirebaseDb();
    const lessonRef = doc(db, COLLECTIONS.LESSONS, lessonId);

    // Normalize PDF and Embed URLs
    const rawPdf = (lessonData.pdfUrl || lessonData.drivePdfUrl || '').trim();
    const embedUrl = rawPdf ? formatEmbedPdfUrl(rawPdf) : '';

    const payload = {
      ...lessonData,
      id: lessonId,
      pdfUrl: rawPdf,
      embedUrl: embedUrl,
      updatedAt: serverTimestamp(),
      version: (lessonData.version || 1) + 1,
      active: lessonData.active !== false
    };

    // 1. Write to Firestore
    await setDoc(lessonRef, payload, { merge: true });

    // 2. Read-Back Verification
    const verifySnap = await getDoc(lessonRef);
    if (!verifySnap.exists()) {
      throw new Error('Read-back verification failed: Document not found after write');
    }

    const savedData = verifySnap.data();

    return {
      success: true,
      data: savedData,
      message: `✅ บันทึกบทเรียน ${lessonData.title || lessonId} ลง Firestore สำเร็จ!`
    };
  } catch (err) {
    console.error('saveLesson error:', err);
    return {
      success: false,
      message: `🔴 บันทึกบทเรียนไม่สำเร็จ: ${err.message}`
    };
  }
}

/**
 * Batch Seed / Migrate Multiple Lessons to Firestore
 */
export async function seedLessonsToFirestore(chaptersList) {
  if (!Array.isArray(chaptersList) || chaptersList.length === 0) return false;

  try {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    chaptersList.forEach((ch, idx) => {
      const chId = ch.id || `ch${idx + 1}`;
      const chRef = doc(db, COLLECTIONS.LESSONS, chId);
      const rawPdf = (ch.pdfUrl || ch.drivePdfUrl || '').trim();
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
    return true;
  } catch (err) {
    console.error('seedLessonsToFirestore error:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 2. STUDENTS & SCORE MANAGEMENT
 * =========================================================================
 */

/**
 * Save or update student profile
 */
export async function saveStudent(studentData) {
  if (!studentData || !studentData.studentId) return false;
  try {
    const db = getFirebaseDb();
    const sRef = doc(db, COLLECTIONS.STUDENTS, studentData.studentId);
    await setDoc(sRef, {
      ...studentData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('saveStudent error:', err);
    return false;
  }
}

/**
 * Save Student Assessment Scores (Enforcing bounds)
 */
export async function saveScore(scoreData) {
  if (!scoreData || !scoreData.studentId) return false;
  try {
    const db = getFirebaseDb();
    const scoreRef = doc(db, COLLECTIONS.SCORES, scoreData.studentId);

    // Enforce Score Bounds
    const preTest = Math.min(10, Math.max(0, scoreData.preTest ?? scoreData.preScore ?? 0));
    const postTest = Math.min(10, Math.max(0, scoreData.postTest ?? scoreData.postScore ?? 0));
    const m1 = Math.min(15, Math.max(0, scoreData.m1 ?? 0));
    const m2 = Math.min(15, Math.max(0, scoreData.m2 ?? 0));
    const m3 = Math.min(15, Math.max(0, scoreData.m3 ?? 0));
    const m4 = Math.min(20, Math.max(0, scoreData.m4 ?? 0));
    const finalScore = Math.min(35, Math.max(0, scoreData.finalScore ?? scoreData.m5 ?? 0));
    const totalScore = Math.min(100, m1 + m2 + m3 + m4 + finalScore);
    const gainScore = Math.max(0, postTest - preTest);

    await setDoc(scoreRef, {
      studentId: scoreData.studentId,
      studentName: scoreData.studentName || '',
      classroom: scoreData.classroom || '',
      studentNumber: scoreData.studentNumber || '',
      preTest,
      postTest,
      m1,
      m2,
      m3,
      m4,
      finalScore,
      totalScore,
      gainScore,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('saveScore error:', err);
    return false;
  }
}

/**
 * Subscribe to all scores for Teacher Dashboard
 */
export function subscribeScores(onUpdate, onError) {
  try {
    const db = getFirebaseDb();
    const scoresCol = collection(db, COLLECTIONS.SCORES);
    return onSnapshot(scoresCol, (snapshot) => {
      const scores = [];
      snapshot.forEach((d) => scores.push({ id: d.id, ...d.data() }));
      onUpdate(scores);
    }, (err) => {
      console.warn('subscribeScores error:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('subscribeScores setup failed:', err);
    return () => {};
  }
}

/**
 * =========================================================================
 * 3. EVENTS & LEARNING EVIDENCE LOGGING
 * =========================================================================
 */

/**
 * Save Game Event
 */
export async function saveEvent(eventData) {
  if (!eventData || !eventData.eventId) return false;
  try {
    const db = getFirebaseDb();
    const evRef = doc(db, COLLECTIONS.EVENTS, eventData.eventId);
    await setDoc(evRef, {
      ...eventData,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('saveEvent error:', err);
    return false;
  }
}

/**
 * Save Learning Evidence / Rubric Assessment Result
 */
export async function saveEvidence(evidenceData) {
  const evidenceId = evidenceData.evidenceId || `ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  try {
    const db = getFirebaseDb();
    const evRef = doc(db, COLLECTIONS.LEARNING_EVIDENCE, evidenceId);
    await setDoc(evRef, {
      ...evidenceData,
      evidenceId,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('saveEvidence error:', err);
    return false;
  }
}
