import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  Play, RotateCcw, CheckCircle2, XCircle, Award, Sparkles, 
  BookOpen, Layers, ArrowRight, ArrowDown, 
  Volume2, VolumeX, ChevronRight, ChevronLeft, Check,
  Zap, Terminal, ShieldAlert, Cpu, Lightbulb, Compass, Code2,
  Tv, Video, Search, ExternalLink, Bookmark, HelpCircle,
  FileText, CornerDownRight, RefreshCw, AlertCircle, Heart,
  Smile, Star, Trophy, Rocket, GraduationCap, CheckCircle,
  Clock, CheckSquare, Plus, Trash2, Edit3, Move, User, Printer,
  Calendar, CheckCheck, Download, Image as ImageIcon, Settings,
  Lock, Unlock, Key, Save, Eye, Film
} from 'lucide-react';

// --- Sound Effects using Web Audio API ---
const playSound = (type, soundEnabled = true) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'drop') {
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } else if (type === 'step') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

// --- YouTube ID Parser Helper ---
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

// --- Standard Flowchart Geometric SVG Renderer ---
const FlowchartShapeSvg = ({ shape, label = '', height = '65px', className = '' }) => {
  switch (shape) {
    case 'terminator':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="termGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <rect x="10" y="8" width="180" height="48" rx="24" ry="24" fill="url(#termGrad)" stroke="#059669" strokeWidth="2.5" />
          <text x="100" y="38" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13" fontFamily="Prompt, sans-serif">
            {label || 'Start / End (เริ่มต้น/จบ)'}
          </text>
        </svg>
      );

    case 'process':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="procGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <rect x="10" y="8" width="180" height="48" rx="4" ry="4" fill="url(#procGrad)" stroke="#1e40af" strokeWidth="2.5" />
          <text x="100" y="38" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13" fontFamily="Prompt, sans-serif">
            {label || 'Process (คำนวณ / ปฏิบัติงาน)'}
          </text>
        </svg>
      );

    case 'inputOutput':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="ioGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <polygon points="35,8 190,8 165,56 10,56" fill="url(#ioGrad)" stroke="#b45309" strokeWidth="2.5" />
          <text x="100" y="38" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13" fontFamily="Prompt, sans-serif">
            {label || 'Data (รับค่า / แสดงผล)'}
          </text>
        </svg>
      );

    case 'decision':
      return (
        <svg viewBox="0 0 200 75" className={`w-full max-h-[85px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="decGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <polygon points="100,6 192,38 100,68 8,38" fill="url(#decGrad)" stroke="#4338ca" strokeWidth="2.5" />
          <text x="100" y="42" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'Decision (เงื่อนไขตัดสินใจ ?)'}
          </text>
        </svg>
      );

    case 'display':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="dispGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <path d="M 40 8 L 175 8 L 192 32 L 175 56 L 40 56 C 12 56 12 8 40 8 Z" fill="url(#dispGrad)" stroke="#0e7490" strokeWidth="2.5" />
          <text x="105" y="38" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'Display (แสดงผลจอภาพ)'}
          </text>
        </svg>
      );

    case 'manualInput':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="manGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <polygon points="12,22 188,8 188,56 12,56" fill="url(#manGrad)" stroke="#0369a1" strokeWidth="2.5" />
          <text x="100" y="40" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'Manual Input (คีย์บอร์ด)'}
          </text>
        </svg>
      );

    case 'document':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
          </defs>
          <path d="M 15 8 L 185 8 L 185 45 C 145 32 115 58 70 46 C 45 40 25 50 15 46 Z" fill="url(#docGrad)" stroke="#115e59" strokeWidth="2.5" />
          <text x="100" y="34" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'Document (พิมพ์เอกสาร)'}
          </text>
        </svg>
      );

    case 'preparation':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="prepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>
          <polygon points="32,32 52,8 148,8 168,32 148,56 52,56" fill="url(#prepGrad)" stroke="#5b21b6" strokeWidth="2.5" />
          <text x="100" y="38" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'Preparation (เตรียมค่า / Loop)'}
          </text>
        </svg>
      );

    case 'connector':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="32" r="24" fill="url(#connGrad)" stroke="#be123c" strokeWidth="2.5" />
          <text x="100" y="38" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="14" fontFamily="Prompt, sans-serif">
            {label || 'A'}
          </text>
        </svg>
      );

    case 'offpageConnector':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="offGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <polygon points="75,8 125,8 125,38 100,56 75,38" fill="url(#offGrad)" stroke="#c2410c" strokeWidth="2.5" />
          <text x="100" y="30" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'หน้า 2'}
          </text>
        </svg>
      );

    case 'flowLine':
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <line x1="25" y1="32" x2="155" y2="32" stroke="#334155" strokeWidth="4" />
          <polygon points="175,32 150,20 150,44" fill="#334155" />
          <text x="90" y="22" textAnchor="middle" fill="#475569" fontWeight="bold" fontSize="12" fontFamily="Prompt, sans-serif">
            ทิศทาง (Flow Line)
          </text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 200 65" className={`w-full max-h-[75px] drop-shadow-md ${className}`}>
          <rect x="10" y="8" width="180" height="48" rx="6" ry="6" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
          <text x="100" y="38" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13" fontFamily="Prompt, sans-serif">
            {label || 'Process'}
          </text>
        </svg>
      );
  }
};

// --- Complete List of 11 Standard Flowchart Symbols ---
const ALL_FLOWCHART_SYMBOLS = [
  {
    id: 'terminator',
    name: 'จุดเริ่มต้นและจุดสิ้นสุด',
    shapeName: 'วงรีขอบมน (Stadium / Oval)',
    shapeType: 'terminator',
    category: 'พื้นฐานสำคัญ',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    icon: '🟢',
    simpleExplain: 'ใช้ระบุจุดเริ่มต้น (Start) และจุดสิ้นสุด (End) ของผังงาน โดยในหนึ่งผังงานต้องมีจุดเริ่มต้น 1 จุดเสมอ',
    example: 'เริ่มต้น (Start), สิ้นสุด (End), จบการทำงาน'
  },
  {
    id: 'process',
    name: 'การประมวลผล / คำนวณ / ปฏิบัติงาน',
    shapeName: 'สี่เหลี่ยมผืนผ้า (Rectangle)',
    shapeType: 'process',
    category: 'การทำงาน',
    badge: 'bg-blue-50 text-blue-700 border-blue-300',
    icon: '🟦',
    simpleExplain: 'ใช้สำหรับการคำนวณสูตรเลข กำหนดค่าตัวแปร หรือการสั่งให้ตัวละคร/หุ่นยนต์ลงมือปฏิบัติงาน',
    example: 'ราคารวม = ราคา × จำนวน, นับรอบ = นับรอบ + 1, เดินหน้า 3 ก้าว'
  },
  {
    id: 'inputOutput',
    name: 'การรับข้อมูล / แสดงผลทั่วไป (Data)',
    shapeName: 'สี่เหลี่ยมด้านขนาน (Parallelogram)',
    shapeType: 'inputOutput',
    category: 'รับและส่งข้อมูล',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: '▱',
    simpleExplain: 'ใช้รับข้อมูลเข้ามาประมวลผล (Input) หรือส่งข้อมูลออกไปแสดงผล (Output) โดยไม่ระบุอุปกรณ์เฉพาะเจาะจง',
    example: 'รับค่าความกว้างและความยาว, รับคะแนนสอบ, แสดงผลลัพธ์พื้นที่'
  },
  {
    id: 'decision',
    name: 'การตัดสินใจ / ตรวจสอบเงื่อนไข',
    shapeName: 'สี่เหลี่ยมข้าวหลามตัด (Diamond)',
    shapeType: 'decision',
    category: 'เงื่อนไขตัดสินใจ',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    icon: '🔶',
    simpleExplain: 'ใช้ตรวจสอบเงื่อนไขเปรียบเทียบ โดยมีเส้นทางออก 2 ทางเสมอ คือ จริง (True/ใช่) หรือ เท็จ (False/ไม่ใช่)',
    example: 'คะแนนสอบ >= 50 ?, อุณหภูมิ > 37.5 องศา ?, ฝนตกหรือไม่ ?'
  },
  {
    id: 'display',
    name: 'แสดงผลออกทางจอภาพ (Display)',
    shapeName: 'รูปทรงจอแสดงผล (Display Output)',
    shapeType: 'display',
    category: 'รับและส่งข้อมูล',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-300',
    icon: '🖥️',
    simpleExplain: 'ใช้ระบุการแสดงข้อความ รูปภาพ หรือคำตอบออกทางหน้าจอคอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟนโดยเฉพาะ',
    example: 'แสดงข้อความ "ยินดีด้วยคุณสอบผ่าน!", แสดงยอดเงินคงเหลือบนจอ'
  },
  {
    id: 'manualInput',
    name: 'การรับข้อมูลผ่านแป้นพิมพ์ (Manual Input)',
    shapeName: 'สี่เหลี่ยมคางหมูด้านบนเอียง (Manual Input)',
    shapeType: 'manualInput',
    category: 'รับและส่งข้อมูล',
    badge: 'bg-sky-50 text-sky-700 border-sky-300',
    icon: '⌨️',
    simpleExplain: 'ใช้ระบุการรับค่าข้อมูลจากการพิมพ์ด้วยมือผ่านแป้นพิมพ์ (Keyboard) ของผู้ใช้งานโดยตรง',
    example: 'กรอกรหัสผ่าน (Password), พิมพ์ชื่อผู้ใช้งาน (Username)'
  },
  {
    id: 'document',
    name: 'พิมพ์เอกสารออกเครื่องพิมพ์ (Document)',
    shapeName: 'เอกสารขอบล่างเป็นคลื่น (Document)',
    shapeType: 'document',
    category: 'รับและส่งข้อมูล',
    badge: 'bg-teal-50 text-teal-700 border-teal-300',
    icon: '📄',
    simpleExplain: 'ใช้ระบุการพิมพ์ข้อมูลออกมาเป็นรายงานหรือเอกสารกระดาษผ่านเครื่องพิมพ์ (Printer)',
    example: 'พิมพ์ใบเสร็จรับเงิน, พิมพ์รายงานเกรดเฉลี่ย'
  },
  {
    id: 'preparation',
    name: 'การเตรียมค่าเริ่มต้น / ลูป (Preparation)',
    shapeName: 'หกเหลี่ยม (Hexagon)',
    shapeType: 'preparation',
    category: 'การทำงาน',
    badge: 'bg-purple-50 text-purple-700 border-purple-300',
    icon: '⬡',
    simpleExplain: 'ใช้กำหนดค่าเริ่มต้นของตัวแปร หรือตั้งค่ารอบการวนซ้ำของโปรแกรม เช่น การตั้งค่ารอบ For Loop',
    example: 'รอบที่ = 1 ถึง 10, กำหนดขนาดข้อมูล = 100'
  },
  {
    id: 'connector',
    name: 'จุดเชื่อมต่อในหน้าเดียวกัน (Connector)',
    shapeName: 'วงกลมเล็ก (Circle)',
    shapeType: 'connector',
    category: 'จุดเชื่อมต่อ',
    badge: 'bg-rose-50 text-rose-700 border-rose-300',
    icon: '⭕',
    simpleExplain: 'ใช้เชื่อมเส้นทางของผังงานในหน้าเดียวกัน เพื่อไม่ให้เส้นลูกศรตัดกันจนดูสับสนและเข้าใจยาก',
    example: 'จุดเชื่อมต่อ A, B หรือ 1, 2'
  },
  {
    id: 'offpageConnector',
    name: 'จุดเชื่อมต่อข้ามหน้า (Off-page Connector)',
    shapeName: 'ห้าเหลี่ยมชี้ลง (Off-page Pentagon)',
    shapeType: 'offpageConnector',
    category: 'จุดเชื่อมต่อ',
    badge: 'bg-orange-50 text-orange-700 border-orange-300',
    icon: '🏷️',
    simpleExplain: 'ใช้เชื่อมผังงานที่มีขนาดยาวและต้องต่อขึ้นหน้ากระดาษใหม่ โดยระบุหมายเลขหน้าที่เชื่อมไป',
    example: 'ไปต่อหน้า 2 (Page 2)'
  },
  {
    id: 'flowLine',
    name: 'เส้นและลูกศรทิศทาง (Flow Line)',
    shapeName: 'เส้นลูกศร (Arrow)',
    shapeType: 'flowLine',
    category: 'พื้นฐานสำคัญ',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: '➡️',
    simpleExplain: 'แสดงลำดับและทิศทางการทำงาน โดยจะไหลจากบนลงล่าง หรือซ้ายไปขวาเสมอ ห้ามลากย้อนโดยไม่มีลูกศร',
    example: 'ทิศทางการไหลจากขั้นตอนที่ 1 ไปขั้นตอนที่ 2'
  }
];

// --- Pool of Flowchart Symbols for Random Drag & Drop Mission 1 ---
const SYMBOL_ITEMS_POOL = [
  {
    id: 'sym_term_start',
    shape: 'terminator',
    shapeName: 'วงรีขอบมน (Oval)',
    symbolText: 'เริ่มต้น (Start)',
    category: 'เริ่มต้น / สิ้นสุด',
    icon: '🟢',
    hint: 'ใช้ระบุจุดเริ่มต้นการทำงานของโปรแกรม'
  },
  {
    id: 'sym_process',
    shape: 'process',
    shapeName: 'สี่เหลี่ยมผืนผ้า (Rectangle)',
    symbolText: 'คำนวณเงินรวม = ราคา × จำนวน',
    category: 'การประมวลผล / คำนวณ',
    icon: '🟦',
    hint: 'ใช้สำหรับการคำนวณตัวเลข หรือการลงมือปฏิบัติงาน'
  },
  {
    id: 'sym_io',
    shape: 'inputOutput',
    shapeName: 'สี่เหลี่ยมด้านขนาน (Parallelogram)',
    symbolText: 'รับค่าคะแนนสอบ (Input Score)',
    category: 'รับเข้า / แสดงผลทั่วไป',
    icon: '▱',
    hint: 'ใช้รับข้อมูลหรือแสดงผลลัพธ์ทั่วไป'
  },
  {
    id: 'sym_decision',
    shape: 'decision',
    shapeName: 'สี่เหลี่ยมข้าวหลามตัด (Diamond)',
    symbolText: 'คะแนนสอบ >= 50 ?',
    category: 'การตัดสินใจ / เงื่อนไข',
    icon: '🔶',
    hint: 'ใช้ตรวจสอบเงื่อนไข มีทางออก จริง หรือ เท็จ'
  },
  {
    id: 'sym_display',
    shape: 'display',
    shapeName: 'รูปทรงจอภาพ (Display)',
    symbolText: 'แสดงผล "ยินดีด้วยคุณผ่านเกณฑ์"',
    category: 'แสดงผลหน้าจอ',
    icon: '🖥️',
    hint: 'ใช้แสดงข้อความหรือผลลัพธ์ออกทางจอภาพ'
  },
  {
    id: 'sym_connector',
    shape: 'connector',
    shapeName: 'วงกลมเล็ก (Circle)',
    symbolText: 'จุดเชื่อมต่อ A',
    category: 'จุดเชื่อมต่อในหน้า',
    icon: '⭕',
    hint: 'ใช้เชื่อมเส้นทางในหน้าเดียวกัน เพื่อไม่ให้เส้นตัดกัน'
  },
  {
    id: 'sym_term_end',
    shape: 'terminator',
    shapeName: 'วงรีขอบมน (Oval)',
    symbolText: 'สิ้นสุด (End)',
    category: 'เริ่มต้น / สิ้นสุด',
    icon: '🔴',
    hint: 'ใช้ระบุจุดสิ้นสุดเมื่อโปรแกรมทำงานเสร็จสิ้น'
  }
];

// --- 10 Questions Flowchart Quiz for Grade 6 ---
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: '1. สัญลักษณ์ใดในผังงาน ใช้แทนจุด "เริ่มต้น" (Start) และ "สิ้นสุด" (End)?',
    shapeType: 'terminator',
    icon: '🟢',
    options: [
      'ก. สี่เหลี่ยมผืนผ้า (Rectangle)',
      'ข. วงรีหรือสี่เหลี่ยมขอบมน (Oval / Terminator)',
      'ค. สี่เหลี่ยมข้าวหลามตัด (Diamond)',
      'ง. วงกลมเล็ก (Circle)'
    ],
    correctAnswer: 1,
    explanation: 'ถูกต้องครับ! สัญลักษณ์วงรีหรือสี่เหลี่ยมขอบมน (Terminator) ใช้แทนจุดเริ่มต้นและสิ้นสุดของผังงานเสมอ'
  },
  {
    id: 2,
    question: '2. สัญลักษณ์ "สี่เหลี่ยมผืนผ้า" (Rectangle / Process) มีหน้าที่ตรงกับข้อใดมากที่สุด?',
    shapeType: 'process',
    icon: '🟦',
    options: [
      'ก. การประมวลผล การคำนวณ หรือการปฏิบัติงาน',
      'ข. การรับข้อมูลผ่านแป้นพิมพ์',
      'ค. การตัดสินใจตรวจสอบเงื่อนไขจริง/เท็จ',
      'ง. การแสดงผลออกทางเครื่องพิมพ์'
    ],
    correctAnswer: 0,
    explanation: 'ถูกต้องครับ! สี่เหลี่ยมผืนผ้า (Process) ใช้สำหรับการคำนวณ เช่น พื้นที่ = กว้าง × ยาว หรือการลงมือปฏิบัติงาน'
  },
  {
    id: 3,
    question: '3. หากต้องการเขียนผังงานเพื่อตรวจสอบว่า "คะแนนสอบ >= 50 หรือไม่" ควรเลือกใช้สัญลักษณ์ใด?',
    shapeType: 'decision',
    icon: '🔶',
    options: [
      'ก. สี่เหลี่ยมด้านขนาน (Parallelogram)',
      'ข. วงรี (Oval)',
      'ค. สี่เหลี่ยมข้าวหลามตัด (Diamond / Decision)',
      'ง. สี่เหลี่ยมผืนผ้า (Rectangle)'
    ],
    correctAnswer: 2,
    explanation: 'ถูกต้องครับ! สี่เหลี่ยมข้าวหลามตัด (Decision) ใช้ตรวจสอบเงื่อนไขที่มีผลลัพธ์เป็น จริง (True) หรือ เท็จ (False)'
  },
  {
    id: 4,
    question: '4. สัญลักษณ์ "สี่เหลี่ยมด้านขนาน" (Parallelogram) ทำหน้าที่อะไรในผังงาน?',
    shapeType: 'inputOutput',
    icon: '▱',
    options: [
      'ก. กำหนดจุดเริ่มต้นของโปรแกรม',
      'ข. การรับข้อมูลเข้า (Input) หรือแสดงผลข้อมูล (Output) ทั่วไป',
      'ค. การวนซ้ำรอบคำสั่ง',
      'ง. จุดเชื่อมต่อของหน้ากระดาษ'
    ],
    correctAnswer: 1,
    explanation: 'ถูกต้องครับ! สี่เหลี่ยมด้านขนานใช้แทนการรับค่า (Input) เช่น รับค่าตัวเลข หรือการแสดงผล (Output)'
  },
  {
    id: 5,
    question: '5. โครงสร้างผังงานที่สั่งให้ทำคำสั่งเดิมซ้ำๆ จนกว่าจะครบตามเงื่อนไข เรียกว่าโครงสร้างแบบใด?',
    shapeType: 'preparation',
    icon: '🔄',
    options: [
      'ก. โครงสร้างแบบเรียงลำดับ (Sequence)',
      'ข. โครงสร้างแบบทางเลือก (Selection)',
      'ค. โครงสร้างแบบวนซ้ำ (Loop / Iteration)',
      'ง. โครงสร้างแบบเชื่อมโยง (Connector)'
    ],
    correctAnswer: 2,
    explanation: 'ถูกต้องครับ! โครงสร้างแบบวนซ้ำ (Loop) จะทำงานเดิมซ้ำๆ เช่น การกระโดดตบ 5 ครั้ง หรือการนับเลข 1 ถึง 100'
  },
  {
    id: 6,
    question: '6. ข้อใดคือ "ทิศทางการไหล" (Flow Line) ของผังงานที่ถูกต้องตามมาตรฐานสากล?',
    shapeType: 'flowLine',
    icon: '➡️',
    options: [
      'ก. ไหลจากล่างขึ้นบนเสมอ',
      'ข. ไหลจากบนลงล่าง หรือจากซ้ายไปขวาอย่างมีระเบียบ',
      'ค. ลากเส้นทแยงมุมตัดกันไปมาได้อิสระ',
      'ง. ไม่จำเป็นต้องมีหัวลูกศรชี้ทิศทาง'
    ],
    correctAnswer: 1,
    explanation: 'ถูกต้องครับ! ทิศทางการทำงานของผังงานต้องเรียงจากบนลงล่าง หรือซ้ายไปขวา และต้องมีหัวลูกศรชี้บอกทิศทางเสมอ'
  },
  {
    id: 7,
    question: '7. "ถ้าอุณหภูมิ > 37.5°C ให้แจ้งว่ามีไข้ ถ้าไม่ใช่ให้เข้าห้องเรียน" สอดคล้องกับโครงสร้างแบบใด?',
    shapeType: 'decision',
    icon: '🩺',
    options: [
      'ก. โครงสร้างแบบทางเลือก / ตัดสินใจ (Selection / If-Else)',
      'ข. โครงสร้างแบบเรียงลำดับ (Sequence)',
      'ค. โครงสร้างแบบวนซ้ำไม่รู้จบ (Infinite Loop)',
      'ง. โครงสร้างแบบไม่มีจุดสิ้นสุด'
    ],
    correctAnswer: 0,
    explanation: 'ถูกต้องครับ! เป็นโครงสร้างแบบทางเลือก (If-Else) ที่มีเงื่อนไขตรวจสอบ ถ้าจริงทำอย่างหนึ่ง ถ้าเท็จทำอีกอย่างหนึ่ง'
  },
  {
    id: 8,
    question: '8. สัญลักษณ์ "วงกลมเล็ก" (Circle / Connector) มีประโยชน์อย่างไรในผังงาน?',
    shapeType: 'connector',
    icon: '⭕',
    options: [
      'ก. ใช้หยุดการทำงานทันที',
      'ข. เป็นจุดเชื่อมต่อเส้นทางในหน้าเดียวกัน เพื่อไม่ให้เส้นลูกศรตัดกันสับสน',
      'ค. ใช้แทนปุ่มเปิด-ปิดคอมพิวเตอร์',
      'ง. ใช้แทนการบันทึกไฟล์ลงเครื่อง'
    ],
    correctAnswer: 1,
    explanation: 'ถูกต้องครับ! จุดเชื่อมต่อ (Connector) ช่วยรวมเส้นทางที่มาจากหลายทิศทางเข้าด้วยกัน เพื่อความเรียบร้อย'
  },
  {
    id: 9,
    question: '9. ขั้นตอนการคำนวณ "ราคารวม = ราคาขนม × จำนวนชิ้น" ควรเขียนอยู่ในสัญลักษณ์รูปทรงใด?',
    shapeType: 'process',
    icon: '🍰',
    options: [
      'ก. วงรี (Terminator)',
      'ข. สี่เหลี่ยมผืนผ้า (Process)',
      'ค. วงกลม (Connector)',
      'ง. สี่เหลี่ยมข้าวหลามตัด (Decision)'
    ],
    correctAnswer: 1,
    explanation: 'ถูกต้องครับ! การคำนวณทางคณิตศาสตร์ต้องเขียนในสัญลักษณ์สี่เหลี่ยมผืนผ้า (Process) เสมอ'
  },
  {
    id: 10,
    question: '10. ข้อใด "ไม่ใช่" หลักการเขียนผังงานที่ดีและถูกต้อง?',
    shapeType: 'terminator',
    icon: '⭐',
    options: [
      'ก. มีจุดเริ่มต้น 1 จุด และมีจุดสิ้นสุดชัดเจน',
      'ข. ข้อความในสัญลักษณ์กระชับ ได้ใจความ และเข้าใจง่าย',
      'ค. ลากเส้นลูกศรตัดกันไปมาได้โดยไม่ต้องใช้จุดเชื่อมต่อ',
      'ง. ใช้รูปทรงสัญลักษณ์มาตรฐาน ANSI/ISO ให้ตรงกับหน้าที่'
    ],
    correctAnswer: 2,
    explanation: 'ถูกต้องครับ! การลากเส้นตัดกันไปมาจะทำให้ผังงานสับสน หากจำเป็นต้องตัดกันควรใช้สัญลักษณ์จุดเชื่อมต่อ (Connector)'
  }
];

// --- Default Initial YouTube Lessons ---
const DEFAULT_VIDEO_LESSONS = [
  {
    id: 'p6_lesson1',
    title: 'บทเรียนที่ 1: การเขียนผังงาน (Flowchart) วิทยาการคำนวณ ป.6',
    creator: 'ครูนก วิทยาการคำนวณ ป.6',
    duration: '14:30 นาที',
    youtubeId: 'S20m_Yf8tW0',
    description: 'เรียนรู้เรื่องการแก้ปัญหาอย่างเป็นขั้นตอนด้วยผังงาน การจดจำสัญลักษณ์สำคัญในชีวิตประจำวันสำหรับเด็ก ป.6',
    keyPoints: [
      'ผังงานคืออะไร? ทำไมโปรแกรมเมอร์ต้องวาดผังงานก่อนเขียนโค้ด',
      'สัญลักษณ์ที่ ป.6 ต้องรู้: เริ่มต้น/จบ, สี่เหลี่ยมคำนวณ, สี่เหลี่ยมด้านขนานรับค่า, ข้าวหลามตัดตัดสินใจ',
      'ตัวอย่างขั้นตอนในชีวิตประจำวัน เช่น การแต่งตัวไปโรงเรียน และการซักผ้า'
    ]
  },
  {
    id: 'p6_lesson2',
    title: 'บทเรียนที่ 2: ผังงานแบบมีเงื่อนไขและวนซ้ำ (If-Else & Loop) ป.6',
    creator: 'สื่อการสอน สสวท. ประถมศึกษา',
    duration: '16:50 นาที',
    youtubeId: 'bV1t7Z9cR8Y',
    description: 'อธิบายการเขียนผังงานแบบมีทางเลือก (จริง/เท็จ) และการวนซ้ำอย่างเข้าใจง่าย พร้อมการทดลองลากบล็อก',
    keyPoints: [
      'โครงสร้าง 3 แบบ: แบบเรียงลำดับ, แบบทางเลือก, และแบบวนซ้ำ',
      'การใช้สัญลักษณ์ข้าวหลามตัด (Decision) ในการตัดเกรด หรือเช็กฝนตก',
      'เทคนิคการเขียนลูกศรวนลูปให้ถูกต้อง ไม่สับสน'
    ]
  },
  {
    id: 'p6_lesson3',
    title: 'บทเรียนที่ 3: ตะลุยโจทย์ผังงานและเตรียมสอบ O-NET วิทยาการคำนวณ',
    creator: 'Kru Kid Coding Academy',
    duration: '19:20 นาที',
    youtubeId: 'dGcx9yR8qj4',
    description: 'ฝึกทำโจทย์แบบฝึกหัดจริง วิเคราะห์สถานการณ์ในโรงเรียน และการตรวจหาข้อผิดพลาด (Debugging)',
    keyPoints: [
      'แนวข้อสอบผังงานวิทยาการคำนวณ ป.6 ยอดฮิต',
      'การหาข้อผิดพลาดเมื่อผังงานเรียงขั้นตอนสลับกัน',
      'เคล็ดลับการจำสัญลักษณ์ผังงานแม่นยำ 100%'
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('game');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game state
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);

  // Drag & drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragTargets, setDragTargets] = useState([]);
  const [dragAvailablePool, setDragAvailablePool] = useState([]);
  const [dragPlacedAnswers, setDragPlacedAnswers] = useState({});
  const [dragResult, setDragResult] = useState(null);

  // Puzzle missions state
  const [placedSlots, setPlacedSlots] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [puzzleResult, setPuzzleResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simLogs, setSimLogs] = useState([]);

  // Quiz mode state
  const [studentInfo, setStudentInfo] = useState({ name: '', room: 'ป.6/1', number: '' });
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizPageIdx, setQuizPageIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600);
  const [timeUsedSeconds, setTimeUsedSeconds] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const timerRef = useRef(null);
  const certificateRef = useRef(null);

  // Completed Missions Record
  const [completedMissions, setCompletedMissions] = useState({});

  // Sandbox Studio State
  const [sandboxNodes, setSandboxNodes] = useState([
    { id: 'sb_1', shape: 'terminator', text: 'เริ่มต้น (Start)' },
    { id: 'sb_2', shape: 'inputOutput', text: 'รับค่าตัวเลข X' },
    { id: 'sb_3', shape: 'process', text: 'คำนวณ Y = X + 10' },
    { id: 'sb_4', shape: 'display', text: 'แสดงผลลัพธ์ Y' },
    { id: 'sb_5', shape: 'terminator', text: 'สิ้นสุด (End)' }
  ]);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState([]);

  // Guide Tab Filter
  const [symbolFilter, setSymbolFilter] = useState('ทั้งหมด');

  // ================= ADMIN BACKEND FOR VIDEO MEDIA =================
  // Persistent video lessons stored in localStorage
  const [videoLessons, setVideoLessons] = useState(() => {
    try {
      const saved = localStorage.getItem('flowchart_video_lessons');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_VIDEO_LESSONS;
  });

  const [selectedVideo, setSelectedVideo] = useState(videoLessons[0] || DEFAULT_VIDEO_LESSONS[0]);
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customVideoId, setCustomVideoId] = useState(null);

  // Admin Management State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  // Video Add / Edit Form State
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    creator: 'คุณครูผู้สอน',
    duration: '10:00 นาที',
    youtubeUrl: '',
    description: '',
    keyPoint1: '',
    keyPoint2: '',
    keyPoint3: ''
  });

  // Save videoLessons to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('flowchart_video_lessons', JSON.stringify(videoLessons));
    } catch (e) {
      console.error("LocalStorage save error:", e);
    }
  }, [videoLessons]);

  useEffect(() => {
    initLevel(currentMissionIdx);
  }, [currentMissionIdx]);

  // Quiz Countdown Timer Effect
  useEffect(() => {
    if (quizStarted && !quizSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz(true);
            return 0;
          }
          return prev - 1;
        });
        setTimeUsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [quizStarted, quizSubmitted]);

  const initLevel = (idx) => {
    if (idx === 0) {
      const shuffledPool = [...SYMBOL_ITEMS_POOL].sort(() => Math.random() - 0.5);
      const selected = shuffledPool.slice(0, 4);
      
      const targets = selected.map((item, i) => ({
        slotId: `slot_${i}`,
        correctItemId: item.id,
        category: item.category,
        shapeName: item.shapeName,
        shapeType: item.shape,
        hint: item.hint
      }));

      const poolShuffled = [...selected].sort(() => Math.random() - 0.5);

      setDragTargets(targets);
      setDragAvailablePool(poolShuffled);
      setDragPlacedAnswers({});
      setDragResult(null);
    } else if (idx === 1) {
      initPuzzleLevel([
        { id: 'm1_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
        { id: 'm1_step1', text: 'เทนมสดรสจืดลงในแก้ว', shape: 'process' },
        { id: 'm1_step2', text: 'ตักน้ำตาล 1 ช้อนและคนให้ละลาย', shape: 'process' },
        { id: 'm1_step3', text: 'ใส่น้ำแข็งก้อนลงไปให้เต็มแก้ว', shape: 'process' },
        { id: 'm1_step4', text: 'แสดงผล "นมสดเย็นพร้อมเสิร์ฟ"', shape: 'display' },
        { id: 'm1_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
      ]);
    } else if (idx === 2) {
      initPuzzleLevel([
        { id: 'm2_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
        { id: 'm2_input', text: 'รับค่า ราคาขนม (Price), จำนวนชิ้น (Qty)', shape: 'inputOutput' },
        { id: 'm2_calc', text: 'คำนวณ ราคารวม = Price × Qty', shape: 'process' },
        { id: 'm2_display', text: 'แสดงผลลัพธ์ ยอดเงินที่ต้องจ่าย', shape: 'display' },
        { id: 'm2_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
      ]);
    } else if (idx === 3) {
      initPuzzleLevel([
        { id: 'm3_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
        { id: 'm3_input', text: 'สแกนวัดอุณหภูมิร่างกาย (Temp)', shape: 'inputOutput' },
        { id: 'm3_decision', text: 'ตรวจสอบเงื่อนไข Temp > 37.5 °C ?', shape: 'decision' },
        { id: 'm3_output', text: 'แสดงผล "เข้าห้องเรียนได้" หรือ "พบครูพยาบาล"', shape: 'display' },
        { id: 'm3_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
      ]);
    } else if (idx === 4) {
      setQuizStarted(false);
      setQuizSubmitted(false);
      setQuizPageIdx(0);
      setQuizAnswers({});
      setTimeLeftSeconds(600);
      setTimeUsedSeconds(0);
    }
  };

  const initPuzzleLevel = (blocks) => {
    const shuffled = [...blocks].sort(() => Math.random() - 0.5);
    setAvailableBlocks(shuffled);
    setPlacedSlots([]);
    setPuzzleResult(null);
    setIsSimulating(false);
    setSimStep(0);
    setSimLogs([]);
  };

  // Drag & drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDropOnSlot = (e, slotId) => {
    e.preventDefault();
    if (!draggedItem) return;
    playSound('drop', soundEnabled);

    const existing = dragPlacedAnswers[slotId];
    let newPool = dragAvailablePool.filter(it => it.id !== draggedItem.id);
    if (existing) {
      newPool.push(existing);
    }

    setDragPlacedAnswers(prev => ({ ...prev, [slotId]: draggedItem }));
    setDragAvailablePool(newPool);
    setDraggedItem(null);
    setDragResult(null);
  };

  const handleRemoveFromSlot = (slotId) => {
    const item = dragPlacedAnswers[slotId];
    if (!item) return;
    playSound('click', soundEnabled);
    const newAnswers = { ...dragPlacedAnswers };
    delete newAnswers[slotId];
    setDragPlacedAnswers(newAnswers);
    setDragAvailablePool(prev => [...prev, item]);
    setDragResult(null);
  };

  const handleQuickPlace = (item) => {
    const emptySlot = dragTargets.find(t => !dragPlacedAnswers[t.slotId]);
    if (!emptySlot) return;
    playSound('drop', soundEnabled);
    setDragPlacedAnswers(prev => ({ ...prev, [emptySlot.slotId]: item }));
    setDragAvailablePool(prev => prev.filter(it => it.id !== item.id));
    setDragResult(null);
  };

  const handleVerifyDragDrop = () => {
    const filledCount = Object.keys(dragPlacedAnswers).length;
    if (filledCount < dragTargets.length) {
      playSound('error', soundEnabled);
      setDragResult({
        success: false,
        message: `น้องๆ ยังวางไม่ครบทุกช่องนะจ๊ะ (วางไปแล้ว ${filledCount}/${dragTargets.length} ช่อง) ลากวางให้ครบก่อนนะ!`
      });
      return;
    }

    let allCorrect = true;
    dragTargets.forEach(target => {
      const placed = dragPlacedAnswers[target.slotId];
      if (!placed || placed.id !== target.correctItemId) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      playSound('success', soundEnabled);
      setDragResult({
        success: true,
        message: '🎉 ยอดเยี่ยมมากครับ! ลากสัญลักษณ์ Flowchart มาจับคู่กับหน้าที่ได้ถูกต้อง 100% เต็ม!'
      });
      setCompletedMissions(prev => ({ ...prev, 0: true }));
    } else {
      playSound('error', soundEnabled);
      setDragResult({
        success: false,
        message: '❌ ยังมีสัญลักษณ์ที่วางสลับที่กันอยู่ ลองตรวจดูรูปทรงและหน้าที่ แล้วจัดวางใหม่อีกรอบนะครับ'
      });
    }
  };

  const handleVerifyPuzzle = () => {
    if (placedSlots.length === 0) {
      playSound('error', soundEnabled);
      setPuzzleResult({
        success: false,
        message: 'กรุณาเลือกวางบล็อกผังงานก่อนทดสอบครับ'
      });
      return;
    }

    const currentIds = placedSlots.map(b => b.id);
    let correctIds = [];
    if (currentMissionIdx === 1) correctIds = ['m1_start', 'm1_step1', 'm1_step2', 'm1_step3', 'm1_step4', 'm1_end'];
    if (currentMissionIdx === 2) correctIds = ['m2_start', 'm2_input', 'm2_calc', 'm2_display', 'm2_end'];
    if (currentMissionIdx === 3) correctIds = ['m3_start', 'm3_input', 'm3_decision', 'm3_output', 'm3_end'];

    const isMatch = currentIds.length === correctIds.length && 
                    currentIds.every((id, idx) => id === correctIds[idx]);

    if (isMatch) {
      playSound('success', soundEnabled);
      setPuzzleResult({
        success: true,
        message: `🌟 ถูกต้องสมบูรณ์แบบ! เรียงผังงานได้ถูกต้องตามหลักการวิชาวิทยาการคำนวณ ป.6`
      });
      setCompletedMissions(prev => ({ ...prev, [currentMissionIdx]: true }));
      setIsSimulating(true);
      setSimStep(0);
      let st = 0;
      const interval = setInterval(() => {
        if (st < placedSlots.length) {
          setSimStep(st);
          setSimLogs(prev => [...prev, `✅ ขั้นตอนที่ ${st + 1}: ${placedSlots[st].text}`]);
          playSound('step', soundEnabled);
          st++;
        } else {
          clearInterval(interval);
          setIsSimulating(false);
        }
      }, 1000);
    } else {
      playSound('error', soundEnabled);
      setPuzzleResult({
        success: false,
        message: '❌ ลำดับขั้นตอนยังไม่ถูกต้อง ลองตรวจดูจุดเริ่มต้น สิ้นสุด และการคำนวณใหม่อีกครั้งครับ'
      });
    }
  };

  // Quiz Handlers
  const handleStartQuiz = (e) => {
    e.preventDefault();
    if (!studentInfo.name.trim()) {
      playSound('error', soundEnabled);
      alert('กรุณากรอกชื่อ-นามสกุลของนักเรียนก่อนเริ่มทำแบบทดสอบครับ 😊');
      return;
    }
    playSound('success', soundEnabled);
    setQuizStarted(true);
    setQuizSubmitted(false);
    setQuizPageIdx(0);
    setTimeLeftSeconds(600);
    setTimeUsedSeconds(0);
  };

  const handleSelectQuizOption = (qId, optionIdx) => {
    if (quizSubmitted) return;
    playSound('click', soundEnabled);
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = (isAuto = false) => {
    if (!isAuto && Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
      const confirmSubmit = window.confirm(`น้องๆ ตอบไปแล้ว ${Object.keys(quizAnswers).length}/10 ข้อ ยังมีข้อที่ยังไม่ได้ตอบ ต้องการส่งคำตอบเลยหรือไม่?`);
      if (!confirmSubmit) return;
    }

    clearInterval(timerRef.current);
    playSound('success', soundEnabled);
    setQuizSubmitted(true);
    setCompletedMissions(prev => ({ ...prev, 4: true }));
  };

  const calculateQuizScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) score += 1;
    });
    return score;
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // PNG Download & PNG Print
  const handleDownloadPNG = async () => {
    if (!certificateRef.current) return;
    playSound('click', soundEnabled);
    setIsExporting(true);

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const cleanName = studentInfo.name ? studentInfo.name.trim().replace(/[\s\/\\]+/g, '_') : 'นักเรียน';
      const link = document.createElement('a');
      link.download = `ใบประกาศผลการสอบ_วิทยาการคำนวณ_ป6_${cleanName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      playSound('success', soundEnabled);
    } catch (err) {
      console.error("PNG download error:", err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintCertificate = async () => {
    if (!certificateRef.current) return;
    playSound('click', soundEnabled);
    setIsExporting(true);

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const printWin = window.open('', '_blank');

      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>ใบประกาศผลการสอบ ป.6 - ${studentInfo.name || 'นักเรียน'}</title>
              <style>
                @page { size: landscape; margin: 10mm; }
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  background-color: #ffffff;
                }
                img {
                  max-width: 98%;
                  max-height: 95vh;
                  height: auto;
                  object-fit: contain;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                  border-radius: 8px;
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.focus(); window.print(); window.close();" />
            </body>
          </html>
        `);
        printWin.document.close();
      } else {
        window.print();
      }
    } catch (e) {
      console.error("Print error:", e);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // ================= ADMIN BACKEND VIDEO ACTIONS =================
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPinInput === 'admin1234' || adminPinInput === '1234' || adminPinInput === 'admin') {
      playSound('success', soundEnabled);
      setIsAdminUnlocked(true);
      setShowAdminModal(false);
      setAdminPinInput('');
      setAdminPinError('');
    } else {
      playSound('error', soundEnabled);
      setAdminPinError('รหัสผ่านไม่ถูกต้อง (รหัสมาตรฐาน: admin1234)');
    }
  };

  const handleOpenAddVideo = () => {
    playSound('click', soundEnabled);
    setEditingVideoId(null);
    setVideoForm({
      title: '',
      creator: 'คุณครูผู้สอน',
      duration: '10:00 นาที',
      youtubeUrl: '',
      description: '',
      keyPoint1: '',
      keyPoint2: '',
      keyPoint3: ''
    });
  };

  const handleOpenEditVideo = (video) => {
    playSound('click', soundEnabled);
    setEditingVideoId(video.id);
    setVideoForm({
      title: video.title,
      creator: video.creator,
      duration: video.duration,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
      description: video.description,
      keyPoint1: video.keyPoints?.[0] || '',
      keyPoint2: video.keyPoints?.[1] || '',
      keyPoint3: video.keyPoints?.[2] || ''
    });
  };

  const handleSaveVideo = (e) => {
    e.preventDefault();
    if (!videoForm.title.trim() || !videoForm.youtubeUrl.trim()) {
      playSound('error', soundEnabled);
      alert('กรุณากรอกชื่อบทเรียนและลิงก์ YouTube ครับ');
      return;
    }

    const yId = extractYoutubeId(videoForm.youtubeUrl);
    if (!yId) {
      playSound('error', soundEnabled);
      alert('รูปแบบลิงก์ YouTube ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้งครับ');
      return;
    }

    const keyPoints = [videoForm.keyPoint1, videoForm.keyPoint2, videoForm.keyPoint3].filter(p => p && p.trim().length > 0);

    playSound('success', soundEnabled);

    if (editingVideoId) {
      // Update existing
      setVideoLessons(prev => prev.map(v => {
        if (v.id === editingVideoId) {
          const updated = {
            ...v,
            title: videoForm.title,
            creator: videoForm.creator || 'คุณครูผู้สอน',
            duration: videoForm.duration || '10:00 นาที',
            youtubeId: yId,
            description: videoForm.description,
            keyPoints: keyPoints.length > 0 ? keyPoints : ['ดูการสอนแบบเรียลไทม์ในห้องเรียน']
          };
          if (selectedVideo.id === v.id) setSelectedVideo(updated);
          return updated;
        }
        return v;
      }));
      setEditingVideoId(null);
    } else {
      // Add new video
      const newVideo = {
        id: `custom_vid_${Date.now()}`,
        title: videoForm.title,
        creator: videoForm.creator || 'คุณครูผู้สอน',
        duration: videoForm.duration || '10:00 นาที',
        youtubeId: yId,
        description: videoForm.description || 'บทเรียนวิดีโอเสริมการเรียนรู้',
        keyPoints: keyPoints.length > 0 ? keyPoints : ['ดูการสอนแบบเรียลไทม์ในห้องเรียน']
      };
      setVideoLessons(prev => [newVideo, ...prev]);
      setSelectedVideo(newVideo);
      setCustomVideoId(null);
    }

    // Reset Form
    setVideoForm({
      title: '',
      creator: 'คุณครูผู้สอน',
      duration: '10:00 นาที',
      youtubeUrl: '',
      description: '',
      keyPoint1: '',
      keyPoint2: '',
      keyPoint3: ''
    });
  };

  const handleDeleteVideo = (id) => {
    if (videoLessons.length <= 1) {
      alert('ต้องมีวิดีโออย่างน้อย 1 รายการในระบบครับ');
      return;
    }
    const confirmDel = window.confirm('คุณต้องการลบวิดีโอนี้ออกจากสื่อการสอนใช่หรือไม่?');
    if (!confirmDel) return;

    playSound('click', soundEnabled);
    const updated = videoLessons.filter(v => v.id !== id);
    setVideoLessons(updated);
    if (selectedVideo.id === id) {
      setSelectedVideo(updated[0]);
    }
  };

  const handleResetDefaultVideos = () => {
    const confirmReset = window.confirm('ต้องการคืนค่าวิดีโอทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่?');
    if (!confirmReset) return;
    playSound('click', soundEnabled);
    setVideoLessons(DEFAULT_VIDEO_LESSONS);
    setSelectedVideo(DEFAULT_VIDEO_LESSONS[0]);
  };

  // Sandbox Studio
  const handleRunSandbox = () => {
    playSound('click', soundEnabled);
    setSandboxRunning(true);
    setSandboxLogs(['🚀 เริ่มต้นประมวลผลผังงานในห้องทดลอง...']);
    let step = 0;
    const intv = setInterval(() => {
      if (step < sandboxNodes.length) {
        const node = sandboxNodes[step];
        setSandboxLogs(prev => [...prev, `▶️ [${node.shape.toUpperCase()}] : ${node.text}`]);
        playSound('step', soundEnabled);
        step++;
      } else {
        clearInterval(intv);
        setSandboxLogs(prev => [...prev, '🏁 ประมวลผลผังงานเสร็จสมบูรณ์ 100%!']);
        setSandboxRunning(false);
        playSound('success', soundEnabled);
      }
    }, 900);
  };

  const handleAddSandboxNode = (shape) => {
    playSound('click', soundEnabled);
    const names = {
      terminator: 'สิ้นสุด (End)',
      process: 'คำนวณค่าตัวแปร',
      inputOutput: 'รับข้อมูลเข้า (Input)',
      decision: 'ตรวจสอบเงื่อนไข ?',
      display: 'แสดงผลหน้าจอ'
    };
    const newNode = {
      id: `sb_${Date.now()}`,
      shape,
      text: names[shape] || 'บล็อกคำสั่ง'
    };
    setSandboxNodes(prev => [...prev, newNode]);
  };

  const handleRemoveSandboxNode = (id) => {
    playSound('click', soundEnabled);
    setSandboxNodes(prev => prev.filter(n => n.id !== id));
  };

  const handleLoadCustomUrl = (e) => {
    e.preventDefault();
    if (!customYoutubeUrl.trim()) return;
    const yId = extractYoutubeId(customYoutubeUrl);
    if (!yId) {
      alert('ลิงก์ YouTube ไม่ถูกต้องครับ');
      return;
    }

    setCustomVideoId(yId);
    setSelectedVideo({
      id: 'custom_live',
      title: 'วิดีโอที่กำลังเล่น (Custom YouTube Stream)',
      creator: 'YouTube Embed',
      duration: 'กำหนดเอง',
      youtubeId: yId,
      description: 'กำลังเล่นวิดีโอการเรียนรู้จากลิงก์ที่คุณระบุในระบบ',
      keyPoints: ['ดูวิดีโอการสอนแบบเรียลไทม์ได้โดยตรงในหน้านี้']
    });
  };

  const activeVideoId = customVideoId || selectedVideo?.youtubeId || 'S20m_Yf8tW0';

  const filteredSymbols = symbolFilter === 'ทั้งหมด' 
    ? ALL_FLOWCHART_SYMBOLS 
    : ALL_FLOWCHART_SYMBOLS.filter(s => s.category === symbolFilter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-white to-sky-50 text-slate-800 font-['Prompt',sans-serif] antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* --- Top Header --- */}
      <header className="border-b border-blue-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-bounce-small">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent tracking-tight">
                  Flowchart Lab ป.6
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                  วิทยาการคำนวณ
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">ระบบแอดมินอัปเดตสื่อ YouTube • ดาวน์โหลด PNG • ข้อสอบ 10 ข้อ</p>
            </div>
          </div>

          {/* Navigation Tabs & Admin Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'game' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>เกม & ข้อสอบ 10 ข้อ</span>
                {Object.keys(completedMissions).length > 0 && (
                  <span className="ml-1 text-xs bg-amber-400 text-slate-900 font-black px-1.5 py-0.2 rounded-full">
                    {Object.keys(completedMissions).length}/5 ★
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('sandbox'); playSound('click', soundEnabled); }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'sandbox' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Code2 className="w-4 h-4 text-sky-300" />
                <span>ห้องทดลองผังงาน</span>
              </button>

              <button
                onClick={() => { setActiveTab('guide'); playSound('click', soundEnabled); }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'guide' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>คู่มือสัญลักษณ์</span>
              </button>

              <button
                onClick={() => { setActiveTab('video'); playSound('click', soundEnabled); }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'video' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Tv className="w-4 h-4 text-rose-500" />
                <span>สื่อการสอน (YouTube)</span>
              </button>
            </nav>

            {/* Admin Backend Unlock Button */}
            <button
              onClick={() => {
                if (isAdminUnlocked) {
                  setIsAdminUnlocked(false);
                  playSound('click', soundEnabled);
                } else {
                  setShowAdminModal(true);
                  playSound('click', soundEnabled);
                }
              }}
              title={isAdminUnlocked ? 'โหมดคุณครู/แอดมิน (คลิกเพื่อออกจากระบบ)' : 'เข้าสู่ระบบแอดมินจัดการสื่อ'}
              className={`p-2.5 rounded-2xl border shadow-sm transition flex items-center space-x-1.5 text-xs font-bold ${
                isAdminUnlocked 
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600'
              }`}
            >
              {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="hidden md:inline">{isAdminUnlocked ? 'แอดมินออนไลน์' : 'แอดมิน'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm transition"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* --- Admin Unlock PIN Modal --- */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-2xl mb-3 border border-amber-200">
              🔑
            </div>
            <h3 className="text-xl font-black text-slate-900">เข้าสู่ระบบแอดมินหลังบ้าน</h3>
            <p className="text-xs text-slate-500 mt-1">
              สำหรับคุณครูเพื่อเพิ่ม แก้ไข และจัดการสื่อการสอน YouTube
            </p>

            <form onSubmit={handleAdminLogin} className="mt-5 space-y-3">
              <input
                type="password"
                placeholder="กรอกรหัสผ่าน (admin1234)"
                value={adminPinInput}
                onChange={(e) => { setAdminPinInput(e.target.value); setAdminPinError(''); }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              {adminPinError && (
                <p className="text-xs text-rose-600 font-bold">{adminPinError}</p>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdminModal(false); setAdminPinError(''); }}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow transition"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* ================= TAB 1: GAME MISSIONS & QUIZ ================= */}
        {activeTab === 'game' && (
          <div className="space-y-6">
            
            <div className="bg-white border border-blue-100 rounded-3xl p-5 shadow-sm shadow-blue-500/5 no-print">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-blue-600 font-bold mb-0.5 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>ภารกิจท้าทายวิทยาการคำนวณ ป.6</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                    {currentMissionIdx === 0 && 'ด่าน 1: 🧩 แดรกแอนด์ดร็อป (Drag & Drop) สัญลักษณ์ Flowchart'}
                    {currentMissionIdx === 1 && 'ด่าน 2: 🥛 หุ่นยนต์ชงนมสดหวานมัน (โครงสร้างเรียงลำดับ)'}
                    {currentMissionIdx === 2 && 'ด่าน 3: 🍰 คิดเงินร้านขนมสหกรณ์ (การรับค่า & คำนวณ)'}
                    {currentMissionIdx === 3 && 'ด่าน 4: 🩺 เครื่องคัดกรองวัดไข้หน้าโรงเรียน (โครงสร้าง If-Else)'}
                    {currentMissionIdx === 4 && 'ด่าน 5: 🏆 แบบทดสอบวัดผลสัมฤทธิ์ วิทยาการคำนวณ ป.6 (10 ข้อ)'}
                  </h2>
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
                  {['ด่าน 1 (Drag & Drop)', 'ด่าน 2 (ชงนม)', 'ด่าน 3 (คิดเงิน)', 'ด่าน 4 (วัดไข้)', 'ด่าน 5 (ข้อสอบ 10 ข้อ)'].map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentMissionIdx(idx); playSound('click', soundEnabled); }}
                      className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all border shrink-0 flex items-center space-x-1.5 ${
                        currentMissionIdx === idx
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30'
                          : completedMissions[idx]
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{name}</span>
                      {completedMissions[idx] && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LEVEL 1: DRAG & DROP SYMBOL MATCHING */}
            {currentMissionIdx === 0 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white rounded-3xl p-6 shadow-lg shadow-blue-600/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/20 font-bold border border-white/30">
                        🎲 โหมดสุ่มโจทย์อัตโนมัติ (Random Generator)
                      </span>
                      <h3 className="text-xl font-black mt-2">
                        ลากบล็อกสัญลักษณ์ Flowchart รูปทรงที่ถูกต้องมาวางลงในช่องเป้าหมาย!
                      </h3>
                      <p className="text-xs text-blue-100 mt-1">
                        👉 วิธีเล่น: ลากบล็อกสัญลักษณ์จากฝั่งขวามาปล่อย (Drop) ลงในช่องคำถามฝั่งซ้าย (หรือคลิกเลือกเพื่อส่งลงช่องว่างอัตโนมัติ)
                      </p>
                    </div>
                    <button
                      onClick={() => initLevel(0)}
                      className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-4 py-2.5 rounded-2xl transition shadow flex items-center space-x-1.5 text-xs shrink-0 self-start sm:self-center"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>สุ่มโจทย์ชุดใหม่</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                      <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center space-x-2">
                        <Move className="w-5 h-5 text-blue-600" />
                        <span>ช่องเป้าหมายที่ต้องนำสัญลักษณ์รูปทรงจริงมาวาง ({dragTargets.length} ช่อง)</span>
                      </h4>

                      <div className="space-y-4">
                        {dragTargets.map((target, idx) => {
                          const placed = dragPlacedAnswers[target.slotId];

                          return (
                            <div
                              key={target.slotId}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDropOnSlot(e, target.slotId)}
                              className={`p-4 rounded-3xl border-2 transition-all min-h-[130px] flex flex-col justify-between ${
                                placed 
                                  ? 'border-blue-400 bg-blue-50/50 shadow-sm' 
                                  : 'border-dashed border-blue-300 bg-slate-50/80 hover:bg-blue-50/40'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-lg">
                                      ช่องที่ {idx + 1}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900">
                                      หน้าที่: {target.category}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    💡 <strong>รูปทรงที่ถูกต้อง:</strong> <span className="text-blue-600 font-bold">{target.shapeName}</span> — {target.hint}
                                  </p>
                                </div>

                                {placed && (
                                  <button
                                    onClick={() => handleRemoveFromSlot(target.slotId)}
                                    title="คลิกเพื่อนำออก"
                                    className="text-rose-500 hover:text-rose-700 bg-white p-1.5 rounded-xl border border-rose-200 shadow-xs"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-200/70">
                                {placed ? (
                                  <div className="bg-white p-2 rounded-2xl border border-blue-200 shadow-xs animate-fadeIn flex items-center space-x-3">
                                    <div className="w-32 sm:w-40 shrink-0">
                                      <FlowchartShapeSvg shape={placed.shape} label={placed.symbolText} height="48px" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-bold text-slate-800 truncate">{placed.symbolText}</div>
                                      <div className="text-[10px] text-blue-600 font-semibold">{placed.shapeName}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-3 text-xs text-blue-400 font-semibold italic bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
                                    ⬇️ ลากบล็อกสัญลักษณ์รูปทรงที่ถูกต้องมาวางที่นี่ (Drop Here)
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                        <button
                          onClick={handleVerifyDragDrop}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 text-base"
                        >
                          <CheckSquare className="w-5 h-5" />
                          <span>ตรวจคำตอบการจับคู่สัญลักษณ์ (Verify Matching)</span>
                        </button>

                        {dragResult && (
                          <div className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all ${
                            dragResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}>
                            {dragResult.success ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />}
                            <div>
                              <p className="text-sm font-bold">{dragResult.message}</p>
                              {dragResult.success && (
                                <p className="text-xs text-emerald-700 mt-1">
                                  เก่งมากครับ! กดสุ่มโจทย์ใหม่ หรือคลิกเลือกด่าน 2 ด้านบนเพื่อไปทำภารกิจต่อไปได้เลย
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          <span>บล็อกสัญลักษณ์รูปทรงจริง</span>
                        </h4>
                        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                          เหลือ {dragAvailablePool.length} อัน
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">
                        คลิกค้างแล้วลาก (Drag) หรือคลิกเพื่อส่งลงช่องว่างอัตโนมัติ
                      </p>

                      <div className="space-y-3 min-h-[220px]">
                        {dragAvailablePool.length === 0 ? (
                          <div className="text-center py-10 border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                            <p className="text-sm font-black text-emerald-800">นำบล็อกทั้งหมดไปวางแล้ว!</p>
                            <p className="text-xs text-emerald-600 mt-0.5">กดปุ่มตรวจคำตอบฝั่งซ้ายได้เลยจ้า</p>
                          </div>
                        ) : (
                          dragAvailablePool.map((item) => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                              onClick={() => handleQuickPlace(item)}
                              title="ลากไปวางในช่อง หรือคลิกเพื่อเลือก"
                              className="p-3.5 rounded-3xl bg-slate-50 hover:bg-blue-50/80 border-2 border-slate-200 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all flex flex-col justify-between group"
                            >
                              <div className="w-full flex items-center justify-center py-1">
                                <FlowchartShapeSvg shape={item.shape} label={item.symbolText} height="52px" />
                              </div>
                              <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200/60 font-semibold">
                                <span className="text-slate-600">รูปทรง: <strong className="text-blue-600">{item.shapeName}</strong></span>
                                <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg text-[10px] font-bold">ลากเลย ➡️</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* LEVEL 2, 3, 4: PUZZLE FLOWCHART MISSIONS */}
            {(currentMissionIdx >= 1 && currentMissionIdx <= 3) && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
                        <h3 className="font-extrabold text-slate-900 text-base">กระดานผังงาน (Flowchart Canvas)</h3>
                      </div>
                      <button
                        onClick={() => initLevel(currentMissionIdx)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-rose-50 font-bold transition flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>รีเซ็ตกระดาน</span>
                      </button>
                    </div>

                    <div className="space-y-3 min-h-[380px] bg-gradient-to-b from-blue-50/40 to-slate-50/60 rounded-3xl p-6 border-2 border-dashed border-blue-200/80 flex flex-col items-center justify-start">
                      {placedSlots.length === 0 ? (
                        <div className="my-auto text-center py-12 px-4">
                          <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-3 shadow-sm text-3xl">
                            🧩
                          </div>
                          <p className="font-extrabold text-slate-800 text-base">กระดานผังงานยังว่างอยู่</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs">คลิกเลือกบล็อกสัญลักษณ์จากด้านขวาเพื่อนำมาเรียงผังงาน</p>
                        </div>
                      ) : (
                        placedSlots.map((block, index) => (
                          <React.Fragment key={`${block.id}-${index}`}>
                            {index > 0 && (
                              <div className="flex flex-col items-center my-0.5">
                                <div className="w-0.5 h-4 bg-blue-300" />
                                <ArrowDown className="w-4 h-4 -mt-1 text-blue-500" />
                              </div>
                            )}
                            <div 
                              onClick={() => {
                                playSound('click', soundEnabled);
                                const blockToRemove = placedSlots[index];
                                setPlacedSlots(prev => prev.filter((_, i) => i !== index));
                                setAvailableBlocks(prev => [...prev, blockToRemove]);
                                setPuzzleResult(null);
                              }}
                              className="group cursor-pointer relative transition-all transform hover:scale-102 w-full max-w-sm"
                            >
                              <FlowchartShapeSvg shape={block.shape} label={block.text} height="52px" />
                              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition bg-rose-500 text-white rounded-full p-1 shadow">
                                <XCircle className="w-4 h-4" />
                              </div>
                            </div>
                          </React.Fragment>
                        ))
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                      <button
                        onClick={handleVerifyPuzzle}
                        disabled={isSimulating}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 text-base"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>ตรวจคำตอบ & รันผังงาน (Simulate)</span>
                      </button>

                      {puzzleResult && (
                        <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${puzzleResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
                          {puzzleResult.success ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />}
                          <p className="text-sm font-bold">{puzzleResult.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                    <h4 className="font-extrabold text-slate-900 text-base mb-3">บล็อกคำสั่งที่พร้อมใช้งาน ({availableBlocks.length})</h4>
                    <div className="space-y-2.5">
                      {availableBlocks.map(block => (
                        <div
                          key={block.id}
                          onClick={() => {
                            playSound('click', soundEnabled);
                            setAvailableBlocks(prev => prev.filter(b => b.id !== block.id));
                            setPlacedSlots(prev => [...prev, block]);
                            setPuzzleResult(null);
                          }}
                          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition flex items-center justify-between group"
                        >
                          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700">{block.text}</span>
                          <span className="text-xs bg-blue-600 text-white font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition">เลือก +</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* LEVEL 5: ข้อสอบ ป.6 (1 ข้อต่อ 1 หน้า + มีเวลา + ชื่อ + ดาวน์โหลด PNG + พิมพ์ PNG) */}
            {currentMissionIdx === 4 && (
              <div className="space-y-6">
                
                {!quizStarted && !quizSubmitted && (
                  <div className="max-w-2xl mx-auto bg-white border border-blue-100 rounded-3xl p-8 sm:p-10 shadow-lg shadow-blue-500/5 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center text-3xl mb-4 border border-blue-200">
                      🎓
                    </div>
                    
                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
                      แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                      วิชาวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 6
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                      แบบทดสอบปรนัยจำนวน 10 ข้อ • มีการจับเวลา 10:00 นาที • แสดงข้อสอบทีละหน้า
                    </p>

                    <form onSubmit={handleStartQuiz} className="mt-6 text-left space-y-4 max-w-md mx-auto bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          👤 ชื่อ - นามสกุล นักเรียน <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="เช่น เด็กชายกิตติศักดิ์ เรียนดี"
                          value={studentInfo.name}
                          onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            🏫 ชั้น / ห้อง
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น ป.6/1"
                            value={studentInfo.room}
                            onChange={(e) => setStudentInfo({ ...studentInfo, room: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            🔢 เลขที่
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น 15"
                            value={studentInfo.number}
                            onChange={(e) => setStudentInfo({ ...studentInfo, number: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98 text-base mt-4"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>เริ่มทำแบบทดสอบ (Start Exam)</span>
                      </button>
                    </form>
                  </div>
                )}

                {quizStarted && !quizSubmitted && (
                  <div className="space-y-6">
                    <div className="bg-white border border-blue-100 rounded-3xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                            {studentInfo.name.charAt(0) || '👤'}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-900">
                              {studentInfo.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              ห้อง: <span className="text-blue-700 font-bold">{studentInfo.room || 'ป.6'}</span> • เลขที่: <span className="text-blue-700 font-bold">{studentInfo.number || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-center">
                          <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border font-mono font-black text-base shadow-xs ${
                            timeLeftSeconds < 120 
                              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' 
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}>
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>{formatTimer(timeLeftSeconds)}</span>
                          </div>

                          <button
                            onClick={() => handleSubmitQuiz(false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow transition flex items-center space-x-1"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>ส่งคำตอบ</span>
                          </button>
                        </div>

                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                          <span>ข้อที่ {quizPageIdx + 1} จาก {QUIZ_QUESTIONS.length} ข้อ</span>
                          <span className="text-blue-600">ตอบแล้ว {Object.keys(quizAnswers).length}/10 ข้อ</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${((quizPageIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Single Question Card */}
                    {(() => {
                      const currentQ = QUIZ_QUESTIONS[quizPageIdx];
                      const selectedOpt = quizAnswers[currentQ.id];

                      return (
                        <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                          
                          <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                              <span className="text-xs bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full">
                                ข้อที่ {quizPageIdx + 1}
                              </span>
                              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2.5 leading-snug">
                                {currentQ.question}
                              </h3>
                            </div>
                            <div className="w-24 sm:w-32 shrink-0">
                              <FlowchartShapeSvg shape={currentQ.shapeType} height="40px" />
                            </div>
                          </div>

                          <div className="space-y-3">
                            {currentQ.options.map((opt, optIdx) => {
                              const isSelected = selectedOpt === optIdx;

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectQuizOption(currentQ.id, optIdx)}
                                  className={`w-full p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 transform scale-[1.01]'
                                      : 'bg-slate-50 hover:bg-blue-50/70 border-slate-200 hover:border-blue-300 text-slate-800'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                                    isSelected ? 'border-white bg-white text-blue-600' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <button
                              disabled={quizPageIdx === 0}
                              onClick={() => { setQuizPageIdx(prev => prev - 1); playSound('click', soundEnabled); }}
                              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>ข้อก่อนหน้า</span>
                            </button>

                            <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                              {QUIZ_QUESTIONS.map((q, idx) => {
                                const isAnswered = quizAnswers[q.id] !== undefined;
                                const isCurrent = quizPageIdx === idx;

                                return (
                                  <button
                                    key={q.id}
                                    onClick={() => { setQuizPageIdx(idx); playSound('click', soundEnabled); }}
                                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                                      isCurrent
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2'
                                        : isAnswered
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    {idx + 1}
                                  </button>
                                );
                              })}
                            </div>

                            {quizPageIdx < QUIZ_QUESTIONS.length - 1 ? (
                              <button
                                onClick={() => { setQuizPageIdx(prev => prev + 1); playSound('click', soundEnabled); }}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center justify-center space-x-1.5"
                              >
                                <span>ข้อถัดไป</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSubmitQuiz(false)}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5"
                              >
                                <CheckCheck className="w-4 h-4" />
                                <span>ส่งคำตอบ (Submit)</span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })()}

                  </div>
                )}

                {quizSubmitted && (
                  <div className="space-y-8">
                    <div 
                      ref={certificateRef}
                      id="certificate-card"
                      className="bg-gradient-to-b from-blue-50/60 via-white to-sky-50 border-4 border-double border-blue-300 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden text-center max-w-3xl mx-auto"
                    >
                      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs uppercase tracking-wider mb-4 shadow-sm">
                        <Award className="w-4 h-4" />
                        <span>ใบรายงานผลการทดสอบวัดผลสัมฤทธิ์</span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
                        วิชาวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 6
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        โรงเรียนประถมศึกษา • การทดสอบเรื่องผังงาน (Flowchart)
                      </p>

                      <div className="my-6 p-4 bg-white/90 rounded-2xl border border-blue-200 inline-block text-slate-800 text-sm font-semibold shadow-xs">
                        มอบให้แก่: <strong className="text-blue-700 text-base font-black underline">{studentInfo.name || 'นักเรียน ป.6'}</strong>
                        <div className="text-xs text-slate-500 mt-1">
                          ชั้น: <strong>{studentInfo.room || 'ป.6'}</strong> • เลขที่: <strong>{studentInfo.number || '-'}</strong> • เวลาที่ใช้ไป: <strong>{formatTimer(timeUsedSeconds)} นาที</strong>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-600/25 max-w-md mx-auto mb-6">
                        <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">คะแนนที่ได้</div>
                        <div className="text-5xl font-black mt-1">
                          {calculateQuizScore()} <span className="text-2xl text-blue-200">/ 10</span>
                        </div>
                        <div className="text-xs text-amber-300 font-bold mt-2">
                          {calculateQuizScore() >= 8 ? '🌟 ระดับผลการเรียน: ยอดเยี่ยมมาก (เกรด 4)' : calculateQuizScore() >= 5 ? '👍 ระดับผลการเรียน: ผ่านเกณฑ์ประเมิน (ดี)' : '📖 ระดับผลการเรียน: ควรทบทวนบทเรียนเพิ่มเติม'}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium pt-2">
                        Flowchart Lab ป.6 • ระบบทดสอบและประเมินผลออนไลน์
                      </div>
                    </div>

                    <div className="max-w-3xl mx-auto bg-white border border-blue-100 rounded-3xl p-5 shadow-sm no-print">
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={handleDownloadPNG}
                          disabled={isExporting}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-2xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm transition flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          <span>{isExporting ? 'กำลังสร้างรูปภาพ...' : 'ดาวน์โหลดเป็นรูปภาพ PNG'}</span>
                        </button>

                        <button
                          onClick={handlePrintCertificate}
                          disabled={isExporting}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-md shadow-blue-600/20 text-xs sm:text-sm transition flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Printer className="w-4 h-4" />
                          <span>พิมพ์ใบประกาศคะแนน (Print PNG)</span>
                        </button>

                        <button
                          onClick={() => { setQuizStarted(false); setQuizSubmitted(false); }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-5 rounded-2xl border border-slate-300 text-xs sm:text-sm transition flex items-center space-x-1.5"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>ทำแบบทดสอบใหม่อีกครั้ง</span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed Review & Explanations */}
                    <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm no-print">
                      <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span>ตรวจคำตอบและคำอธิบายเฉลยละเอียดทั้ง 10 ข้อ</span>
                      </h4>

                      <div className="space-y-4">
                        {QUIZ_QUESTIONS.map((q) => {
                          const selected = quizAnswers[q.id];
                          const isCorrect = selected === q.correctAnswer;

                          return (
                            <div
                              key={q.id}
                              className={`p-5 rounded-3xl border transition-all ${
                                isCorrect 
                                  ? 'border-emerald-300 bg-emerald-50/20' 
                                  : 'border-rose-300 bg-rose-50/20'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h5 className="font-extrabold text-sm text-slate-900">
                                  {q.question}
                                </h5>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ${
                                  isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {isCorrect ? '✅ ถูกต้อง +1' : '❌ ผิด 0'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {q.options.map((opt, optIdx) => {
                                  const isUserChosen = selected === optIdx;
                                  const isTargetCorrect = q.correctAnswer === optIdx;

                                  let optClass = 'bg-slate-50 border-slate-200 text-slate-600';
                                  if (isTargetCorrect) {
                                    optClass = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                                  } else if (isUserChosen && !isTargetCorrect) {
                                    optClass = 'bg-rose-100 border-rose-400 text-rose-950 font-bold line-through';
                                  }

                                  return (
                                    <div key={optIdx} className={`p-2.5 rounded-xl border ${optClass}`}>
                                      {opt}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                                <strong className="text-blue-700">📖 คำอธิบายเฉลย: </strong>
                                {q.explanation}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ================= TAB 2: FLOWCHART SANDBOX STUDIO ================= */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">
                    🧪 ห้องทดลองสร้างผังงานอิสระ (Sandbox Studio)
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    ออกแบบและจำลองการรันผังงานด้วยตัวเอง
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    คลิกเพิ่มบล็อกสัญลักษณ์ ปรับแก้ข้อความ และกดปุ่มรันผังงานเพื่อดูการทำงานได้ทันที
                  </p>
                </div>

                <button
                  onClick={handleRunSandbox}
                  disabled={sandboxRunning || sandboxNodes.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center space-x-2 transition self-start sm:self-center disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{sandboxRunning ? 'กำลังรันผังงาน...' : 'รันผังงาน (Execute Flow)'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 mr-2">+ เพิ่มบล็อก:</span>
                <button onClick={() => handleAddSandboxNode('terminator')} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs hover:bg-emerald-100">
                  🟢 เริ่ม/จบ (Terminator)
                </button>
                <button onClick={() => handleAddSandboxNode('process')} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-300 font-bold text-xs hover:bg-blue-100">
                  🟦 ประมวลผล (Process)
                </button>
                <button onClick={() => handleAddSandboxNode('inputOutput')} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs hover:bg-amber-100">
                  ▱ รับ/แสดงผล (I/O)
                </button>
                <button onClick={() => handleAddSandboxNode('decision')} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-300 font-bold text-xs hover:bg-indigo-100">
                  🔶 ตัดสินใจ (Decision)
                </button>
                <button onClick={() => handleAddSandboxNode('display')} className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-300 font-bold text-xs hover:bg-cyan-100">
                  🖥️ หน้าจอ (Display)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-blue-100 rounded-3xl p-6 shadow-sm min-h-[400px]">
                <h4 className="font-extrabold text-slate-900 text-base mb-4">ผังงานของคุณ ({sandboxNodes.length} บล็อก)</h4>
                
                <div className="space-y-3 flex flex-col items-center">
                  {sandboxNodes.map((node, idx) => (
                    <React.Fragment key={node.id}>
                      {idx > 0 && (
                        <div className="flex flex-col items-center my-0.5">
                          <div className="w-0.5 h-3 bg-blue-300" />
                          <ArrowDown className="w-4 h-4 -mt-1 text-blue-500" />
                        </div>
                      )}
                      <div className="w-full max-w-md p-3 rounded-2xl border-2 border-blue-200 bg-slate-50 flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-2.5 flex-1 mr-2">
                          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={node.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSandboxNodes(prev => prev.map(n => n.id === node.id ? { ...n, text: val } : n));
                            }}
                            className="bg-white border border-slate-300 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveSandboxNode(node.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl font-mono text-xs text-slate-200 min-h-[300px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Terminal className="w-4 h-4" />
                    <span>Live Simulator Console</span>
                  </div>
                </div>

                <div className="space-y-2 text-slate-300">
                  {sandboxLogs.length === 0 ? (
                    <p className="text-slate-600 italic">กดปุ่ม "รันผังงาน" เพื่อดูผลการทำงานแบบ Step-by-Step</p>
                  ) : (
                    sandboxLogs.map((log, i) => (
                      <div key={i} className="animate-fadeIn">
                        <span className="text-blue-400">&gt; </span>{log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: FLOWCHART HANDBOOK ================= */}
        {activeTab === 'guide' && (
          <div className="space-y-8">
            <div className="bg-white border border-blue-100 rounded-3xl p-8 shadow-sm">
              <div className="max-w-4xl">
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
                  📚 รูปทรงสัญลักษณ์มาตรฐานสากล (ANSI / ISO Standard)
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  คู่มือสัญลักษณ์ผังงานฉบับสมบูรณ์ (Flowchart Handbook)
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                  รวบรวมรูปทรงเรขาคณิตมาตรฐานทางวิศวกรรมและวิทยาการคำนวณที่ถูกต้อง 100% พร้อมคำอธิบายหน้าที่และตัวอย่างการใช้งาน
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 mr-2">หมวดหมู่:</span>
                {['ทั้งหมด', 'พื้นฐานสำคัญ', 'การทำงาน', 'รับและส่งข้อมูล', 'เงื่อนไขตัดสินใจ', 'จุดเชื่อมต่อ'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSymbolFilter(cat); playSound('click', soundEnabled); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      symbolFilter === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">
                  สัญลักษณ์มาตรฐาน ({filteredSymbols.length} สัญลักษณ์)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSymbols.map((item) => (
                  <div key={item.id} className="bg-white border border-blue-100 hover:border-blue-300 hover:shadow-lg rounded-3xl p-6 transition-all flex flex-col justify-between">
                    <div>
                      <div className="h-32 bg-gradient-to-br from-blue-50/50 via-slate-50 to-sky-50/30 rounded-2xl border border-blue-100 flex items-center justify-center p-3 mb-4">
                        <FlowchartShapeSvg shape={item.shapeType} label={item.name.split(' ')[0]} height="65px" />
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </h4>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        รูปทรงเรขาคณิต: {item.shapeName}
                      </p>

                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-normal">
                        {item.simpleExplain}
                      </p>

                      <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <span className="text-slate-500 font-bold">💡 ตัวอย่าง: </span>
                        <span className="text-indigo-700 font-bold">{item.example}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${item.badge}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">ANSI/ISO Standard</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: VIDEO LEARNING & ADMIN VIDEO BACKEND ================= */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            
            {/* Video Header & Quick Custom URL Player */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1 rounded-full border border-rose-200">
                      📺 ห้องเรียนรู้วิดีโอ ป.6 (YouTube Live Stream)
                    </span>
                    {isAdminUnlocked && (
                      <span className="text-xs bg-amber-100 text-amber-800 font-black px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                        ⚙️ แอดมินจัดการสื่อ
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    เรียนรู้การเขียนผังงานด้วยวิดีโอและสื่อการสอนแบบเรียลไทม์
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <form onSubmit={handleLoadCustomUrl} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="วางลิงก์ YouTube ที่ต้องการ..."
                      value={customYoutubeUrl}
                      onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow">
                      เปิดดูคลิป
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* ================= ADMIN VIDEO MANAGEMENT PANEL (ระบบหลังบ้าน) ================= */}
            {isAdminUnlocked && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 border-2 border-amber-300 rounded-3xl p-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {editingVideoId ? '✏️ แก้ไขสื่อการสอน YouTube' : '➕ เพิ่มสื่อการสอน YouTube ใหม่'}
                      </h3>
                      <p className="text-xs text-slate-600">ข้อมูลจะถูกบันทึกถาวรลงในระบบทันที</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {editingVideoId && (
                      <button
                        onClick={handleOpenAddVideo}
                        className="text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                      >
                        ยกเลิกการแก้ไข
                      </button>
                    )}
                    <button
                      onClick={handleResetDefaultVideos}
                      className="text-xs px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold hover:bg-rose-100 transition"
                    >
                      คืนค่าวิดีโอเริ่มต้น
                    </button>
                  </div>
                </div>

                {/* Video Form */}
                <form onSubmit={handleSaveVideo} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        🎬 ชื่อบทเรียน / ชื่อคลิปวิดีโอ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น บทเรียนที่ 4: การแก้ปัญหาด้วยผังงานวิทยาการคำนวณ"
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        🔗 ลิงก์ YouTube (URL หรือ Video ID) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น https://www.youtube.com/watch?v=S20m_Yf8tW0"
                        value={videoForm.youtubeUrl}
                        onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        👤 ผู้จัดทำ / ช่อง YouTube
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น คุณครูนก / สสวท. ประถมศึกษา"
                        value={videoForm.creator}
                        onChange={(e) => setVideoForm({ ...videoForm, creator: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ⏱️ ความยาวคลิป
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น 15:30 นาที"
                        value={videoForm.duration}
                        onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-12">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        📝 คำอธิบายเนื้อหาบทเรียน
                      </label>
                      <textarea
                        rows="2"
                        placeholder="สรุปย่อเกี่ยวกับเนื้อหาวิทยาการคำนวณที่นักเรียนจะได้รับจากคลิปนี้..."
                        value={videoForm.description}
                        onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        💡 ประเด็นสำคัญข้อที่ 1
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น สัญลักษณ์เริ่มต้นและสิ้นสุด"
                        value={videoForm.keyPoint1}
                        onChange={(e) => setVideoForm({ ...videoForm, keyPoint1: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        💡 ประเด็นสำคัญข้อที่ 2
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น การตรวจสอบเงื่อนไขจริง/เท็จ"
                        value={videoForm.keyPoint2}
                        onChange={(e) => setVideoForm({ ...videoForm, keyPoint2: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        💡 ประเด็นสำคัญข้อที่ 3
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ตัวอย่างขั้นตอนในชีวิตประจำวัน"
                        value={videoForm.keyPoint3}
                        onChange={(e) => setVideoForm({ ...videoForm, keyPoint3: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-2xl shadow transition text-xs flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingVideoId ? 'บันทึกการแก้ไขวิดีโอ' : 'บันทึกและเพิ่มคลิป YouTube'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Video Player & Playlist Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Main Video Player */}
              <div className="lg:col-span-8 bg-white border border-blue-100 rounded-3xl p-5 shadow-sm">
                <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video shadow-lg">
                  <iframe
                    className="w-full h-full absolute inset-0"
                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                    title={selectedVideo?.title || 'Flowchart Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-md">
                      {selectedVideo?.creator || 'YouTube'} • {selectedVideo?.duration || '10:00 นาที'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {activeVideoId}</span>
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-900 mt-2">{selectedVideo?.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{selectedVideo?.description}</p>

                  {/* Key points */}
                  {selectedVideo?.keyPoints && selectedVideo.keyPoints.length > 0 && (
                    <div className="mt-4 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
                      <h5 className="text-xs font-black text-blue-900 mb-1.5 flex items-center space-x-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>สาระสำคัญที่นักเรียนจะได้รับ:</span>
                      </h5>
                      <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                        {selectedVideo.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Playlist & Admin Video Actions */}
              <div className="lg:col-span-4 bg-white border border-blue-100 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                    <Film className="w-4 h-4 text-rose-600" />
                    <span>รายการบทเรียน ({videoLessons.length} ตอน)</span>
                  </h4>
                  {isAdminUnlocked && (
                    <button
                      onClick={handleOpenAddVideo}
                      className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg transition flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มคลิป</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {videoLessons.map((video) => {
                    const isCurrent = (selectedVideo?.id === video.id && !customVideoId);

                    return (
                      <div
                        key={video.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-300'
                            : 'bg-slate-50 hover:bg-blue-50/40 border-slate-200'
                        }`}
                      >
                        <div 
                          onClick={() => { setSelectedVideo(video); setCustomVideoId(null); playSound('click', soundEnabled); }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-600">
                              {video.title}
                            </h5>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-600 text-white font-black px-1.5 py-0.5 rounded shrink-0">
                                กำลังเล่น ▶
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
                            <span className="text-rose-600 font-bold">{video.creator}</span>
                            <span>{video.duration}</span>
                          </div>
                        </div>

                        {/* Admin Action Buttons on Each Item */}
                        {isAdminUnlocked && (
                          <div className="flex items-center justify-end space-x-1.5 mt-2.5 pt-2 border-t border-slate-200/70">
                            <button
                              onClick={() => handleOpenEditVideo(video)}
                              className="text-[11px] bg-white border border-slate-200 hover:border-amber-400 text-amber-700 font-bold px-2 py-0.5 rounded-md flex items-center space-x-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="text-[11px] bg-white border border-slate-200 hover:border-rose-400 text-rose-600 font-bold px-2 py-0.5 rounded-md flex items-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>ลบ</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-blue-100 bg-white/90 py-5 text-center text-xs text-slate-500 no-print">
        <p className="font-bold text-slate-700">Flowchart Lab ป.6 • ห้องทดลองผังงานและการแก้ปัญหา วิชาวิทยาการคำนวณ</p>
        <p className="mt-1 text-[11px]">ระบบแอดมินอัปเดตสื่อ YouTube ถาวร • ดาวน์โหลดใบประกาศ PNG • พิมพ์หน้า PNG</p>
      </footer>
    </div>
  );
}
