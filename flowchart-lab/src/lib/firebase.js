// Flowchart Quest - Firebase Firestore Core Module
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Default Firebase Configuration for Project: flowchart-quest-p6
// Can be customized via Vite env vars (VITE_FIREBASE_*) or Admin Panel LocalStorage
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyB_FlowchartQuestP6_LiveClientKey2026",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "flowchart-quest-p6.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "flowchart-quest-p6",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "flowchart-quest-p6.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475632",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:102938475632:web:9c8d7e6f5a4b3c2d1e0f"
};

/**
 * Get active Firebase Config from env, localStorage or default
 */
export function getStoredFirebaseConfig() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('flowchart_firebase_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Error reading stored Firebase config:', err);
  }
  return DEFAULT_FIREBASE_CONFIG;
}


/**
 * Save new Firebase Config to localStorage
 */
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem('flowchart_firebase_config', JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
    return false;
  }
}

/**
 * Initialize Firebase App singleton
 */
let appInstance = null;
let dbInstance = null;

export function getFirebaseApp() {
  const config = getStoredFirebaseConfig();
  if (!getApps().length) {
    appInstance = initializeApp(config);
    console.log('[FIRESTORE INIT] Firebase App Initialized for Project:', config.projectId);
  } else {
    appInstance = getApp();
  }
  return appInstance;
}

/**
 * Get Firestore Instance with Multi-Tab Offline Persistence
 */
export function getFirebaseDb() {
  if (dbInstance) return dbInstance;
  
  const app = getFirebaseApp();
  try {
    // Initialize Firestore with Multi-Tab Persistent Local Cache
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    // Fallback if already initialized in this window
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

export const db = getFirebaseDb();

/**
 * Check connection status and metadata
 */
export function getFirebaseConnectionStatus() {
  try {
    const app = getFirebaseApp();
    const config = getStoredFirebaseConfig();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      connected: isOnline && Boolean(app),
      projectId: config.projectId,
      appId: config.appId,
      authDomain: config.authDomain,
      isOnline
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      projectId: 'unknown',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false
    };
  }
}

