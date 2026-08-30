// Flowchart Quest - Firebase Firestore Core Module
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Default Firebase Configuration (Can be updated dynamically in Admin Panel)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDummyKey_For_Template_Setup_ReplaceInAdmin",
  authDomain: "flowchart-quest-p6.firebaseapp.com",
  projectId: "flowchart-quest-p6",
  storageBucket: "flowchart-quest-p6.firebasestorage.app",
  messagingSenderId: "1029384756",
  appId: "1:1029384756:web:abcdef123456"
};

/**
 * Get active Firebase Config from localStorage or default
 */
export function getStoredFirebaseConfig() {
  try {
    const saved = localStorage.getItem('flowchart_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
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
  } else {
    appInstance = getApp();
  }
  return appInstance;
}

/**
 * Get Firestore Instance with Offline Persistence
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
    // Fallback if already initialized
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

export const db = getFirebaseDb();
