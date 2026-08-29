import React, { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, CheckCircle2, XCircle, Award, Sparkles, 
  BookOpen, Layers, ArrowRight, ArrowDown, 
  Volume2, VolumeX, ChevronRight, Check,
  Zap, Terminal, ShieldAlert, Cpu, Lightbulb, Compass, Code2,
  Tv, Video, Search, ExternalLink, Bookmark, HelpCircle,
  FileText, CornerDownRight, RefreshCw, AlertCircle, Heart,
  Smile, Star, Trophy, Rocket, GraduationCap, CheckCircle,
  Clock, CheckSquare, Plus, Trash2, Edit3, Move
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
    category: 'การประมวลผล',
    icon: '🟦',
    hint: 'ใช้สำหรับการคำนวณตัวเลข หรือการลงมือปฏิบัติงาน'
  },
  {
    id: 'sym_io',
    shape: 'inputOutput',
    shapeName: 'สี่เหลี่ยมด้านขนาน (Parallelogram)',
    symbolText: 'รับค่าคะแนนสอบ (Input Score)',
    category: 'รับเข้า / แสดงผล',
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
    category: 'จุดเชื่อมต่อ',
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

// --- Standard Symbols for Guide ---
const PRIMARY_SYMBOLS = [
  {
    id: 'terminator',
    name: 'จุดเริ่มต้นและจุดสิ้นสุด (Start / End)',
    shapeName: 'วงรีขอบมน (Oval)',
    category: 'พื้นฐานสำคัญ',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    colorGradient: 'from-emerald-500 to-teal-600',
    shapeType: 'oval',
    icon: '🟢',
    simpleExplain: 'เป็นจุดเริ่มต้นก้าวแรก และจุดสุดท้ายเมื่อจบการทำงานของโปรแกรม ในหนึ่งผังงานต้องมีเสมอ!',
    example: 'เริ่มต้น (Start), สิ้นสุด (End), จบการทำงาน'
  },
  {
    id: 'process',
    name: 'การปฏิบัติงาน / คำนวณ (Process)',
    shapeName: 'สี่เหลี่ยมผืนผ้า (Rectangle)',
    category: 'การทำงาน',
    badge: 'bg-blue-50 text-blue-700 border-blue-300',
    colorGradient: 'from-blue-600 to-indigo-600',
    shapeType: 'rectangle',
    icon: '🟦',
    simpleExplain: 'ใช้เมื่อมีการลงมือทำสิ่งต่างๆ การคำนวณเลข หรือการสั่งให้หุ่นยนต์/ตัวละครทำตามคำสั่ง',
    example: 'เดินหน้า 3 ก้าว, ราคารวม = 20 × 5, เติมน้ำตาล 1 ช้อน'
  },
  {
    id: 'inputOutput',
    name: 'การรับข้อมูล / แสดงผลทั่วไป (Input / Output)',
    shapeName: 'สี่เหลี่ยมด้านขนาน (Parallelogram)',
    category: 'รับและส่งข้อมูล',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    colorGradient: 'from-amber-500 to-amber-600',
    shapeType: 'parallelogram',
    icon: '▱',
    simpleExplain: 'ใช้เมื่อต้องการรับค่าเข้ามา (เช่น ถามชื่อ, รับคะแนน) หรือต้องการส่งค่าออกไปแสดงผล',
    example: 'รับค่าความกว้างและความยาว, รับคะแนนสอบ, แสดงผลค่าพื้นที่'
  },
  {
    id: 'decision',
    name: 'การตัดสินใจ / ตรวจสอบเงื่อนไข (Decision)',
    shapeName: 'สี่เหลี่ยมข้าวหลามตัด (Diamond)',
    category: 'เงื่อนไขตัดสินใจ',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    colorGradient: 'from-indigo-600 to-violet-600',
    shapeType: 'diamond',
    icon: '🔶',
    simpleExplain: 'ใช้เปรียบเทียบหรือตั้งคำถาม เช่น "ฝนตกไหม?" ผลลัพธ์จะมี 2 ทางเลือกเสมอ คือ จริง (ใช่) หรือ เท็จ (ไม่ใช่)',
    example: 'คะแนนสอบ >= 50 ?, อุณหภูมิ > 37.5 องศา ?, ฝนตกหรือไม่ ?'
  },
  {
    id: 'display',
    name: 'แสดงผลออกทางจอภาพ (Display Output)',
    shapeName: 'รูปทรงจอแสดงผล (Display)',
    category: 'รับและส่งข้อมูล',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-300',
    colorGradient: 'from-cyan-500 to-blue-600',
    shapeType: 'displayShape',
    icon: '🖥️',
    simpleExplain: 'ใช้เมื่อต้องการให้หน้าจอคอมพิวเตอร์หรือแท็บเล็ตแสดงข้อความ รูปภาพ หรือคำตอบให้ผู้ใช้เห็น',
    example: 'แสดงข้อความ "ยินดีด้วยคุณสอบผ่าน!", แสดงยอดเงินคงเหลือ'
  },
  {
    id: 'connector',
    name: 'จุดเชื่อมต่อในหน้าเดียวกัน (Connector)',
    shapeName: 'วงกลมเล็ก (Circle)',
    category: 'จุดเชื่อมต่อ',
    badge: 'bg-rose-50 text-rose-700 border-rose-300',
    colorGradient: 'from-rose-500 to-pink-600',
    shapeType: 'circle',
    icon: '⭕',
    simpleExplain: 'ใช้เชื่อมเส้นทางของผังงานให้รวมเป็นจุดเดียวกัน เพื่อไม่ให้เส้นลูกศรตัดกันจนดูสับสน',
    example: 'จุดเชื่อมรวม A หรือ 1'
  },
  {
    id: 'flowLine',
    name: 'เส้นและลูกศรทิศทาง (Flow Line)',
    shapeName: 'เส้นลูกศร (Arrow)',
    category: 'พื้นฐานสำคัญ',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    colorGradient: 'from-slate-700 to-slate-800',
    shapeType: 'arrow',
    icon: '➡️',
    simpleExplain: 'แสดงลำดับและทิศทางการทำงาน โดยจะไหลจากบนลงล่าง หรือซ้ายไปขวาเสมอ ห้ามลากย้อนโดยไม่มีลูกศร',
    example: 'ทิศทางการไหลจากขั้นตอนที่ 1 ไปขั้นตอนที่ 2'
  }
];

// --- 10 Questions Flowchart Quiz for Grade 6 ---
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: '1. สัญลักษณ์ใดในผังงาน ใช้แทนจุด "เริ่มต้น" (Start) และ "สิ้นสุด" (End)?',
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

// --- Educational YouTube Lessons for Grade 6 ---
const VIDEO_LESSONS = [
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
  // Navigation Tabs: 'game' | 'sandbox' | 'guide' | 'video'
  const [activeTab, setActiveTab] = useState('game');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Game State (5 Missions) ---
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0); // 0=DragDrop Sym, 1=Milk, 2=Shop, 3=Temp, 4=Quiz

  // Drag & Drop State for Mission 1 (Randomized Symbol Matching)
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragTargets, setDragTargets] = useState([]); // Slots to fill
  const [dragAvailablePool, setDragAvailablePool] = useState([]); // Available items to drag
  const [dragPlacedAnswers, setDragPlacedAnswers] = useState({}); // { [slotId]: item }
  const [dragResult, setDragResult] = useState(null);

  // Standard Puzzle Missions State (Missions 2-4)
  const [placedSlots, setPlacedSlots] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [puzzleResult, setPuzzleResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simLogs, setSimLogs] = useState([]);
  const [simVars, setSimVars] = useState({});

  // Quiz State (Mission 5)
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Completed Missions Record
  const [completedMissions, setCompletedMissions] = useState({});

  // --- Sandbox Studio State ---
  const [sandboxNodes, setSandboxNodes] = useState([
    { id: 'sb_1', shape: 'terminator', text: 'เริ่มต้น (Start)' },
    { id: 'sb_2', shape: 'inputOutput', text: 'รับค่าตัวเลข X' },
    { id: 'sb_3', shape: 'process', text: 'คำนวณ Y = X + 10' },
    { id: 'sb_4', shape: 'display', text: 'แสดงผลลัพธ์ Y' },
    { id: 'sb_5', shape: 'terminator', text: 'สิ้นสุด (End)' }
  ]);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState([]);

  // --- Video Tab State ---
  const [selectedVideo, setSelectedVideo] = useState(VIDEO_LESSONS[0]);
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customVideoId, setCustomVideoId] = useState(null);

  // Initialize mission whenever level changes
  useEffect(() => {
    initLevel(currentMissionIdx);
  }, [currentMissionIdx]);

  const initLevel = (idx) => {
    if (idx === 0) {
      // Mission 1: Randomize 4 symbols from pool
      const shuffledPool = [...SYMBOL_ITEMS_POOL].sort(() => Math.random() - 0.5);
      const selected = shuffledPool.slice(0, 4);
      
      // Targets are ordered placeholders
      const targets = selected.map((item, i) => ({
        slotId: `slot_${i}`,
        correctItemId: item.id,
        category: item.category,
        shapeName: item.shapeName,
        hint: item.hint
      }));

      // Available items are shuffled
      const poolShuffled = [...selected].sort(() => Math.random() - 0.5);

      setDragTargets(targets);
      setDragAvailablePool(poolShuffled);
      setDragPlacedAnswers({});
      setDragResult(null);
    } else if (idx === 1) {
      // Mission 2: Milk
      initPuzzleLevel([
        { id: 'm1_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
        { id: 'm1_step1', text: 'เทนมสดรสจืดลงในแก้ว', shape: 'process' },
        { id: 'm1_step2', text: 'ตักน้ำตาล 1 ช้อนและคนให้ละลาย', shape: 'process' },
        { id: 'm1_step3', text: 'ใส่น้ำแข็งก้อนลงไปให้เต็มแก้ว', shape: 'process' },
        { id: 'm1_step4', text: 'แสดงผล "นมสดเย็นพร้อมเสิร์ฟ"', shape: 'display' },
        { id: 'm1_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
      ], ['m1_start', 'm1_step1', 'm1_step2', 'm1_step3', 'm1_step4', 'm1_end']);
    } else if (idx === 2) {
      // Mission 3: Shop Calculator
      initPuzzleLevel([
        { id: 'm2_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
        { id: 'm2_input', text: 'รับค่า ราคาขนม (Price), จำนวนชิ้น (Qty)', shape: 'inputOutput' },
        { id: 'm2_calc', text: 'คำนวณ ราคารวม = Price × Qty', shape: 'process' },
        { id: 'm2_display', text: 'แสดงผลลัพธ์ ยอดเงินที่ต้องจ่าย', shape: 'display' },
        { id: 'm2_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
      ], ['m2_start', 'm2_input', 'm2_calc', 'm2_display', 'm2_end']);
    } else if (idx === 3) {
      // Mission 4: Temp Decision
      initPuzzleLevel([
        { id: 'm3_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
        { id: 'm3_input', text: 'สแกนวัดอุณหภูมิร่างกาย (Temp)', shape: 'inputOutput' },
        { id: 'm3_decision', text: 'ตรวจสอบเงื่อนไข Temp > 37.5 °C ?', shape: 'decision' },
        { id: 'm3_output', text: 'แสดงผล "เข้าห้องเรียนได้" หรือ "พบครูพยาบาล"', shape: 'display' },
        { id: 'm3_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
      ], ['m3_start', 'm3_input', 'm3_decision', 'm3_output', 'm3_end']);
    } else if (idx === 4) {
      // Mission 5: Quiz
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  const initPuzzleLevel = (blocks, correctOrder) => {
    const shuffled = [...blocks].sort(() => Math.random() - 0.5);
    setAvailableBlocks(shuffled);
    setPlacedSlots([]);
    setPuzzleResult(null);
    setIsSimulating(false);
    setSimStep(0);
    setSimLogs([]);
    setSimVars({});
  };

  // --- Drag & Drop Handlers for Mission 1 ---
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDropOnSlot = (e, slotId) => {
    e.preventDefault();
    if (!draggedItem) return;
    playSound('drop', soundEnabled);

    // If slot already had an item, return it to pool
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

  // Click-to-place fallback for mobile on Mission 1
  const handleQuickPlace = (item) => {
    // Find first empty target slot
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
        message: '❌ ยังมีสัญลักษณ์ที่วางสลับที่กันอยู่ ลองอ่านคำใบ้รูปทรงและหน้าที่ แล้วจัดวางใหม่อีกรอบนะครับ'
      });
    }
  };

  // Puzzle verify (Missions 2-4)
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
      // Run trace
      setIsSimulating(true);
      setSimStep(0);
      let st = 0;
      const interval = setInterval(() => {
        if (st < placedSlots.length) {
          setSimStep(st);
          setSimLogs(prev => [...prev, `✅ ทำงานขั้นตอนที่ ${st + 1}: ${placedSlots[st].text}`]);
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

  // Quiz Handling
  const handleSelectQuizOption = (qId, optionIdx) => {
    if (quizSubmitted) return;
    playSound('click', soundEnabled);
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
      playSound('error', soundEnabled);
      alert('กรุณาตอบคำถามให้ครบทั้ง 10 ข้อก่อนส่งคำตอบครับ 😊');
      return;
    }
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

  // Sandbox studio runner
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
    let id = customYoutubeUrl.trim();
    if (id.includes('v=')) id = id.split('v=')[1].split('&')[0];
    else if (id.includes('youtu.be/')) id = id.split('youtu.be/')[1].split('?')[0];
    else if (id.includes('embed/')) id = id.split('embed/')[1].split('?')[0];

    setCustomVideoId(id);
    setSelectedVideo({
      id: 'custom',
      title: 'วิดีโอที่คุณครู/นักเรียนระบุ (Custom Stream)',
      creator: 'YouTube Embed',
      duration: 'กำหนดเอง',
      youtubeId: id,
      description: 'กำลังเล่นวิดีโอการเรียนรู้จากลิงก์ที่คุณระบุในระบบ',
      keyPoints: ['ดูวิดีโอการสอนแบบเรียลไทม์ได้โดยตรงในหน้านี้']
    });
  };

  const activeVideoId = customVideoId || selectedVideo.youtubeId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-white to-sky-50 text-slate-800 font-['Prompt',sans-serif] antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* --- Top Header --- */}
      <header className="border-b border-blue-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
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
              <p className="text-xs text-slate-500 font-medium">เกม Drag & Drop ผังงาน • ห้องทดลองสร้างผังงาน • ข้อสอบ 10 ข้อ</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'game' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>เกมภารกิจ</span>
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
                <span>ห้องทดลองสร้างผังงาน</span>
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
                <span>วิดีโอสอน</span>
              </button>
            </nav>

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

      {/* --- Main Container --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* ================= TAB 1: GAME MISSIONS ================= */}
        {activeTab === 'game' && (
          <div className="space-y-6">
            
            {/* Level Selector Header */}
            <div className="bg-white border border-blue-100 rounded-3xl p-5 shadow-sm shadow-blue-500/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-blue-600 font-bold mb-0.5 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>ภารกิจท้าทายวิทยาการคำนวณ ป.6</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                    {currentMissionIdx === 0 && 'ด่าน 1: 🧩 แดรกแอนด์ดร็อป (Drag & Drop) สัญลักษณ์ Flowchart (สุ่มโจทย์ใหม่ทุกรอบ)'}
                    {currentMissionIdx === 1 && 'ด่าน 2: 🥛 หุ่นยนต์ชงนมสดหวานมัน (โครงสร้างเรียงลำดับ)'}
                    {currentMissionIdx === 2 && 'ด่าน 3: 🍰 คิดเงินร้านขนมสหกรณ์ (การรับค่า & คำนวณ)'}
                    {currentMissionIdx === 3 && 'ด่าน 4: 🩺 เครื่องคัดกรองวัดไข้หน้าโรงเรียน (โครงสร้าง If-Else)'}
                    {currentMissionIdx === 4 && 'ด่าน 5: 🏆 แบบทดสอบวัดความรู้ผังงาน ป.6 (10 ข้อท้ายบท)'}
                  </h2>
                </div>

                {/* Level Tabs (1 to 5) */}
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

            {/* ===== LEVEL 1: DRAG & DROP SYMBOL MATCHING (สุ่มโจทย์ทุกครั้งที่เริ่มเกม) ===== */}
            {currentMissionIdx === 0 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white rounded-3xl p-6 shadow-lg shadow-blue-600/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/20 font-bold border border-white/30">
                        🎲 โหมดสุ่มโจทย์อัตโนมัติ (Random Generator)
                      </span>
                      <h3 className="text-xl font-black mt-2">
                        ลากวางบล็อกสัญลักษณ์ Flowchart ให้ตรงกับหน้าที่และรูปทรง!
                      </h3>
                      <p className="text-xs text-blue-100 mt-1">
                        👉 วิธีเล่น: ลากบล็อกสัญลักษณ์จากฝั่งขวามาปล่อย (Drop) ลงในช่องคำถามฝั่งซ้าย (หรือคลิกเพื่อส่งลงช่องว่างทันที)
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
                  
                  {/* Left Column: Drop Target Slots (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                      <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center space-x-2">
                        <Move className="w-5 h-5 text-blue-600" />
                        <span>ช่องเป้าหมายที่ต้องนำสัญลักษณ์มาวาง ({dragTargets.length} ช่อง)</span>
                      </h4>

                      <div className="space-y-3.5">
                        {dragTargets.map((target, idx) => {
                          const placed = dragPlacedAnswers[target.slotId];

                          return (
                            <div
                              key={target.slotId}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDropOnSlot(e, target.slotId)}
                              className={`p-4 rounded-2xl border-2 transition-all min-h-[105px] flex flex-col justify-between ${
                                placed 
                                  ? 'border-blue-400 bg-blue-50/50 shadow-sm' 
                                  : 'border-dashed border-blue-200 bg-slate-50/70 hover:bg-blue-50/30'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg">
                                      ช่องที่ {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                      หน้าที่: {target.category}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    💡 <strong>คำใบ้รูปทรง:</strong> {target.shapeName} ({target.hint})
                                  </p>
                                </div>

                                {placed && (
                                  <button
                                    onClick={() => handleRemoveFromSlot(target.slotId)}
                                    title="คลิกเพื่อนำออก"
                                    className="text-rose-500 hover:text-rose-700 bg-white p-1 rounded-lg border border-rose-200 shadow-xs"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Target Drop Content */}
                              <div className="mt-2 pt-2 border-t border-slate-200/60">
                                {placed ? (
                                  <div className="flex items-center space-x-2.5 text-xs font-bold text-blue-900 bg-white p-2 rounded-xl border border-blue-200 shadow-xs animate-fadeIn">
                                    <span className="text-lg">{placed.icon}</span>
                                    <span>{placed.symbolText}</span>
                                    <span className="ml-auto text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                      {placed.shapeName}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-center py-2 text-xs text-blue-400 font-semibold italic">
                                    ⬇️ ลากบล็อกสัญลักษณ์มาวางที่นี่ (Drop Here)
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Verify Button & Result */}
                      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                        <button
                          onClick={handleVerifyDragDrop}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 text-base"
                        >
                          <CheckSquare className="w-5 h-5" />
                          <span>ตรวจคำตอบการจับคู่ (Verify Matching)</span>
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

                  {/* Right Column: Available Draggable Items (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          <span>บล็อกสัญลักษณ์ที่ต้องนำไปวาง</span>
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
                              className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border-2 border-slate-200 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                  <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700">
                                    {item.symbolText}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    รูปทรง: <span className="text-blue-600 font-bold">{item.shapeName}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs bg-blue-600 text-white font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition shadow">
                                ลากเลย ➡️
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ===== LEVEL 2, 3, 4: PUZZLE FLOWCHART MISSIONS ===== */}
            {(currentMissionIdx >= 1 && currentMissionIdx <= 3) && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Canvas */}
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

                    {/* Canvas Slot Container */}
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
                              className="group cursor-pointer relative transition-all transform hover:scale-102"
                            >
                              <div className={`px-6 py-3 rounded-2xl shadow-md border-2 text-white font-bold text-sm min-w-[260px] flex items-center justify-between ${
                                block.shape === 'terminator' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 rounded-full' :
                                block.shape === 'decision' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-400' :
                                block.shape === 'inputOutput' ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400 transform -skew-x-6' :
                                'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-400'
                              }`}>
                                <span>{block.text}</span>
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{block.shape}</span>
                              </div>
                              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition bg-rose-500 text-white rounded-full p-1 shadow">
                                <XCircle className="w-4 h-4" />
                              </div>
                            </div>
                          </React.Fragment>
                        ))
                      )}
                    </div>

                    {/* Actions */}
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
                          {puzzleResult.success ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />}
                          <p className="text-sm font-bold">{puzzleResult.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Available Blocks */}
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

            {/* ===== LEVEL 5: 10-QUESTION QUIZ ===== */}
            {currentMissionIdx === 4 && (
              <div className="space-y-6">
                <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-300">
                        🏆 แบบทดสอบท้ายบท 10 ข้อ
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 mt-2">แบบทดสอบวัดผลสัมฤทธิ์ วิทยาการคำนวณ ป.6</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-500">ตอบไปแล้ว</div>
                      <div className="text-2xl font-black text-blue-700">{Object.keys(quizAnswers).length} / 10</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {QUIZ_QUESTIONS.map((q) => {
                    const selected = quizAnswers[q.id];
                    const isCorrect = selected === q.correctAnswer;
                    return (
                      <div key={q.id} className={`bg-white border rounded-3xl p-6 shadow-sm ${quizSubmitted ? (isCorrect ? 'border-emerald-300 bg-emerald-50/20' : 'border-rose-300 bg-rose-50/20') : 'border-blue-100'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-extrabold text-base text-slate-900">{q.question}</h4>
                          {quizSubmitted && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {isCorrect ? 'ถูกต้อง +1' : 'ผิด 0'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => handleSelectQuizOption(q.id, optIdx)}
                              className={`p-3.5 rounded-2xl border text-left text-sm font-semibold transition ${
                                selected === optIdx ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>

                        {quizSubmitted && (
                          <div className="mt-3 text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-700">
                            <strong className="text-blue-700">เฉลย: </strong>{q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Quiz Banner */}
                <div className="bg-white border border-blue-100 rounded-3xl p-6 text-center">
                  {!quizSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-blue-600/30 text-base"
                    >
                      ส่งคำตอบและดูผลคะแนน (10 ข้อ)
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-2xl font-black text-slate-900">คะแนนของคุณ: {calculateQuizScore()} / 10</h4>
                      <button
                        onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-6 rounded-xl border border-slate-300 text-xs"
                      >
                        ทำแบบทดสอบใหม่อีกครั้ง
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 2: FLOWCHART SANDBOX STUDIO (ห้องทดลองสร้างผังงาน) ================= */}
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

              {/* Add Block Toolbar */}
              <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 mr-2">+ เพิ่มบล็อก:</span>
                <button onClick={() => handleAddSandboxNode('terminator')} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs hover:bg-emerald-100">
                  🟢 เริ่ม/จบ
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

            {/* Sandbox Canvas & Console Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Canvas List */}
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
                      <div className="w-full max-w-md p-3.5 rounded-2xl border-2 border-blue-200 bg-slate-50 flex items-center justify-between shadow-xs">
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
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg border border-slate-200 bg-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Console Output */}
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
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">
                  📚 คู่มือสัญลักษณ์มาตรฐาน วิทยาการคำนวณ ป.6
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  สารานุกรมรูปทรงสัญลักษณ์ผังงาน (Flowchart Handbook)
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  สรุปความหมายและวิธีใช้งานสัญลักษณ์ผังงานมาตรฐาน ANSI/ISO ทุกรูปทรงสำหรับนักเรียนชั้น ป.6
                </p>
              </div>
            </div>

            {/* Symbol Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRIMARY_SYMBOLS.map((item) => (
                <div key={item.id} className="bg-white border border-blue-100 hover:border-blue-300 rounded-3xl p-6 transition shadow-sm">
                  <div className="h-28 bg-gradient-to-br from-blue-50/60 to-slate-50 rounded-2xl border border-blue-100 flex items-center justify-center p-4 mb-4">
                    <span className={`border-2 text-white font-bold text-xs px-6 py-2 rounded-xl shadow bg-gradient-to-r ${item.colorGradient}`}>
                      {item.name.split(' ')[0]}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">{item.icon} {item.name}</h4>
                  <p className="text-xs font-bold text-blue-600 mt-0.5">รูปทรง: {item.shapeName}</p>
                  <p className="text-xs text-slate-600 mt-2">{item.simpleExplain}</p>
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <strong>ตัวอย่าง: </strong>{item.example}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: VIDEO LEARNING ================= */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1 rounded-full border border-rose-200">
                    📺 ห้องเรียนรู้วิดีโอ ป.6 (YouTube Live Stream)
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">ดูคลิปการสอนผังงานแบบเรียลไทม์ในหน้านี้</h2>
                </div>

                <form onSubmit={handleLoadCustomUrl} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="วางลิงก์ YouTube ที่ต้องการ..."
                    value={customYoutubeUrl}
                    onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-60 sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow">
                    เปิดดูคลิป
                  </button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white border border-blue-100 rounded-3xl p-5 shadow-sm">
                <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video shadow-lg">
                  <iframe
                    className="w-full h-full absolute inset-0"
                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h3 className="text-lg font-black text-slate-900">{selectedVideo.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{selectedVideo.description}</p>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white border border-blue-100 rounded-3xl p-5 shadow-sm">
                <h4 className="font-extrabold text-slate-900 text-sm mb-3">บทเรียนวิดีโอแนะนำ</h4>
                <div className="space-y-3">
                  {VIDEO_LESSONS.map((video, idx) => (
                    <div
                      key={video.id}
                      onClick={() => { setSelectedVideo(video); setCustomVideoId(null); playSound('click', soundEnabled); }}
                      className="p-3 rounded-2xl border bg-slate-50 hover:bg-blue-50 cursor-pointer transition"
                    >
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-2">{video.title}</h5>
                      <span className="text-[10px] text-rose-600 font-bold mt-1 block">{video.creator} ({video.duration})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-blue-100 bg-white/90 py-5 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-700">Flowchart Lab ป.6 • ห้องทดลองผังงานและการแก้ปัญหา วิชาวิทยาการคำนวณ</p>
        <p className="mt-1 text-[11px]">ด่าน 1 Drag & Drop สุ่มโจทย์ใหม่ • ห้องทดลองสร้างผังงาน Sandbox • วิดีโอสด YouTube • แบบทดสอบ 10 ข้อ</p>
      </footer>
    </div>
  );
}
