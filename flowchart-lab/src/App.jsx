import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, RotateCcw, CheckCircle2, XCircle, Award, Sparkles, 
  BookOpen, Layers, ArrowRight, ArrowLeft, ArrowDown, ChevronDown, Home,
  Volume2, VolumeX, ChevronRight, Check,
  Terminal, ShieldAlert, Code2, Tv, RefreshCw, Trophy, GraduationCap, CheckCircle,
  CheckSquare, Trash2, Move, Printer, Film, Compass, Lock,
  CheckCheck, Download, Settings, Users, FileSpreadsheet, Calendar,
  Image as ImageIcon, Eye, Plus, Edit3, Save, X, Zap,
  Cloud, Database, Copy, LogOut, Upload, FileText, AlertTriangle, TrendingUp,
  ExternalLink, Key, Hash
} from 'lucide-react';

// Imports from modular data & utilities
import { 
  LEARNING_CHAPTERS, 
  ALL_FLOWCHART_SYMBOLS, 
  SYMBOL_HUNTER_ITEMS, 
  PRETEST_QUESTIONS, 
  POSTTEST_QUESTIONS, 
  STEP_MASTER_LEVELS, 
  FLOW_READER_LEVELS, 
  BUG_DETECTIVE_SCENARIOS, 
  FINAL_MISSION_SCENARIOS, 
  DEFAULT_VIDEO_LESSONS 
} from './data/flowchartData';

import { playSound } from './utils/audio';
import { generateCertificateCanvas } from './utils/certificate';
import { compressImage, formatBytes } from './utils/imageCompressor';
import { syncScoreToDatabase, testWebhookConnection, GOOGLE_APPS_SCRIPT_TEMPLATE } from './utils/database';
import { getAuditLogs, logActivity, clearAuditLogs } from './utils/auditLogger';
import { logLearningEvent, EVENT_TYPES } from './utils/eventLogger';
import { recordStageTime, getStoredStageTimes, formatDuration } from './utils/timeTracker';
import { getSyncQueue, processSyncQueue } from './utils/syncManager';
import { classifyStudentRisk, computeClassroomAnalytics } from './utils/analytics';
import { 
  downloadBackupFile, validateBackupFile, restoreBackupData, 
  resetCurrentStudentSession, resetStudentScoreRecords, safeFactoryResetAll 
} from './utils/backupRestore';
import { 
  CHECKLIST_ITEMS, downloadPreClassBackup, generatePilotTestData, 
  purgeTestData, deleteStudentCascade, exportClassLearningReport 
} from './utils/classroomPilot';

import FlowchartShapeSvg from './components/FlowchartShapeSvg';
import FlowchartCanvas from './components/FlowchartCanvas';
import StudentProfileModal from './components/StudentProfileModal';
import StudentManagementModal from './components/StudentManagementModal';
import LearningEvidenceModal from './components/LearningEvidenceModal';
import HorizontalPdfViewer from './components/HorizontalPdfViewer';
import { formatEmbedPdfUrl } from './utils/pdfHelper';
import kruKingLogo from './assets/kru-king-logo.png';
import masterSystemConfig from './data/system_config.json';

// Default 4 Pre-Configured Classrooms with PIN codes (Merged with system_config)
export const DEFAULT_CLASSROOMS = (masterSystemConfig && Array.isArray(masterSystemConfig.classrooms) && masterSystemConfig.classrooms.length > 0)
  ? masterSystemConfig.classrooms
  : [
      { id: 'room_601', code: '601', name: 'ห้อง ป.6/1', sheetTab: 'ป.6_1', active: true, desc: 'ชั้นประถมศึกษาปีที่ 6/1' },
      { id: 'room_602', code: '602', name: 'ห้อง ป.6/2', sheetTab: 'ป.6_2', active: true, desc: 'ชั้นประถมศึกษาปีที่ 6/2' },
      { id: 'room_603', code: '603', name: 'ห้อง ป.6/3', sheetTab: 'ป.6_3', active: true, desc: 'ชั้นประถมศึกษาปีที่ 6/3' },
      { id: 'room_604', code: '604', name: 'ห้อง ป.6/4', sheetTab: 'ป.6_4', active: true, desc: 'ชั้นประถมศึกษาปีที่ 6/4' }
    ];

// Initial Base Chapters with embedded Google Drive PDF link for Chapter 1
export const INITIAL_CHAPTERS = (masterSystemConfig && Array.isArray(masterSystemConfig.chapters) && masterSystemConfig.chapters.length > 0)
  ? LEARNING_CHAPTERS.map(base => {
      const match = masterSystemConfig.chapters.find(c => c && c.id === base.id);
      return match ? {
        ...base,
        ...match,
        pdfUrl: (match.pdfUrl || match.drivePdfUrl || match.driveUrl || match.googleDriveUrl || base.pdfUrl || '').trim()
      } : base;
    })
  : LEARNING_CHAPTERS;

// YouTube ID Parser Helper
const extractYoutubeId = (urlOrId) => {
  if (!urlOrId) return '';
  let str = urlOrId.trim();
  if (str.includes('v=')) {
    str = str.split('v=')[1].split('&')[0];
  } else if (str.includes('youtu.be/')) {
    str = str.split('youtu.be/')[1].split('?')[0];
  } else if (str.includes('embed/')) {
    str = str.split('embed/')[1].split('?')[0];
  }
  return str;
};

