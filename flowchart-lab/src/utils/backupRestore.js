// Flowchart Quest - Production Hardened Backup, Restore & Safe Reset Engine
// Standards: Schema Version 2.0.0, Zero Secrets Exported, Pre-Restore Inspection, Safety Auto-Backup

import { logActivity } from './auditLogger.js';

export const BACKUP_VERSION = '2.0.0';
export const APP_NAME = 'Flowchart Quest';

/**
 * Generate full sanitized backup JSON object
 */
export function generateFullBackup() {
  const studentRecords = JSON.parse(localStorage.getItem('flowchart_student_records') || '[]');
  const studentRoster = JSON.parse(localStorage.getItem('flowchart_student_roster') || '[]');
  const learningChapters = JSON.parse(localStorage.getItem('flowchart_learning_chapters') || '[]');
  const chapterImages = JSON.parse(localStorage.getItem('flowchart_chapter_images') || '{}');
  const activityLogs = JSON.parse(localStorage.getItem('flowchart_activity_logs') || '[]');
  const learningEvents = JSON.parse(localStorage.getItem('flowchart_learning_events') || '[]');
  const videoLessons = JSON.parse(localStorage.getItem('flowchart_video_lessons') || '[]');

  const backup = {
    schemaVersion: BACKUP_VERSION,
    appVersion: '2.0.0',
    appName: APP_NAME,
    createdAt: new Date().toISOString(),
    recordCounts: {
      studentRecordsCount: studentRecords.length,
      studentRosterCount: studentRoster.length,
      learningChaptersCount: learningChapters.length,
      learningEventsCount: learningEvents.length,
      activityLogsCount: activityLogs.length
    },
    data: {
      studentRecords,
      studentRoster,
      learningChapters,
      chapterImages,
      activityLogs,
      learningEvents,
      videoLessons,
      settings: {
        cloudWebhookUrl: localStorage.getItem('flowchart_cloud_webhook_url') || ''
        // Note: Admin PIN & Secrets are NEVER exported for security
      }
    }
  };

  logActivity({
    user: 'Teacher/Admin',
    role: 'Admin',
    action: 'EXPORT_BACKUP',
    target: `Records: ${studentRecords.length}, Roster: ${studentRoster.length}`,
    result: 'SUCCESS'
  });

  return backup;
}

/**
 * Download backup as a JSON file
 */
export function downloadBackupFile() {
  const backup = generateFullBackup();
  if (typeof document !== 'undefined' && typeof URL !== 'undefined') {
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FlowchartQuest_Backup_v${BACKUP_VERSION}_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return backup;
}

/**
 * Validate an imported backup file
 */
export function validateBackupFile(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, message: 'รูปแบบไฟล์ไม่ถูกต้อง ไม่ใช่ JSON Object' };
  }

  if (jsonData.appName !== APP_NAME && !jsonData.data) {
    return { valid: false, message: 'ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลของ Flowchart Quest' };
  }

  const d = jsonData.data || {};
  const studentCount = Array.isArray(d.studentRecords) ? d.studentRecords.length : 0;
  const rosterCount = Array.isArray(d.studentRoster) ? d.studentRoster.length : 0;
  const chapterCount = Array.isArray(d.learningChapters) ? d.learningChapters.length : 0;
  const eventCount = Array.isArray(d.learningEvents) ? d.learningEvents.length : 0;

  return {
    valid: true,
    version: jsonData.schemaVersion || jsonData.version || '1.0.0',
    createdAt: jsonData.createdAt || 'ไม่ระบุ',
    summary: {
      studentRecordsCount: studentCount,
      studentRosterCount: rosterCount,
      learningChaptersCount: chapterCount,
      learningEventsCount: eventCount
    }
  };
}

/**
 * Restore data from a validated backup object
 */
export function restoreBackupData(jsonData) {
  const validation = validateBackupFile(jsonData);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const d = jsonData.data || {};

  if (Array.isArray(d.studentRecords)) {
    localStorage.setItem('flowchart_student_records', JSON.stringify(d.studentRecords));
  }
  if (Array.isArray(d.studentRoster)) {
    localStorage.setItem('flowchart_student_roster', JSON.stringify(d.studentRoster));
  }
  if (Array.isArray(d.learningChapters)) {
    localStorage.setItem('flowchart_learning_chapters', JSON.stringify(d.learningChapters));
  }
  if (d.chapterImages && typeof d.chapterImages === 'object') {
    localStorage.setItem('flowchart_chapter_images', JSON.stringify(d.chapterImages));
  }
  if (Array.isArray(d.activityLogs)) {
    localStorage.setItem('flowchart_activity_logs', JSON.stringify(d.activityLogs));
  }
  if (Array.isArray(d.learningEvents)) {
    localStorage.setItem('flowchart_learning_events', JSON.stringify(d.learningEvents));
  }
  if (d.settings && d.settings.cloudWebhookUrl) {
    localStorage.setItem('flowchart_cloud_webhook_url', d.settings.cloudWebhookUrl);
  }

  logActivity({
    user: 'Teacher/Admin',
    role: 'Admin',
    action: 'RESTORE_BACKUP',
    target: `Version ${validation.version}`,
    result: 'SUCCESS'
  });

  return validation;
}

/**
 * Safe Reset Level 1: Reset Current Student Session
 */
export function resetCurrentStudentSession() {
  localStorage.removeItem('flowchart_current_student');
  localStorage.removeItem('flowchart_mission_scores');
  localStorage.removeItem('flowchart_completed_stages');
  logActivity({ action: 'RESET_CURRENT_SESSION', target: 'Current Student', result: 'SUCCESS' });
}

/**
 * Safe Reset Level 2: Reset All Student Score Records
 */
export function resetStudentScoreRecords() {
  localStorage.removeItem('flowchart_student_records');
  localStorage.removeItem('flowchart_learning_events');
  logActivity({ action: 'RESET_STUDENT_RECORDS', target: 'All Score Records', result: 'SUCCESS' });
}

/**
 * Safe Reset Level 3: Factory Reset All Data with Safety Auto-Backup
 */
export function safeFactoryResetAll(confirmationKeyword) {
  if (confirmationKeyword !== 'RESET') {
    throw new Error('กรุณากรอกคำว่า "RESET" เพื่อยืนยันการคืนค่าโรงงาน');
  }

  // 1. Mandatory Auto-Backup before reset
  downloadBackupFile();

  // 2. Perform safe reset preserving admin credentials
  const preservePin = localStorage.getItem('flowchart_admin_pin') || 'admin1234';
  localStorage.clear();
  localStorage.setItem('flowchart_admin_pin', preservePin);

  logActivity({ action: 'FACTORY_RESET_ALL', target: 'Entire LocalStorage', result: 'SUCCESS' });
  return true;
}
