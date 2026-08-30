// Flowchart Quest - Offline-First Sync Manager & Queue Engine

import { syncScoreToDatabase } from './database.js';
import { logActivity } from './auditLogger.js';

const QUEUE_STORAGE_KEY = 'flowchart_sync_queue';
const MAX_RETRIES = 3;

/**
 * Get all pending sync items
 */
export function getSyncQueue() {
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save sync queue to LocalStorage
 */
export function saveSyncQueue(queue) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save sync queue:', err);
  }
}

/**
 * Add a record to the sync queue
 */
export function enqueueRecord(record, webhookUrl) {
  const queue = getSyncQueue();
  const existingIdx = queue.findIndex(q => q.record.id === record.id);

  const queueItem = {
    queueId: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    record,
    webhookUrl: webhookUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending', // 'pending' | 'syncing' | 'failed' | 'synced'
    lastError: null
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = queueItem;
  } else {
    queue.push(queueItem);
  }

  saveSyncQueue(queue);
  return queueItem;
}

/**
 * Remove an item from the sync queue after successful sync
 */
export function dequeueRecord(queueId) {
  const queue = getSyncQueue();
  const updated = queue.filter(q => q.queueId !== queueId);
  saveSyncQueue(updated);
}

/**
 * Process the sync queue with exponential backoff
 */
export async function processSyncQueue(webhookUrl, onProgress) {
  const queue = getSyncQueue();
  if (queue.length === 0) return { total: 0, success: 0, failed: 0 };

  const targetUrl = webhookUrl || (queue[0] && queue[0].webhookUrl);
  if (!targetUrl) {
    return { total: queue.length, success: 0, failed: queue.length, message: 'No webhook URL configured' };
  }

  let successCount = 0;
  let failedCount = 0;
  const remainingQueue = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const url = item.webhookUrl || targetUrl;

    if (onProgress) {
      onProgress({ current: i + 1, total: queue.length, item });
    }

    try {
      // Exponential backoff delay if retried before
      if (item.retryCount > 0) {
        const delayMs = Math.min(1000 * Math.pow(2, item.retryCount - 1), 5000);
        await new Promise(r => setTimeout(r, delayMs));
      }

      const res = await syncScoreToDatabase(item.record, url);

      if (res.success && res.mode === 'cloud') {
        successCount++;
        logActivity({
          user: item.record.name || 'Student',
          role: 'Student',
          action: 'SYNC_CLOUD_SUCCESS',
          target: `Record ID: ${item.record.id}`,
          result: 'SUCCESS'
        });
      } else {
        throw new Error(res.error || 'Failed to sync');
      }
    } catch (err) {
      failedCount++;
      item.retryCount = (item.retryCount || 0) + 1;
      item.updatedAt = new Date().toISOString();
      item.lastError = err.message;
      item.status = item.retryCount >= MAX_RETRIES ? 'failed' : 'pending';

      if (item.retryCount < MAX_RETRIES) {
        remainingQueue.push(item);
      } else {
        logActivity({
          user: item.record.name || 'Student',
          role: 'Student',
          action: 'SYNC_MAX_RETRIES_REACHED',
          target: `Record ID: ${item.record.id}`,
          result: 'FAILED',
          details: err.message
        });
      }
    }
  }

  saveSyncQueue(remainingQueue);
  return { total: queue.length, success: successCount, failed: failedCount };
}

/**
 * Check if a conflict exists between local record and incoming record
 */
export function checkDataConflict(localRecord, incomingRecord) {
  if (!localRecord || !incomingRecord) return null;
  if (localRecord.id !== incomingRecord.id) return null;

  const localTime = new Date(localRecord.completedAt || localRecord.updatedAt || 0).getTime();
  const incomingTime = new Date(incomingRecord.completedAt || incomingRecord.updatedAt || 0).getTime();

  if (Math.abs(localTime - incomingTime) > 1000 && localRecord.totalScore !== incomingRecord.totalScore) {
    return {
      hasConflict: true,
      newer: localTime > incomingTime ? 'local' : 'incoming',
      localTime: new Date(localTime).toLocaleString('th-TH'),
      incomingTime: new Date(incomingTime).toLocaleString('th-TH')
    };
  }

  return { hasConflict: false };
}
