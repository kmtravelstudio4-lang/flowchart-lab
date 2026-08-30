// Flowchart Quest - Audit & Activity Logger Utility

const STORAGE_KEY = 'flowchart_activity_logs';
const MAX_LOGS = 200;

export function getAuditLogs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to load audit logs:', err);
    return [];
  }
}

export function logActivity({ user = 'System', role = 'Teacher', action, target, result = 'SUCCESS', details = '' }) {
  try {
    const logs = getAuditLogs();
    const newEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user: user || 'Anonymous',
      role: role || 'Teacher',
      action,
      target: target || '-',
      result, // 'SUCCESS' | 'WARNING' | 'FAILED'
      details
    };

    const updated = [newEntry, ...logs].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  } catch (err) {
    console.warn('Failed to record activity log:', err);
    return null;
  }
}

export function clearAuditLogs() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