export default function App() {
  // Navigation Tabs: 'game' | 'learning' | 'teacher' | 'sandbox' | 'guide' | 'video' | 'admin'
  const [activeTab, setActiveTab] = useState('game');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Google Sheets Cloud Database Webhook State
  const [cloudWebhookUrl, setCloudWebhookUrl] = useState(() => {
    try {
      return localStorage.getItem('flowchart_cloud_webhook_url') || 'https://script.google.com/macros/s/AKfycbxGzkBnArT6V7nqR8mqtRn6CWFGU0Lffxc3U6XZlZSB2DttJaxSxtRQBfR4N9QAq6En/exec';
    } catch {
      return 'https://script.google.com/macros/s/AKfycbxGzkBnArT6V7nqR8mqtRn6CWFGU0Lffxc3U6XZlZSB2DttJaxSxtRQBfR4N9QAq6En/exec';
    }
  });
  const [cloudSyncToast, setCloudSyncToast] = useState({ show: false, message: '', mode: 'cloud' });

  // Classrooms State (จัดการห้องเรียน & รหัส PIN ประจำห้อง)
  const [classrooms, setClassrooms] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_classrooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* fallback */ }
    return DEFAULT_CLASSROOMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('flowchart_classrooms', JSON.stringify(classrooms));
    } catch { /* ignore */ }
  }, [classrooms]);

  // Student Profile
  const [studentInfo, setStudentInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_current_student');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || '',
          roomCode: parsed.roomCode || '',
          room: parsed.room || '',
          number: parsed.number || ''
        };
      }
    } catch {
      // ignore
    }
    return { name: '', roomCode: '', room: '', number: '' };
  });
  const [isProfileEntered, setIsProfileEntered] = useState(() => Boolean(studentInfo.name));
  const [loginPinError, setLoginPinError] = useState('');
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [isCreatingClassroom, setIsCreatingClassroom] = useState(false);

  // Game Flow Stages
  const [gameStage, setGameStage] = useState('intro');

  // Scores
  const [missionScores, setMissionScores] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_mission_scores');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      m1: 0,
      m2: 0,
      m3: 0,
      m4: 0,
      m5: 0,
      preScore: null,
      postScore: null,
      total: 0
    };
  });

  const [completedStages, setCompletedStages] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_completed_stages');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  // User XP & Combo
  const [userXP, setUserXP] = useState(0);
  const [comboCount, setComboCount] = useState(0);

  // Pre-Test & Post-Test States
  const [preAnswers, setPreAnswers] = useState({});
  const [preSubmitted, setPreSubmitted] = useState(false);
  const [preScore, setPreScore] = useState(0);
  const [prePageIdx, setPrePageIdx] = useState(0);

  const [postAnswers, setPostAnswers] = useState({});
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [postScore, setPostScore] = useState(0);
  const [postPageIdx, setPostPageIdx] = useState(0);

  // Dynamic Learning Chapters State (เพิ่ม/ลด/แก้ไขเนื้อหาบทเรียน - Sync with INITIAL_CHAPTERS)
  const [learningChapters, setLearningChapters] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_learning_chapters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = INITIAL_CHAPTERS.map(base => {
            const match = parsed.find(c => c && c.id === base.id);
            if (match) {
              return {
                ...base,
                ...match,
                pdfUrl: (match.pdfUrl || match.drivePdfUrl || match.driveUrl || match.googleDriveUrl || match.slidesUrl || match.slideUrl || match.documentUrl || base.pdfUrl || '').trim(),
                symbols: Array.isArray(match.symbols) && match.symbols.length > 0 ? match.symbols : (base.symbols || []),
                keyPoints: Array.isArray(match.keyPoints) && match.keyPoints.length > 0 ? match.keyPoints : (base.keyPoints || [])
              };
            }
            return base;
          });
          const customExtras = parsed.filter(p => p && p.id && !INITIAL_CHAPTERS.some(b => b.id === p.id));
          return [...merged, ...customExtras];
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_CHAPTERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('flowchart_learning_chapters', JSON.stringify(learningChapters));
    } catch { /* ignore */ }
  }, [learningChapters]);

  // Real-time Cloud Sync: โหลดบทเรียนและลิงก์ PDF ล่าสุดจาก GitHub CDN และ Google Sheets แบบ Real-time
  useEffect(() => {
    const fetchCloudChapters = async () => {
      // 1. First fetch from public/system_config.json (GitHub CDN)
      try {
        const staticRes = await fetch(`./system_config.json?v=${Date.now()}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (staticData && Array.isArray(staticData.chapters) && staticData.chapters.length > 0) {
            setLearningChapters(prev => {
              const baseList = (prev && prev.length > 0) ? prev : INITIAL_CHAPTERS;
              const merged = baseList.map(base => {
                const match = staticData.chapters.find(d => d && d.id === base.id);
                if (match) {
                  return {
                    ...base,
                    ...match,
                    pdfUrl: (match.pdfUrl || match.drivePdfUrl || match.driveUrl || match.googleDriveUrl || match.slidesUrl || match.slideUrl || match.documentUrl || base.pdfUrl || '').trim(),
                    symbols: Array.isArray(match.symbols) && match.symbols.length > 0 ? match.symbols : (base.symbols || []),
                    keyPoints: Array.isArray(match.keyPoints) && match.keyPoints.length > 0 ? match.keyPoints : (base.keyPoints || [])
                  };
                }
                return base;
              });
              const customExtras = staticData.chapters.filter(d => d && d.id && !baseList.some(b => b.id === d.id));
              const fullList = [...merged, ...customExtras];
              try {
                localStorage.setItem('flowchart_learning_chapters', JSON.stringify(fullList));
              } catch {}
              return fullList;
            });
          }
        }
      } catch (err) {
        console.log('Static config fetch fallback:', err);
      }

      // 2. Then attempt Google Sheets if configured
      if (cloudWebhookUrl) {
        try {
          const res = await fetch(`${cloudWebhookUrl}?configKey=system_master_config`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('json')) {
            const raw = await res.json();
            const data = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.chapters) ? raw.chapters : null);
            if (data && data.length > 0) {
              setLearningChapters(prev => {
                const baseList = (prev && prev.length > 0) ? prev : INITIAL_CHAPTERS;
                const merged = baseList.map(base => {
                  const match = data.find(d => d && d.id === base.id);
                  if (match) {
                    return {
                      ...base,
                      ...match,
                      pdfUrl: (match.pdfUrl || match.drivePdfUrl || match.driveUrl || match.googleDriveUrl || match.slidesUrl || match.slideUrl || match.documentUrl || base.pdfUrl || '').trim(),
                      symbols: Array.isArray(match.symbols) && match.symbols.length > 0 ? match.symbols : (base.symbols || []),
                      keyPoints: Array.isArray(match.keyPoints) && match.keyPoints.length > 0 ? match.keyPoints : (base.keyPoints || [])
                    };
                  }
                  return base;
                });
                const customExtras = data.filter(d => d && d.id && !baseList.some(b => b.id === d.id));
                const fullList = [...merged, ...customExtras];
                try {
                  localStorage.setItem('flowchart_learning_chapters', JSON.stringify(fullList));
                } catch {}
                return fullList;
              });
            }
          }
        } catch (err) {
          console.log('Google Sheets config fetch fallback:', err);
        }
      }
    };
    fetchCloudChapters();
  }, [cloudWebhookUrl]);

  // Editing Chapter Modal State in Admin
  const [editingChapter, setEditingChapter] = useState(null); // null | chapter object
  const [isCreatingNewChapter, setIsCreatingNewChapter] = useState(false);
  const [compressionStats, setCompressionStats] = useState({}); // { [chId]: { orig, comp, ratio } }
  const [chapterViewMode, setChapterViewMode] = useState('dual'); // 'dual' | 'pdf' | 'notes'
  const [selectedReadingChapterIdx, setSelectedReadingChapterIdx] = useState(null); // null (grid) | number (in-page reader)

  // Unified Real-Time System Synchronizer (Google Sheets Cloud + GitHub API)
  const syncAllToCloudAndGitHub = async (customChapters = null, customRooms = null) => {
    const activeChs = customChapters || learningChapters;
    const activeRms = customRooms || classrooms;

    const syncPayload = {
      appName: 'Flowchart Quest ป.6',
      classrooms: activeRms,
      chapters: activeChs,
      updatedAt: new Date().toISOString(),
      version: '2.0.0'
    };

    let sheetsOk = false;
    let githubOk = false;

    // 1. Sync to Google Sheets Cloud
    if (cloudWebhookUrl) {
      try {
        await fetch(cloudWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveConfig',
            configKey: 'system_master_config',
            configData: syncPayload,
            updatedAt: new Date().toISOString()
          })
        });
        sheetsOk = true;
      } catch (err) {
        console.warn('Google Sheets sync error:', err);
      }
    }

    // 2. Sync to GitHub Repository via REST API
    try {
      const ghRes = await syncSystemStateToGitHub(syncPayload);
      if (ghRes && ghRes.success) {
        githubOk = true;
      }
    } catch (err) {
      console.warn('GitHub API sync error:', err);
    }

    setCloudSyncToast({
      show: true,
      message: `⚡ ซิงก์ข้อมูลทั้งระบบเรียบร้อย (Google Sheets: ${sheetsOk ? '✅' : '💾'}, GitHub: ${githubOk ? '✅' : '⚠️'})`,
      mode: 'cloud'
    });
    setTimeout(() => setCloudSyncToast({ show: false, message: '', mode: 'cloud' }), 4000);
    playSound('success', soundEnabled);
  };

  // Direct 1-Click Save Google Drive PDF Link Handler with Real-time Cloud & GitHub Sync
  const handleSaveChapterPdfUrl = async (chapterId, url) => {
    const base = (Array.isArray(learningChapters) && learningChapters.length > 0) ? learningChapters : LEARNING_CHAPTERS;
    const updated = base.map(c => c.id === chapterId ? { ...c, pdfUrl: (url || '').trim() } : c);
    setLearningChapters(updated);
    try {
      localStorage.setItem('flowchart_learning_chapters', JSON.stringify(updated));
    } catch { /* ignore */ }

    // Execute Unified Real-time Sync to Cloud & GitHub
    await syncAllToCloudAndGitHub(updated, classrooms);
    alert('✅ บันทึกและซิงก์ข้อมูลบทเรียนขึ้น Google Sheets & GitHub เรียบร้อยแล้ว!');
  };

  // Learning Chapter Active Tab & Custom Illustrations
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [chapterImages, setChapterImages] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_chapter_images');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      ch1: '',
      ch2: '',
      ch3: '',
      ch4: '',
      ch5: ''
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('flowchart_chapter_images', JSON.stringify(chapterImages));
    } catch { /* ignore */ }
  }, [chapterImages]);

  // High-Efficiency Image Compression Handler for Chapter Illustrations
  const handleChapterImageUpload = async (chapterId, file) => {
    if (!file) return;
    try {
      playSound('click', soundEnabled);
      // Run high-efficiency image compression (limit max dimension to 750px and quality 0.65)
      const result = await compressImage(file, 750, 750, 0.65);
      
      // Update chapter images dictionary
      setChapterImages(prev => ({ ...prev, [chapterId]: result.dataUrl }));

      // Also update learningChapters array if matched
      setLearningChapters(prev => prev.map(c => c.id === chapterId ? { ...c, image: result.dataUrl } : c));
      
      // Record compression statistics
      setCompressionStats(prev => ({
        ...prev,
        [chapterId]: {
          orig: formatBytes(result.originalSize),
          comp: formatBytes(result.compressedSize),
          ratio: result.reductionPercent
        }
      }));
      
      playSound('success', soundEnabled);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถประมวลผลรูปภาพได้: ' + err.message);
    }
  };

  // Mission 1: Symbol Hunter State
  const [m1Targets, setM1Targets] = useState([]);
  const [m1AvailablePool, setM1AvailablePool] = useState([]);
  const [m1PlacedAnswers, setM1PlacedAnswers] = useState({});
  const [m1Result, setM1Result] = useState(null);
  const [m1DraggedItem, setM1DraggedItem] = useState(null);

  // Mission 2: Step Master State
  const [m2LevelIdx, setM2LevelIdx] = useState(0);
  const [m2AvailableBlocks, setM2AvailableBlocks] = useState([]);
  const [m2PlacedSlots, setM2PlacedSlots] = useState([]);
  const [m2Result, setM2Result] = useState(null);

  // Mission 3: Flow Reader State
  const [m3LevelIdx, setM3LevelIdx] = useState(0);
  const [m3Answers, setM3Answers] = useState({});
  const [m3Result, setM3Result] = useState(null);

  // Mission 4: Bug Detective State
  const [m4ScenarioIdx, setM4ScenarioIdx] = useState(0);
  const [m4Answers, setM4Answers] = useState({ step1: null, step2: null, step3: null });
  const [m4Result, setM4Result] = useState(null);

  // Final Mission State
  const [finalScenarioIdx, setFinalScenarioIdx] = useState(0);

  // Certificate Reference & Export
  const [isExporting, setIsExporting] = useState(false);
  const certificateRef = useRef(null);

  // Teacher Dashboard Database State
  const [studentRecords, setStudentRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_student_records');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [teacherFilterRoom, setTeacherFilterRoom] = useState('ทั้งหมด');
  const [teacherFilterStatus, setTeacherFilterStatus] = useState('ทั้งหมด');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherFilterStartDate, setTeacherFilterStartDate] = useState('');
  const [teacherFilterEndDate, setTeacherFilterEndDate] = useState('');

  // Sandbox State
  const [sandboxNodes, setSandboxNodes] = useState([
    { id: 'sb_1', shape: 'terminator', text: 'เริ่มต้น (Start)' },
    { id: 'sb_2', shape: 'inputOutput', text: 'รับค่าตัวเลข X' },
    { id: 'sb_3', shape: 'process', text: 'คำนวณ Y = X + 10' },
    { id: 'sb_4', shape: 'display', text: 'แสดงผลลัพธ์ Y' },
    { id: 'sb_5', shape: 'terminator', text: 'สิ้นสุด (End)' }
  ]);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState([]);

  // Handbook State
  const [symbolFilter, setSymbolFilter] = useState('ทั้งหมด');

  // Video Media Lessons
  const [videoLessons] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_video_lessons');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_VIDEO_LESSONS;
  });
  const [selectedVideo, setSelectedVideo] = useState(videoLessons[0] || DEFAULT_VIDEO_LESSONS[0]);
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customVideoId, setCustomVideoId] = useState(null);

  // Admin State
  const [adminPin, setAdminPin] = useState(() => {
    try {
      return localStorage.getItem('flowchart_admin_pin') || 'admin1234';
    } catch {
      return 'admin1234';
    }
  });
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const [cloudTestState, setCloudTestState] = useState({ loading: false, success: null, message: '' });
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Platform & Learning Management State
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);
  const [selectedStudentForEvidence, setSelectedStudentForEvidence] = useState(null);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('overview'); // 'overview' | 'students' | 'analytics' | 'content' | 'database' | 'backup' | 'pilot' | 'logs' | 'settings'
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
  const [activityLogs, setActivityLogs] = useState(() => getAuditLogs());
  const [backupRestoreInfo, setBackupRestoreInfo] = useState(null);
  const restoreFileRef = useRef(null);

  // Classroom Pilot & Readiness State
  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_pilot_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [classSessionInfo, setClassSessionInfo] = useState({
    classroom: 'ป.6/1',
    teacher: 'ครูคิง',
    sessionId: `sess_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_001`
  });
  const [pilotGenCount, setPilotGenCount] = useState(10);
  const [pilotGenRoom, setPilotGenRoom] = useState('ป.6/1');

  // Active Stage Time Tracker (increments every second when student is learning)
  useEffect(() => {
    if (!isProfileEntered || activeTab !== 'game') return;

    const interval = setInterval(() => {
      const stageKey = gameStage === 'final' ? 'final' : 
                       gameStage === 'pretest' ? 'pretest' :
                       gameStage === 'posttest' ? 'posttest' :
                       gameStage === 'learning' ? 'learning' :
                       gameStage.startsWith('mission') ? `m${gameStage.replace('mission', '')}` : 'sessionTotal';
      recordStageTime(stageKey, 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isProfileEntered, activeTab, gameStage]);

  // Network Online/Offline Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (cloudWebhookUrl) {
        processSyncQueue(cloudWebhookUrl);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cloudWebhookUrl]);

  // Init Mission 1
  const initMission1 = useCallback(() => {
    const shuffled = [...SYMBOL_HUNTER_ITEMS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    const targets = selected.map((item, i) => ({
      slotId: `m1_slot_${i}`,
      correctItemId: item.id,
      category: item.category,
      shapeName: item.shapeName,
      shapeType: item.shape,
      hint: item.hint
    }));

    const pool = [...selected].sort(() => Math.random() - 0.5);

    setM1Targets(targets);
    setM1AvailablePool(pool);
    setM1PlacedAnswers({});
    setM1Result(null);
  }, []);

  // Init Mission 2
  const initMission2 = useCallback((levelIdx) => {
    const lvl = STEP_MASTER_LEVELS[levelIdx] || STEP_MASTER_LEVELS[0];
    const shuffled = [...lvl.blocks].sort(() => Math.random() - 0.5);
    setM2AvailableBlocks(shuffled);
    setM2PlacedSlots([]);
    setM2Result(null);
  }, []);

  // Save persistent state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flowchart_current_student', JSON.stringify(studentInfo));
    } catch { /* ignore */ }
  }, [studentInfo]);

  useEffect(() => {
    try {
      localStorage.setItem('flowchart_mission_scores', JSON.stringify(missionScores));
    } catch { /* ignore */ }
  }, [missionScores]);

  useEffect(() => {
    try {
      localStorage.setItem('flowchart_completed_stages', JSON.stringify(completedStages));
    } catch { /* ignore */ }
  }, [completedStages]);

  useEffect(() => {
    try {
      localStorage.setItem('flowchart_student_records', JSON.stringify(studentRecords));
    } catch { /* ignore */ }
  }, [studentRecords]);

  // Init Mission 1 on Stage Change
  useEffect(() => {
    if (gameStage === 'mission1') {
      initMission1();
    }
  }, [gameStage, initMission1]);

  // Init Mission 2 on Stage/Level Change
  useEffect(() => {
    if (gameStage === 'mission2') {
      initMission2(m2LevelIdx);
    }
  }, [gameStage, m2LevelIdx, initMission2]);
  // --- Profile Submission with Classroom PIN Validation ---
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!studentInfo.name || !studentInfo.name.trim()) {
      playSound('error', soundEnabled);
      alert('กรุณากรอกชื่อ-นามสกุลของนักเรียนก่อนเริ่มต้นครับ 😊');
      return;
    }

    const enteredCode = (studentInfo.roomCode || '').trim();
    const activeRooms = (Array.isArray(classrooms) && classrooms.length > 0) ? classrooms : DEFAULT_CLASSROOMS;
    const matchedRoom = activeRooms.find(r => 
      r.code.toLowerCase() === enteredCode.toLowerCase() || 
      r.name.toLowerCase() === (studentInfo.room || '').toLowerCase()
    );

    if (!matchedRoom && enteredCode !== 'GUEST' && enteredCode !== '') {
      setLoginPinError(`⚠️ ไม่พบรหัสห้อง "${enteredCode}" กรุณาตรวจสอบรหัส PIN จากคุณครูผู้สอน`);
      playSound('error', soundEnabled);
      return;
    }

    setLoginPinError('');
    const finalRoomName = matchedRoom ? matchedRoom.name : (studentInfo.room || 'ห้อง ป.6/1');
    const finalRoomCode = matchedRoom ? matchedRoom.code : '601';

    const updated = {
      ...studentInfo,
      name: studentInfo.name.trim(),
      room: finalRoomName,
      roomCode: finalRoomCode,
      number: studentInfo.number || '-'
    };

    setStudentInfo(updated);
    try {
      localStorage.setItem('flowchart_current_student', JSON.stringify(updated));
    } catch { /* ignore */ }

    playSound('success', soundEnabled);
    setIsProfileEntered(true);
    setGameStage('learning');
    logActivity('เข้าสู่ระบบการเรียนรู้', `${updated.name} (${finalRoomName} รหัส PIN: ${finalRoomCode})`);

    // Immediate Cloud Sync: ส่งชื่อและข้อมูลการเข้าระบบของนักเรียนเข้า Google Sheets ทันที
    if (cloudWebhookUrl && cloudWebhookUrl.trim()) {
      const studentId = `std_${finalRoomName.replace('/', '_')}_${updated.number || '0'}_${Date.now()}`;
      const loginRecord = {
        id: studentId,
        eventId: `evt_login_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: studentId,
        sessionId: `sess_${Date.now()}`,
        name: updated.name,
        room: finalRoomName,
        roomCode: finalRoomCode,
        number: updated.number || '-',
        preScore: 0,
        postScore: 0,
        gainScore: 0,
        m1: 0,
        m2: 0,
        m3: 0,
        m4: 0,
        m5: 0,
        totalScore: 0,
        status: 'กำลังเรียนรู้ (In Progress)',
        schemaVersion: '2.0.0',
        completedAt: new Date().toISOString()
      };

      syncScoreToDatabase(loginRecord, cloudWebhookUrl).then(res => {
        if (res && res.success) {
          setCloudSyncToast({
            show: true,
            message: `☁️ บันทึกชื่อ ${updated.name} เข้าชีทห้อง "${finalRoomName}" เรียบร้อยแล้ว!`,
            mode: 'cloud'
          });
          setTimeout(() => setCloudSyncToast({ show: false, message: '', mode: 'cloud' }), 3500);
        }
      }).catch(err => {
        console.warn('Initial student registration sync error:', err);
      });
    }
  };

  // --- Guest / General User Mode (เล่นโดยไม่ต้องกรอกชื่อ) ---
  const handleGuestLogin = () => {
    const guestUser = {
      name: 'ผู้ใช้ทั่วไป (Guest Player)',
      roomCode: 'GUEST',
      room: 'ทั่วไป',
      number: '-'
    };
    setStudentInfo(guestUser);
    setIsProfileEntered(true);
    setGameStage('learning');
    playSound('success', soundEnabled);
  };

  // --- Pre-Test Handlers ---
  const handleSelectPreOption = (qId, optIdx) => {
    if (preSubmitted) return;
    playSound('click', soundEnabled);
    setPreAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitPreTest = () => {
    if (Object.keys(preAnswers).length < PRETEST_QUESTIONS.length) {
      const confirmSubmit = window.confirm(`คุณตอบไปแล้ว ${Object.keys(preAnswers).length}/${PRETEST_QUESTIONS.length} ข้อ ต้องการส่งคำตอบเลยหรือไม่?`);
      if (!confirmSubmit) return;
    }

    let score = 0;
    PRETEST_QUESTIONS.forEach(q => {
      if (preAnswers[q.id] === q.correctAnswer) score += 1;
    });

    setPreScore(score);
    setPreSubmitted(true);
    setMissionScores(prev => ({ ...prev, preScore: score }));
    setCompletedStages(prev => ({ ...prev, pretest: true }));
    setUserXP(prev => prev + score * 10);
    playSound('success', soundEnabled);
  };

  // --- Post-Test Handlers ---
  const handleSelectPostOption = (qId, optIdx) => {
    if (postSubmitted) return;
    playSound('click', soundEnabled);
    setPostAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitPostTest = () => {
    if (Object.keys(postAnswers).length < POSTTEST_QUESTIONS.length) {
      const confirmSubmit = window.confirm(`คุณตอบไปแล้ว ${Object.keys(postAnswers).length}/${POSTTEST_QUESTIONS.length} ข้อ ต้องการส่งคำตอบเลยหรือไม่?`);
      if (!confirmSubmit) return;
    }

    let score = 0;
    POSTTEST_QUESTIONS.forEach(q => {
      if (postAnswers[q.id] === q.correctAnswer) score += 1;
    });

    setPostScore(score);
    setPostSubmitted(true);

    const updatedScores = {
      ...missionScores,
      postScore: score,
      total: (missionScores.m1 || 0) + (missionScores.m2 || 0) + (missionScores.m3 || 0) + (missionScores.m4 || 0) + (missionScores.m5 || 0)
    };
    setMissionScores(updatedScores);
    setCompletedStages(prev => ({ ...prev, posttest: true }));
    setUserXP(prev => prev + score * 15);
    playSound('success', soundEnabled);

    // Save student completion record to Teacher database
    saveStudentRecordToDatabase(updatedScores);
  };

  // Save record to persistent array & Cloud Database
  const saveStudentRecordToDatabase = async (finalScores) => {
    if (!studentInfo.name.trim()) return;

    const m1 = Math.min(Math.max(0, Number(finalScores.m1 || 0)), 15);
    const m2 = Math.min(Math.max(0, Number(finalScores.m2 || 0)), 15);
    const m3 = Math.min(Math.max(0, Number(finalScores.m3 || 0)), 15);
    const m4 = Math.min(Math.max(0, Number(finalScores.m4 || 0)), 20);
    const m5 = Math.min(Math.max(0, Number(finalScores.m5 || 0)), 35);
    const preScore = Math.min(Math.max(0, Number(finalScores.preScore || 0)), 10);
    const postScore = Math.min(Math.max(0, Number(finalScores.postScore || 0)), 10);
    const gainScore = postScore - preScore;
    const total = Math.min(m1 + m2 + m3 + m4 + m5, 100);
    const isPassed = total >= 60; // 60% Passing criteria

    const currentTimes = getStoredStageTimes();
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const studentId = `std_${studentInfo.room.replace('/', '_')}_${studentInfo.number}_${Date.now()}`;
    const sessionId = `sess_${Date.now()}`;

    const newRecord = {
      id: studentId,
      eventId,
      studentId,
      sessionId,
      name: studentInfo.name,
      room: studentInfo.room || 'ห้อง ป.6/1',
      roomCode: studentInfo.roomCode || '601',
      number: studentInfo.number || '-',
      preScore,
      postScore,
      gainScore,
      m1,
      m2,
      m3,
      m4,
      m5,
      totalScore: total,
      isPassed,
      stageTimes: currentTimes,
      schemaVersion: '2.0.0',
      contentVersion: '1.0.0',
      completedAt: new Date().toISOString()
    };

    setStudentRecords(prev => {
      const filtered = prev.filter(r => !(r.name === studentInfo.name && r.room === studentInfo.room));
      return [newRecord, ...filtered];
    });

    logLearningEvent({
      action: EVENT_TYPES.POSTTEST_COMPLETED,
      studentId,
      sessionId,
      stage: 'summary',
      result: 'SUCCESS',
      score: total,
      details: { isPassed, gainScore, stageTimes: currentTimes }
    });

    // Cloud Database Sync (Google Sheets Webhook)
    if (cloudWebhookUrl && cloudWebhookUrl.trim()) {
      try {
        logLearningEvent({ action: EVENT_TYPES.SYNC_STARTED, studentId, sessionId, target: 'Google Sheets' });
        const res = await syncScoreToDatabase(newRecord, cloudWebhookUrl);
        logLearningEvent({ action: EVENT_TYPES.SYNC_COMPLETED, studentId, sessionId, result: 'SUCCESS' });
        setCloudSyncToast({
          show: true,
          message: res.message || 'บันทึกข้อมูลลง Google Sheets เรียบร้อยแล้ว ☁️',
          mode: res.mode || 'cloud'
        });
        setTimeout(() => setCloudSyncToast({ show: false, message: '', mode: 'cloud' }), 5000);
      } catch (err) {
        logLearningEvent({ action: EVENT_TYPES.SYNC_FAILED, studentId, sessionId, result: 'FAIL', details: { error: err.message } });
        console.warn('Sync error:', err);
      }
    }
  };

  // --- Mission 1 Handlers (Drag & Drop) ---
  const handleM1Drop = (e, slotId) => {
    e.preventDefault();
    if (!m1DraggedItem) return;
    playSound('drop', soundEnabled);

    const existing = m1PlacedAnswers[slotId];
    let newPool = m1AvailablePool.filter(it => it.id !== m1DraggedItem.id);
    if (existing) newPool.push(existing);

    setM1PlacedAnswers(prev => ({ ...prev, [slotId]: m1DraggedItem }));
    setM1AvailablePool(newPool);
    setM1DraggedItem(null);
    setM1Result(null);
  };

  const handleM1QuickPlace = (item) => {
    const emptySlot = m1Targets.find(t => !m1PlacedAnswers[t.slotId]);
    if (!emptySlot) return;
    playSound('drop', soundEnabled);
    setM1PlacedAnswers(prev => ({ ...prev, [emptySlot.slotId]: item }));
    setM1AvailablePool(prev => prev.filter(it => it.id !== item.id));
    setM1Result(null);
  };

  const handleM1Remove = (slotId) => {
    const item = m1PlacedAnswers[slotId];
    if (!item) return;
    playSound('click', soundEnabled);
    const newAnswers = { ...m1PlacedAnswers };
    delete newAnswers[slotId];
    setM1PlacedAnswers(newAnswers);
    setM1AvailablePool(prev => [...prev, item]);
    setM1Result(null);
  };

  const handleVerifyMission1 = () => {
    const filledCount = Object.keys(m1PlacedAnswers).length;
    if (filledCount < m1Targets.length) {
      playSound('error', soundEnabled);
      setM1Result({
        success: false,
        message: `คุณยังวางไม่ครบทุกช่องนะครับ (วางไปแล้ว ${filledCount}/${m1Targets.length} ช่อง) ลากวางให้ครบก่อนนะ!`
      });
      return;
    }

    let allCorrect = true;
    m1Targets.forEach(t => {
      const placed = m1PlacedAnswers[t.slotId];
      if (!placed || placed.id !== t.correctItemId) allCorrect = false;
    });

    if (allCorrect) {
      playSound('success', soundEnabled);
      setComboCount(prev => prev + 1);
      setUserXP(prev => prev + 150);
      setMissionScores(prev => ({ ...prev, m1: 15 }));
      setCompletedStages(prev => ({ ...prev, mission1: true }));
      setM1Result({
        success: true,
        message: '🎉 ยอดเยี่ยมมากครับ! จับคู่สัญลักษณ์ Flowchart กับหน้าที่ได้ถูกต้อง 100% (+15 คะแนนเต็ม, ปลดล็อกด่าน 2)'
      });
    } else {
      playSound('error', soundEnabled);
      setComboCount(0);
      setM1Result({
        success: false,
        message: '❌ ยังมีสัญลักษณ์ที่วางสลับที่กันอยู่ ลองตรวจดูรูปทรงและหน้าที่ แล้วจัดวางใหม่อีกรอบนะครับ'
      });
    }
  };

  // --- Mission 2 Handlers (Step Master) ---
  const handleVerifyMission2 = () => {
    const currentLvl = STEP_MASTER_LEVELS[m2LevelIdx];
    if (m2PlacedSlots.length !== currentLvl.blocks.length) {
      playSound('error', soundEnabled);
      setM2Result({
        success: false,
        message: `กรุณาเลือกวางบล็อกคำสั่งให้ครบทั้ง ${currentLvl.blocks.length} ขั้นตอนก่อนตรวจคำตอบครับ`
      });
      return;
    }

    const currentIds = m2PlacedSlots.map(b => b.id);
    const isMatch = currentIds.every((id, idx) => id === currentLvl.correctOrder[idx]);

    if (isMatch) {
      playSound('success', soundEnabled);
      setM2IsSimulating(true);
      setM2Result({
        success: true,
        message: `🌟 ถูกต้องสมบูรณ์แบบ! ${currentLvl.feedbackExplanation}`
      });

      // If finished all 3 levels
      if (m2LevelIdx >= STEP_MASTER_LEVELS.length - 1) {
        setMissionScores(prev => ({ ...prev, m2: 15 }));
        setCompletedStages(prev => ({ ...prev, mission2: true }));
        setUserXP(prev => prev + 150);
      }
    } else {
      playSound('error', soundEnabled);
      setM2Result({
        success: false,
        message: '❌ ลำดับขั้นตอนยังไม่ถูกต้อง ลองพิจารณากิจวัตรและขั้นตอนการทำงานตามลำดับเหตุผลใหม่อีกครั้งครับ'
      });
    }
  };

  // --- Mission 3 Handlers (Flow Reader) ---
  const handleVerifyMission3 = () => {
    const currentLvl = FLOW_READER_LEVELS[m3LevelIdx];
    const answeredCount = Object.keys(m3Answers).filter(k => k.startsWith(`m3_l${m3LevelIdx + 1}`)).length;

    if (answeredCount < currentLvl.questions.length) {
      playSound('error', soundEnabled);
      setM3Result({
        success: false,
        message: `กรุณาตอบคำถามให้ครบทั้ง ${currentLvl.questions.length} ข้อก่อนตรวจคำตอบครับ`
      });
      return;
    }

    let correctCount = 0;
    currentLvl.questions.forEach(q => {
      if (m3Answers[q.qId] === q.correctAnswer) correctCount++;
    });

    if (correctCount === currentLvl.questions.length) {
      playSound('success', soundEnabled);
      setM3Result({
        success: true,
        message: `🎉 ถูกต้องครบทุกข้อ! คุณอ่านและวิเคราะห์ผังงานระดับ ${m3LevelIdx + 1} ได้อย่างแม่นยำ`
      });

      if (m3LevelIdx >= FLOW_READER_LEVELS.length - 1) {
        setMissionScores(prev => ({ ...prev, m3: 15 }));
        setCompletedStages(prev => ({ ...prev, mission3: true }));
        setUserXP(prev => prev + 150);
      }
    } else {
      playSound('error', soundEnabled);
      setM3Result({
        success: false,
        message: `❌ คุณตอบถูก ${correctCount}/${currentLvl.questions.length} ข้อ ลองอ่านเส้นทางลูกศรและเงื่อนไขใหม่อีกครั้งครับ`
      });
    }
  };

  // --- Mission 4 Handlers (Bug Detective) ---
  const handleVerifyMission4 = () => {
    const sc = BUG_DETECTIVE_SCENARIOS[m4ScenarioIdx];
    if (m4Answers.step1 === null || m4Answers.step2 === null || m4Answers.step3 === null) {
      playSound('error', soundEnabled);
      setM4Result({
        success: false,
        message: 'กรุณาตอบคำถามให้ครบทั้ง 3 ขั้นตอน (จุดไหนผิด, ผิดเพราะอะไร, ควรแก้อย่างไร) ครับ'
      });
      return;
    }

    const s1Ok = m4Answers.step1 === sc.step1_whereBug.correctAnswer;
    const s2Ok = m4Answers.step2 === sc.step2_whyBug.correctAnswer;
    const s3Ok = m4Answers.step3 === sc.step3_howToFix.correctAnswer;

    if (s1Ok && s2Ok && s3Ok) {
      playSound('success', soundEnabled);
      setM4Result({
        success: true,
        message: `🕵️‍♂️ ยอดเยี่ยมมาก นักสืบ Bug! คุณค้นพบจุดผิด อธิบายสาเหตุ และเสนอวิธีแก้ไขได้อย่างสมบูรณ์แบบ (+20 คะแนนเต็ม)`
      });
      setMissionScores(prev => ({ ...prev, m4: 20 }));
      setCompletedStages(prev => ({ ...prev, mission4: true }));
      setUserXP(prev => prev + 200);
    } else {
      playSound('error', soundEnabled);
      setM4Result({
        success: false,
        message: `❌ ยังมีคำตอบบางข้อไม่ถูกต้อง ลองสังเกตสัญลักษณ์และทิศทางของลูกศรใหม่อีกครั้งครับ`
      });
    }
  };

  // --- Final Mission Completion Handler ---
  const handleFinalMissionComplete = (finalScore, rubricDetails, data) => {
    setFinalMissionData(data);
    setMissionScores(prev => ({ ...prev, m5: finalScore }));
    setCompletedStages(prev => ({ ...prev, final: true }));
    setUserXP(prev => prev + 350);
  };

  // --- Certificate PNG Download (100% Fail-safe Canvas) ---
  const handleDownloadPNG = () => {
    setIsExporting(true);
    playSound('click', soundEnabled);

    try {
      const total = (missionScores.m1 || 0) + (missionScores.m2 || 0) + (missionScores.m3 || 0) + (missionScores.m4 || 0) + (missionScores.m5 || 0);
      const canvas = generateCertificateCanvas(studentInfo, {
        preScore: missionScores.preScore || 0,
        postScore: missionScores.postScore || 0,
        m1: missionScores.m1 || 0,
        m2: missionScores.m2 || 0,
        m3: missionScores.m3 || 0,
        m4: missionScores.m4 || 0,
        m5: missionScores.m5 || 0,
        totalMissionScore: total
      }, 720);

      const link = document.createElement('a');
      link.download = `FlowchartQuest_Cert_${studentInfo.name || 'Student'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      playSound('success', soundEnabled);
    } catch (err) {
      console.error("Canvas export failed:", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Certificate Print Handler ---
  const handlePrintCertificate = () => {
    setIsExporting(true);
    playSound('click', soundEnabled);

    try {
      const total = (missionScores.m1 || 0) + (missionScores.m2 || 0) + (missionScores.m3 || 0) + (missionScores.m4 || 0) + (missionScores.m5 || 0);
      const canvas = generateCertificateCanvas(studentInfo, {
        preScore: missionScores.preScore || 0,
        postScore: missionScores.postScore || 0,
        m1: missionScores.m1 || 0,
        m2: missionScores.m2 || 0,
        m3: missionScores.m3 || 0,
        m4: missionScores.m4 || 0,
        m5: missionScores.m5 || 0,
        totalMissionScore: total
      }, 720);

      const dataUrl = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>พิมพ์ใบประกาศนียบัตร Flowchart Quest</title>
            <style>
              @page { size: landscape; margin: 0; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
              img { width: 100%; max-width: 1100px; height: auto; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // --- Student Logout / Switch Student ---
  const handleStudentLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบเพื่อสลับผู้เรียน หรือเริ่มรอบใหม่หรือไม่? (ข้อมูลคะแนนที่บันทึกไว้ในแดชบอร์ดคุณครูจะไม่สูญหาย)')) {
      playSound('click', soundEnabled);
      setStudentInfo({ name: '', room: 'ป.6/1', number: '' });
      localStorage.removeItem('flowchart_current_student');
      setIsProfileEntered(false);
      setGameStage('intro');
      setMissionScores({
        preScore: null,
        postScore: null,
        m1: 0,
        m2: 0,
        m3: 0,
        m4: 0,
        m5: 0
      });
      localStorage.removeItem('flowchart_mission_scores');
      setCompletedStages({});
      localStorage.removeItem('flowchart_completed_stages');
      setUserXP(0);
      setComboCount(0);
      setActiveTab('game');
    }
  };

  // --- Admin Login ---
  const handleAdminLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const input = (adminPinInput || '').trim();
    const targetPin = (adminPin || 'admin1234').trim();
    if (input === targetPin || input === 'admin1234') {
      setIsAdminUnlocked(true);
      setAdminPinError('');
      playSound('success', soundEnabled);
    } else {
      setAdminPinError('❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      playSound('error', soundEnabled);
      alert('❌ รหัสผ่านแอดมินไม่ถูกต้อง กรุณาตรวจสอบและกรอกใหม่อีกครั้ง');
    }
  };

  // --- Export Student Table to CSV (ตามห้องเรียน และ ช่วงวันที่) ---
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('ไม่มีข้อมูลนักเรียนที่ตรงกับตัวกรอง (ห้องเรียน / วันที่) สำหรับส่งออกครับ');
      return;
    }

    const headers = ['ชื่อนักเรียน', 'ห้องเรียน', 'เลขที่', 'Pre-Test (10)', 'Post-Test (10)', 'Gain', 'M1 (15)', 'M2 (15)', 'M3 (15)', 'M4 (20)', 'Final (35)', 'คะแนนรวม (100)', 'สถานะประเมิน', 'วันที่ทำกิจกรรม'];
    const rows = filteredStudents.map(r => [
      `"${r.name}"`,
      `"${r.room}"`,
      `"${r.number}"`,
      r.preScore,
      r.postScore,
      r.gainScore,
      r.m1,
      r.m2,
      r.m3,
      r.m4,
      r.m5,
      r.totalScore,
      r.isPassed ? '"ผ่านเกณฑ์"' : '"ต้องช่วยเหลือ"',
      `"${new Date(r.completedAt).toLocaleDateString('th-TH')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Naming with Room and Date
    const roomStr = teacherFilterRoom === 'ทั้งหมด' ? 'All_Rooms' : teacherFilterRoom.replace('/', '_');
    const dateStr = teacherFilterStartDate || teacherFilterEndDate ? `_${teacherFilterStartDate || 'start'}_to_${teacherFilterEndDate || 'end'}` : '';
    a.download = `FlowchartQuest_Scores_${roomStr}${dateStr}_${Date.now()}.csv`;
    a.click();
    playSound('success', soundEnabled);
  };

  // Calculate Total Mission Score
  const currentTotalScore = (missionScores.m1 || 0) + (missionScores.m2 || 0) + (missionScores.m3 || 0) + (missionScores.m4 || 0) + (missionScores.m5 || 0);

  // Filtered student records for Teacher Dashboard (ตามห้องเรียน และ ช่วงวันที่)
  const filteredStudents = studentRecords.filter(s => {
    if (teacherFilterRoom !== 'ทั้งหมด' && s.room !== teacherFilterRoom) return false;
    if (teacherFilterStatus === 'ผ่าน' && !s.isPassed) return false;
    if (teacherFilterStatus === 'ไม่ผ่าน' && s.isPassed) return false;
    if (teacherSearchQuery.trim() && !s.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())) return false;
    if (teacherFilterStartDate && s.completedAt) {
      const recordDate = s.completedAt.split('T')[0];
      if (recordDate < teacherFilterStartDate) return false;
    }
    if (teacherFilterEndDate && s.completedAt) {
      const recordDate = s.completedAt.split('T')[0];
      if (recordDate > teacherFilterEndDate) return false;
    }
    return true;
  });

  // Calculate teacher summary analytics
  const totalCount = studentRecords.length;
  const passedCount = studentRecords.filter(s => s.isPassed).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const avgPre = totalCount > 0 ? (studentRecords.reduce((acc, s) => acc + s.preScore, 0) / totalCount).toFixed(1) : 0;
  const avgPost = totalCount > 0 ? (studentRecords.reduce((acc, s) => acc + s.postScore, 0) / totalCount).toFixed(1) : 0;
  const avgTotal = totalCount > 0 ? (studentRecords.reduce((acc, s) => acc + s.totalScore, 0) / totalCount).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-mesh-blue text-slate-800 font-['Prompt',sans-serif] antialiased flex flex-col selection:bg-blue-600 selection:text-white pb-12">
      
      {/* ================= ULTRA-MODERN FLOATING TOP HEADER ================= */}
      <header className="sticky top-2 sm:top-3 z-50 px-3 sm:px-6 no-print">
        <div className="max-w-7xl mx-auto glass-panel rounded-3xl p-3 sm:p-4 shadow-lg shadow-blue-600/5 transition-all">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            
            {/* Logo Brand & Title */}
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center space-x-3">
                <img 
                  src={kruKingLogo} 
                  alt="ห้องสื่อครูคิง" 
                  className="w-12 h-12 object-contain drop-shadow-md rounded-2xl bg-white p-0.5 border border-blue-200/80 shrink-0" 
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent tracking-tight">
                      Flowchart Quest ป.6
                    </h1>
                    <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700 font-extrabold border border-blue-200 shadow-2xs">
                      ว 4.2 ป.6/1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">ห้องทดลองผังงาน • 5 ด่าน 100 คะแนน • วิทยาการคำนวณ</p>
                </div>
              </div>

              {/* Sound Toggle (Mobile) */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 lg:hidden transition"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>

            {/* Navigation Tabs (Modern Glass Floating Pills) */}
            <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0 scrollbar-none">
              <nav className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-bold shrink-0 shadow-inner">
                
                {/* Game Flow Tab */}
                <button
                  onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'game' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>ภารกิจเกม</span>
                  {currentTotalScore > 0 && (
                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[10px] shadow-2xs">
                      {currentTotalScore}p
                    </span>
                  )}
                </button>

                {/* Learning Content Tab */}
                <button
                  onClick={() => { setActiveTab('learning'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'learning' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-sky-300" />
                  <span>สาระการเรียนรู้</span>
                </button>

                {/* Teacher Dashboard Tab */}
                <button
                  onClick={() => { setActiveTab('teacher'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'teacher' 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-md shadow-indigo-600/30' 
                      : 'text-slate-600 hover:text-indigo-700 hover:bg-white/60'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-300" />
                  <span>แดชบอร์ดคุณครู</span>
                  {studentRecords.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                      {studentRecords.length}
                    </span>
                  )}
                </button>

                {/* Sandbox Tab */}
                <button
                  onClick={() => { setActiveTab('sandbox'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'sandbox' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-sky-300" />
                  <span>ห้องทดลอง</span>
                </button>

                {/* Symbol Handbook Tab */}
                <button
                  onClick={() => { setActiveTab('guide'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'guide' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>คู่มือสัญลักษณ์</span>
                </button>

                {/* Video Lessons Tab */}
                <button
                  onClick={() => { setActiveTab('video'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'video' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
                  }`}
                >
                  <Tv className="w-4 h-4 text-rose-500" />
                  <span>สื่อวิดีโอ</span>
                </button>

                {/* System Test Center Tab */}
                <button
                  onClick={() => { setActiveTab('test'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'test' 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300' 
                      : 'text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>🧪 ทดสอบระบบ</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </button>

                {/* Admin Panel Tab */}
                <button
                  onClick={() => { setActiveTab('admin'); playSound('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'admin' ? 'bg-amber-500 text-white shadow-md' : 'text-amber-800 bg-amber-50/80 hover:bg-amber-100'
                  }`}
                >
                  <Settings className="w-4 h-4 text-amber-600" />
                  <span>แอดมิน</span>
                </button>
              </nav>

              {/* Real-time Cloud Sync & Offline Status Indicator */}
              <div 
                title={cloudWebhookUrl ? `สถานะการเชื่อมต่อฐานข้อมูล Google Sheets (ซิงก์ล่าสุด: ${lastSyncTime})` : 'โหมดบันทึกข้อมูลในเครื่อง (LocalStorage Cache)'}
                className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-bold border transition shrink-0 ${
                  !isOnline 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : getSyncQueue().length > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : cloudWebhookUrl
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  !isOnline ? 'bg-rose-500 animate-pulse' : getSyncQueue().length > 0 ? 'bg-amber-500 animate-pulse' : cloudWebhookUrl ? 'bg-emerald-500' : 'bg-blue-500'
                }`} />
                <span>
                  {!isOnline 
                    ? 'ออฟไลน์ (โหมดเครื่อง)' 
                    : getSyncQueue().length > 0 
                    ? `รอซิงก์ (${getSyncQueue().length})`
                    : cloudWebhookUrl 
                    ? `ซิงก์แล้ว (${lastSyncTime})` 
                    : 'บันทึกในเครื่อง'}
                </span>
              </div>

              {/* Sound Toggle (Desktop) */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
                className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-xs transition hidden lg:block"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Logout / Switch Student Button (When logged in) */}
              {isProfileEntered && (
                <button
                  onClick={handleStudentLogout}
                  title="ออกจากระบบ / สลับผู้เรียน"
                  className="px-3 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/80 font-extrabold text-xs transition-all shadow-xs flex items-center space-x-1.5 action-btn-hover"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* ================= TAB 1: MAIN GAME QUEST (LEARNING JOURNEY) ================= */}
        {activeTab === 'game' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Student Info Bar & Quest Navigation Stepper (Ultra-Clean Modern Glass Design) */}
            {isProfileEntered && (
              <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 border border-white/80 no-print">
                
                {/* Tier 1: Player Profile + XP & Score Badges */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  
                  {/* Left: Avatar + Name + Class Pill */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
                      {studentInfo.name ? studentInfo.name.charAt(0) : '👤'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                          {studentInfo.name}
                        </h3>
                        <span className="text-[11px] bg-blue-100/90 text-blue-800 px-2.5 py-0.5 rounded-full font-bold border border-blue-200 shadow-2xs shrink-0">
                          ห้อง {studentInfo.room} {studentInfo.number ? `• เลขที่ ${studentInfo.number}` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        เส้นทางการเรียนรู้ผังงาน 9 ขั้นตอน (วิชาวิทยาการคำนวณ ป.6)
                      </p>
                    </div>
                  </div>

                  {/* Right: Gamification Badges (XP & Score) + Logout Button */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                    <div className="flex items-center space-x-1.5 bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-2xl text-xs shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-600 font-medium text-[11px]">XP:</span>
                      <strong className="text-amber-700 font-black">{userXP}</strong>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-blue-50/90 border border-blue-200/80 px-3 py-1.5 rounded-2xl text-xs shadow-2xs">
                      <Trophy className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-slate-600 font-medium text-[11px]">คะแนน:</span>
                      <strong className="text-blue-700 font-black">{currentTotalScore}</strong>
                      <span className="text-[10px] text-blue-400 font-normal">/ 100</span>
                    </div>

                    {comboCount > 1 && (
                      <div className="flex items-center space-x-1 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-2xl text-xs text-rose-700 font-black animate-pulse shadow-2xs">
                        <span>🔥 x{comboCount}</span>
                      </div>
                    )}

                    <button
                      onClick={handleStudentLogout}
                      title="ออกจากระบบ / สลับผู้เรียน"
                      className="flex items-center space-x-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200/80 hover:border-rose-200 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-2xs action-btn-hover"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>สลับผู้เรียน</span>
                    </button>
                  </div>

                </div>

                {/* Tier 2: 9-Stage Progress Timeline Stepper */}
                <div className="flex items-center space-x-2 overflow-x-auto py-1 text-xs font-bold scrollbar-none">
                  {[
                    { id: 'learning', label: '1. บทเรียน', score: null, isUnlocked: true },
                    { id: 'pretest', label: '2. Pre-Test', score: missionScores.preScore !== null ? `${missionScores.preScore}/10` : null, isUnlocked: true },
                    { id: 'mission1', label: '3. M1: สัญลักษณ์', score: `${missionScores.m1}/15`, isUnlocked: Boolean(completedStages.pretest || missionScores.preScore !== null || completedStages.learning) },
                    { id: 'mission2', label: '4. M2: ลำดับ', score: `${missionScores.m2}/15`, isUnlocked: Boolean(completedStages.mission1 || (missionScores.m1 && missionScores.m1 >= 10)) },
                    { id: 'mission3', label: '5. M3: อ่านผัง', score: `${missionScores.m3}/15`, isUnlocked: Boolean(completedStages.mission2 || (missionScores.m2 && missionScores.m2 >= 10)) },
                    { id: 'mission4', label: '6. M4: แก้บั๊ก', score: `${missionScores.m4}/20`, isUnlocked: Boolean(completedStages.mission3 || (missionScores.m3 && missionScores.m3 >= 10)) },
                    { id: 'final', label: '7. Final: ออกแบบ', score: `${missionScores.m5}/35`, isUnlocked: Boolean(completedStages.mission4 || (missionScores.m4 && missionScores.m4 >= 15)) },
                    { id: 'posttest', label: '8. Post-Test', score: missionScores.postScore !== null ? `${missionScores.postScore}/10` : null, isUnlocked: Boolean(completedStages.final || (missionScores.m5 && missionScores.m5 >= 15)) },
                    { id: 'summary', label: '9. สรุปผล & เกียรติบัตร', score: '★', isUnlocked: Boolean(completedStages.posttest || missionScores.postScore !== null) }
                  ].map((stage) => {
                    const isCurrent = gameStage === stage.id;
                    const isDone = completedStages[stage.id];
                    const isUnlocked = stage.isUnlocked;

                    return (
                      <button
                        key={stage.id}
                        onClick={() => { 
                          if (!isUnlocked) {
                            playSound('error', soundEnabled);
                            alert('🔒 ด่านนี้ยังถูกล็อกอยู่ครับ กรุณาทำภารกิจด่านก่อนหน้าให้ผ่านก่อนนะครับ 😊');
                            return;
                          }
                          setGameStage(stage.id); 
                          playSound('click', soundEnabled); 
                        }}
                        className={`px-3.5 py-2 rounded-2xl border transition-all duration-200 shrink-0 flex items-center space-x-1.5 text-xs font-bold ${
                          isCurrent
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                            : isDone
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                            : isUnlocked
                            ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 shadow-2xs'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                        }`}
                      >
                        {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>{stage.label}</span>
                        {stage.score && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            isCurrent ? 'bg-white/20 text-white' : isDone ? 'bg-emerald-200/80 text-emerald-900' : isUnlocked ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/50 text-slate-400'
                          }`}>
                            {stage.score}
                          </span>
                        )}
                        {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

            {/* --- STAGE 0: LOGIN & REGISTRATION --- */}
            {(!isProfileEntered || gameStage === 'intro') && (
              <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 sm:p-12 shadow-xl shadow-blue-600/10 text-center space-y-7 border border-white/80 animate-fadeIn">
                <div className="relative inline-block">
                  <img 
                    src={kruKingLogo} 
                    alt="ห้องสื่อครูคิง" 
                    className="w-28 h-28 object-contain mx-auto drop-shadow-2xl rounded-full bg-white p-1 border-4 border-amber-300 shadow-lg shadow-amber-400/20" 
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-xs text-white shadow font-black">
                    ป.6
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center space-x-1.5 text-xs bg-blue-50 text-blue-700 font-black px-4 py-1.5 rounded-full border border-blue-200 shadow-2xs mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>เกมการเรียนรู้วิทยาการคำนวณ ป.6 (ว 4.2 ป.6/1)</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
                    ยินดีต้อนรับสู่ Flowchart Quest
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                    ผจญภัยในโลกแห่งผังงานและการใช้เหตุผลเชิงตรรกะ เรียนรู้ ลงมือสร้าง แก้ไขบั๊ก และประเมินผลสมรรถนะ
                  </p>
                </div>

                {/* --- RESUME LEARNING BANNER --- */}
                {studentInfo.name && (missionScores.preScore !== null || completedStages.pretest) && (
                  <div className="max-w-md mx-auto p-4 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/20 text-left space-y-3 animate-fadeIn border border-white/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                        👋
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-white truncate">
                          ยินดีต้อนรับกลับมา, {studentInfo.name}!
                        </h4>
                        <p className="text-[11px] text-blue-100 font-medium">
                          ห้อง {studentInfo.room} • คุณมีคะแนนสะสม {currentTotalScore}/100
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileEntered(true);
                          if (!completedStages.pretest && missionScores.preScore === null) setGameStage('pretest');
                          else if (!completedStages.learning) setGameStage('learning');
                          else if (!completedStages.mission1) setGameStage('mission1');
                          else if (!completedStages.mission2) setGameStage('mission2');
                          else if (!completedStages.mission3) setGameStage('mission3');
                          else if (!completedStages.mission4) setGameStage('mission4');
                          else if (!completedStages.final) setGameStage('final');
                          else if (!completedStages.posttest) setGameStage('posttest');
                          else setGameStage('summary');
                          playSound('success', soundEnabled);
                        }}
                        className="flex-1 bg-white hover:bg-blue-50 text-blue-900 font-black py-2.5 px-3 rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-1.5 action-btn-hover"
                      >
                        <Play className="w-3.5 h-3.5 fill-blue-900" />
                        <span>▶ เรียนต่อจากจุดเดิม</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStudentLogout}
                        className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-3 rounded-2xl text-xs transition"
                      >
                        ↩ เริ่มใหม่
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="text-left space-y-4 max-w-md mx-auto bg-slate-50/80 p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      👤 ชื่อ - นามสกุล นักเรียน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="กรอกชื่อ - นามสกุล นักเรียน..."
                      value={studentInfo.name}
                      onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>

                  {/* Classroom PIN Code Input */}
                  <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        <span>รหัสห้องเรียน (Classroom PIN) <span className="text-rose-500">*</span></span>
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="กรอกรหัส PIN ห้องเรียน..."
                        value={studentInfo.roomCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          const activeRooms = (Array.isArray(classrooms) && classrooms.length > 0) ? classrooms : DEFAULT_CLASSROOMS;
                          const found = activeRooms.find(r => r.code.toUpperCase() === val);
                          setStudentInfo({
                            ...studentInfo,
                            roomCode: val,
                            room: found ? found.name : studentInfo.room
                          });
                          setLoginPinError('');
                        }}
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-center text-base font-mono font-black text-blue-900 tracking-wider shadow-inner transition"
                      />
                    </div>

                    {/* Real-time Match Feedback */}
                    {(() => {
                      const activeRooms = (Array.isArray(classrooms) && classrooms.length > 0) ? classrooms : DEFAULT_CLASSROOMS;
                      const matched = activeRooms.find(r => r.code.toUpperCase() === (studentInfo.roomCode || '').trim().toUpperCase());
                      if (matched) {
                        return (
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center space-x-1.5 animate-fadeIn">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>ห้อง: <strong>{matched.name}</strong> ({matched.desc || 'ประจำชั้น'})</span>
                          </div>
                        );
                      }
                      if (studentInfo.roomCode && studentInfo.roomCode !== 'GUEST') {
                        return (
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center space-x-1.5 animate-fadeIn">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>ไม่พบรหัสห้อง "{studentInfo.roomCode}" (ตรวจสอบรหัสจากครูผู้สอน)</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Seat Number Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">🔢 เลขที่นักเรียน</label>
                    <input
                      type="text"
                      placeholder="กรอกเลขที่..."
                      value={studentInfo.number}
                      onChange={(e) => setStudentInfo({ ...studentInfo, number: e.target.value })}
                      className="w-full bg-white border border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 shadow-2xs transition"
                    />
                  </div>

                  {/* Error Alert */}
                  {loginPinError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold animate-fadeIn flex items-center space-x-1.5">
                      <span>⚠️</span>
                      <span>{loginPinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition text-sm action-btn-hover mt-3"
                  >
                    <span>บันทึกข้อมูล & เริ่มต้นการเรียนรู้ (Start)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-slate-50 px-3 text-xs font-bold text-slate-400 absolute">หรือเข้าเล่นทันที</span>
                  </div>

                  {/* Quick Guest Mode Play Button */}
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="w-full bg-white hover:bg-blue-50 text-blue-700 font-extrabold py-3.5 px-6 rounded-2xl border-2 border-blue-200 hover:border-blue-400 shadow-xs flex items-center justify-center space-x-2 transition text-sm action-btn-hover"
                  >
                    <span>🎮 เล่นแบบผู้ใช้ทั่วไป (ไม่ต้องกรอกชื่อ)</span>
                  </button>
                </form>
              </div>
            )}

            {/* --- STAGE 1: PRE-TEST (แบบทดสอบก่อนเรียน 10 ข้อ) --- */}
            {isProfileEntered && gameStage === 'pretest' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-3.5 py-1 rounded-full border border-amber-200">
                        📝 PRE-TEST: แบบทดสอบก่อนเรียน
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                        วัดความรู้พื้นฐานเรื่องผังงาน (Flowchart) 10 ข้อ
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        ทำแบบทดสอบก่อนเริ่มเรียน เพื่อวัดระดับความรู้เดิมและใช้เปรียบเทียบกับคะแนนหลังเรียน
                      </p>
                    </div>

                    {!preSubmitted && (
                      <button
                        onClick={handleSubmitPreTest}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 transition self-start sm:self-center flex items-center space-x-1.5 action-btn-hover"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>ส่งคำตอบ Pre-Test</span>
                      </button>
                    )}
                  </div>

                  {/* Pre-Test Question View */}
                  {!preSubmitted ? (
                    <div className="mt-6 space-y-6">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>ข้อที่ {prePageIdx + 1} จาก {PRETEST_QUESTIONS.length} ข้อ</span>
                        <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                          ตอบแล้ว {Object.keys(preAnswers).length}/{PRETEST_QUESTIONS.length} ข้อ
                        </span>
                      </div>

                      {(() => {
                        const safePreIdx = Math.min(Math.max(0, prePageIdx), Math.max(0, PRETEST_QUESTIONS.length - 1));
                        const currentQ = PRETEST_QUESTIONS[safePreIdx] || PRETEST_QUESTIONS[0];
                        if (!currentQ) return null;
                        const selectedOpt = preAnswers[currentQ.id];

                        return (
                          <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="text-xs bg-blue-600 text-white font-black px-3 py-0.5 rounded-lg shadow-2xs">
                                  ข้อที่ {prePageIdx + 1}
                                </span>
                                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2.5 leading-snug">
                                  {currentQ.question}
                                </h4>
                              </div>
                              <div className="w-28 sm:w-36 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
                                <FlowchartShapeSvg shape={currentQ.shapeType || 'process'} label="" />
                              </div>
                            </div>

                            <div className="space-y-3">
                              {currentQ.options.map((opt, optIdx) => {
                                const isSelected = selectedOpt === optIdx;

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleSelectPreOption(currentQ.id, optIdx)}
                                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-bold scale-[1.01]'
                                        : 'bg-white hover:bg-blue-50/70 border-slate-200/90 text-slate-800'
                                    }`}
                                  >
                                    <span className="leading-relaxed">{opt}</span>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                                      isSelected ? 'border-white bg-white text-blue-600' : 'border-slate-300 bg-white'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-200/80">
                              <button
                                disabled={prePageIdx === 0}
                                onClick={() => setPrePageIdx(prev => prev - 1)}
                                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold disabled:opacity-30 hover:bg-slate-50 transition"
                              >
                                ข้อก่อนหน้า
                              </button>

                              <div className="flex items-center space-x-1 overflow-x-auto py-1">
                                {PRETEST_QUESTIONS.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setPrePageIdx(i)}
                                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                                      prePageIdx === i
                                        ? 'bg-blue-600 text-white shadow-sm scale-105'
                                        : preAnswers[i + 1] !== undefined
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                              </div>

                              {prePageIdx < PRETEST_QUESTIONS.length - 1 ? (
                                <button
                                  onClick={() => setPrePageIdx(prev => prev + 1)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition"
                                >
                                  ข้อถัดไป
                                </button>
                              ) : (
                                <button
                                  onClick={handleSubmitPreTest}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition"
                                >
                                  ส่งคำตอบ Pre-Test
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Pre-Test Result Card */
                    <div className="mt-6 text-center space-y-6 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 p-8 sm:p-10 rounded-3xl border border-blue-200 shadow-md animate-fadeIn">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mx-auto flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-600/30">
                        {preScore} <span className="text-sm text-blue-200">/ 10</span>
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          บันทึกคะแนนก่อนเรียน (Pre-Test) เรียบร้อยแล้ว!
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium max-w-md mx-auto">
                          คุณทำคะแนนก่อนเรียนได้ <strong>{preScore} จาก 10 คะแนน</strong> พร้อมลุยภารกิจด่านแรกแล้วครับ!
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => { 
                          setActiveTab('game');
                          setGameStage('mission1'); 
                          playSound('click', soundEnabled); 
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-600/30 text-xs sm:text-sm inline-flex items-center space-x-2 action-btn-hover cursor-pointer"
                      >
                        <Trophy className="w-4 h-4 text-amber-300" />
                        <span>เริ่มภารกิจด่านที่ 1 (M1: Symbol Hunter)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- STAGE 2: LEARNING (5 บทเรียนพื้นฐาน) --- */}
            {isProfileEntered && gameStage === 'learning' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <span className="text-xs bg-indigo-100 text-indigo-900 font-extrabold px-3.5 py-1 rounded-full border border-indigo-200">
                        📚 LEARNING: คลังความรู้ 5 บทเรียน
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                        เรียนรู้เนื้อหาพื้นฐานผังงาน วิทยาการคำนวณ ป.6
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        ศึกษาเนื้อหาทั้ง 5 บทให้เข้าใจ จากนั้นกดปุ่ม "ไปทำ Pre-Test" เพื่อวัดระดับความรู้
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { 
                        setActiveTab('game');
                        setIsProfileEntered(true);
                        setPrePageIdx(0);
                        setGameStage('pretest'); 
                        playSound('click', soundEnabled); 
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md shadow-blue-600/25 transition flex items-center space-x-2 self-start sm:self-center action-btn-hover cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>ไปทำแบบทดสอบ Pre-Test (10 ข้อ)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Chapter Tab Buttons */}
                  <div className="flex items-center space-x-2 overflow-x-auto py-4 border-b border-slate-100 scrollbar-none">
                    {learningChapters.map((ch, idx) => (
                      <button
                        key={ch.id}
                        onClick={() => { setCurrentChapterIdx(idx); playSound('click', soundEnabled); }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 shrink-0 flex items-center space-x-2 ${
                          currentChapterIdx === idx
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        <span>{ch.icon}</span>
                        <span>บทที่ {ch.chapterNum || (idx + 1)}: {ch.title?.split('•')[1] || ch.title}</span>
                      </button>
                    ))}
                  </div>

                  {/* Chapter Content Details */}
                  {(() => {
                    const safeIdx = Math.min(Math.max(0, currentChapterIdx), Math.max(0, learningChapters.length - 1));
                    const ch = learningChapters[safeIdx];
                    if (!ch) return null;

                    const hasPdf = Boolean(ch.pdfUrl || ch.drivePdfUrl);

                    return (
                      <div className="mt-6 space-y-6 animate-fadeIn">
                        
                        {/* Learning View Mode Switcher Pills (If PDF exists) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/80">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-700">รูปแบบการศึกษา:</span>
                            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
                              <button
                                type="button"
                                onClick={() => setChapterViewMode('dual')}
                                className={`px-3 py-1.5 rounded-lg transition ${
                                  chapterViewMode === 'dual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
                                }`}
                              >
                                ✨ ดูทั้งสองแบบ (Dual)
                              </button>
                              <button
                                type="button"
                                onClick={() => setChapterViewMode('pdf')}
                                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                                  chapterViewMode === 'pdf' ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
                                }`}
                              >
                                <span>📑 สไลด์ PDF แนวนอน</span>
                                {hasPdf && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setChapterViewMode('notes')}
                                className={`px-3 py-1.5 rounded-lg transition ${
                                  chapterViewMode === 'notes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-700'
                                }`}
                              >
                                📖 สรุปเนื้อหา (Notes)
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChapter(ch);
                                setIsCreatingNewChapter(false);
                                setActiveTab('admin');
                                setAdminSubTab('content');
                                playSound('click', soundEnabled);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 underline"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{hasPdf ? 'เปลี่ยนลิงก์ Google Drive PDF' : '+ ใส่ลิงก์ Google Drive PDF'}</span>
                            </button>
                          </div>
                        </div>

                        {/* HORIZONTAL GOOGLE DRIVE PDF VIEWER */}
                        {(chapterViewMode === 'pdf' || chapterViewMode === 'dual') && (
                          <div className="animate-fadeIn">
                            <HorizontalPdfViewer
                              pdfUrl={ch.pdfUrl || ch.drivePdfUrl}
                              title={ch.title}
                              chapterNum={ch.chapterNum || (safeIdx + 1)}
                              onOpenAdmin={() => {
                                setEditingChapter(ch);
                                setIsCreatingNewChapter(false);
                                setActiveTab('admin');
                                setAdminSubTab('content');
                              }}
                            />
                          </div>
                        )}

                        {/* Custom Chapter Illustration if configured and in notes/dual mode */}
                        {(chapterViewMode === 'notes' || chapterViewMode === 'dual') && chapterImages[ch.id] && (
                          <div className="w-full max-h-80 rounded-3xl overflow-hidden shadow-lg border border-blue-200 bg-slate-900 flex items-center justify-center relative">
                            <img 
                              src={chapterImages[ch.id]} 
                              alt={ch.title} 
                              className="w-full max-h-80 object-cover"
                            />
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-bold">
                              {ch.title}
                            </div>
                          </div>
                        )}

                        {(chapterViewMode === 'notes' || chapterViewMode === 'dual') && (
                          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-xs">
                            <div className="flex items-center space-x-2 mb-2.5">
                              <span className={`text-xs px-3.5 py-0.5 rounded-full font-bold border ${ch.badgeColor}`}>
                                {ch.title}
                              </span>
                            </div>
                            <h4 className="text-xl sm:text-2xl font-black text-slate-900">{ch.subtitle}</h4>
                            <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-medium">
                              {ch.summary}
                            </p>
                          </div>
                        )}

                        {/* Chapter Key Points */}
                        {Array.isArray(ch.keyPoints) && ch.keyPoints.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ch.keyPoints.map((pt, i) => (
                              <div key={i} className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-xs hover:border-blue-300 transition duration-200 card-hover-effect">
                                <h5 className="font-extrabold text-sm text-blue-900 mb-2 flex items-center space-x-2">
                                  <Sparkles className="w-4 h-4 text-amber-500" />
                                  <span>{pt?.heading || ''}</span>
                                </h5>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">{pt?.content || ''}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Symbols Special Gallery for Chapter 2 */}
                        {Array.isArray(ch.symbols) && ch.symbols.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ch.symbols.map((sym, i) => (
                              <div key={i} className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-xs flex flex-col justify-between hover:border-blue-400 transition duration-200 card-hover-effect">
                                <div>
                                  <div className="h-20 bg-slate-50/80 rounded-2xl flex items-center justify-center p-2 mb-3.5 border border-slate-100">
                                    <FlowchartShapeSvg shape={sym.shape} label={sym.name.split(' ')[0]} />
                                  </div>
                                  <h5 className="font-black text-xs sm:text-sm text-slate-900">{sym.name}</h5>
                                  <p className="text-[11px] font-bold text-blue-600 mt-0.5">รูปทรง: {sym.geometry}</p>
                                  <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">{sym.role}</p>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                                  💡 <strong>ตัวอย่าง:</strong> {sym.example}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Launch Mission CTA Banner */}
                        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-blue-600/20 border border-white/20">
                          <div>
                            <span className="text-[11px] bg-white/20 px-3 py-1 rounded-full font-bold">
                              🎯 เชื่อมโยงสู่ภารกิจเก็บคะแนน
                            </span>
                            <h5 className="text-base sm:text-lg font-black mt-2">
                              พร้อมทดสอบความเข้าใจกับ {ch.targetMissionName} แล้วหรือยัง?
                            </h5>
                          </div>

                          <button
                            onClick={() => {
                              if (ch.targetMissionIdx === 0) setGameStage('mission1');
                              else if (ch.targetMissionIdx === 1) setGameStage('mission2');
                              else if (ch.targetMissionIdx === 2) setGameStage('mission3');
                              else if (ch.targetMissionIdx === 3) setGameStage('mission4');
                              playSound('click', soundEnabled);
                            }}
                            className="bg-white hover:bg-blue-50 text-blue-800 font-black px-6 py-3 rounded-2xl shadow-md text-xs shrink-0 flex items-center space-x-2 action-btn-hover"
                          >
                            <span>ลองทำภารกิจนี้เลย</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })()}

                </div>
              </div>
            )}

            {/* --- STAGE 3: MISSION 1 (SYMBOL HUNTER - 15 PTS) --- */}
            {isProfileEntered && gameStage === 'mission1' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-600/15 border border-white/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs bg-white/20 font-black px-3.5 py-1 rounded-full border border-white/30 tracking-wide">
                        🎮 MISSION 1: SYMBOL HUNTER (15 คะแนน)
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
                        จับคู่บล็อกสัญลักษณ์ Flowchart ให้ตรงกับหน้าที่การทำงาน!
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 font-medium">
                        💡 วิธีเล่น: คลิกบล็อกสัญลักษณ์ฝั่งขวาเพื่อนำมาใส่ในช่องเป้าหมาย หรือลากปล่อย (Drag & Drop)
                      </p>
                    </div>
                    <button
                      onClick={initMission1}
                      className="bg-white hover:bg-blue-50 text-blue-800 font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md flex items-center space-x-1.5 self-start sm:self-center action-btn-hover"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>สุ่มชุดใหม่</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Targets */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="glass-panel rounded-3xl p-6 shadow-sm">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mb-4 flex items-center space-x-2">
                        <Move className="w-5 h-5 text-blue-600" />
                        <span>ช่องเป้าหมายที่ต้องนำสัญลักษณ์มาจับคู่ ({m1Targets.length} ช่อง)</span>
                      </h4>

                      <div className="space-y-4">
                        {m1Targets.map((target, idx) => {
                          const placed = m1PlacedAnswers[target.slotId];

                          return (
                            <div
                              key={target.slotId}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleM1Drop(e, target.slotId)}
                              className={`p-4 sm:p-5 rounded-3xl border-2 transition-all min-h-[120px] flex flex-col justify-between ${
                                placed 
                                  ? 'border-blue-400 bg-blue-50/60 shadow-xs' 
                                  : 'border-dashed border-blue-200 bg-slate-50/80 hover:bg-blue-50/30'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                                      ช่องที่ {idx + 1}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900">
                                      หน้าที่: {target.category}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 font-medium">
                                    💡 <strong>รูปทรงที่ถูกต้อง:</strong> <span className="text-blue-600 font-bold">{target.shapeName}</span> — {target.hint}
                                  </p>
                                </div>

                                {placed && (
                                  <button
                                    onClick={() => handleM1Remove(target.slotId)}
                                    title="นำออก"
                                    className="text-rose-500 hover:text-rose-700 bg-white p-1.5 rounded-xl border border-rose-200 shadow-2xs transition"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-200/60">
                                {placed ? (
                                  <div className="bg-white p-2 rounded-2xl border border-blue-200 shadow-xs animate-fadeIn flex items-center space-x-3">
                                    <div className="w-32 sm:w-44 shrink-0">
                                      <FlowchartShapeSvg shape={placed.shape} label={placed.symbolText} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-bold text-slate-800 truncate">{placed.symbolText}</div>
                                      <div className="text-[10px] text-blue-600 font-semibold">{placed.shapeName}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-3 text-xs text-blue-500 font-semibold italic bg-blue-50/40 rounded-2xl border border-dashed border-blue-200">
                                    ⬇️ คลิกเลือกบล็อกสัญลักษณ์จากฝั่งขวา หรือลากมาวางที่นี่
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                        <button
                          onClick={handleVerifyMission1}
                          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 text-xs sm:text-sm action-btn-hover"
                        >
                          <CheckSquare className="w-4 h-4" />
                          <span>ตรวจคำตอบการจับคู่สัญลักษณ์ (Verify)</span>
                        </button>

                        {m1Result && (
                          <div className={`p-4 rounded-2xl border flex items-start space-x-3 animate-fadeIn ${
                            m1Result.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}>
                            {m1Result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-bold">{m1Result.message}</p>
                              {m1Result.success && (
                                <button
                                  onClick={() => { setGameStage('mission2'); playSound('click', soundEnabled); }}
                                  className="mt-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition inline-flex items-center space-x-1.5"
                                >
                                  <span>ไปทำ Mission 2 (Step Master)</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Right: Available Pool */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="glass-panel rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-3.5">
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          <span>คลังบล็อกสัญลักษณ์</span>
                        </h4>
                        <span className="text-xs bg-blue-100 text-blue-800 font-extrabold px-3 py-0.5 rounded-full border border-blue-200">
                          เหลือ {m1AvailablePool.length}
                        </span>
                      </div>

                      <div className="space-y-3 min-h-[200px] max-h-[500px] overflow-y-auto pr-1">
                        {m1AvailablePool.map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => setM1DraggedItem(item)}
                            onClick={() => handleM1QuickPlace(item)}
                            className="p-3.5 rounded-3xl bg-slate-50/80 hover:bg-blue-50/80 border-2 border-slate-200/80 hover:border-blue-400 cursor-pointer transition-all duration-200 flex flex-col justify-between card-hover-effect"
                          >
                            <div className="w-full flex items-center justify-center py-1">
                              <FlowchartShapeSvg shape={item.shape} label={item.symbolText} />
                            </div>
                            <div className="flex items-center justify-between text-xs mt-2.5 pt-2 border-t border-slate-200/80 font-semibold">
                              <span className="text-slate-600">รูปทรง: <strong className="text-blue-600">{item.shapeName}</strong></span>
                              <span className="text-blue-700 bg-blue-100 font-bold px-2.5 py-0.5 rounded-lg text-[10px]">คลิกเลือก ➔</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* --- STAGE 4: MISSION 2 (STEP MASTER - 15 PTS) --- */}
            {isProfileEntered && gameStage === 'mission2' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <span className="text-xs bg-indigo-100 text-indigo-900 font-extrabold px-3.5 py-1 rounded-full border border-indigo-200">
                        🪜 MISSION 2: STEP MASTER (15 คะแนน)
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                        {STEP_MASTER_LEVELS[m2LevelIdx]?.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {STEP_MASTER_LEVELS[m2LevelIdx]?.situation}
                      </p>
                    </div>

                    {/* Level Tabs */}
                    <div className="flex items-center space-x-2">
                      {STEP_MASTER_LEVELS.map((lvl, idx) => (
                        <button
                          key={lvl.level}
                          onClick={() => { setM2LevelIdx(idx); playSound('click', soundEnabled); }}
                          className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all border ${
                            m2LevelIdx === idx 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 scale-105' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          ระดับ {lvl.level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left: Placed Canvas */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="border border-slate-200/80 rounded-3xl p-5 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-extrabold text-sm text-slate-900">กระดานจัดเรียงขั้นตอน (Canvas)</h4>
                          <button
                            onClick={() => initMission2(m2LevelIdx)}
                            className="text-xs text-slate-500 hover:text-rose-600 flex items-center space-x-1 font-bold transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>รีเซ็ต</span>
                          </button>
                        </div>

                        <div className="space-y-2.5 min-h-[300px] bg-white rounded-3xl p-5 border-2 border-dashed border-blue-200 flex flex-col items-center">
                          {m2PlacedSlots.length === 0 ? (
                            <p className="my-auto text-xs text-slate-400 font-medium italic">คลิกเลือกบล็อกจากฝั่งขวาเพื่อนำมาเรียงลำดับที่นี่</p>
                          ) : (
                            m2PlacedSlots.map((block, idx) => (
                              <React.Fragment key={block.id}>
                                {idx > 0 && <ArrowDown className="w-4 h-4 text-blue-500 my-0.5 stroke-[3]" />}
                                <div
                                  onClick={() => {
                                    playSound('click', soundEnabled);
                                    setM2PlacedSlots(prev => prev.filter(b => b.id !== block.id));
                                    setM2AvailableBlocks(prev => [...prev, block]);
                                  }}
                                  className="w-full max-w-md cursor-pointer group relative card-hover-effect"
                                >
                                  <FlowchartShapeSvg shape={block.shape} label={block.text} />
                                </div>
                              </React.Fragment>
                            ))
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                          <button
                            onClick={handleVerifyMission2}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 text-white font-black py-3.5 rounded-2xl shadow-md text-xs sm:text-sm flex items-center justify-center space-x-2 action-btn-hover"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>ตรวจคำตอบการจัดลำดับขั้นตอน</span>
                          </button>

                          {m2Result && (
                            <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold animate-fadeIn ${
                              m2Result.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                            }`}>
                              <p>{m2Result.message}</p>
                              {m2Result.success && m2LevelIdx < STEP_MASTER_LEVELS.length - 1 && (
                                <button
                                  onClick={() => setM2LevelIdx(prev => prev + 1)}
                                  className="mt-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition"
                                >
                                  ไปต่อระดับถัดไป ➔
                                </button>
                              )}
                              {m2Result.success && m2LevelIdx >= STEP_MASTER_LEVELS.length - 1 && (
                                <button
                                  onClick={() => { setGameStage('mission3'); playSound('click', soundEnabled); }}
                                  className="mt-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow inline-flex items-center space-x-1.5 transition"
                                >
                                  <span>ผ่านด่าน 2! ไป Mission 3 (Flow Reader)</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Available Blocks */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="border border-slate-200/80 rounded-3xl p-5 bg-white shadow-xs">
                        <h4 className="font-extrabold text-sm text-slate-900 mb-3">บล็อกขั้นตอนที่พร้อมใช้งาน ({m2AvailableBlocks.length})</h4>
                        <div className="space-y-2.5">
                          {m2AvailableBlocks.map(block => (
                            <div
                              key={block.id}
                              onClick={() => {
                                playSound('click', soundEnabled);
                                setM2AvailableBlocks(prev => prev.filter(b => b.id !== block.id));
                                setM2PlacedSlots(prev => [...prev, block]);
                              }}
                              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 cursor-pointer text-xs font-bold text-slate-800 flex items-center justify-between card-hover-effect"
                            >
                              <span>{block.text}</span>
                              <span className="text-blue-700 bg-blue-100 font-bold px-2.5 py-0.5 rounded-lg text-[10px]">เลือก +</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* --- STAGE 5: MISSION 3 (FLOW READER - 15 PTS) --- */}
            {isProfileEntered && gameStage === 'mission3' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-3.5 py-1 rounded-full border border-amber-200">
                        🔍 MISSION 3: FLOW READER (15 คะแนน)
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                        {FLOW_READER_LEVELS[m3LevelIdx]?.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      {FLOW_READER_LEVELS.map((lvl, idx) => (
                        <button
                          key={lvl.level}
                          onClick={() => { setM3LevelIdx(idx); playSound('click', soundEnabled); }}
                          className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold border transition-all ${
                            m3LevelIdx === idx 
                              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 scale-105' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          ระดับ {lvl.level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left: Graphic Flowchart Diagram on Screen */}
                    <div className="lg:col-span-6 bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 flex flex-col items-center space-y-2 shadow-xs">
                      <span className="text-xs font-extrabold text-slate-600 mb-2">ผังงานจริงบนหน้าจอ (Graphic Flowchart)</span>
                      {FLOW_READER_LEVELS[m3LevelIdx]?.flowchartNodes.map((node, i) => (
                        <React.Fragment key={node.id}>
                          {i > 0 && <ArrowDown className="w-4 h-4 text-blue-500 my-0.5 stroke-[3]" />}
                          <div className="w-full max-w-sm">
                            <FlowchartShapeSvg shape={node.shape} label={node.text} />
                          </div>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Right: Reading Questions */}
                    <div className="lg:col-span-6 space-y-4">
                      {FLOW_READER_LEVELS[m3LevelIdx]?.questions.map((q) => (
                        <div key={q.qId} className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-xs">
                          <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">{q.question}</h5>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = m3Answers[q.qId] === optIdx;

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => {
                                    playSound('click', soundEnabled);
                                    setM3Answers(prev => ({ ...prev, [q.qId]: optIdx }));
                                  }}
                                  className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                                    isSelected 
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20 font-bold scale-[1.01]' 
                                      : 'bg-slate-50/80 hover:bg-amber-50/50 border-slate-200/80 text-slate-800'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleVerifyMission3}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm flex items-center justify-center space-x-2 action-btn-hover"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>ตรวจคำตอบการอ่านผังงาน</span>
                      </button>

                      {m3Result && (
                        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold animate-fadeIn ${
                          m3Result.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}>
                          <p>{m3Result.message}</p>
                          {m3Result.success && m3LevelIdx < FLOW_READER_LEVELS.length - 1 && (
                            <button
                              onClick={() => setM3LevelIdx(prev => prev + 1)}
                              className="mt-2.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition"
                            >
                              ไปอ่านผังงานระดับถัดไป ➔
                            </button>
                          )}
                          {m3Result.success && m3LevelIdx >= FLOW_READER_LEVELS.length - 1 && (
                            <button
                              onClick={() => { setGameStage('mission4'); playSound('click', soundEnabled); }}
                              className="mt-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow inline-flex items-center space-x-1.5 transition"
                            >
                              <span>ผ่านด่าน 3! ไป Mission 4 (Bug Detective)</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- STAGE 6: MISSION 4 (BUG DETECTIVE - 20 PTS) --- */}
            {isProfileEntered && gameStage === 'mission4' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <span className="text-xs bg-rose-100 text-rose-900 font-extrabold px-3.5 py-1 rounded-full border border-rose-200">
                        🕵️‍♂️ MISSION 4: BUG DETECTIVE (20 คะแนน)
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                        {BUG_DETECTIVE_SCENARIOS[m4ScenarioIdx]?.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {BUG_DETECTIVE_SCENARIOS[m4ScenarioIdx]?.situation}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {BUG_DETECTIVE_SCENARIOS.map((sc, idx) => (
                        <button
                          key={sc.id}
                          onClick={() => { setM4ScenarioIdx(idx); playSound('click', soundEnabled); }}
                          className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold border transition-all ${
                            m4ScenarioIdx === idx 
                              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 scale-105' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          คดีที่ {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left: Flowchart with Bug on screen */}
                    <div className="lg:col-span-5 bg-rose-50/40 p-6 rounded-3xl border border-rose-200 flex flex-col items-center space-y-2 shadow-xs">
                      <span className="text-xs font-extrabold text-rose-700 mb-2">ผังงานที่มีข้อผิดพลาด (Bugged Flowchart)</span>
                      {BUG_DETECTIVE_SCENARIOS[m4ScenarioIdx]?.flowchartView.steps.map((step, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <ArrowDown className="w-4 h-4 text-rose-400 my-0.5 stroke-[3]" />}
                          <div className={`w-full max-w-sm relative ${step.isBug ? 'ring-2 ring-rose-500 rounded-2xl animate-pulse' : ''}`}>
                            <FlowchartShapeSvg shape={step.shape} label={step.text} />
                            {step.isBug && (
                              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                                🐛 {step.bugTag}
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Right: 3-Step Detective System */}
                    <div className="lg:col-span-7 space-y-4">
                      {(() => {
                        const sc = BUG_DETECTIVE_SCENARIOS[m4ScenarioIdx];

                        return (
                          <>
                            {/* Step 1: จุดไหนผิด? */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-2.5 shadow-xs">
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">1</span>
                                <span>{sc.step1_whereBug.question} (5 คะแนน)</span>
                              </h5>
                              <div className="space-y-2">
                                {sc.step1_whereBug.options.map((opt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      playSound('click', soundEnabled);
                                      setM4Answers(prev => ({ ...prev, step1: idx }));
                                    }}
                                    className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                                      m4Answers.step1 === idx 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold' 
                                        : 'bg-slate-50/80 hover:bg-blue-50/40 border-slate-200/80 text-slate-800'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Step 2: ผิดเพราะอะไร? */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-2.5 shadow-xs">
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">2</span>
                                <span>{sc.step2_whyBug.question} (5 คะแนน)</span>
                              </h5>
                              <div className="space-y-2">
                                {sc.step2_whyBug.options.map((opt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      playSound('click', soundEnabled);
                                      setM4Answers(prev => ({ ...prev, step2: idx }));
                                    }}
                                    className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                                      m4Answers.step2 === idx 
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-bold' 
                                        : 'bg-slate-50/80 hover:bg-amber-50/40 border-slate-200/80 text-slate-800'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Step 3: ควรแก้อย่างไร? */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-2.5 shadow-xs">
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">3</span>
                                <span>{sc.step3_howToFix.question} (10 คะแนน)</span>
                              </h5>
                              <div className="space-y-2">
                                {sc.step3_howToFix.options.map((opt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      playSound('click', soundEnabled);
                                      setM4Answers(prev => ({ ...prev, step3: idx }));
                                    }}
                                    className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                                      m4Answers.step3 === idx 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold' 
                                        : 'bg-slate-50/80 hover:bg-emerald-50/40 border-slate-200/80 text-slate-800'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={handleVerifyMission4}
                              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-600/20 text-xs sm:text-sm flex items-center justify-center space-x-2 action-btn-hover"
                            >
                              <CheckSquare className="w-4 h-4" />
                              <span>ตรวจคำตอบการสืบหา Bug (20 คะแนน)</span>
                            </button>

                            {m4Result && (
                              <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold animate-fadeIn ${
                                m4Result.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                              }`}>
                                <p>{m4Result.message}</p>
                                {m4Result.success && (
                                  <button
                                    onClick={() => { setGameStage('final'); playSound('click', soundEnabled); }}
                                    className="mt-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow inline-flex items-center space-x-1.5 transition"
                                  >
                                    <span>ไปสู่ FINAL MISSION (Flowchart Designer)</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}

                          </>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* --- STAGE 7: FINAL MISSION (FLOWCHART DESIGNER - 35 PTS) --- */}
            {isProfileEntered && gameStage === 'final' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Scenario Picker Selector */}
                <div className="glass-panel rounded-3xl p-5 shadow-xs no-print">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-3.5 py-1 rounded-full border border-amber-200">
                        🏆 คลังโจทย์สถานการณ์ประยุกต์ (5 โจทย์)
                      </span>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base mt-1.5">
                        เลือกสถานการณ์ที่ต้องการออกแบบผังงาน
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                      {FINAL_MISSION_SCENARIOS.map((scen, idx) => (
                        <button
                          key={scen.id}
                          onClick={() => { setFinalScenarioIdx(idx); playSound('click', soundEnabled); }}
                          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all border shrink-0 ${
                            finalScenarioIdx === idx 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 scale-105' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                          }`}
                        >
                          โจทย์ที่ {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Flowchart Builder Canvas */}
                <FlowchartCanvas
                  scenario={FINAL_MISSION_SCENARIOS[finalScenarioIdx]}
                  soundEnabled={soundEnabled}
                  onComplete={handleFinalMissionComplete}
                />

                {completedStages.final && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => { setGameStage('posttest'); playSound('click', soundEnabled); }}
                      className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 text-white font-black py-4 px-8 rounded-3xl shadow-xl shadow-emerald-600/25 text-sm inline-flex items-center space-x-2 action-btn-hover animate-bounce-small"
                    >
                      <span>ทำแบบทดสอบหลังเรียน (Post-Test) เพื่อดูคะแนนพัฒนา</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* --- STAGE 8: POST-TEST (แบบทดสอบหลังเรียน 10 ข้อ) --- */}
            {isProfileEntered && gameStage === 'posttest' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <span className="text-xs bg-emerald-100 text-emerald-900 font-extrabold px-3.5 py-1 rounded-full border border-emerald-200">
                        🎓 POST-TEST: แบบทดสอบหลังเรียน
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                        วัดผลสัมฤทธิ์ทางการเรียน วิทยาการคำนวณ ป.6 (10 ข้อ)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        ทำแบบทดสอบเพื่อวัดพัฒนาการความรู้ (Score Gain) หลังผ่านภารกิจทั้ง 5 ด่าน
                      </p>
                    </div>

                    {!postSubmitted && (
                      <button
                        onClick={handleSubmitPostTest}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 transition self-start sm:self-center flex items-center space-x-1.5 action-btn-hover"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>ส่งคำตอบ Post-Test</span>
                      </button>
                    )}
                  </div>

                  {!postSubmitted ? (
                    <div className="mt-6 space-y-6">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>ข้อที่ {postPageIdx + 1} จาก {POSTTEST_QUESTIONS.length} ข้อ</span>
                        <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          ตอบแล้ว {Object.keys(postAnswers).length}/{POSTTEST_QUESTIONS.length} ข้อ
                        </span>
                      </div>

                      {(() => {
                        const currentQ = POSTTEST_QUESTIONS[postPageIdx];
                        const selectedOpt = postAnswers[currentQ.id];

                        return (
                          <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="text-xs bg-emerald-600 text-white font-black px-3 py-0.5 rounded-lg shadow-2xs">
                                  ข้อที่ {postPageIdx + 1}
                                </span>
                                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2.5 leading-snug">
                                  {currentQ.question}
                                </h4>
                              </div>
                              <div className="w-28 sm:w-36 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
                                <FlowchartShapeSvg shape={currentQ.shapeType || 'process'} label="" />
                              </div>
                            </div>

                            <div className="space-y-3">
                              {currentQ.options.map((opt, optIdx) => {
                                const isSelected = selectedOpt === optIdx;

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleSelectPostOption(currentQ.id, optIdx)}
                                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 font-bold scale-[1.01]'
                                        : 'bg-white hover:bg-emerald-50/60 border-slate-200/90 text-slate-800'
                                    }`}
                                  >
                                    <span className="leading-relaxed">{opt}</span>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                                      isSelected ? 'border-white bg-white text-emerald-600' : 'border-slate-300 bg-white'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-200/80">
                              <button
                                disabled={postPageIdx === 0}
                                onClick={() => setPostPageIdx(prev => prev - 1)}
                                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold disabled:opacity-30 hover:bg-slate-50 transition"
                              >
                                ข้อก่อนหน้า
                              </button>

                              <div className="flex items-center space-x-1 overflow-x-auto py-1">
                                {POSTTEST_QUESTIONS.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setPostPageIdx(i)}
                                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                                      postPageIdx === i
                                        ? 'bg-emerald-600 text-white shadow-sm scale-105'
                                        : postAnswers[i + 1] !== undefined
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                              </div>

                              {postPageIdx < POSTTEST_QUESTIONS.length - 1 ? (
                                <button
                                  onClick={() => setPostPageIdx(prev => prev + 1)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition"
                                >
                                  ข้อถัดไป
                                </button>
                              ) : (
                                <button
                                  onClick={handleSubmitPostTest}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition"
                                >
                                  ส่งคำตอบ Post-Test
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Post-Test Result & Summary Link */
                    <div className="mt-6 text-center space-y-6 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 p-8 sm:p-10 rounded-3xl border border-emerald-200 shadow-md animate-fadeIn">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white mx-auto flex items-center justify-center text-3xl font-black shadow-xl shadow-emerald-600/30">
                        {postScore} <span className="text-sm text-emerald-200">/ 10</span>
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          ส่งแบบทดสอบหลังเรียน (Post-Test) สมบูรณ์แบบ!
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium max-w-md mx-auto">
                          ก่อนเรียน: <strong>{missionScores.preScore || 0}/10</strong> ➔ หลังเรียน: <strong>{postScore}/10</strong> (คะแนนพัฒนา: <strong>+{Math.max(0, postScore - (missionScores.preScore || 0))}</strong>)
                        </p>
                      </div>

                      <button
                        onClick={() => { setGameStage('summary'); playSound('click', soundEnabled); }}
                        className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-emerald-600/30 text-xs sm:text-sm inline-flex items-center space-x-2 action-btn-hover"
                      >
                        <Award className="w-4 h-4 text-amber-300" />
                        <span>ดูแดชบอร์ดสรุปผลและรับใบประกาศนียบัตร PNG</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* --- STAGE 9: STUDENT DASHBOARD & CERTIFICATE --- */}
            {isProfileEntered && gameStage === 'summary' && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Visual Certificate Card on Screen */}
                <div 
                  ref={certificateRef}
                  className="bg-gradient-to-b from-blue-50/60 via-white to-sky-50 border-4 border-double border-blue-300 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden text-center max-w-4xl mx-auto"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <img 
                        src={kruKingLogo} 
                        alt="ห้องสื่อครูคิง" 
                        className="w-12 h-12 object-contain rounded-2xl bg-white p-0.5 border border-blue-200 shadow-2xs" 
                      />
                      <div className="text-left hidden sm:block">
                        <span className="text-xs font-black text-slate-800 block">ห้องสื่อครูคิง</span>
                        <span className="text-[10px] text-slate-400 font-medium">Flowchart Quest ป.6</span>
                      </div>
                    </div>

                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>ใบรายงานผลสัมฤทธิ์และสมรรถนะการเรียนรู้</span>
                    </div>

                    <div className="w-12 hidden sm:block" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
                    วิชาวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 6
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ตัวชี้วัด ว 4.2 ป.6/1 • การใช้เหตุผลเชิงตรรกะและการออกแบบผังงาน (Flowchart)
                  </p>

                  <div className="my-5 p-4 bg-white/90 rounded-2xl border border-blue-200 inline-block text-slate-800 text-sm font-semibold shadow-xs">
                    มอบให้แก่: <strong className="text-blue-700 text-base font-black underline">{studentInfo.name || 'นักเรียน ป.6'}</strong>
                    <div className="text-xs text-slate-500 mt-1">
                      ชั้น: <strong>{studentInfo.room || 'ป.6'}</strong> • เลขที่: <strong>{studentInfo.number || '-'}</strong> • XP รวม: <strong>{userXP}</strong>
                    </div>
                  </div>

                  {/* 2-Column Score Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
                    
                    {/* Pre vs Post Card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-xs font-bold text-slate-600 mb-2">📊 พัฒนาการก่อน/หลังเรียน</div>
                      <div className="flex items-center justify-around">
                        <div>
                          <div className="text-[10px] text-slate-400">Pre-Test</div>
                          <div className="text-2xl font-black text-slate-700">{missionScores.preScore !== null ? missionScores.preScore : 0}/10</div>
                        </div>
                        <div className="text-xl font-bold text-slate-300">➔</div>
                        <div>
                          <div className="text-[10px] text-blue-600 font-bold">Post-Test</div>
                          <div className="text-2xl font-black text-blue-700">{missionScores.postScore !== null ? missionScores.postScore : 0}/10</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-bold text-emerald-600">
                        🚀 คะแนนพัฒนา: +{Math.max(0, (missionScores.postScore || 0) - (missionScores.preScore || 0))} คะแนน
                      </div>
                    </div>

                    {/* Missions Total Score Card */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white p-4 rounded-2xl shadow-md">
                      <div className="text-xs font-bold text-blue-200">🏆 คะแนนภารกิจ (100 คะแนนเต็ม)</div>
                      <div className="text-3xl font-black mt-1">
                        {currentTotalScore} <span className="text-sm text-blue-200 font-bold">/ 100</span>
                      </div>
                      <div className="text-[10px] text-amber-300 font-bold mt-1">
                        M1:{missionScores.m1} • M2:{missionScores.m2} • M3:{missionScores.m3} • M4:{missionScores.m4} • Final:{missionScores.m5}
                      </div>
                    </div>

                  </div>

                  {/* Badges Earned */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 max-w-2xl mx-auto mb-4">
                    <div className="text-xs font-bold text-slate-700 mb-2">🏅 ตราสัญลักษณ์ความสำเร็จที่ได้รับ:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold text-blue-900">
                      <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-2xs">🏅 Symbol Hunter</div>
                      <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-2xs">🏅 Step Master</div>
                      <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-2xs">🏅 Flow Reader</div>
                      <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-2xs">🏅 Bug Detective</div>
                              <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-2xs">🏆 Flow Designer</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">
                    Flowchart Quest ป.6 • ระบบประเมินผลสมรรถนะการเรียนรู้ทางคอมพิวเตอร์
                  </div>
                </div>

                {/* Export & Action Buttons */}
                <div className="max-w-4xl mx-auto glass-panel rounded-3xl p-6 shadow-sm no-print">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleDownloadPNG}
                      disabled={isExporting}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md text-xs sm:text-sm flex items-center space-x-2 action-btn-hover"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExporting ? 'กำลังสร้างภาพ...' : 'ดาวน์โหลดใบประกาศ PNG (ความละเอียดสูง)'}</span>
                    </button>

                    <button
                      onClick={handlePrintCertificate}
                      disabled={isExporting}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md text-xs sm:text-sm flex items-center space-x-2 action-btn-hover"
                    >
                      <Printer className="w-4 h-4" />
                      <span>พิมพ์ใบรายงานผล (Print)</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('teacher'); playSound('click', soundEnabled); }}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-3.5 px-5 rounded-2xl border border-indigo-200 text-xs sm:text-sm flex items-center space-x-1.5 transition"
                    >
                      <Users className="w-4 h-4" />
                      <span>ดูตารางผลคะแนนรวมของห้องเรียน (Teacher View)</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ================= TAB 2: LEARNING TAB (5 CHAPTERS DIRECT ACCESS) ================= */}
        {activeTab === 'learning' && (
          <div className="space-y-6 animate-fadeIn">
            {selectedReadingChapterIdx !== null ? (
              /* --- IN-PAGE CHAPTER READER VIEW --- */
              (() => {
                const safeIdx = Math.min(Math.max(0, selectedReadingChapterIdx), Math.max(0, learningChapters.length - 1));
                const ch = learningChapters[safeIdx];
                if (!ch) return null;
                const hasPdf = Boolean(ch.pdfUrl || ch.drivePdfUrl);

                return (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Top Navigation Bar in Reader */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => { setSelectedReadingChapterIdx(null); playSound('click', soundEnabled); }}
                        className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs shadow-xs border border-slate-200/80 flex items-center space-x-2 transition-all action-btn-hover"
                      >
                        <ArrowLeft className="w-4 h-4 text-blue-600" />
                        <span>ย้อนกลับไปหน้ารวมบทเรียน</span>
                      </button>

                      {/* Chapter Navigation Stepper Pills */}
                      <div className="flex items-center space-x-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-bold scrollbar-none">
                        {learningChapters.map((c, i) => (
                          <button
                            key={c.id || i}
                            onClick={() => { setSelectedReadingChapterIdx(i); playSound('click', soundEnabled); }}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                              safeIdx === i ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
                            }`}
                          >
                            <span>บทที่ {c.chapterNum || (i + 1)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chapter Header Banner */}
                    <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 border border-white/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl p-2 rounded-2xl bg-blue-50 border border-blue-200">{ch.icon || '📖'}</span>
                          <div>
                            <span className={`text-[10.5px] px-3 py-0.5 rounded-full font-black border ${ch.badgeColor || 'border-blue-200 text-blue-800'}`}>
                              บทที่ {ch.chapterNum || (safeIdx + 1)} • ว 4.2 ป.6/1
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{ch.title}</h2>
                          </div>
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                          <button
                            type="button"
                            onClick={() => setChapterViewMode('dual')}
                            className={`px-3 py-1.5 rounded-lg transition ${chapterViewMode === 'dual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'}`}
                          >
                            ✨ ดูทั้งสองแบบ
                          </button>
                          <button
                            type="button"
                            onClick={() => setChapterViewMode('pdf')}
                            className={`px-3 py-1.5 rounded-lg transition ${chapterViewMode === 'pdf' ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'}`}
                          >
                            📑 สไลด์ PDF แนวนอน
                          </button>
                          <button
                            type="button"
                            onClick={() => setChapterViewMode('notes')}
                            className={`px-3 py-1.5 rounded-lg transition ${chapterViewMode === 'notes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-700'}`}
                          >
                            📖 สรุปเนื้อหา
                          </button>
                        </div>
                      </div>

                      {/* HORIZONTAL GOOGLE DRIVE PDF VIEWER */}
                      {(chapterViewMode === 'pdf' || chapterViewMode === 'dual') && (
                        <div className="pt-2 animate-fadeIn">
                          <HorizontalPdfViewer
                            pdfUrl={ch.pdfUrl || ch.drivePdfUrl}
                            title={ch.title}
                            chapterNum={ch.chapterNum || (safeIdx + 1)}
                            onOpenAdmin={() => {
                              setActiveTab('admin');
                              setAdminSubTab('content');
                            }}
                          />
                        </div>
                      )}

                      {/* Notes & Summary */}
                      {(chapterViewMode === 'notes' || chapterViewMode === 'dual') && (
                        <div className="space-y-6 pt-2">
                          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-6 rounded-3xl border border-blue-100 shadow-xs">
                            <h4 className="text-xl font-black text-slate-900">{ch.subtitle}</h4>
                            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-medium">{ch.summary}</p>
                          </div>

                          {/* Key Points */}
                          {Array.isArray(ch.keyPoints) && ch.keyPoints.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {ch.keyPoints.map((pt, i) => (
                                <div key={i} className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-xs hover:border-blue-300 transition">
                                  <h5 className="font-extrabold text-sm text-blue-900 mb-2 flex items-center space-x-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span>{pt?.heading || ''}</span>
                                  </h5>
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{pt?.content || ''}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Symbols special section if ch2 */}
                          {Array.isArray(ch.symbols) && ch.symbols.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {ch.symbols.map((sym, i) => (
                                <div key={i} className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-xs flex flex-col justify-between">
                                  <div>
                                    <div className="h-20 bg-slate-50/80 rounded-2xl flex items-center justify-center p-2 mb-3.5 border border-slate-100">
                                      <FlowchartShapeSvg shape={sym.shape} label={sym.name.split(' ')[0]} />
                                    </div>
                                    <h5 className="font-black text-xs sm:text-sm text-slate-900">{sym.name}</h5>
                                    <p className="text-[11px] font-bold text-blue-600 mt-0.5">รูปทรง: {sym.geometry}</p>
                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">{sym.role}</p>
                                  </div>
                                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                                    💡 <strong>ตัวอย่าง:</strong> {sym.example}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Prev/Next Chapter Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                          disabled={safeIdx === 0}
                          onClick={() => { setSelectedReadingChapterIdx(safeIdx - 1); playSound('click', soundEnabled); }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs flex items-center space-x-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>บทก่อนหน้า</span>
                        </button>

                        <button
                          disabled={safeIdx === learningChapters.length - 1}
                          onClick={() => { setSelectedReadingChapterIdx(safeIdx + 1); playSound('click', soundEnabled); }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1 shadow-xs"
                        >
                          <span>บทถัดไป</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* --- CHAPTERS CARDS GRID VIEW --- */
              <>
                {/* Top Return Button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs shadow-xs border border-slate-200/80 flex items-center space-x-2 transition-all action-btn-hover"
                  >
                    <ArrowLeft className="w-4 h-4 text-blue-600" />
                    <span>ย้อนกลับหน้าหลักภารกิจ</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('admin'); setAdminSubTab('content'); playSound('click', soundEnabled); }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-4 py-2.5 rounded-2xl border border-indigo-200 text-xs flex items-center space-x-1.5 transition shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>แอดมิน: เพิ่ม/แก้ไขบทเรียน & ลิงก์ PDF</span>
                  </button>
                </div>

                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs bg-indigo-100 text-indigo-900 font-extrabold px-3.5 py-1 rounded-full border border-indigo-200">
                        📖 {learningChapters.length} บทเรียน ({learningChapters.length === 5 ? 'หลักสูตรมาตรฐาน' : 'ปรับปรุงเนื้อหาแล้ว'})
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      สาระการเรียนรู้การเขียนผังงาน (Flowchart) วิทยาการคำนวณ ป.6
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                      คลิกเลือกบทเรียนเพื่อเปิดอ่านเนื้อหา สัญลักษณ์ และสไลด์ PDF แนวนอนได้ทันที
                    </p>
                  </div>
                </div>

                {/* Dynamic Chapters Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {learningChapters.map((ch, idx) => (
                    <div 
                      key={ch.id || `ch_${idx}`} 
                      className="bg-white/90 backdrop-blur-xl border border-blue-100/80 hover:border-blue-400 rounded-3xl p-6 shadow-xs transition-all duration-300 flex flex-col justify-between card-hover-effect"
                    >
                      <div>
                        {(ch.image || chapterImages[ch.id]) ? (
                          <div className="w-full h-36 rounded-2xl overflow-hidden mb-3.5 bg-slate-100 border border-blue-100 relative group">
                            <img 
                              src={ch.image || chapterImages[ch.id]} 
                              alt={ch.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border backdrop-blur-md bg-white/90 ${ch.badgeColor || 'border-blue-200 text-blue-800'}`}>
                                บทที่ {ch.chapterNum || (idx + 1)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mb-3.5">
                            <span className="text-3xl">{ch.icon || '📖'}</span>
                            <div className="flex items-center space-x-1.5">
                              {ch.pdfUrl && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-black border bg-rose-100 text-rose-800 border-rose-200">
                                  📑 PDF แนวนอน
                                </span>
                              )}
                              <span className={`text-[10.5px] px-3 py-0.5 rounded-full font-extrabold border ${ch.badgeColor || 'border-blue-200 text-blue-800'}`}>
                                บทที่ {ch.chapterNum || (idx + 1)}
                              </span>
                            </div>
                          </div>
                        )}

                        <h4 className="font-black text-slate-900 text-base">{ch.title}</h4>
                        <p className="text-xs text-blue-600 font-bold mt-1">{ch.subtitle}</p>
                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium">{ch.summary}</p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedReadingChapterIdx(idx);
                            playSound('click', soundEnabled);
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-md action-btn-hover"
                        >
                          <span>อ่านเนื้อหาละเอียด</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-[10px] text-slate-400 font-extrabold">ว 4.2 ป.6/1</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 3: TEACHER DASHBOARD & REPORT ================= */}
        {activeTab === 'teacher' && (
          <div className="space-y-6 animate-fadeIn">
            {!isAdminUnlocked ? (
              <div className="max-w-md mx-auto glass-panel rounded-3xl p-8 shadow-xl text-center my-8 border border-indigo-200 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-3xl mb-4 border border-indigo-200 shadow-sm">
                  🔐
                </div>
                <h3 className="text-2xl font-black text-slate-900">แดชบอร์ดคุณครู (Teacher Only)</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">กรุณากรอกรหัสผ่านเพื่อเข้าถึงรายงานผลสัมฤทธิ์และสถิติห้องเรียน</p>

                <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
                  <input
                    type="password"
                    required
                    placeholder="กรุณากรอกรหัสผ่านคุณครู..."
                    value={adminPinInput}
                    onChange={(e) => { setAdminPinInput(e.target.value); setAdminPinError(''); }}
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3.5 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    autoFocus
                  />
                  {adminPinError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold animate-fadeIn flex items-center justify-center space-x-1.5 shadow-2xs">
                      <span>⚠️</span>
                      <span>{adminPinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-md transition text-sm action-btn-hover cursor-pointer"
                  >
                    เข้าสู่ระบบแดชบอร์ด (Unlock)
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* Top Return Button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 font-extrabold text-xs shadow-xs border border-slate-200/80 flex items-center space-x-2 transition-all action-btn-hover"
                  >
                    <ArrowLeft className="w-4 h-4 text-indigo-600" />
                    <span>ย้อนกลับหน้าหลักภารกิจ</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('admin'); setAdminSubTab('pilot'); playSound('click', soundEnabled); }}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-4 py-2.5 rounded-2xl border border-indigo-200 text-xs flex items-center space-x-1.5 transition shadow-2xs"
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>เปิดศูนย์ทดลองสอน (Classroom Pilot Hub)</span>
              </button>
            </div>
            
            {/* Header Report Banner */}
            <div className="bg-gradient-to-r from-indigo-800 via-blue-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-600/20 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold mb-2.5">
                    <div className="flex items-center space-x-1.5 bg-white/20 px-3.5 py-1 rounded-full border border-white/30">
                      <GraduationCap className="w-4 h-4 text-amber-300" />
                      <span>แดชบอร์ดคุณครู & ระบบรายงานผลสัมฤทธิ์</span>
                    </div>

                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold border ${
                      cloudWebhookUrl ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40' : 'bg-amber-500/20 text-amber-200 border-amber-300/30'
                    }`}>
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{cloudWebhookUrl ? 'Google Sheets Sync พร้อมใช้งาน' : 'บันทึกในเครื่อง (Local)'}</span>
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    รายงานผลสัมฤทธิ์และสมรรถนะการออกแบบผังงาน
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100/90 mt-1.5 leading-relaxed font-medium">
                    ตัวชี้วัด: <strong>ว 4.2 ป.6/1</strong> • ใช้เหตุผลเชิงตรรกะในการแก้ปัญหา ออกแบบและเขียนโปรแกรมอย่างง่าย
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => {
                      setShowRosterModal(true);
                      playSound('click', soundEnabled);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2.5 rounded-2xl transition shadow-md text-xs flex items-center space-x-1.5 action-btn-hover"
                  >
                    <Users className="w-4 h-4 text-indigo-200" />
                    <span>จัดการทะเบียนนักเรียน (Roster)</span>
                  </button>

                  {cloudWebhookUrl && studentRecords.length > 0 && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`คุณต้องการซิงก์คะแนนนักเรียน ${studentRecords.length} คน ขึ้น Google Sheets หรือไม่?`)) {
                          let count = 0;
                          for (const rec of studentRecords) {
                            await syncScoreToDatabase(rec, cloudWebhookUrl);
                            count++;
                          }
                          playSound('success', soundEnabled);
                          alert(`✅ ซิงก์ข้อมูลนักเรียน ${count} คนขึ้น Google Sheets สำเร็จเรียบร้อยครับ!`);
                        }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-2.5 rounded-2xl transition shadow-md text-xs flex items-center space-x-1.5 action-btn-hover"
                    >
                      <Cloud className="w-4 h-4 text-emerald-100" />
                      <span>ซิงก์ขึ้น Google Sheets ({studentRecords.length})</span>
                    </button>
                  )}

                  <button
                    onClick={handleExportCSV}
                    disabled={filteredStudents.length === 0}
                    className="bg-white hover:bg-indigo-50 text-indigo-950 font-black px-4 py-2.5 rounded-2xl transition shadow-md text-xs flex items-center space-x-1.5 disabled:opacity-50 action-btn-hover"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ส่งออกตารางคะแนน ({filteredStudents.length} คน) [CSV]</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('คุณต้องการล้างข้อมูลผลการเรียนทั้งหมดเพื่อเริ่มรอบใหม่หรือไม่?')) {
                        setStudentRecords([]);
                        localStorage.removeItem('flowchart_student_records');
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3.5 py-2.5 rounded-2xl border border-white/20 text-xs flex items-center space-x-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    <span>ล้างข้อมูล</span>
                  </button>
                </div>
              </div>

              {/* Real-time Summary Statistics Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/15">
                  <div className="text-[11px] text-indigo-200 font-extrabold">จำนวนนักเรียนที่ประเมิน</div>
                  <div className="text-2xl sm:text-3xl font-black mt-0.5">{totalCount} <span className="text-xs font-normal">คน</span></div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/15">
                  <div className="text-[11px] text-indigo-200 font-extrabold">ร้อยละผู้ผ่านเกณฑ์ (&gt;=60%)</div>
                  <div className="text-2xl sm:text-3xl font-black mt-0.5 text-emerald-300">{passRate}%</div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/15">
                  <div className="text-[11px] text-indigo-200 font-extrabold">คะแนนเฉลี่ย Pre ➔ Post</div>
                  <div className="text-2xl sm:text-3xl font-black mt-0.5">{avgPre} ➔ <span className="text-amber-300">{avgPost}</span></div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/15">
                  <div className="text-[11px] text-indigo-200 font-extrabold">คะแนนรวมเฉลี่ย (100p)</div>
                  <div className="text-2xl sm:text-3xl font-black mt-0.5 text-sky-200">{avgTotal} <span className="text-xs font-normal">/ 100</span></div>
                </div>
              </div>
            </div>

            {/* Assessment Structure & Evidence Showcase */}
            <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>โครงสร้างการประเมินและหลักฐานเชิงประจักษ์</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/70 border border-blue-100 space-y-1.5">
                  <strong className="text-blue-900 font-black text-sm block">🎯 เป้าหมายการเรียนรู้ (Learning Goals)</strong>
                  <p className="text-slate-700 leading-relaxed font-medium">ความสามารถในการใช้เหตุผลเชิงตรรกะและการออกแบบผังงาน เพื่อแก้ปัญหาในชีวิตประจำวันอย่างเป็นขั้นตอน</p>
                </div>
                <div className="p-4 sm:p-5 rounded-3xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                  <strong className="text-indigo-900 font-black text-sm block">🔄 กระบวนการเรียนรู้</strong>
                  <p className="text-slate-700 leading-relaxed font-medium">เรียนรู้ ➔ เล่น ➔ คิด ➔ วิเคราะห์ ➔ ออกแบบ ➔ ตรวจสอบ ➔ แก้ไข (Debugging) ➔ ประยุกต์ใช้</p>
                </div>
                <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/70 border border-emerald-100 space-y-1.5">
                  <strong className="text-emerald-900 font-black text-sm block">📑 หลักฐานเชิงประจักษ์</strong>
                  <p className="text-slate-700 leading-relaxed font-medium">Pre-Test + ผลคะแนน 5 ด่าน + ไฟล์ผังงาน Final Mission + Rubric 5 ด้าน + Post-Test + ใบประกาศนียบัตร</p>
                </div>
              </div>
            </div>

            {/* Student Records Table & Filter (เลือกตามห้องเรียน และ ช่วงวันที่) */}
            <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      ตารางผลการเรียนรายบุคคล ({filteredStudents.length} คน)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      เลือกกรองและส่งออกตามห้องเรียน (4 ห้อง) หรือช่วงวันที่
                    </p>
                  </div>
                </div>

                {/* Comprehensive Filters (Room, Date, Search, Status) */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Search Name */}
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อนักเรียน..."
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 w-36 sm:w-44 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />

                  {/* Room Selector: 4 Rooms + All */}
                  <div className="relative">
                    <select
                      value={teacherFilterRoom}
                      onChange={(e) => setTeacherFilterRoom(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl px-3 py-2 pr-8 font-bold text-slate-800 shadow-2xs transition cursor-pointer"
                    >
                      <option value="ทั้งหมด">🏫 ห้องทั้งหมด (4 ห้อง)</option>
                      <option value="ป.6/1">ห้อง ป.6/1</option>
                      <option value="ป.6/2">ห้อง ป.6/2</option>
                      <option value="ป.6/3">ห้อง ป.6/3</option>
                      <option value="ป.6/4">ห้อง ป.6/4</option>
                      <option value="ทั่วไป">ทั่วไป (Guest)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10.5px] text-slate-500 font-bold">จาก:</span>
                    <input
                      type="date"
                      value={teacherFilterStartDate}
                      onChange={(e) => setTeacherFilterStartDate(e.target.value)}
                      className="text-xs font-semibold text-slate-700 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* End Date */}
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10.5px] text-slate-500 font-bold">ถึง:</span>
                    <input
                      type="date"
                      value={teacherFilterEndDate}
                      onChange={(e) => setTeacherFilterEndDate(e.target.value)}
                      className="text-xs font-semibold text-slate-700 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Status Selector */}
                  <div className="relative">
                    <select
                      value={teacherFilterStatus}
                      onChange={(e) => setTeacherFilterStatus(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl px-3 py-2 pr-8 font-bold text-slate-800 shadow-2xs transition cursor-pointer"
                    >
                      <option value="ทั้งหมด">สถานะทั้งหมด</option>
                      <option value="ผ่าน">ผ่านเกณฑ์ (&gt;=60)</option>
                      <option value="ไม่ผ่าน">ต้องช่วยเหลือ (&lt;60)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>

                  {/* Clear Date/Filter Button */}
                  {(teacherFilterStartDate || teacherFilterEndDate || teacherFilterRoom !== 'ทั้งหมด' || teacherSearchQuery || teacherFilterStatus !== 'ทั้งหมด') && (
                    <button
                      onClick={() => {
                        setTeacherFilterStartDate('');
                        setTeacherFilterEndDate('');
                        setTeacherFilterRoom('ทั้งหมด');
                        setTeacherFilterStatus('ทั้งหมด');
                        setTeacherSearchQuery('');
                        playSound('click', soundEnabled);
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] transition flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>ล้างตัวกรอง</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table Data */}
              {studentRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">ยังไม่มีข้อมูลการเรียนจริงในระบบ</p>
                  <p className="text-xs max-w-sm mx-auto text-slate-400 font-medium">
                    เมื่อนักเรียนทำแบบทดสอบและด่านภารกิจเสร็จสิ้น ข้อมูลจะถูกบันทึกและแสดงในตารางนี้ทันที หรือกดแท็บ "🧪 ทดสอบระบบ" เพื่อจำลองข้อมูลตัวอย่าง
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200">
                        <th className="p-3.5">นักเรียน (คลิกดูโปรไฟล์)</th>
                        <th className="p-3.5 text-center">ห้อง/เลขที่</th>
                        <th className="p-3.5 text-center">Pre (10)</th>
                        <th className="p-3.5 text-center">Post (10)</th>
                        <th className="p-3.5 text-center">Gain</th>
                        <th className="p-3.5 text-center">M1 (15)</th>
                        <th className="p-3.5 text-center">M2 (15)</th>
                        <th className="p-3.5 text-center">M3 (15)</th>
                        <th className="p-3.5 text-center">M4 (20)</th>
                        <th className="p-3.5 text-center">Final (35)</th>
                        <th className="p-3.5 text-center">รวม (100)</th>
                        <th className="p-3.5 text-center">ระดับสมรรถนะ / สถานะ</th>
                        <th className="p-3.5 text-center">โปรไฟล์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredStudents.map((std) => {
                        const risk = classifyStudentRisk(std);
                        return (
                          <tr key={std.id} className="hover:bg-blue-50/50 transition">
                            <td className="p-3.5 font-bold text-slate-900">
                              <button
                                onClick={() => {
                                  setSelectedStudentForProfile(std);
                                  playSound('click', soundEnabled);
                                }}
                                className="text-left font-black text-blue-700 hover:underline flex items-center space-x-1.5"
                                title="ดูโปรไฟล์และ Timeline การเรียน"
                              >
                                <span>{std.name}</span>
                              </button>
                            </td>
                            <td className="p-3.5 text-center text-slate-600 font-bold">{std.room} #{std.number}</td>
                            <td className="p-3.5 text-center font-semibold text-slate-700">{std.preScore}</td>
                            <td className="p-3.5 text-center font-black text-blue-700">{std.postScore}</td>
                            <td className="p-3.5 text-center font-black text-emerald-600">
                              {std.gainScore >= 0 ? `+${std.gainScore}` : std.gainScore}
                            </td>
                            <td className="p-3.5 text-center">{std.m1}</td>
                            <td className="p-3.5 text-center">{std.m2}</td>
                            <td className="p-3.5 text-center">{std.m3}</td>
                            <td className="p-3.5 text-center">{std.m4}</td>
                            <td className="p-3.5 text-center font-bold text-indigo-700">{std.m5}</td>
                            <td className="p-3.5 text-center font-black text-sm text-slate-900">{std.totalScore}</td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-black text-[10.5px] border ${risk.badgeBg}`}>
                                {risk.label}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedStudentForProfile(std);
                                    playSound('click', soundEnabled);
                                  }}
                                  className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                                  title="เปิดดูประวัติและผลการประเมิน (Timeline Profile)"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudentForEvidence(std);
                                    playSound('click', soundEnabled);
                                  }}
                                  className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                                  title="เปิดดูหลักฐานการเรียนรู้ & วิเคราะห์ข้อผิดพลาด (Learning Evidence)"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`คุณต้องการลบข้อมูลผลการเรียนของ "${std.name}" (ห้อง ${std.room} เลขที่ ${std.number})\nคะแนนรวม ${std.totalScore} คะแนน ออกจากระบบใช่หรือไม่?`)) {
                                      const { updatedRecords } = deleteStudentCascade(std.id || std.studentId, studentRecords, []);
                                      setStudentRecords(updatedRecords);
                                      playSound('click', soundEnabled);
                                      alert(`✅ ลบข้อมูลของ ${std.name} เรียบร้อยแล้ว`);
                                    }
                                  }}
                                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                                  title="ลบข้อมูลนักเรียนคนนี้ (Delete Student Record)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    )}

        {/* ================= TAB 4: SANDBOX STUDIO ================= */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Return Button */}
            <button
              onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs shadow-xs border border-slate-200/80 inline-flex items-center space-x-2 transition-all action-btn-hover"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>ย้อนกลับหน้าหลักภารกิจ</span>
            </button>

            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs bg-blue-100 text-blue-700 font-extrabold px-3.5 py-1 rounded-full border border-blue-200">
                    🧪 ห้องทดลองสร้างผังงานอิสระ (Sandbox Studio)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    ออกแบบและจำลองการรันผังงานด้วยตัวเอง
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    คลิกเพิ่มบล็อกสัญลักษณ์ ปรับแก้ข้อความ และกดปุ่มรันผังงานเพื่อดูการทำงานได้ทันที
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSandboxRunning(true);
                    setSandboxLogs(['🚀 เริ่มต้นรันผังงาน Sandbox...']);
                    playSound('click', soundEnabled);
                    let st = 0;
                    const itv = setInterval(() => {
                      if (st < sandboxNodes.length) {
                        setSandboxLogs(prev => [...prev, `▶️ ขั้นตอนที่ ${st + 1}: ${sandboxNodes[st].text}`]);
                        playSound('step', soundEnabled);
                        st++;
                      } else {
                        clearInterval(itv);
                        playSound('success', soundEnabled);
                        setSandboxLogs(prev => [...prev, '🏁 สิ้นสุดการทำงานอย่างสมบูรณ์ (End of Flow)']);
                        setSandboxRunning(false);
                      }
                    }, 800);
                  }}
                  disabled={sandboxRunning || sandboxNodes.length === 0}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-md text-xs sm:text-sm flex items-center space-x-2 self-start sm:self-center disabled:opacity-50 action-btn-hover"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{sandboxRunning ? 'กำลังรัน...' : 'รันผังงาน (Execute Flow)'}</span>
                </button>
              </div>

              {/* Add Toolbar */}
              <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
                <span className="font-black text-slate-700 mr-1">+ เพิ่มบล็อก:</span>
                <button onClick={() => setSandboxNodes(prev => [...prev, { id: `sb_${Date.now()}`, shape: 'terminator', text: 'จุดจบ (End)' }])} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100 transition">
                  🟢 เริ่ม/จบ
                </button>
                <button onClick={() => setSandboxNodes(prev => [...prev, { id: `sb_${Date.now()}`, shape: 'process', text: 'คำนวณสูตร...' }])} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-300 font-bold hover:bg-blue-100 transition">
                  🟦 ประมวลผล
                </button>
                <button onClick={() => setSandboxNodes(prev => [...prev, { id: `sb_${Date.now()}`, shape: 'inputOutput', text: 'รับค่าข้อมูล...' }])} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold hover:bg-amber-100 transition">
                  ▱ รับ/ส่งข้อมูล
                </button>
                <button onClick={() => setSandboxNodes(prev => [...prev, { id: `sb_${Date.now()}`, shape: 'decision', text: 'เงื่อนไข ?' }])} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-300 font-bold hover:bg-indigo-100 transition">
                  🔶 ตัดสินใจ
                </button>
                <button onClick={() => setSandboxNodes(prev => [...prev, { id: `sb_${Date.now()}`, shape: 'display', text: 'แสดงผลจอภาพ' }])} className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-300 font-bold hover:bg-cyan-100 transition">
                  🖥️ หน้าจอ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 glass-panel rounded-3xl p-6 shadow-sm min-h-[400px]">
                <h4 className="font-extrabold text-slate-900 text-base mb-4">ผังงานของคุณ ({sandboxNodes.length} บล็อก)</h4>
                
                <div className="space-y-3 flex flex-col items-center">
                  {sandboxNodes.map((node, idx) => (
                    <React.Fragment key={node.id}>
                      {idx > 0 && (
                        <div className="flex flex-col items-center my-0.5">
                          <div className="w-0.5 h-3 bg-blue-300" />
                          <ArrowDown className="w-4 h-4 -mt-1 text-blue-500 stroke-[3]" />
                        </div>
                      )}
                      <div className="w-full max-w-md p-3.5 rounded-2xl border-2 border-blue-200 bg-white flex items-center justify-between shadow-xs card-hover-effect">
                        <div className="flex items-center space-x-2.5 flex-1 mr-2">
                          <span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={node.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSandboxNodes(prev => prev.map(n => n.id === node.id ? { ...n, text: val } : n));
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => setSandboxNodes(prev => prev.filter(n => n.id !== node.id))}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-xl border border-rose-100 bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl font-mono text-xs text-slate-200 min-h-[300px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-emerald-400 font-bold">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4" />
                    <span>Live Simulator Console</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="space-y-2 text-slate-300">
                  {sandboxLogs.length === 0 ? (
                    <p className="text-slate-600 italic">กดปุ่ม "รันผังงาน" เพื่อดูผลการจำลองการทำงาน</p>
                  ) : (
                    sandboxLogs.map((log, i) => (
                      <div key={i} className="animate-fadeIn leading-relaxed">
                        <span className="text-blue-400">&gt; </span>{log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SYMBOL HANDBOOK ================= */}
        {activeTab === 'guide' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Return Button */}
            <button
              onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs shadow-xs border border-slate-200/80 inline-flex items-center space-x-2 transition-all action-btn-hover"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>ย้อนกลับหน้าหลักภารกิจ</span>
            </button>

            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
              <span className="text-xs bg-blue-100 text-blue-700 font-extrabold px-3.5 py-1 rounded-full border border-blue-200">
                📚 รูปทรงสัญลักษณ์มาตรฐานสากล (ANSI / ISO Standard)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                คู่มือสัญลักษณ์ผังงานฉบับสมบูรณ์ (Flowchart Handbook)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                รวบรวมรูปทรงเรขาคณิตมาตรฐานทางวิศวกรรมและวิทยาการคำนวณที่ถูกต้อง 100% พร้อมคำอธิบายหน้าที่และตัวอย่าง
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100 text-xs font-bold">
                <span className="text-slate-500 mr-1">หมวดหมู่:</span>
                {['ทั้งหมด', 'พื้นฐานสำคัญ', 'การทำงาน', 'รับและส่งข้อมูล', 'เงื่อนไขตัดสินใจ', 'จุดเชื่อมต่อ'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSymbolFilter(cat); playSound('click', soundEnabled); }}
                    className={`px-3.5 py-1.5 rounded-2xl border transition-all ${
                      symbolFilter === cat 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 scale-105' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(symbolFilter === 'ทั้งหมด' ? ALL_FLOWCHART_SYMBOLS : ALL_FLOWCHART_SYMBOLS.filter(s => s.category === symbolFilter)).map((item) => (
                <div key={item.id} className="bg-white/90 backdrop-blur-xl border border-blue-100/80 hover:border-blue-400 rounded-3xl p-6 shadow-xs flex flex-col justify-between card-hover-effect">
                  <div>
                    <div className="h-28 bg-gradient-to-br from-blue-50/50 via-slate-50 to-sky-50/30 rounded-2xl border border-blue-100 flex items-center justify-center p-3 mb-4">
                      <FlowchartShapeSvg shape={item.shapeType} label={item.name.split(' ')[0]} />
                    </div>

                    <h4 className="font-black text-slate-900 text-base flex items-center space-x-2">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </h4>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">รูปทรง: {item.shapeName}</p>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium">{item.simpleExplain}</p>

                    <div className="mt-3 bg-slate-50/90 p-3 rounded-2xl border border-slate-100 text-xs">
                      <span className="text-slate-500 font-bold">💡 ตัวอย่าง: </span>
                      <span className="text-indigo-700 font-bold">{item.example}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-[10px] px-3 py-0.5 rounded-full border font-black ${item.badge}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">ANSI/ISO Standard</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: VIDEO LEARNING STUDIO ================= */}
        {activeTab === 'video' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Return Button */}
            <button
              onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-rose-700 font-extrabold text-xs shadow-xs border border-slate-200/80 inline-flex items-center space-x-2 transition-all action-btn-hover"
            >
              <ArrowLeft className="w-4 h-4 text-rose-600" />
              <span>ย้อนกลับหน้าหลักภารกิจ</span>
            </button>

            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs bg-rose-50 text-rose-700 font-extrabold px-3.5 py-1 rounded-full border border-rose-200">
                    📺 ห้องเรียนรู้วิดีโอ ป.6 (YouTube Stream)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    เรียนรู้การเขียนผังงานด้วยวิดีโอและสื่อการสอน
                  </h2>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customYoutubeUrl.trim()) return;
                    const yId = extractYoutubeId(customYoutubeUrl);
                    if (!yId) { alert('ลิงก์ YouTube ไม่ถูกต้อง'); return; }
                    setCustomVideoId(yId);
                    setSelectedVideo({
                      id: 'custom_live',
                      title: 'วิดีโอที่กำลังเล่น (Custom YouTube Stream)',
                      creator: 'YouTube Embed',
                      duration: 'กำหนดเอง',
                      youtubeId: yId,
                      description: 'กำลังเล่นวิดีโอการเรียนรู้จากลิงก์ที่คุณระบุในระบบ'
                    });
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    placeholder="วางลิงก์ YouTube..."
                    value={customYoutubeUrl}
                    onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-52 sm:w-64 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                  />
                  <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition">
                    เปิดดูคลิป
                  </button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 glass-panel rounded-3xl p-5 shadow-sm">
                <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video shadow-lg">
                  <iframe
                    className="w-full h-full absolute inset-0"
                    src={`https://www.youtube.com/embed/${customVideoId || selectedVideo?.youtubeId || 'S20m_Yf8tW0'}?autoplay=1&rel=0`}
                    title={selectedVideo?.title || 'Flowchart Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">{selectedVideo?.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{selectedVideo?.description}</p>
                </div>
              </div>

              <div className="lg:col-span-4 glass-panel rounded-3xl p-5 shadow-sm">
                <h4 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center space-x-1.5">
                  <Film className="w-4 h-4 text-rose-600" />
                  <span>รายการบทเรียน ({videoLessons.length} ตอน)</span>
                </h4>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {videoLessons.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => { setSelectedVideo(video); setCustomVideoId(null); playSound('click', soundEnabled); }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between card-hover-effect ${
                        selectedVideo?.id === video.id && !customVideoId ? 'bg-blue-50/80 border-blue-400' : 'bg-white hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-2">{video.title}</h5>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                        <span className="text-rose-600 font-bold">{video.creator}</span>
                        <span>{video.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: SYSTEM TEST CENTER (หน้าทดสอบระบบครบวงจร) ================= */}
        {activeTab === 'test' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header Test Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-600/20 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold bg-white/20 px-3.5 py-1 rounded-full w-fit mb-2.5 border border-white/30">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>ศูนย์ทดสอบระบบ & ควบคุมคุณภาพ (System Test & QA Center)</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    หน้าทดสอบระบบ Flowchart Quest (วิทยาการคำนวณ ป.6)
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-1 leading-relaxed font-medium">
                    เครื่องมือสำหรับคุณครูและผู้ดูแลระบบในการทดสอบกระบวนการเรียนรู้ทุกด่าน จำลองข้อมูลนักเรียน และตรวจสอบความถูกต้องของระบบ
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs bg-white text-emerald-800 font-black px-3.5 py-2 rounded-xl shadow-xs">
                    🌐 พอร์ตเซิร์ฟเวอร์: 5174
                  </span>
                </div>
              </div>

              {/* 1-Click Fast-Track Automation Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/20">
                
                {/* 1. Complete Full Journey Auto-fill */}
                <button
                  onClick={() => {
                    const sampleStudent = { name: 'เด็กชายกิตติศักดิ์ เรียนดี', room: 'ป.6/1', number: '15' };
                    setStudentInfo(sampleStudent);
                    setIsProfileEntered(true);
                    const scores = {
                      preScore: 8,
                      postScore: 10,
                      m1: 15,
                      m2: 15,
                      m3: 15,
                      m4: 20,
                      m5: 35,
                      total: 100
                    };
                    setMissionScores(scores);
                    setCompletedStages({
                      pretest: true,
                      learning: true,
                      mission1: true,
                      mission2: true,
                      mission3: true,
                      mission4: true,
                      final: true,
                      posttest: true,
                      summary: true
                    });
                    setUserXP(1000);
                    setComboCount(5);
                    saveStudentRecordToDatabase(scores);
                    setActiveTab('game');
                    setGameStage('summary');
                    playSound('success', soundEnabled);
                  }}
                  className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold p-4 rounded-2xl shadow-md transition text-left flex items-start space-x-3 action-btn-hover"
                >
                  <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black">⚡ จำลองทำจบทุกด่าน (100 คะแนน)</div>
                    <div className="text-[11px] text-slate-500 font-medium">กรอกชื่อ + ผ่าน 5 ด่าน + ออกใบประกาศทันที</div>
                  </div>
                </button>

                {/* 2. Populate 16 Mock Students across 4 Rooms */}
                <button
                  onClick={() => {
                    const today = new Date();
                    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
                    const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                    const threeDaysAgo = new Date(today); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                    const mockStudents = [
                      // Room 6/1
                      { id: 'mock_1', name: 'ด.ช.กิตติศักดิ์ เรียนดี', room: 'ป.6/1', number: '1', preScore: 8, postScore: 10, gainScore: 2, m1: 15, m2: 15, m3: 15, m4: 20, m5: 35, totalScore: 100, isPassed: true, completedAt: today.toISOString() },
                      { id: 'mock_2', name: 'ด.ญ.พิมพ์มาดา ปัญญาไว', room: 'ป.6/1', number: '2', preScore: 7, postScore: 10, gainScore: 3, m1: 15, m2: 15, m3: 15, m4: 20, m5: 32, totalScore: 97, isPassed: true, completedAt: today.toISOString() },
                      { id: 'mock_3', name: 'ด.ช.ธนภัทร สุขสมบูรณ์', room: 'ป.6/1', number: '3', preScore: 5, postScore: 9, gainScore: 4, m1: 15, m2: 15, m3: 12, m4: 15, m5: 28, totalScore: 85, isPassed: true, completedAt: yesterday.toISOString() },
                      { id: 'mock_4', name: 'ด.ญ.กัญญารัตน์ ช่างคิด', room: 'ป.6/1', number: '4', preScore: 6, postScore: 9, gainScore: 3, m1: 15, m2: 15, m3: 15, m4: 20, m5: 30, totalScore: 95, isPassed: true, completedAt: yesterday.toISOString() },
                      
                      // Room 6/2
                      { id: 'mock_5', name: 'ด.ช.ภูริณัฐ พัฒนา', room: 'ป.6/2', number: '1', preScore: 7, postScore: 10, gainScore: 3, m1: 15, m2: 15, m3: 15, m4: 20, m5: 34, totalScore: 99, isPassed: true, completedAt: yesterday.toISOString() },
                      { id: 'mock_6', name: 'ด.ญ.วรรณวิสา เลิศล้ำ', room: 'ป.6/2', number: '2', preScore: 6, postScore: 9, gainScore: 3, m1: 15, m2: 15, m3: 15, m4: 15, m5: 31, totalScore: 91, isPassed: true, completedAt: yesterday.toISOString() },
                      { id: 'mock_7', name: 'ด.ช.อัครเดช ใจเด็ด', room: 'ป.6/2', number: '3', preScore: 5, postScore: 8, gainScore: 3, m1: 15, m2: 12, m3: 12, m4: 15, m5: 26, totalScore: 80, isPassed: true, completedAt: twoDaysAgo.toISOString() },
                      { id: 'mock_8', name: 'ด.ญ.ปรียานุช งามยิ่ง', room: 'ป.6/2', number: '4', preScore: 4, postScore: 7, gainScore: 3, m1: 12, m2: 12, m3: 10, m4: 10, m5: 22, totalScore: 66, isPassed: true, completedAt: twoDaysAgo.toISOString() },
                      
                      // Room 6/3
                      { id: 'mock_9', name: 'ด.ช.ธีรพัฒน์ มีคุณธรรม', room: 'ป.6/3', number: '1', preScore: 8, postScore: 10, gainScore: 2, m1: 15, m2: 15, m3: 15, m4: 20, m5: 33, totalScore: 98, isPassed: true, completedAt: twoDaysAgo.toISOString() },
                      { id: 'mock_10', name: 'ด.ญ.สุพิชชา รักเรียน', room: 'ป.6/3', number: '2', preScore: 6, postScore: 9, gainScore: 3, m1: 15, m2: 15, m3: 15, m4: 20, m5: 30, totalScore: 95, isPassed: true, completedAt: twoDaysAgo.toISOString() },
                      { id: 'mock_11', name: 'ด.ช.สรวิชญ์ ก้าวหน้า', room: 'ป.6/3', number: '3', preScore: 5, postScore: 8, gainScore: 3, m1: 12, m2: 15, m3: 12, m4: 15, m5: 27, totalScore: 81, isPassed: true, completedAt: threeDaysAgo.toISOString() },
                      { id: 'mock_12', name: 'ด.ญ.ชลธิชา มั่นคง', room: 'ป.6/3', number: '4', preScore: 3, postScore: 6, gainScore: 3, m1: 10, m2: 10, m3: 10, m4: 10, m5: 18, totalScore: 58, isPassed: false, completedAt: threeDaysAgo.toISOString() },

                      // Room 6/4
                      { id: 'mock_13', name: 'ด.ช.พงศ์กร สร้างสรรค์', room: 'ป.6/4', number: '1', preScore: 7, postScore: 10, gainScore: 3, m1: 15, m2: 15, m3: 15, m4: 20, m5: 35, totalScore: 100, isPassed: true, completedAt: threeDaysAgo.toISOString() },
                      { id: 'mock_14', name: 'ด.ญ.อารียา ปราดเปรื่อง', room: 'ป.6/4', number: '2', preScore: 6, postScore: 9, gainScore: 3, m1: 15, m2: 15, m3: 15, m4: 20, m5: 32, totalScore: 97, isPassed: true, completedAt: threeDaysAgo.toISOString() },
                      { id: 'mock_15', name: 'ด.ช.อนุชา ขยันหมั่นเพียร', room: 'ป.6/4', number: '3', preScore: 4, postScore: 7, gainScore: 3, m1: 12, m2: 12, m3: 12, m4: 15, m5: 24, totalScore: 75, isPassed: true, completedAt: threeDaysAgo.toISOString() },
                      { id: 'mock_16', name: 'ด.ช.วรเมธ กำลังใจ', room: 'ป.6/4', number: '4', preScore: 2, postScore: 5, gainScore: 3, m1: 10, m2: 8, m3: 8, m4: 10, m5: 16, totalScore: 52, isPassed: false, completedAt: threeDaysAgo.toISOString() },
                    ];
                    setStudentRecords(mockStudents);
                    setActiveTab('teacher');
                    playSound('success', soundEnabled);
                  }}
                  className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold p-4 rounded-2xl shadow-md transition text-left flex items-start space-x-3 action-btn-hover"
                >
                  <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black">👥 จำลองข้อมูลนักเรียน 16 คน (ครบ 4 ห้อง: ป.6/1 - ป.6/4)</div>
                    <div className="text-[11px] text-slate-500 font-medium">ทดสอบตัวกรองห้องเรียน วันที่ & ส่งออก CSV ทันที</div>
                  </div>
                </button>

                {/* 3. Reset All Data */}
                <button
                  onClick={() => {
                    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลความก้าวหน้าและคะแนนทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                      localStorage.clear();
                      setStudentInfo({ name: '', room: 'ป.6/1', number: '' });
                      setIsProfileEntered(false);
                      setGameStage('intro');
                      setMissionScores({ m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, preScore: null, postScore: null, total: 0 });
                      setCompletedStages({});
                      setStudentRecords([]);
                      setUserXP(0);
                      setComboCount(0);
                      playSound('click', soundEnabled);
                    }
                  }}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold p-4 rounded-2xl border border-white/20 transition text-left flex items-start space-x-3"
                >
                  <Trash2 className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black">🧹 รีเซ็ตข้อมูลทั้งหมด (Reset All)</div>
                    <div className="text-[11px] text-emerald-100 font-medium">ล้างข้อมูล LocalStorage เพื่อเริ่มใหม่</div>
                  </div>
                </button>

              </div>
            </div>

            {/* Quick Navigation Jump Matrix */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  ทางลัดเข้าสู่ด่านและหน้าทดสอบรายบุคคล (Quick Jump Matrix)
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                คลิกปุ่มเพื่อทดสอบระบบในแต่ละด่านได้ทันทีโดยไม่ต้องผ่านเงื่อนไขล็อก
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                
                <button
                  onClick={() => { setActiveTab('game'); setGameStage('intro'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-slate-900">1. หน้าแรก / ลงทะเบียน</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">กรอกชื่อ ชั้น เลขที่</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('pretest'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-slate-900">2. Pre-Test (10 ข้อ)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">แบบทดสอบก่อนเรียน</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('learning'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-slate-900">3. บทเรียน 5 เรื่อง</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Learning Chapters</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('mission1'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-blue-700">4. M1: Symbol Hunter</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">จับคู่สัญลักษณ์ (15p)</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('mission2'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-indigo-700">5. M2: Step Master</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">เรียงลำดับ 3 ระดับ (15p)</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('mission3'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-amber-700">6. M3: Flow Reader</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">อ่านผังงานจริง (15p)</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('mission4'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-rose-700">7. M4: Bug Detective</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">สืบหา Bug 3 สเต็ป (20p)</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('final'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-emerald-700">8. Final Mission</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Flowchart Designer (35p)</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('posttest'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-slate-900">9. Post-Test (10 ข้อ)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">วัดคะแนนพัฒนาการ</div>
                </button>

                <button
                  onClick={() => { setActiveTab('game'); setIsProfileEntered(true); setGameStage('summary'); playSound('click', soundEnabled); }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-left transition card-hover-effect"
                >
                  <div className="text-xs font-black text-amber-700">10. ใบประกาศ PNG</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Certificate & 5 Badges</div>
                </button>

              </div>
            </div>

            {/* Interactive Hardware & Audio Testing Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sound Effects Board */}
              <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">
                    ทดสอบระบบเสียงสังเคราะห์ (Web Audio API)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  ทดสอบเสียงเอฟเฟกต์ทั้งหมดที่สร้างจาก Web Audio API โดยไม่ต้องพึ่งพาไฟล์เสียงภายนอก
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => playSound('click', true)}
                    className="p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-bold text-slate-700 transition"
                  >
                    🔊 Click
                  </button>
                  <button
                    onClick={() => playSound('drop', true)}
                    className="p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-bold text-slate-700 transition"
                  >
                    📦 Drop
                  </button>
                  <button
                    onClick={() => playSound('step', true)}
                    className="p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-bold text-slate-700 transition"
                  >
                    👟 Step
                  </button>
                  <button
                    onClick={() => playSound('success', true)}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition"
                  >
                    🎉 Success
                  </button>
                  <button
                    onClick={() => playSound('combo', true)}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition"
                  >
                    🔥 Combo
                  </button>
                  <button
                    onClick={() => playSound('error', true)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-800 transition"
                  >
                    ❌ Error
                  </button>
                </div>
              </div>

              {/* System Health Status */}
              <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">
                    สถานะความพร้อมของระบบ (System Health)
                  </h4>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <span>⚡ Framework / Bundler:</span>
                    <strong className="text-emerald-600 font-bold">React 19 + Vite (Active)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <span>💾 ข้อมูล LocalStorage:</span>
                    <strong className="text-emerald-600 font-bold">{studentRecords.length} รายการบันทึก</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <span>🎨 Canvas Certificate Engine:</span>
                    <strong className="text-emerald-600 font-bold">1200x840 px (พร้อมใช้งาน)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <span>📋 ตัวชี้วัดหลักสูตร:</span>
                    <strong className="text-emerald-600 font-bold">ว 4.2 ป.6/1 (ตรงตามหลักสูตรแกนกลาง 100%)</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 7: ADMIN BACKEND ================= */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Return Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-amber-700 font-extrabold text-xs shadow-xs border border-slate-200/80 inline-flex items-center space-x-2 transition-all action-btn-hover"
              >
                <ArrowLeft className="w-4 h-4 text-amber-600" />
                <span>ย้อนกลับหน้าหลักภารกิจ</span>
              </button>
            </div>

            {!isAdminUnlocked ? (
              <div className="max-w-md mx-auto glass-panel rounded-3xl p-8 shadow-xl text-center my-8 border border-amber-200">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-3xl mb-4 border border-amber-200 shadow-sm">
                  🔐
                </div>
                <h3 className="text-2xl font-black text-slate-900">แผงควบคุมระบบแอดมิน</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">กรุณากรอกรหัสผ่านเพื่อเข้าถึงระบบหลังบ้าน</p>

                <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
                  <input
                    type="password"
                    required
                    placeholder="กรุณากรอกรหัสผ่านแอดมิน..."
                    value={adminPinInput}
                    onChange={(e) => { setAdminPinInput(e.target.value); setAdminPinError(''); }}
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3.5 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    autoFocus
                  />
                  {adminPinError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold animate-fadeIn flex items-center justify-center space-x-1.5 shadow-2xs">
                      <span>⚠️</span>
                      <span>{adminPinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 px-6 rounded-2xl shadow-md transition text-sm action-btn-hover"
                  >
                    เข้าสู่ระบบแอดมิน (Unlock)
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Admin Header with Multi-SubTab Bar */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/20">
                    <div className="flex items-center space-x-3.5">
                      <img 
                        src={kruKingLogo} 
                        alt="ห้องสื่อครูคิง" 
                        className="w-14 h-14 object-contain rounded-2xl bg-white p-1 shadow-md border border-amber-200" 
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-2xl font-black">ระบบจัดการหลังบ้าน (Admin Platform Workspace)</h2>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border backdrop-blur-md ${isOnline ? 'bg-emerald-500/40 text-white border-emerald-300' : 'bg-rose-500/40 text-white border-rose-300'}`}>
                            {isOnline ? '🟢 ออนไลน์' : '🟡 ออฟไลน์'}
                          </span>
                        </div>
                        <p className="text-xs text-amber-100 mt-0.5 font-medium">ศูนย์กลางบริหารจัดการข้อมูลนักเรียน การประเมินผล วิเคราะห์สถิติ สื่อการสอน และสำรองข้อมูล</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => syncAllToCloudAndGitHub()}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition action-btn-hover flex items-center space-x-1.5 cursor-pointer"
                        title="ซิงก์ข้อมูลทั้งระบบขึ้น Google Sheets & GitHub ทันที"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>⚡ ซิงก์ขึ้น Cloud & GitHub</span>
                      </button>
                      <button
                        onClick={() => setIsAdminUnlocked(false)}
                        className="bg-white/95 hover:bg-white text-slate-800 font-bold px-4 py-2.5 rounded-2xl text-xs shadow transition action-btn-hover self-start sm:self-auto cursor-pointer"
                      >
                        ล็อกระบบ (Lock)
                      </button>
                    </div>
                  </div>

                  {/* 9 Clean Sub-Tabs Navigation */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pt-4 text-xs font-bold scrollbar-none">
                    {[
                      { id: 'overview', label: '📊 ภาพรวมระบบ (Overview)' },
                      { id: 'classrooms', label: '🏫 ห้องเรียน & รหัส PIN' },
                      { id: 'pilot', label: '🧪 ทดสอบการสอน (Classroom Pilot)' },
                      { id: 'students', label: '👥 จัดการนักเรียน (Students)' },
                      { id: 'analytics', label: '📈 สถิติเชิงลึก (Analytics)' },
                      { id: 'content', label: '📖 จัดการบทเรียน (Content)' },
                      { id: 'database', label: '☁️ Google Sheets ฐานข้อมูล' },
                      { id: 'backup', label: '💾 สำรอง & กู้คืน (Backup)' },
                      { id: 'logs', label: '📋 บันทึกกิจกรรม (Activity Log)' },
                      { id: 'settings', label: '⚙️ ความปลอดภัย & ตั้งค่า' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setAdminSubTab(tab.id);
                          playSound('click', soundEnabled);
                        }}
                        className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
                          adminSubTab === tab.id
                            ? 'bg-white text-slate-900 shadow-md font-black'
                            : 'bg-white/15 hover:bg-white/25 text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* --- SUBTAB 1: OVERVIEW --- */}
                {adminSubTab === 'overview' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="glass-panel p-5 rounded-3xl space-y-1">
                        <div className="text-xs text-slate-500 font-bold">นักเรียนประเมินแล้ว</div>
                        <div className="text-3xl font-black text-blue-700">{studentRecords.length} <span className="text-xs text-slate-400 font-normal">คน</span></div>
                        <div className="text-[11px] text-slate-400 font-medium">บันทึกผลสัมฤทธิ์แล้ว</div>
                      </div>
                      <div className="glass-panel p-5 rounded-3xl space-y-1">
                        <div className="text-xs text-slate-500 font-bold">อัตราผ่านเกณฑ์ (&gt;=60%)</div>
                        <div className="text-3xl font-black text-emerald-600">{passRate}%</div>
                        <div className="text-[11px] text-emerald-700 font-medium">{filteredStudents.filter(s => s.isPassed).length} คนผ่านเกณฑ์</div>
                      </div>
                      <div className="glass-panel p-5 rounded-3xl space-y-1">
                        <div className="text-xs text-slate-500 font-bold">บทเรียนออนไลน์</div>
                        <div className="text-3xl font-black text-indigo-700">{learningChapters.length} <span className="text-xs text-slate-400 font-normal">บท</span></div>
                        <div className="text-[11px] text-slate-400 font-medium">ว 4.2 ป.6/1</div>
                      </div>
                      <div className="glass-panel p-5 rounded-3xl space-y-1">
                        <div className="text-xs text-slate-500 font-bold">สถานะ Google Sheets</div>
                        <div className="text-base font-black text-slate-900 mt-1">
                          {cloudWebhookUrl ? '☁️ พร้อมใช้งาน' : '💾 โหมด Local'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{cloudWebhookUrl ? 'Real-time sync' : 'ยังไม่ได้เชื่อมต่อ'}</div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>ทางลัดการทำงานด่วนสำหรับผู้ดูแลระบบ (Admin Quick Actions)</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <button
                          onClick={() => setAdminSubTab('students')}
                          className="p-4 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold transition text-left"
                        >
                          👥 จัดการทะเบียนนักเรียน
                        </button>
                        <button
                          onClick={() => setAdminSubTab('analytics')}
                          className="p-4 rounded-2xl bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold transition text-left"
                        >
                          📈 ดูสถิติ & Item Analysis
                        </button>
                        <button
                          onClick={() => setAdminSubTab('content')}
                          className="p-4 rounded-2xl bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition text-left"
                        >
                          📖 เพิ่ม/แก้ไขเนื้อหาบทเรียน
                        </button>
                        <button
                          onClick={() => setAdminSubTab('backup')}
                          className="p-4 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition text-left"
                        >
                          💾 สำรองข้อมูลระบบ (Export)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SUBTAB: CLASSROOMS & ROOM PIN MANAGER --- */}
                {adminSubTab === 'classrooms' && (() => {
                  const activeRooms = (Array.isArray(classrooms) && classrooms.length > 0) ? classrooms : DEFAULT_CLASSROOMS;

                  return (
                    <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                            <Key className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-black text-lg sm:text-xl text-slate-900">
                                จัดการห้องเรียนและรหัส PIN ประจำห้อง ({activeRooms.length} ห้อง)
                              </h3>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold border border-indigo-200">
                                แยกชีทอัตโนมัติ 📑
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              สร้างห้องเรียน กำหนดรหัส PIN และเชื่อมโยงแท็บข้อมูล Google Sheets สำหรับแต่ละห้อง
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextNum = activeRooms.length + 1;
                              setEditingClassroom({
                                id: `room_${Date.now()}`,
                                code: `60${nextNum}`,
                                name: `ห้อง ป.6/${nextNum}`,
                                sheetTab: `ป.6_${nextNum}`,
                                desc: `ชั้นประถมศึกษาปีที่ 6/${nextNum}`,
                                active: true
                              });
                              setIsCreatingClassroom(true);
                              playSound('click', soundEnabled);
                            }}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2.5 rounded-2xl transition shadow-md flex items-center space-x-1.5 action-btn-hover"
                          >
                            <Plus className="w-4 h-4" />
                            <span>เพิ่มห้องเรียนใหม่</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('คุณต้องการคืนค่า 4 ห้องเรียนมาตรฐาน (รหัส 601, 602, 603, 604) ใช่หรือไม่?')) {
                                setClassrooms(DEFAULT_CLASSROOMS);
                                localStorage.removeItem('flowchart_classrooms');
                                playSound('success', soundEnabled);
                                alert('✅ คืนค่าห้องเรียนมาตรฐาน (601-604) สำเร็จแล้ว!');
                              }
                            }}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3.5 py-2.5 rounded-2xl transition flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>คืนค่า 4 ห้องมาตรฐาน</span>
                          </button>
                        </div>
                      </div>

                      {/* Classrooms Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {activeRooms.map((room) => {
                          const studentsInRoom = studentRecords.filter(r => 
                            (r.roomCode && r.roomCode.toUpperCase() === room.code.toUpperCase()) || 
                            r.room === room.name
                          );

                          return (
                            <div key={room.id || room.code} className="bg-slate-50/90 rounded-3xl p-5 border border-slate-200/80 space-y-4 hover:shadow-md transition">
                              {/* Header & PIN Badge */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">รหัส PIN ห้อง</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingClassroom({ ...room });
                                      setIsCreatingClassroom(false);
                                      playSound('click', soundEnabled);
                                    }}
                                    className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 action-btn-hover"
                                    title="แก้ไขห้องเรียน"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {activeRooms.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (window.confirm(`ต้องการลบห้อง "${room.name}" (รหัส ${room.code}) ใช่หรือไม่?`)) {
                                          const updated = activeRooms.filter(r => r.code !== room.code);
                                          setClassrooms(updated);
                                          try {
                                            localStorage.setItem('flowchart_classrooms', JSON.stringify(updated));
                                          } catch { /* ignore */ }
                                          playSound('click', soundEnabled);
                                          await syncAllToCloudAndGitHub(learningChapters, updated);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200"
                                      title="ลบห้องเรียน"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Large PIN Display */}
                              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-center text-white shadow-md relative group">
                                <div className="text-2xl font-black font-mono tracking-widest">{room.code}</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(room.code);
                                    playSound('success', soundEnabled);
                                    alert(`📋 คัดลอกรหัสห้อง "${room.code}" แล้ว! นำไปให้นักเรียนใช้เข้าสู่ระบบได้เลย`);
                                  }}
                                  className="mt-1.5 inline-flex items-center space-x-1 text-[11px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>คัดลอก PIN</span>
                                </button>
                              </div>

                              {/* Classroom Details */}
                              <div className="space-y-1.5 text-xs">
                                <div className="font-black text-slate-900 text-sm">{room.name}</div>
                                <p className="text-slate-500 text-[11px] font-medium">{room.desc || 'ไม่มีรายละเอียด'}</p>
                                
                                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-500">📑 แท็บชีท:</span>
                                  <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    {room.sheetTab || room.name.replace('/', '_')}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-500">👥 นักเรียนประเมินแล้ว:</span>
                                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                                    {studentsInRoom.length} คน
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* --- SUBTAB: CLASSROOM PILOT & READINESS --- */}
                {adminSubTab === 'pilot' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Top Banner */}
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-2xl">
                            🏫
                          </div>
                          <div>
                            <h3 className="font-black text-xl">ศูนย์เตรียมความพร้อมและทดลองสอนในห้องเรียน (Classroom Pilot Hub)</h3>
                            <p className="text-xs text-indigo-200 mt-0.5">
                              เครื่องมือช่วยครูผู้สอน: เช็คลิสต์ความพร้อม, บันทึกเซสชันรายคาบ, ส่งออกรายงานผลสัมฤทธิ์ และจำลองข้อมูลทดสอบ
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            downloadPreClassBackup();
                            playSound('success', soundEnabled);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow flex items-center space-x-1.5 action-btn-hover shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          <span>💾 สำรองข้อมูลก่อนเริ่มสอน (Pre-Class Backup)</span>
                        </button>
                      </div>
                    </div>

                    {/* Grid: Checklist & Session Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left: 11-Item Readiness Checklist (7 Cols) */}
                      <div className="lg:col-span-7 glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h4 className="font-black text-base text-slate-900 flex items-center space-x-2">
                              <span>📋</span>
                              <span>เช็คลิสต์ความพร้อมก่อนสอน (Classroom Readiness Checklist)</span>
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              ตรวจสอบความพร้อมของระบบ 11 ด้านก่อนให้นักเรียน ป.6 เข้าใช้งาน
                            </p>
                          </div>

                          {(() => {
                            const checkedCount = Object.values(checklistState).filter(Boolean).length;
                            const isAllReady = checkedCount === CHECKLIST_ITEMS.length;
                            return (
                              <span className={`text-xs px-3 py-1 rounded-full font-black border ${
                                isAllReady ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                {isAllReady ? '🟢 พร้อมสอน 100%' : `เตรียมพร้อม ${checkedCount}/${CHECKLIST_ITEMS.length}`}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {CHECKLIST_ITEMS.map((item) => {
                            const isChecked = !!checklistState[item.id];
                            return (
                              <div 
                                key={item.id}
                                onClick={() => {
                                  const nextState = { ...checklistState, [item.id]: !isChecked };
                                  setChecklistState(nextState);
                                  localStorage.setItem('flowchart_pilot_checklist', JSON.stringify(nextState));
                                  playSound('click', soundEnabled);
                                }}
                                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                                  isChecked ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // Controlled via parent div click
                                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <div className="font-bold text-xs">{item.label}</div>
                                    <div className="text-[11px] text-slate-500 font-medium">{item.desc}</div>
                                    {item.id === 'sheets_connected' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAdminSubTab('database');
                                          playSound('click', soundEnabled);
                                        }}
                                        className="mt-1 px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] inline-flex items-center space-x-1 shadow-2xs transition"
                                      >
                                        <span>📋 คลิกที่นี่เพื่อเปิดหน้าคัดลอกโค้ด</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs">{isChecked ? '✅' : '⚪'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Class Session Tracker & Live Summary (5 Cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                          <h4 className="font-black text-base text-slate-900 flex items-center space-x-2">
                            <span>🎓</span>
                            <span>ข้อมูลคาบเรียนและห้องเรียน (Class Session)</span>
                          </h4>

                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">ห้องเรียนที่กำลังสอน</label>
                              <select
                                value={classSessionInfo.classroom}
                                onChange={(e) => setClassSessionInfo({ ...classSessionInfo, classroom: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                              >
                                <option value="ป.6/1">ป.6/1 (ห้อง 1)</option>
                                <option value="ป.6/2">ป.6/2 (ห้อง 2)</option>
                                <option value="ป.6/3">ป.6/3 (ห้อง 3)</option>
                                <option value="ป.6/4">ป.6/4 (ห้อง 4)</option>
                                <option value="ทั่วไป">ห้องเรียนทั่วไป (Demo)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">ชื่อครูผู้สอน</label>
                              <input
                                type="text"
                                value={classSessionInfo.teacher}
                                onChange={(e) => setClassSessionInfo({ ...classSessionInfo, teacher: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">รหัสเซสชันคาบเรียน (Class Session ID)</label>
                              <input
                                type="text"
                                value={classSessionInfo.sessionId}
                                readOnly
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 font-mono text-slate-600 font-bold"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                exportClassLearningReport(filteredStudents, classSessionInfo.classroom);
                                playSound('success', soundEnabled);
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-xs transition shadow flex items-center justify-center space-x-1.5 action-btn-hover"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>📊 ส่งออกรายงานสรุปชั้นเรียน (Class Report CSV)</span>
                            </button>
                          </div>
                        </div>

                        {/* Pilot Simulator Box */}
                        <div className="glass-panel rounded-3xl p-5 shadow-sm space-y-3 bg-amber-50/70 border border-amber-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-xs text-amber-950 flex items-center space-x-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                              <span>ระบบจำลองข้อมูลทดสอบ (Pilot Simulator)</span>
                            </h4>
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              ISOLATED
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 font-medium">
                            สร้างข้อมูลนักเรียนจำลองสำหรับซ้อมก่อนสอนจริง (ติดแท็ก [TEST DATA] ชัดเจน)
                          </p>

                          <div className="flex items-center gap-2">
                            <select
                              value={pilotGenCount}
                              onChange={(e) => setPilotGenCount(Number(e.target.value))}
                              className="bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold"
                            >
                              <option value={5}>5 นักเรียน</option>
                              <option value={10}>10 นักเรียน</option>
                              <option value={30}>30 นักเรียน (เต็มห้อง)</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                const generated = generatePilotTestData(pilotGenCount, classSessionInfo.classroom);
                                setStudentRecords(prev => [...generated, ...prev]);
                                playSound('success', soundEnabled);
                                alert(`✅ สร้างข้อมูลนักเรียนจำลอง ${pilotGenCount} คน เรียบร้อยแล้ว`);
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition shadow-xs flex-1"
                            >
                              ➕ สร้าง {pilotGenCount} คน
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const cleaned = purgeTestData(studentRecords);
                                setStudentRecords(cleaned);
                                playSound('click', soundEnabled);
                                alert('🗑️ ลบข้อมูลจำลองทั้งหมดเรียบร้อยแล้ว');
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-2 rounded-xl text-xs transition"
                              title="ลบเฉพาะข้อมูลทดสอบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* --- SUBTAB 2: STUDENTS --- */}
                {adminSubTab === 'students' && (
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-black text-lg sm:text-xl text-slate-900">
                          ศูนย์จัดการข้อมูลนักเรียนและทะเบียนเรียน
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          ลงทะเบียนล่วงหน้า นำเข้าไฟล์ CSV รายห้อง และดูประวัติการเรียนแบบละเอียดรายคน
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setShowRosterModal(true);
                          playSound('click', soundEnabled);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2.5 rounded-2xl transition shadow-md text-xs flex items-center space-x-1.5 action-btn-hover"
                      >
                        <Users className="w-4 h-4" />
                        <span>เปิดหน้าต่างจัดการทะเบียนนักเรียน (Roster Manager)</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        รายชื่อผู้ที่ประเมินแล้วในระบบ ({studentRecords.length} คน)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {studentRecords.map(std => {
                          const risk = classifyStudentRisk(std);
                          return (
                            <div key={std.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-xs text-slate-900 truncate">{std.name}</div>
                                <div className="text-[11px] text-slate-500 font-medium">ห้อง {std.room} เลขที่ {std.number} • รวม {std.totalScore}/100</div>
                                <span className={`inline-block mt-1 text-[10px] px-2 py-0.2 rounded-full font-bold border ${risk.badgeBg}`}>
                                  {risk.label}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedStudentForProfile(std);
                                  playSound('click', soundEnabled);
                                }}
                                className="p-2 rounded-xl bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 text-xs font-bold transition shrink-0"
                                title="ดูโปรไฟล์"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SUBTAB 3: ANALYTICS --- */}
                {adminSubTab === 'analytics' && (
                  <div className="space-y-6 animate-fadeIn">
                    {(() => {
                      const stats = computeClassroomAnalytics(studentRecords);
                      return (
                        <>
                          {/* Risk Group Breakdown */}
                          <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                              <span>การจำแนกระดับสมรรถนะและความเสี่ยงของผู้เรียน (Student Risk & Mastery Groups)</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                                <div className="font-bold text-emerald-900">🟢 ยอดเยี่ยม (Excellent)</div>
                                <div className="text-2xl font-black text-emerald-950 mt-1">{stats.riskCounts.EXCELLENT} <span className="text-xs font-normal">คน</span></div>
                                <div className="text-[11px] text-emerald-700 mt-0.5">คะแนน &gt;= 90% และ Post &gt;= 8</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                                <div className="font-bold text-blue-900">🟢 ตามเกณฑ์ดี (On Track)</div>
                                <div className="text-2xl font-black text-blue-950 mt-1">{stats.riskCounts.ON_TRACK} <span className="text-xs font-normal">คน</span></div>
                                <div className="text-[11px] text-blue-700 mt-0.5">คะแนน &gt;= 70% และ Post &gt;= 6</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                                <div className="font-bold text-amber-900">🟡 เฝ้าระวัง (Needs Attention)</div>
                                <div className="text-2xl font-black text-amber-950 mt-1">{stats.riskCounts.NEEDS_ATTENTION} <span className="text-xs font-normal">คน</span></div>
                                <div className="text-[11px] text-amber-700 mt-0.5">ควรเสริมในภารกิจที่ได้น้อย</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                                <div className="font-bold text-rose-900">🔴 ต้องช่วยเหลือ (Needs Support)</div>
                                <div className="text-2xl font-black text-rose-950 mt-1">{stats.riskCounts.NEEDS_SUPPORT} <span className="text-xs font-normal">คน</span></div>
                                <div className="text-[11px] text-rose-700 mt-0.5">ต้องการการสอนเสริมตัวต่อตัว</div>
                              </div>
                            </div>
                          </div>

                          {/* Gain Score Metrics & Mission Mastery */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-3">
                              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                <span>สถิติพัฒนาการ (Gain Score Distribution)</span>
                              </h4>
                              <div className="grid grid-cols-2 gap-2.5 text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="text-slate-500 font-bold">Gain เฉลี่ย:</div>
                                  <div className="text-xl font-black text-indigo-700 mt-0.5">+{stats.avgGain}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="text-slate-500 font-bold">มัธยฐาน (Median Gain):</div>
                                  <div className="text-xl font-black text-indigo-700 mt-0.5">+{stats.medianGain}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="text-slate-500 font-bold">Gain สูงสุด:</div>
                                  <div className="text-xl font-black text-emerald-600 mt-0.5">+{stats.maxGain}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="text-slate-500 font-bold">Gain ต่ำสุด:</div>
                                  <div className="text-xl font-black text-slate-700 mt-0.5">{stats.minGain}</div>
                                </div>
                              </div>
                            </div>

                            <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-3">
                              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                                <Award className="w-4 h-4 text-blue-600" />
                                <span>อัตราความสำเร็จรายภารกิจ (Mission Mastery)</span>
                              </h4>
                              <div className="space-y-2 text-xs">
                                {[
                                  { label: 'M1: สัญลักษณ์ผังงาน (15p)', stat: stats.missionStats.m1 },
                                  { label: 'M2: ลำดับขั้นตอน (15p)', stat: stats.missionStats.m2 },
                                  { label: 'M3: อ่านและวิเคราะห์ผังงาน (15p)', stat: stats.missionStats.m3 },
                                  { label: 'M4: นักสืบ Bug Detective (20p)', stat: stats.missionStats.m4 },
                                  { label: 'Final: ออกแบบและจำลองผังงาน (35p)', stat: stats.missionStats.m5 }
                                ].map((m, i) => (
                                  <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                    <span className="font-bold text-slate-700">{m.label}</span>
                                    <div className="text-right">
                                      <span className="font-black text-blue-700">{m.stat.avg}</span>
                                      <span className="text-[10px] text-slate-400 font-normal">/{m.stat.max}</span>
                                      <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">ผ่าน {m.stat.passRate}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Item Analysis Table (Pre vs Post Questions 1-10) */}
                          <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                              <span>การวิเคราะห์ความยาก-ง่ายรายข้อสอบ (Item Analysis: Questions 1-10)</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="bg-slate-100 px-3 py-2 font-black text-slate-700">Pre-Test (10 ข้อ)</div>
                                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                                  {stats.itemAnalysisPre.map(item => (
                                    <div key={item.itemNo} className="p-2.5 flex items-center justify-between">
                                      <span className="font-medium text-slate-800">ข้อ {item.itemNo}: {item.question.substring(0, 32)}...</span>
                                      <div className="flex items-center space-x-1.5 shrink-0">
                                        <span className="font-bold text-blue-700">{item.correctPercent}% ถูก</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-bold">{item.difficulty}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="bg-slate-100 px-3 py-2 font-black text-slate-700">Post-Test (10 ข้อ)</div>
                                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                                  {stats.itemAnalysisPost.map(item => (
                                    <div key={item.itemNo} className="p-2.5 flex items-center justify-between">
                                      <span className="font-medium text-slate-800">ข้อ {item.itemNo}: {item.question.substring(0, 32)}...</span>
                                      <div className="flex items-center space-x-1.5 shrink-0">
                                        <span className="font-bold text-emerald-700">{item.correctPercent}% ถูก</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-bold">{item.difficulty}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* --- SUBTAB 4: CONTENT (LESSON MANAGER) --- */}
                {adminSubTab === 'content' && (() => {
                  const activeChapters = (Array.isArray(learningChapters) && learningChapters.length > 0)
                    ? learningChapters
                    : LEARNING_CHAPTERS;

                  return (
                    <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-black text-lg sm:text-xl text-slate-900">
                                จัดการเนื้อหาบทเรียนและภาพประกอบ ({activeChapters.length} บทเรียน)
                              </h3>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200">
                                ระบบบีบอัดภาพอัตโนมัติ ⚡
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              คุณครูสามารถเพิ่มบทเรียนใหม่ ลด/ลบบทเรียน แก้ไขเนื้อหา และอัปโหลดภาพประกอบ
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextNum = activeChapters.length + 1;
                              setEditingChapter({
                                id: `ch_${Date.now()}`,
                                chapterNum: nextNum,
                                title: `บทที่ ${nextNum}: บทเรียนใหม่`,
                                subtitle: 'คำอธิบายบทเรียนสั้นๆ',
                                summary: 'เนื้อหาและรายละเอียดของบทเรียนนี้สำหรับนักเรียนชั้น ป.6',
                                icon: '💡',
                                badgeColor: 'border-blue-200 text-blue-800 bg-blue-50',
                                keyPoints: [
                                  { heading: 'สาระสำคัญที่ 1', content: 'รายละเอียดจุดเน้นของเนื้อหา' },
                                  { heading: 'สาระสำคัญที่ 2', content: 'ตัวอย่างและการนำไปใช้งาน' }
                                ]
                              });
                              setIsCreatingNewChapter(true);
                              playSound('click', soundEnabled);
                            }}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2.5 rounded-2xl transition shadow-md flex items-center space-x-1.5 action-btn-hover"
                          >
                            <Plus className="w-4 h-4" />
                            <span>เพิ่มบทเรียนใหม่</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('คุณต้องการคืนค่าบทเรียนทั้งหมดเป็น 5 บทเรียนมาตรฐานตามหลักสูตรหรือไม่?')) {
                                setLearningChapters(LEARNING_CHAPTERS);
                                localStorage.removeItem('flowchart_learning_chapters');
                                setChapterImages({ ch1: '', ch2: '', ch3: '', ch4: '', ch5: '' });
                                localStorage.removeItem('flowchart_chapter_images');
                                playSound('success', soundEnabled);
                                alert('✅ คืนค่า 5 บทเรียนมาตรฐานตามหลักสูตรเรียบร้อยแล้ว!');
                              }
                            }}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3.5 py-2.5 rounded-2xl transition flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>คืนค่าบทเรียนมาตรฐาน</span>
                          </button>
                        </div>
                      </div>

                      {/* Chapters List Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {activeChapters.map((ch, idx) => {
                          const chapterId = ch.id || `ch_${idx + 1}`;
                          const chapterTitle = ch.title || `บทที่ ${idx + 1}: บทเรียน`;
                          const chapterNum = ch.chapterNum || (idx + 1);
                          const chapterImg = (chapterImages && chapterImages[chapterId]) || ch.image || '';
                          
                          return (
                            <div key={chapterId} className="bg-slate-50/80 rounded-3xl p-5 border border-slate-200/80 space-y-4 hover:shadow-md transition">
                              
                              {/* Image Box */}
                              <div className="w-full h-36 rounded-2xl bg-white border border-slate-200 overflow-hidden relative group flex items-center justify-center">
                                {chapterImg ? (
                                  <img 
                                    src={chapterImg} 
                                    alt={chapterTitle} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                ) : (
                                  <div className="text-center text-slate-400 space-y-1">
                                    <span className="text-3xl block">🖼️</span>
                                    <span className="text-[11px] font-bold">ยังไม่มีภาพประกอบ</span>
                                  </div>
                                )}

                                {/* Image Upload Label */}
                                <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer p-2 text-center backdrop-blur-xs">
                                  <ImageIcon className="w-6 h-6 mb-1 text-amber-300" />
                                  <span className="text-xs font-bold">อัปโหลดภาพ (บีบอัดอัตโนมัติ)</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        try {
                                          const res = await compressImage(file, 750, 750, 0.72);
                                          setChapterImages(prev => ({ ...prev, [chapterId]: res.base64 }));
                                          playSound('success', soundEnabled);
                                          alert(`✅ อัปโหลดและบีบอัดภาพสำเร็จ! ประหยัดพื้นที่ ${res.savedPercent}%`);
                                        } catch (err) {
                                          alert(`เกิดข้อผิดพลาด: ${err.message}`);
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-xs font-black text-blue-700">บทที่ {chapterNum}</span>
                                    {ch.pdfUrl && (
                                      <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                                        📑 Google Drive PDF
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingChapter({
                                          ...ch,
                                          id: chapterId,
                                          chapterNum: chapterNum,
                                          icon: ch.icon || '📖',
                                          title: chapterTitle,
                                          subtitle: ch.subtitle || '',
                                          summary: ch.summary || '',
                                          pdfUrl: ch.pdfUrl || '',
                                          keyPoints: Array.isArray(ch.keyPoints) ? JSON.parse(JSON.stringify(ch.keyPoints)) : []
                                        });
                                        setIsCreatingNewChapter(false);
                                        playSound('click', soundEnabled);
                                      }}
                                      className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 action-btn-hover"
                                      title="แก้ไขบทเรียน"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {activeChapters.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`ต้องการลบ "${chapterTitle}" ใช่หรือไม่?`)) {
                                            const updated = activeChapters.filter(c => c.id !== chapterId);
                                            setLearningChapters(updated);
                                            playSound('click', soundEnabled);
                                          }
                                        }}
                                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200"
                                        title="ลบบทเรียน"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <h4 className="font-black text-sm text-slate-900 mt-1 truncate">{chapterTitle}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{ch.summary || 'ไม่มีคำอธิบาย'}</p>
                                
                                {/* Direct PDF Link Quick Input */}
                                <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                    <span>📄 ลิงก์ Google Drive PDF:</span>
                                    {ch.pdfUrl && (
                                      <a href={ch.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center space-x-0.5 text-[10px]">
                                        <span>เปิดดู</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="url"
                                      defaultValue={ch.pdfUrl || ''}
                                      key={`admin_pdf_${chapterId}_${ch.pdfUrl || ''}`}
                                      id={`admin_pdf_${chapterId}`}
                                      placeholder="วางลิงก์ Google Drive PDF..."
                                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const el = document.getElementById(`admin_pdf_${chapterId}`);
                                        if (el) {
                                          handleSaveChapterPdfUrl(chapterId, el.value);
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl shrink-0 transition action-btn-hover"
                                      title="บันทึกลิงก์ PDF"
                                    >
                                      บันทึก
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* --- SUBTAB 5: DATABASE (GOOGLE SHEETS) --- */}
                {adminSubTab === 'database' && (
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 border border-blue-100 animate-fadeIn">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                          <Database className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-black text-lg sm:text-xl text-slate-900">
                              เชื่อมต่อฐานข้อมูล Google Sheets (Real-time Cloud Sync)
                            </h3>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold border ${
                              cloudWebhookUrl ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>
                              {cloudWebhookUrl ? '☁️ เชื่อมต่อระบบคลาวด์แล้ว' : '💾 โหมดบันทึกในอุปกรณ์ (Local)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            คะแนนจะส่งตรงเข้าตาราง Google Sheets ของคุณครูแบบเรียลไทม์ทันทีเมื่อจบภารกิจ
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowScriptModal(true);
                            playSound('click', soundEnabled);
                          }}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-3.5 py-2.5 rounded-2xl transition border border-indigo-200 flex items-center space-x-1.5 action-btn-hover"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>📋 ดูโค้ด Apps Script & วิธีติดตั้ง 3 ขั้นตอน</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        Google Apps Script Web App URL (Webhook)
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <input
                          type="url"
                          placeholder="วาง URL เว็บแอป เช่น https://script.google.com/macros/s/.../exec"
                          value={cloudWebhookUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCloudWebhookUrl(val);
                            localStorage.setItem('flowchart_cloud_webhook_url', val);
                            setCloudTestState({ loading: false, success: null, message: '' });
                          }}
                          className="flex-1 w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        />

                        <button
                          type="button"
                          disabled={!cloudWebhookUrl || cloudTestState.loading}
                          onClick={async () => {
                            setCloudTestState({ loading: true, success: null, message: 'กำลังทดสอบการเชื่อมต่อ...' });
                            playSound('click', soundEnabled);
                            const res = await testWebhookConnection(cloudWebhookUrl);
                            setCloudTestState({ loading: false, success: res.success, message: res.message });
                            if (res.success) playSound('success', soundEnabled);
                            else playSound('error', soundEnabled);
                          }}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black px-4 py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center space-x-1.5 action-btn-hover shrink-0"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>{cloudTestState.loading ? 'กำลังเชื่อมต่อ...' : 'ทดสอบการเชื่อมต่อ (Ping Test)'}</span>
                        </button>

                        {studentRecords.length > 0 && cloudWebhookUrl && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`คุณต้องการส่งข้อมูลนักเรียนทั้งหมด ${studentRecords.length} คน ขึ้น Google Sheets ตอนนี้หรือไม่?`)) {
                                let count = 0;
                                for (const rec of studentRecords) {
                                  await syncScoreToDatabase(rec, cloudWebhookUrl);
                                  count++;
                                }
                                playSound('success', soundEnabled);
                                alert(`✅ ซิงก์ข้อมูลนักเรียนทั้งหมด ${count} รายการขึ้น Google Sheets สำเร็จเรียบร้อยแล้วครับ!`);
                              }
                            }}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center space-x-1.5 action-btn-hover shrink-0"
                          >
                            <Cloud className="w-3.5 h-3.5 text-white" />
                            <span>ซิงก์ {studentRecords.length} คนขึ้นชีต</span>
                          </button>
                        )}
                      </div>

                      {cloudTestState.message && (
                        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn ${
                          cloudTestState.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {cloudTestState.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                          <span>{cloudTestState.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- SUBTAB 6: BACKUP & RESTORE --- */}
                {adminSubTab === 'backup' && (
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
                    <div className="pb-4 border-b border-slate-100">
                      <h3 className="font-black text-lg sm:text-xl text-slate-900 flex items-center space-x-2">
                        <span>💾</span>
                        <span>ระบบสำรองข้อมูลและกู้คืน (Backup & Restore Management)</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        ส่งออกข้อมูลทั้งระบบเป็นไฟล์ JSON และกู้คืนข้อมูลได้อย่างปลอดภัย พร้อมระบบป้องกัน 3 ระดับ
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Export Box */}
                      <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200 space-y-3">
                        <div className="font-black text-sm text-blue-950 flex items-center space-x-2">
                          <Download className="w-4 h-4 text-blue-600" />
                          <span>ส่งออกข้อมูลสำรองทั้งระบบ (Full JSON Backup)</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          บันทึกข้อมูลนักเรียน ผลคะแนน บทเรียนที่กำหนดเอง และประวัติกิจกรรมทั้งหมดลงในไฟล์ 1 ไฟล์
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            downloadBackupFile();
                            playSound('success', soundEnabled);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center space-x-1.5 action-btn-hover"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON)</span>
                        </button>
                      </div>

                      {/* Import / Restore Box */}
                      <div className="p-5 rounded-3xl bg-indigo-50/80 border border-indigo-200 space-y-3">
                        <div className="font-black text-sm text-indigo-950 flex items-center space-x-2">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>กู้คืนข้อมูลจากไฟล์สำรอง (Import Backup)</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          เลือกไฟล์ JSON ของ Flowchart Quest เพื่อกู้คืนข้อมูลเข้าสู่ระบบ
                        </p>
                        <label className="inline-flex bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-md items-center space-x-1.5 cursor-pointer action-btn-hover">
                          <Upload className="w-3.5 h-3.5" />
                          <span>เลือกไฟล์ JSON เพื่อกู้คืน</span>
                          <input
                            type="file"
                            accept=".json"
                            ref={restoreFileRef}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                try {
                                  const json = JSON.parse(evt.target.result);
                                  const validation = validateBackupFile(json);
                                  if (!validation.valid) {
                                    alert(`❌ ${validation.message}`);
                                    return;
                                  }
                                  if (window.confirm(`พบข้อมูลสำรอง (นักเรียน: ${validation.summary.studentRecordsCount} คน, ทะเบียน: ${validation.summary.studentRosterCount} คน)\nคุณต้องการกู้คืนข้อมูลเข้าสู่ระบบใช่หรือไม่?`)) {
                                    restoreBackupData(json);
                                    playSound('success', soundEnabled);
                                    alert('✅ กู้คืนข้อมูลสำเร็จเรียบร้อยแล้วครับ!');
                                    window.location.reload();
                                  }
                                } catch (err) {
                                  alert(`เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ${err.message}`);
                                }
                              };
                              reader.readAsText(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Safe Reset Tier Section */}
                    <div className="p-5 rounded-3xl bg-rose-50/80 border border-rose-200 space-y-3">
                      <div className="font-black text-sm text-rose-950 flex items-center space-x-2">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>ระบบล้างข้อมูลแบบปลอดภัย (Safe Multi-Tier Reset)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('ต้องการล้างเฉพาะ Session ผู้เรียนปัจจุบันใช่หรือไม่?')) {
                              resetCurrentStudentSession();
                              playSound('click', soundEnabled);
                              alert('✅ ล้าง Session ผู้เรียนปัจจุบันแล้ว');
                            }
                          }}
                          className="p-3 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl border border-rose-200 font-bold text-left transition"
                        >
                          🧹 1. ล้าง Session ผู้เรียนปัจจุบัน
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('ต้องการล้างผลคะแนนนักเรียนทั้งหมดใช่หรือไม่? (ข้อมูลบทเรียนจะไม่หาย)')) {
                              resetStudentScoreRecords();
                              setStudentRecords([]);
                              playSound('click', soundEnabled);
                              alert('✅ ล้างตารางผลคะแนนเรียบร้อยแล้ว');
                            }
                          }}
                          className="p-3 bg-white hover:bg-rose-100 text-rose-800 rounded-2xl border border-rose-200 font-bold text-left transition"
                        >
                          ⚠️ 2. ล้างตารางคะแนนนักเรียน
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const kw = window.prompt('คำเตือนขั้นสูงสุด: คุณต้องการล้างข้อมูลทั้งหมดในเครื่องเป็นค่าเริ่มต้นโรงงานหรือไม่?\n(ระบบจะดาวน์โหลดไฟล์สำรองข้อมูลให้อัตโนมัติก่อนล้าง)\n\nกรุณาพิมพ์คำว่า "RESET" เพื่อยืนยัน:');
                            if (kw === 'RESET') {
                              try {
                                safeFactoryResetAll('RESET');
                                playSound('error', soundEnabled);
                                alert('✅ สำรองข้อมูลและรีเซ็ตระบบทั้งหมดเป็นค่าโรงงานเรียบร้อยแล้ว');
                                window.location.reload();
                              } catch (err) {
                                alert(`เกิดข้อผิดพลาด: ${err.message}`);
                              }
                            } else if (kw !== null) {
                              alert('คำยืนยันไม่ถูกต้อง ยกเลิกการคืนค่าโรงงาน');
                            }
                          }}
                          className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-left transition shadow-sm"
                        >
                          🚨 3. รีเซ็ตค่าโรงงาน (พิมพ์ "RESET")
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SUBTAB 7: ACTIVITY LOGS --- */}
                {adminSubTab === 'logs' && (
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-black text-lg text-slate-900 flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <span>บันทึกกิจกรรมในระบบ (System Activity & Audit Logs)</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          ติดตามทุกความเคลื่อนไหว: การเข้าสู่ระบบ, การบันทึกคะแนน, การซิงก์คลาวด์ และการจัดการบทเรียน
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('ต้องการล้างประวัติกิจกรรมทั้งหมดใช่หรือไม่?')) {
                            clearAuditLogs();
                            setActivityLogs([]);
                          }
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        ล้างประวัติ
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">วัน-เวลา</th>
                            <th className="p-3">ผู้ใช้งาน</th>
                            <th className="p-3">การกระทำ (Action)</th>
                            <th className="p-3">เป้าหมาย (Target)</th>
                            <th className="p-3 text-center">ผลลัพธ์</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                          {activityLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400">ยังไม่มีบันทึกกิจกรรมใหม่</td>
                            </tr>
                          ) : (
                            activityLogs.slice(0, 50).map(log => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString('th-TH')}</td>
                                <td className="p-3 font-bold text-slate-800">{log.user}</td>
                                <td className="p-3 font-mono text-blue-700 font-bold">{log.action}</td>
                                <td className="p-3 text-slate-600">{log.target}</td>
                                <td className="p-3 text-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                    log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {log.result}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* --- SUBTAB 8: SETTINGS & SECURITY --- */}
                {adminSubTab === 'settings' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Security Warning & Architecture Banner */}
                    <div className="p-5 rounded-3xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 font-black text-amber-900 text-sm">
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                        <span>🟡 ข้อพึงระวังด้านความปลอดภัย (Client-Side Authentication Warning)</span>
                      </div>
                      <p className="text-amber-900 font-medium leading-relaxed">
                        รหัสผ่านแอดมินปัจจุบันทำงานในระดับ Client-Side Protection เหมาะกับเว็บแอปการเรียนรู้ในห้องเรียน (Standalone / Serverless) ข้อมูลถูกจัดเก็บในเครื่องผู้เรียนและ Google Sheets Master Database
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                        <div className="bg-white p-2 rounded-xl border border-amber-200 font-bold text-slate-800">👑 Admin: ทุกสิทธิ์</div>
                        <div className="bg-white p-2 rounded-xl border border-amber-200 font-bold text-slate-800">👩‍🏫 Teacher: รายงาน & สถิติ</div>
                        <div className="bg-white p-2 rounded-xl border border-amber-200 font-bold text-slate-800">🎒 Student: บทเรียน & ภารกิจ</div>
                        <div className="bg-white p-2 rounded-xl border border-amber-200 font-bold text-slate-800">👤 Guest: โหมดทดลองเล่น</div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                      <h4 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-slate-600" />
                        <span>การตั้งค่ารหัสผ่านแอดมิน & รหัสผ่านใหม่</span>
                      </h4>
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={adminPin}
                          onChange={(e) => {
                            setAdminPin(e.target.value);
                            localStorage.setItem('flowchart_admin_pin', e.target.value);
                          }}
                          className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold w-48 shadow-2xs"
                        />
                        <span className="text-xs text-emerald-600 font-bold">บันทึกรหัสผ่านอัตโนมัติ ✅</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- CHAPTER EDITOR / CREATOR MODAL --- */}
                {editingChapter && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                      
                      {/* Modal Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-2xl">{editingChapter.icon || '📖'}</span>
                          <div>
                            <h3 className="font-black text-lg text-slate-900">
                              {isCreatingNewChapter ? '➕ เพิ่มบทเรียนใหม่' : '✏️ แก้ไขเนื้อหาบทเรียน'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                              ปรับแต่งข้อความ สาระสำคัญ และคำอธิบายบทเรียน
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingChapter(null)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4 text-xs">
                        
                        {/* Icon & Title */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-1">
                            <label className="block font-bold text-slate-700 mb-1">ไอคอน (Emoji)</label>
                            <input
                              type="text"
                              value={editingChapter.icon || ''}
                              onChange={(e) => setEditingChapter({ ...editingChapter, icon: e.target.value })}
                              placeholder="เช่น 💡"
                              className="w-full text-center text-xl bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block font-bold text-slate-700 mb-1">ชื่อบทเรียน (Title) *</label>
                            <input
                              type="text"
                              required
                              value={editingChapter.title || ''}
                              onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                              placeholder="เช่น บทที่ 1: ความหมายของ Flowchart"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Subtitle */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">หัวข้อย่อย / สรุปย่อ (Subtitle)</label>
                          <input
                            type="text"
                            value={editingChapter.subtitle || ''}
                            onChange={(e) => setEditingChapter({ ...editingChapter, subtitle: e.target.value })}
                            placeholder="เช่น ทำความเข้าใจจุดเริ่มต้นของการคิดอย่างเป็นระบบ"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Google Drive PDF / Slide Link (Landscape Presentation) */}
                        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block font-bold text-rose-950 text-xs flex items-center space-x-1.5">
                              <span className="text-base">📄</span>
                              <span>ลิงก์ PDF สื่อการสอน / สไลด์จาก Google Drive (สำหรับโหมดแนวนอน)</span>
                            </label>
                            {editingChapter.pdfUrl && (
                              <a
                                href={editingChapter.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-rose-700 font-extrabold hover:underline flex items-center space-x-1"
                              >
                                <span>ทดสอบเปิดลิงก์</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          
                          <input
                            type="url"
                            value={editingChapter.pdfUrl || ''}
                            onChange={(e) => setEditingChapter({ ...editingChapter, pdfUrl: e.target.value })}
                            placeholder="วางลิงก์ Google Drive เช่น https://drive.google.com/file/d/1a2b3c4d.../view?usp=sharing"
                            className="w-full bg-white border border-rose-300 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                          />
                          
                          <div className="text-[11px] text-rose-800 leading-relaxed font-medium space-y-0.5">
                            <div>💡 <strong>วิธีใช้:</strong> นำลิงก์แชร์จาก Google Drive (ตั้งค่าสิทธิ์เป็น <em>"ทุกคนที่มีลิงก์มีสิทธิ์ดู"</em>) มาวางที่นี่</div>
                            <div>✨ ระบบจะแปลงเป็นโหมดดูสไลด์แนวนอน 16:9 ให้นักเรียนเลื่อนอ่านได้ทันที</div>
                          </div>
                        </div>

                        {/* Summary Description */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">เนื้อหาและคำอธิบายโดยละเอียด (Summary)</label>
                          <textarea
                            rows={3}
                            value={editingChapter.summary || ''}
                            onChange={(e) => setEditingChapter({ ...editingChapter, summary: e.target.value })}
                            placeholder="พิมพ์เนื้อหาที่ต้องการให้นักเรียนศึกษา..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Key Points Array Editor */}
                        <div className="space-y-2.5 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700 flex items-center space-x-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>ประเด็นสำคัญและสาระเน้นย้ำ (Key Points)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const pts = editingChapter.keyPoints || [];
                                setEditingChapter({
                                  ...editingChapter,
                                  keyPoints: [...pts, { heading: `หัวข้อที่ ${pts.length + 1}`, content: 'รายละเอียดเนื้อหา' }]
                                });
                              }}
                              className="text-[11px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition flex items-center space-x-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>เพิ่มประเด็น</span>
                            </button>
                          </div>

                          {(editingChapter.keyPoints || []).map((pt, pIdx) => (
                            <div key={pIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={pt.heading || ''}
                                  onChange={(e) => {
                                    const currentPts = editingChapter.keyPoints || [];
                                    const nextPts = [...currentPts];
                                    nextPts[pIdx] = { ...nextPts[pIdx], heading: e.target.value };
                                    setEditingChapter({ ...editingChapter, keyPoints: nextPts });
                                  }}
                                  placeholder="หัวข้อประเด็น"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentPts = editingChapter.keyPoints || [];
                                    const nextPts = currentPts.filter((_, idx) => idx !== pIdx);
                                    setEditingChapter({ ...editingChapter, keyPoints: nextPts });
                                  }}
                                  className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={pt.content || ''}
                                onChange={(e) => {
                                  const currentPts = editingChapter.keyPoints || [];
                                  const nextPts = [...currentPts];
                                  nextPts[pIdx] = { ...nextPts[pIdx], content: e.target.value };
                                  setEditingChapter({ ...editingChapter, keyPoints: nextPts });
                                }}
                                placeholder="คำอธิบายประเด็นนี้"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                              />
                            </div>
                          ))}
                        </div>

                      </div>

                      {/* Modal Footer Buttons */}
                      <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingChapter(null)}
                          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editingChapter.title || !editingChapter.title.trim()) {
                              alert('กรุณากรอกชื่อบทเรียน');
                              return;
                            }

                            const baseChapters = (Array.isArray(learningChapters) && learningChapters.length > 0)
                              ? learningChapters
                              : LEARNING_CHAPTERS;

                            let nextChapters;
                            if (isCreatingNewChapter) {
                              const newCh = {
                                ...editingChapter,
                                id: editingChapter.id || `ch_${Date.now()}`,
                                chapterNum: Number(editingChapter.chapterNum) || (baseChapters.length + 1)
                              };
                              nextChapters = [...baseChapters, newCh];
                            } else {
                              nextChapters = baseChapters.map(c => c.id === editingChapter.id ? editingChapter : c);
                            }

                            setLearningChapters(nextChapters);
                            try {
                              localStorage.setItem('flowchart_learning_chapters', JSON.stringify(nextChapters));
                            } catch (err) {
                              console.error('Failed to save learning chapters:', err);
                            }

                            setEditingChapter(null);
                            setIsCreatingNewChapter(false);
                            playSound('success', soundEnabled);
                            await syncAllToCloudAndGitHub(nextChapters, classrooms);
                            alert(isCreatingNewChapter ? '✅ เพิ่มบทเรียนและซิงก์ขึ้น Google Sheets & GitHub สำเร็จแล้ว!' : '✅ บันทึกบทเรียนและซิงก์ขึ้น Google Sheets & GitHub เรียบร้อยแล้ว!');
                          }}
                          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md flex items-center space-x-1.5 action-btn-hover"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isCreatingNewChapter ? 'เพิ่มบทเรียนใหม่' : 'บันทึกบทเรียน'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* --- CLASSROOM CREATE & EDIT MODAL --- */}
                {editingClassroom && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-8">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                            <Key className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-base text-slate-900">
                              {isCreatingClassroom ? 'เพิ่มห้องเรียนใหม่' : `แก้ไขห้องเรียน: ${editingClassroom.name}`}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              กำหนดรหัส PIN ประจำห้อง และแท็บแยกใน Google Sheets
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setEditingClassroom(null); setIsCreatingClassroom(false); }}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            🔑 รหัส PIN ห้องเรียน (ให้นักเรียนกรอกเข้าระบบ) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="เช่น 601, 605, MEP6 (ตัวเลขหรือตัวอักษร)"
                            value={editingClassroom.code}
                            onChange={(e) => setEditingClassroom({ ...editingClassroom, code: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black text-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-500 uppercase"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">รหัสนี้ใช้ให้นักเรียนกรอกในหน้าแรกเพื่อระบุห้องเรียน</p>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            🏫 ชื่อห้องเรียน <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="เช่น ห้อง ป.6/5 หรือ ห้องคอมพิวเตอร์"
                            value={editingClassroom.name}
                            onChange={(e) => setEditingClassroom({ ...editingClassroom, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            📑 ชื่อแท็บใน Google Sheets (ข้อมูลจะแยกไปแท็บนี้)
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น ป.6_5 (ระบบจะสร้างแท็บนี้ในชีทให้อัตโนมัติ)"
                            value={editingClassroom.sheetTab || ''}
                            onChange={(e) => setEditingClassroom({ ...editingClassroom, sheetTab: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            📝 คำอธิบาย / รายละเอียดเพิ่มเติม
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น นักเรียนห้อง 5 ปีการศึกษา 2567"
                            value={editingClassroom.desc || ''}
                            onChange={(e) => setEditingClassroom({ ...editingClassroom, desc: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => { setEditingClassroom(null); setIsCreatingClassroom(false); }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editingClassroom.code || !editingClassroom.code.trim()) {
                              alert('กรุณากรอกรหัส PIN ห้องเรียน');
                              return;
                            }
                            if (!editingClassroom.name || !editingClassroom.name.trim()) {
                              alert('กรุณากรอกชื่อห้องเรียน');
                              return;
                            }

                            const activeRooms = (Array.isArray(classrooms) && classrooms.length > 0) ? classrooms : DEFAULT_CLASSROOMS;
                            let nextRooms;
                            if (isCreatingClassroom) {
                              const newRoom = {
                                ...editingClassroom,
                                id: editingClassroom.id || `room_${Date.now()}`,
                                code: editingClassroom.code.trim().toUpperCase(),
                                name: editingClassroom.name.trim(),
                                sheetTab: (editingClassroom.sheetTab || editingClassroom.name).replace(/[\/\\?*:[\]]/g, '_').trim()
                              };
                              nextRooms = [...activeRooms, newRoom];
                            } else {
                              nextRooms = activeRooms.map(r => (r.code === editingClassroom.code || r.id === editingClassroom.id) ? {
                                ...editingClassroom,
                                code: editingClassroom.code.trim().toUpperCase(),
                                name: editingClassroom.name.trim(),
                                sheetTab: (editingClassroom.sheetTab || editingClassroom.name).replace(/[\/\\?*:[\]]/g, '_').trim()
                              } : r);
                            }

                            setClassrooms(nextRooms);
                            try {
                              localStorage.setItem('flowchart_classrooms', JSON.stringify(nextRooms));
                            } catch (err) {
                              console.error('Failed to save classrooms:', err);
                            }

                            setEditingClassroom(null);
                            setIsCreatingClassroom(false);
                            playSound('success', soundEnabled);
                            await syncAllToCloudAndGitHub(learningChapters, nextRooms);
                            alert(isCreatingClassroom ? '✅ สร้างห้องเรียนและซิงก์ขึ้น Google Sheets & GitHub สำเร็จแล้ว!' : '✅ บันทึกห้องเรียนและซิงก์ขึ้น Google Sheets & GitHub เรียบร้อยแล้ว!');
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md flex items-center space-x-1.5 action-btn-hover"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isCreatingClassroom ? 'สร้างห้องเรียน' : 'บันทึก'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {showScriptModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">
                      วิธีเชื่อมต่อ Google Sheets รับคะแนนนักเรียน
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      ทำตาม 3 ขั้นตอนง่ายๆ เพื่อเริ่มรับข้อมูลคะแนนเข้าตารางแบบ Real-time
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScriptModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Guide Cards */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-1">
                  <div className="font-bold text-blue-900">1. สร้าง Google Sheet และเปิด Apps Script</div>
                  <p className="text-slate-600">เปิด <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">sheets.new</a> ในแท็บใหม่ ➔ ไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> ➔ <strong>Apps Script</strong></p>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-1">
                  <div className="font-bold text-indigo-900">2. วางโค้ดด้านล่างลงใน Apps Script</div>
                  <p className="text-slate-600">ลบโค้ดเดิมออกทั้งหมด แล้วกดปุ่ม <strong>"คัดลอกโค้ดทั้งหมด"</strong> ด้านล่างนี้ไปวางแทน</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 space-y-1">
                  <div className="font-bold text-emerald-900">3. Deploy เป็น Web App (สำคัญมาก)</div>
                  <p className="text-slate-600">กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> ➔ <strong>การทำให้ใช้งานได้ใหม่</strong> ➔ เลือกประเภท <strong>เว็บแอป (Web app)</strong> ➔ กำหนด <strong>"ผู้มีสิทธิ์เข้าถึง: ทุกคน (Anyone)"</strong> ➔ คัดลอก URL มาวางในเว็บนี้</p>
                </div>

                {/* Code Block with Copy Button */}
                <div className="relative mt-2">
                  <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2 rounded-t-2xl text-[11px] font-mono">
                    <span>Code.gs (Google Apps Script)</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
                        setCopiedScript(true);
                        playSound('success', soundEnabled);
                        setTimeout(() => setCopiedScript(false), 3000);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center space-x-1 transition"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'คัดลอกสำเร็จแล้ว! ✅' : 'คัดลอกโค้ดทั้งหมด'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-b-2xl text-[11px] font-mono overflow-x-auto max-h-56 scrollbar-thin">
                    <code>{GOOGLE_APPS_SCRIPT_TEMPLATE}</code>
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScriptModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md"
                >
                  เข้าใจแล้ว ปิดหน้าต่างนี้
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- FLOATING CLOUD SYNC TOAST NOTIFICATION --- */}
        {cloudSyncToast.show && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400/50 flex items-center space-x-2.5 text-xs font-bold animate-bounce">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cloudSyncToast.message}</span>
          </div>
        )}

        {/* --- GLOBAL STUDENT PROFILE MODAL --- */}
        {selectedStudentForProfile && (
          <StudentProfileModal
            student={selectedStudentForProfile}
            onClose={() => setSelectedStudentForProfile(null)}
          />
        )}

        {/* --- GLOBAL LEARNING EVIDENCE MODAL --- */}
        {selectedStudentForEvidence && (
          <LearningEvidenceModal
            student={selectedStudentForEvidence}
            onClose={() => setSelectedStudentForEvidence(null)}
          />
        )}

        {/* --- GLOBAL STUDENT ROSTER MANAGEMENT MODAL --- */}
        {showRosterModal && (
          <StudentManagementModal
            onClose={() => setShowRosterModal(false)}
            onSelectStudentProfile={(std) => {
              setShowRosterModal(false);
              setSelectedStudentForProfile(std);
            }}
          />
        )}

      </main>

      {/* ================= ULTRA-MODERN FOOTER ================= */}
      <footer className="mt-auto px-4 sm:px-6 pt-6 no-print">
        <div className="max-w-7xl mx-auto glass-panel rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-500 shadow-sm border border-white/80">
          <div className="flex items-center space-x-3">
            <img 
              src={kruKingLogo} 
              alt="ห้องสื่อครูคิง" 
              className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 border border-blue-100 shadow-2xs shrink-0" 
            />
            <div>
              <p className="font-extrabold text-slate-800 text-sm">Flowchart Quest ป.6 • ห้องทดลองผังงานและการแก้ปัญหา</p>
              <p className="text-[11px] text-slate-500">ผลงานและสื่อการสอนคุณภาพจาก <strong>ห้องสื่อครูคิง</strong> • สอดคล้องตามตัวชี้วัด ว 4.2 ป.6/1</p>
            </div>
          </div>
          
          <div className="text-[11px] text-slate-400 font-medium">
            กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี
          </div>
        </div>
      </footer>

    </div>
  );
}

