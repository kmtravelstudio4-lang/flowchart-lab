// Flowchart Quest - Fine-Grained Learning Event Logging Engine
// Standards: Schema Version 2.0.0, Unique Event IDs, Deduplication, Audit Trail

const EVENTS_STORAGE_KEY = 'flowchart_learning_events';
const MAX_EVENTS_IN_STORAGE = 1000;

export const EVENT_TYPES = {
  SESSION_STARTED: 'SESSION_STARTED',
  PRETEST_STARTED: 'PRETEST_STARTED',
  PRETEST_COMPLETED: 'PRETEST_COMPLETED',
  LESSON_VIEWED: 'LESSON_VIEWED',
  LESSON_COMPLETED: 'LESSON_COMPLETED',
  MISSION_STARTED: 'MISSION_STARTED',
  QUESTION_ANSWERED: 'QUESTION_ANSWERED',
  MISSION_COMPLETED: 'MISSION_COMPLETED',
  FINAL_STARTED: 'FINAL_STARTED',
  FLOWCHART_CREATED: 'FLOWCHART_CREATED',
  FLOWCHART_VALIDATED: 'FLOWCHART_VALIDATED',
  FINAL_COMPLETED: 'FINAL_COMPLETED',
  POSTTEST_STARTED: 'POSTTEST_STARTED',
  POSTTEST_COMPLETED: 'POSTTEST_COMPLETED',
  CERTIFICATE_GENERATED: 'CERTIFICATE_GENERATED',
  SESSION_RESUMED: 'SESSION_RESUMED',
  SESSION_LOGOUT: 'SESSION_LOGOUT',
  SYNC_STARTED: 'SYNC_STARTED',
  SYNC_COMPLETED: 'SYNC_COMPLETED',
  SYNC_FAILED: 'SYNC_FAILED'
};

/**
 * Generate unique Event ID
 */
export function generateEventId(prefix = 'evt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all stored learning events
 */
export function getLearningEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Log a learning event with complete metadata
 * @param {Object} eventData
 * @param {string} eventData.action - One of EVENT_TYPES
 * @param {string} [eventData.studentId]
 * @param {string} [eventData.sessionId]
 * @param {string} [eventData.stage]
 * @param {string} [eventData.result] - 'SUCCESS' | 'IN_PROGRESS' | 'FAIL'
 * @param {number} [eventData.score]
 * @param {Object} [eventData.details]
 * @returns {Object} Recorded event
 */
export function logLearningEvent(eventData) {
  try {
    const existing = getLearningEvents();
    const eventId = eventData.eventId || generateEventId();

    // Deduplication check by eventId
    if (existing.some(e => e.eventId === eventId)) {
      return existing.find(e => e.eventId === eventId);
    }

    const newEvent = {
      eventId,
      studentId: eventData.studentId || 'guest',
      sessionId: eventData.sessionId || 'session_default',
      timestamp: new Date().toISOString(),
      stage: eventData.stage || 'general',
      action: eventData.action,
      result: eventData.result || 'SUCCESS',
      score: typeof eventData.score === 'number' ? eventData.score : null,
      details: eventData.details || {},
      schemaVersion: '2.0.0',
      deviceId: typeof navigator !== 'undefined' ? (navigator.userAgent || 'web_client').substring(0, 50) : 'node'
    };

    const updated = [newEvent, ...existing].slice(0, MAX_EVENTS_IN_STORAGE);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated));
    return newEvent;
  } catch (err) {
    console.warn('Failed to log learning event:', err);
    return null;
  }
}

/**
 * Get learning events for a specific student or session
 */
export function getStudentEvents(studentId, sessionId = null) {
  const all = getLearningEvents();
  return all.filter(e => {
    if (sessionId) return e.studentId === studentId && e.sessionId === sessionId;
    return e.studentId === studentId;
  });
}

/**
 * Clear all learning events (used during system reset)
 */
export function clearLearningEvents() {
  try {
    localStorage.removeItem(EVENTS_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear learning events:', err);
  }
}
