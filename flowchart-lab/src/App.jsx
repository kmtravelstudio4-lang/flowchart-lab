import React, { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, CheckCircle2, XCircle, Award, Sparkles, 
  BookOpen, Layers, ArrowRight, ArrowDown, 
  Volume2, VolumeX, ChevronRight, Check,
  Zap, Terminal, ShieldAlert, Cpu, Lightbulb, Compass, Code2,
  Tv, Video, Search, ExternalLink, Bookmark, HelpCircle,
  FileText, CornerDownRight, RefreshCw, AlertCircle, Heart,
  Smile, Star, Trophy, Rocket, GraduationCap, CheckCircle
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
    } else if (type === 'success') {
      // Friendly celebration chord
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
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
    console.error("Audio playback error:", e);
  }
};

// --- Flowchart Symbols Guide for Grade 6 (ป.6) ---
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

// --- 3 Core Flowchart Structures Explained for Primary 6 ---
const PRIMARY_STRUCTURES = [
  {
    title: '1. โครงสร้างแบบเรียงลำดับ (Sequence)',
    subtitle: 'ทำทีละขั้น จากบนลงล่าง',
    icon: '⬇️',
    color: 'bg-blue-50/80 border-blue-200 text-blue-900',
    badge: 'bg-blue-600 text-white',
    desc: 'เป็นการทำงานเรียงตามลำดับทีละขั้นตอนจากบนลงล่างอย่างเป็นระเบียบ ไม่มีข้ามขั้น เช่น ขั้นตอนการต้มบะหมี่ หรือการแปรงฟัน',
    exampleSteps: ['1. เริ่มต้น (Start)', '2. บีบยาสีฟันใส่แปรง', '3. แปรงฟันให้ทั่ว 2 นาที', '4. บ้วนปากด้วยน้ำสะอาด', '5. สิ้นสุด (End)']
  },
  {
    title: '2. โครงสร้างแบบทางเลือก (Selection / If-Else)',
    subtitle: 'มีเงื่อนไขให้ตัดสินใจ จริง หรือ เท็จ',
    icon: '🔀',
    color: 'bg-indigo-50/80 border-indigo-200 text-indigo-900',
    badge: 'bg-indigo-600 text-white',
    desc: 'มีการตรวจสอบเงื่อนไข ถ้าเป็นจริงจะทำคำสั่งหนึ่ง ถ้าเป็นเท็จจะทำอีกคำสั่งหนึ่ง เช่น เช็กว่าคะแนนสอบถึง 50 หรือไม่',
    exampleSteps: ['1. รับคะแนนสอบ', '2. ตรวจสอบ คะแนน >= 50 ?', '3. ถ้าจริง -> แสดงผล "ผ่าน 🎉"', '4. ถ้าเท็จ -> แสดงผล "ต้องสอบซ่อม 📖"', '5. จบการทำงาน']
  },
  {
    title: '3. โครงสร้างแบบวนซ้ำ (Iteration / Loop)',
    subtitle: 'ทำซ้ำๆ จนกว่าจะครบตามเป้าหมาย',
    icon: '🔄',
    color: 'bg-violet-50/80 border-violet-200 text-violet-900',
    badge: 'bg-violet-600 text-white',
    desc: 'เป็นการสั่งให้ทำกิจกรรมเดิมซ้ำๆ หลายรอบ ตราบใดที่ยังเข้าเงื่อนไข เช่น ให้วิ่งรอบสนาม 3 รอบ หรือกระโดดตบ 5 ครั้ง',
    exampleSteps: ['1. ตั้งรอบเริ่มต้น รอบที่ = 1', '2. ตรวจสอบ รอบที่ <= 3 ?', '3. วิ่ง 1 รอบ และเพิ่มรอบที่ขึ้น 1', '4. วนกลับไปตรวจสอบรอบใหม่', '5. เมื่อครบ 3 รอบ ให้หยุด']
  }
];

// --- Missions Specifically Designed for Grade 6 Students ---
const MISSIONS = [
  {
    id: 1,
    title: 'ภารกิจที่ 1: หุ่นยนต์ชงนมสดหวานมัน 🥛',
    subtitle: 'โครงสร้างแบบเรียงลำดับ (Sequence)',
    level: 'ระดับ ป.6 พื้นฐาน',
    difficultyColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: '🥛',
    description: 'ช่วยน้องโค้ดดี้ (Cody Bot) จัดลำดับขั้นตอนการชงนมสดหวานมันแสนอร่อยให้ถูกต้องทีละสเต็ป!',
    expectedOutput: 'นมสดหวานมันพร้อมดื่มแล้ว!',
    correctOrderIds: ['m1_start', 'm1_step1', 'm1_step2', 'm1_step3', 'm1_step4', 'm1_end'],
    blocks: [
      { id: 'm1_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
      { id: 'm1_step1', text: 'เทนมสดรสจืดลงในแก้ว', shape: 'process' },
      { id: 'm1_step2', text: 'ตักน้ำตาล 1 ช้อนและคนให้ละลาย', shape: 'process' },
      { id: 'm1_step3', text: 'ใส่น้ำแข็งก้อนลงไปให้เต็มแก้ว', shape: 'process' },
      { id: 'm1_step4', text: 'แสดงผล "นมสดเย็นพร้อมเสิร์ฟ"', shape: 'display' },
      { id: 'm1_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
    ],
    executionTrace: [
      { step: 0, blockId: 'm1_start', msg: '🤖 น้องโค้ดดี้เริ่มเตรียมอุปกรณ์ชงนมสด', vars: { สถานะ: 'เริ่มภารกิจ' } },
      { step: 1, blockId: 'm1_step1', msg: '🥛 เทนมสดรสจืดปริมาณ 200 มล. ลงแก้ว', vars: { วัตถุดิบ: 'นมสดในแก้ว' } },
      { step: 2, blockId: 'm1_step2', msg: '🥄 ตักน้ำตาล 1 ช้อนโต๊ะ แล้วคนจนละลายหอมหวาน', vars: { ความหวาน: 'พอดี' } },
      { step: 3, blockId: 'm1_step3', msg: '🧊 ตักน้ำแข็งใส่แก้วจนเย็นชื่นใจ', vars: { ความเย็น: 'เย็นสดชื่น' } },
      { step: 4, blockId: 'm1_step4', msg: '🎉 แสดงผลหน้าจอ: นมสดหวานมันพร้อมดื่มแล้วจ้า!', vars: { เครื่องดื่ม: 'พร้อมเสิร์ฟ' } },
      { step: 5, blockId: 'm1_end', msg: '🏁 ภารกิจสำเร็จ ยอดเยี่ยมมากครับ!', vars: { สรุปผล: 'ผ่านด่าน 1' } }
    ]
  },
  {
    id: 2,
    title: 'ภารกิจที่ 2: เครื่องคิดเงินร้านขนมสหกรณ์ 🍰',
    subtitle: 'การรับค่าข้อมูล (Input) และคำนวณ (Process)',
    level: 'ระดับ ป.6 ปานกลาง',
    difficultyColor: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: '🍰',
    description: 'สร้างผังงานสำหรับคิดเงินค่าขนม โดยรับราคาขนม (ชิ้นละ 15 บาท) และจำนวนชิ้น (3 ชิ้น) แล้วคำนวณเงินรวม',
    expectedOutput: 'ยอดรวมเงินค่าขนม = 45 บาท',
    correctOrderIds: ['m2_start', 'm2_input', 'm2_calc', 'm2_display', 'm2_end'],
    blocks: [
      { id: 'm2_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
      { id: 'm2_input', text: 'รับค่า ราคาขนม (Price) และ จำนวนชิ้น (Qty)', shape: 'inputOutput' },
      { id: 'm2_calc', text: 'คำนวณ ราคารวม = Price × Qty', shape: 'process' },
      { id: 'm2_display', text: 'แสดงผลลัพธ์ ยอดเงินที่ต้องจ่าย', shape: 'display' },
      { id: 'm2_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
    ],
    executionTrace: [
      { step: 0, blockId: 'm2_start', msg: '🤖 เปิดระบบเครื่องคิดเงินร้านสหกรณ์', vars: {} },
      { step: 1, blockId: 'm2_input', msg: '📥 รับข้อมูล: ราคาขนม 15 บาท, ซื้อ 3 ชิ้น', vars: { Price: 15, Qty: 3 } },
      { step: 2, blockId: 'm2_calc', msg: '⚙️ คำนวณคณิตศาสตร์: 15 × 3 = 45 บาท', vars: { Price: 15, Qty: 3, Total: 45 } },
      { step: 3, blockId: 'm2_display', msg: '🖥️ หน้าจอแสดงยอดชำระ: "ยอดเงินรวม = 45 บาท"', vars: { Price: 15, Qty: 3, Total: 45 } },
      { step: 4, blockId: 'm2_end', msg: '🏁 ปริ้นต์ใบเสร็จและจบการคิดเงิน', vars: { สถานะ: 'จ่ายเงินเรียบร้อย' } }
    ]
  },
  {
    id: 3,
    title: 'ภารกิจที่ 3: เครื่องคัดกรองวัดไข้หน้าโรงเรียน 🩺',
    subtitle: 'โครงสร้างแบบตัดสินใจ (Decision / If-Else)',
    level: 'ระดับ ป.6 ท้าทาย',
    difficultyColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    icon: '🩺',
    description: 'ช่วยโรงเรียนคัดกรองวัดไข้ โดยสแกนอุณหภูมิ ถ้ามากกว่า 37.5°C ให้แจ้งพบครูพยาบาล ถ้าไม่เกินให้เข้าเรียนได้',
    expectedOutput: 'อุณหภูมิปกติ ยินดีต้อนรับเข้าโรงเรียน!',
    correctOrderIds: ['m3_start', 'm3_input', 'm3_decision', 'm3_output', 'm3_end'],
    blocks: [
      { id: 'm3_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
      { id: 'm3_input', text: 'สแกนวัดอุณหภูมิร่างกาย (Temp)', shape: 'inputOutput' },
      { id: 'm3_decision', text: 'ตรวจสอบเงื่อนไข Temp > 37.5 °C ?', shape: 'decision' },
      { id: 'm3_output', text: 'แสดงผล "ผ่านเข้าห้องเรียนได้" หรือ "พบคุณครูพยาบาล"', shape: 'display' },
      { id: 'm3_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
    ],
    executionTrace: [
      { step: 0, blockId: 'm3_start', msg: '🤖 เครื่องวัดไข้เปิดพร้อมทำงานหน้าประตูโรงเรียน', vars: {} },
      { step: 1, blockId: 'm3_input', msg: '📥 สแกนหน้าผากนักเรียน: ได้ค่า Temp = 36.6 °C', vars: { Temp: 36.6 } },
      { step: 2, blockId: 'm3_decision', msg: '🔶 ตรวจสอบ 36.6 > 37.5 หรือไม่? -> ผลคือ "เท็จ (ไม่ใช่)"', vars: { Temp: 36.6, มีไข้: 'ไม่มี' } },
      { step: 3, blockId: 'm3_output', msg: '🖥️ หน้าจอแสดงไฟเขียว: "อุณหภูมิปกติ เข้าห้องเรียนได้เลยครับ"', vars: { ผลการตรวจ: 'ผ่าน' } },
      { step: 4, blockId: 'm3_end', msg: '🏁 สิ้นสุดการตรวจคัดกรองนักเรียนคนนี้', vars: { สถานะ: 'เสร็จสิ้น' } }
    ]
  },
  {
    id: 4,
    title: 'ภารกิจที่ 4: หุ่นยนต์กระโดดตบ 5 ครั้ง ฟิตร่างกาย 🏃‍♂️',
    subtitle: 'โครงสร้างแบบวนซ้ำ (Loop / Repetition)',
    level: 'ระดับ ป.6 ผู้เชี่ยวชาญ',
    difficultyColor: 'text-violet-700 bg-violet-50 border-violet-200',
    icon: '🏃‍♂️',
    description: 'เขียนผังงานวนซ้ำ สั่งให้น้องโค้ดดี้กระโดดตบออกกำลังกายให้ครบ 5 ครั้ง โดยนับรอบ Count=1 ถึง 5',
    expectedOutput: 'กระโดดตบครบ 5 ครั้ง ร่างกายแข็งแรง!',
    correctOrderIds: ['m4_start', 'm4_init', 'm4_check', 'm4_action', 'm4_display', 'm4_end'],
    blocks: [
      { id: 'm4_start', text: 'เริ่มต้น (Start)', shape: 'terminator' },
      { id: 'm4_init', text: 'กำหนดตัวนับรอบ Count = 1', shape: 'process' },
      { id: 'm4_check', text: 'ตรวจสอบเงื่อนไข Count <= 5 ?', shape: 'decision' },
      { id: 'm4_action', text: 'กระโดดตบ 1 ครั้ง และเพิ่ม Count = Count + 1', shape: 'process' },
      { id: 'm4_display', text: 'แสดงผล "ออกกำลังกายครบ 5 ครั้งแล้ว!"', shape: 'display' },
      { id: 'm4_end', text: 'สิ้นสุด (End)', shape: 'terminator' }
    ],
    executionTrace: [
      { step: 0, blockId: 'm4_start', msg: '🤖 น้องโค้ดดี้เตรียมตัวออกกำลังกายคาบพละ', vars: {} },
      { step: 1, blockId: 'm4_init', msg: '⚙️ ตั้งค่าเริ่มต้น: ตัวนับรอบ Count = 1', vars: { Count: 1 } },
      { step: 2, blockId: 'm4_check', msg: '🔶 ตรวจสอบ 1 <= 5 (จริง) -> ให้เริ่มกระโดด', vars: { Count: 1 } },
      { step: 3, blockId: 'm4_action', msg: '🏃‍♂️ กระโดดตบครั้งที่ 1, 2, 3, 4, 5 จนครบ!', vars: { Count: 6, กระโดดครบ: '5 ครั้ง' } },
      { step: 4, blockId: 'm4_display', msg: '🖥️ แสดงผล: "เย้! กระโดดตบครบ 5 ครั้งแล้ว ร่างกายแข็งแรง"', vars: { สุขภาพ: 'แข็งแรง 100%' } },
      { step: 5, blockId: 'm4_end', msg: '🏁 จบคาบออกกำลังกายอย่างสมบูรณ์แบบ!', vars: { สรุปผล: 'สำเร็จ' } }
    ]
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
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'guide' | 'video'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Video Tab State
  const [selectedVideo, setSelectedVideo] = useState(VIDEO_LESSONS[0]);
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customVideoId, setCustomVideoId] = useState(null);

  // Game State
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);
  const [placedSlots, setPlacedSlots] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [completedMissions, setCompletedMissions] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simLogs, setSimLogs] = useState([]);
  const [simVars, setSimVars] = useState({});

  const currentMission = MISSIONS[currentMissionIdx];

  useEffect(() => {
    initMission(currentMissionIdx);
  }, [currentMissionIdx]);

  const initMission = (idx) => {
    const mission = MISSIONS[idx];
    const shuffled = [...mission.blocks].sort(() => Math.random() - 0.5);
    setAvailableBlocks(shuffled);
    setPlacedSlots([]);
    setGameResult(null);
    setIsSimulating(false);
    setSimStep(0);
    setSimLogs([]);
    setSimVars({});
  };

  const handleSelectBlock = (block) => {
    playSound('click', soundEnabled);
    if (isSimulating) return;
    setAvailableBlocks(prev => prev.filter(b => b.id !== block.id));
    setPlacedSlots(prev => [...prev, block]);
    setGameResult(null);
  };

  const handleRemoveBlock = (index) => {
    playSound('click', soundEnabled);
    if (isSimulating) return;
    const blockToRemove = placedSlots[index];
    setPlacedSlots(prev => prev.filter((_, i) => i !== index));
    setAvailableBlocks(prev => [...prev, blockToRemove]);
    setGameResult(null);
  };

  const handleVerify = () => {
    if (placedSlots.length === 0) {
      playSound('error', soundEnabled);
      setGameResult({
        success: false,
        message: 'น้องๆ อย่าลืมคลิกเลือกบล็อกผังงานมาวางก่อนทดสอบนะจ๊ะ! 😊'
      });
      return;
    }

    const currentIds = placedSlots.map(b => b.id);
    const targetIds = currentMission.correctOrderIds;

    const isMatch = currentIds.length === targetIds.length && 
                    currentIds.every((id, idx) => id === targetIds[idx]);

    if (isMatch) {
      playSound('success', soundEnabled);
      setGameResult({
        success: true,
        message: `🌟 เยี่ยมยอดมากครับน้อง ป.6! เรียงลำดับผังงานของ "${currentMission.title}" ได้ถูกต้อง 100% เต็ม!`
      });
      setCompletedMissions(prev => ({ ...prev, [currentMission.id]: true }));
      startSimulation();
    } else {
      playSound('error', soundEnabled);
      setGameResult({
        success: false,
        message: '💡 ลำดับขั้นตอนยังไม่ถูกต้องนะ ลองตรวจดูจุดเริ่มต้น สิ้นสุด และลำดับการทำงานใหม่อีกรอบนะครับ สู้ๆ!'
      });
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setSimStep(0);
    setSimLogs([]);
    setSimVars({});

    const trace = currentMission.executionTrace;
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < trace.length) {
        const item = trace[stepIndex];
        setSimStep(stepIndex);
        setSimLogs(prev => [...prev, item.msg]);
        setSimVars(item.vars || {});
        playSound('step', soundEnabled);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1100);
  };

  const handleAutoSolve = () => {
    playSound('click', soundEnabled);
    const correctMap = new Map(currentMission.blocks.map(b => [b.id, b]));
    const ordered = currentMission.correctOrderIds.map(id => correctMap.get(id));
    setPlacedSlots(ordered);
    setAvailableBlocks([]);
    setGameResult({
      success: true,
      message: '✨ ใส่เฉลยลำดับผังงานที่ถูกต้องให้น้องๆ แล้วจ้า! กดปุ่ม "รันผังงาน" เพื่อดูหุ่นยนต์ทำงานได้เลย'
    });
  };

  const handleLoadCustomUrl = (e) => {
    e.preventDefault();
    if (!customYoutubeUrl.trim()) return;
    
    let id = customYoutubeUrl.trim();
    if (id.includes('v=')) {
      id = id.split('v=')[1].split('&')[0];
    } else if (id.includes('youtu.be/')) {
      id = id.split('youtu.be/')[1].split('?')[0];
    } else if (id.includes('embed/')) {
      id = id.split('embed/')[1].split('?')[0];
    }

    setCustomVideoId(id);
    setSelectedVideo({
      id: 'custom',
      title: 'วิดีโอการสอนที่นักเรียนเลือกเอง (Custom Video)',
      creator: 'YouTube Embed',
      duration: 'กำหนดเอง',
      youtubeId: id,
      description: 'กำลังเปิดดูวิดีโอที่คุณครูหรือนักเรียนระบุไว้ในหน้านี้',
      keyPoints: ['ดูคลิปการสอนผังงานแบบเรียลไทม์ได้โดยตรงในหน้านี้']
    });
  };

  const activeVideoId = customVideoId || selectedVideo.youtubeId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-white to-sky-50 text-slate-800 font-['Prompt',sans-serif] antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* --- Top Navigation Header (Bright & Friendly Grade 6 Theme) --- */}
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
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200 shadow-xs">
                  วิทยาการคำนวณ
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">ห้องเรียนรู้และเกมผังงานมหาสนุก สำหรับนักเรียนชั้นประถมศึกษาปีที่ 6</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => { setActiveTab('game'); playSound('click', soundEnabled); }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'game' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>เกมภารกิจ ป.6</span>
                {Object.keys(completedMissions).length > 0 && (
                  <span className="ml-1 text-xs bg-amber-400 text-slate-900 font-black px-1.5 py-0.2 rounded-full">
                    {Object.keys(completedMissions).length}/{MISSIONS.length} ★
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('guide'); playSound('click', soundEnabled); }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'guide' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>คู่มือสัญลักษณ์</span>
              </button>

              <button
                onClick={() => { setActiveTab('video'); playSound('click', soundEnabled); }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'video' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Tv className="w-4 h-4 text-rose-500" />
                <span>ดูวิดีโอสอน ป.6</span>
              </button>
            </nav>

            {/* Sound Switcher */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm transition"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Workspace Area --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* ================= TAB 1: GRADE 6 GAME MISSIONS ================= */}
        {activeTab === 'game' && (
          <div className="space-y-6">
            
            {/* Level Selector Banner */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    {currentMission.icon}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-blue-600 font-bold mb-0.5 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{currentMission.subtitle}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                      <span>{currentMission.title}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${currentMission.difficultyColor}`}>
                        {currentMission.level}
                      </span>
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">{currentMission.description}</p>
                  </div>
                </div>

                {/* Level Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
                  {MISSIONS.map((m, idx) => {
                    const isDone = completedMissions[m.id];
                    const isCurrent = idx === currentMissionIdx;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setCurrentMissionIdx(idx);
                          playSound('click', soundEnabled);
                        }}
                        className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all border shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30'
                            : isDone
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>ด่าน {m.id}</span>
                        {isDone && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Layout: Left Canvas (7 cols) + Right Tools (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Flowchart Canvas Area */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
                      <h3 className="font-extrabold text-slate-900 text-base">
                        กระดานผังงานของน้องๆ (Flowchart Canvas)
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleAutoSolve}
                        className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold transition flex items-center space-x-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>เฉลยคำตอบ</span>
                      </button>
                      <button
                        onClick={() => initMission(currentMissionIdx)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold transition flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>เริ่มใหม่</span>
                      </button>
                    </div>
                  </div>

                  {/* Flowchart Drop Slot Container */}
                  <div className="space-y-3 min-h-[380px] bg-gradient-to-b from-blue-50/40 to-slate-50/60 rounded-3xl p-6 border-2 border-dashed border-blue-200/80 flex flex-col items-center justify-start">
                    {placedSlots.length === 0 ? (
                      <div className="my-auto text-center py-12 px-4">
                        <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-3 shadow-sm text-3xl">
                          🧩
                        </div>
                        <p className="font-extrabold text-slate-800 text-base">กระดานผังงานยังว่างอยู่ครับ</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                          คลิกเลือกบล็อกสัญลักษณ์จากกล่อง "บล็อกคำสั่งที่พร้อมใช้งาน" ทางขวา เพื่อนำมาจัดเรียงผังงานทีละขั้นตอน
                        </p>
                      </div>
                    ) : (
                      placedSlots.map((block, index) => {
                        const isNodeActive = isSimulating && simStep === index;

                        return (
                          <React.Fragment key={`${block.id}-${index}`}>
                            {/* Visual Connecting Arrow */}
                            {index > 0 && (
                              <div className="flex flex-col items-center my-0.5">
                                <div className={`w-0.5 h-4 ${isNodeActive ? 'bg-blue-600' : 'bg-blue-300'}`} />
                                <ArrowDown className={`w-4 h-4 -mt-1 ${isNodeActive ? 'text-blue-600 animate-bounce' : 'text-blue-400'}`} />
                              </div>
                            )}

                            {/* Node Block Shape Card */}
                            <div 
                              onClick={() => handleRemoveBlock(index)}
                              title="คลิกเพื่อนำบล็อกออกจากผังงาน"
                              className={`group cursor-pointer relative transition-all duration-300 transform hover:scale-102 ${
                                isNodeActive 
                                  ? 'ring-4 ring-blue-500 shadow-xl shadow-blue-500/30 scale-105' 
                                  : 'hover:border-rose-400'
                              }`}
                            >
                              {block.shape === 'decision' ? (
                                <div className="py-2">
                                  <div className="relative border-2 border-indigo-400 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 rounded-2xl shadow-md flex items-center justify-center space-x-2">
                                    <span className="text-sm font-bold">{block.text}</span>
                                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold">
                                      ตัดสินใจ ?
                                    </span>
                                  </div>
                                </div>
                              ) : block.shape === 'inputOutput' ? (
                                <div className="border-2 border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-7 py-3 rounded-xl shadow-md flex items-center justify-between space-x-4 min-w-[280px] transform -skew-x-6">
                                  <div className="transform skew-x-6 flex items-center space-x-2">
                                    <span className="text-base">▱</span>
                                    <span className="text-sm font-bold">{block.text}</span>
                                  </div>
                                  <span className="transform skew-x-6 text-[10px] bg-black/20 text-white px-2 py-0.5 rounded-full font-bold">รับ/แสดงค่า</span>
                                </div>
                              ) : block.shape === 'terminator' ? (
                                <div className="border-2 border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-full shadow-md flex items-center justify-center space-x-2 min-w-[260px]">
                                  <span className="text-sm font-bold">{block.text}</span>
                                  <span className="text-xs text-emerald-200">●</span>
                                </div>
                              ) : (
                                <div className="border-2 border-blue-400 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3.5 rounded-2xl shadow-md flex items-center justify-between space-x-3 min-w-[280px]">
                                  <span className="text-sm font-bold">{block.text}</span>
                                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">การปฏิบัติงาน</span>
                                </div>
                              )}

                              {/* Hover badge to remove */}
                              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition bg-rose-500 text-white rounded-full p-1 shadow-md">
                                <XCircle className="w-4 h-4" />
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>

                  {/* Actions & Result Display */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={handleVerify}
                        disabled={isSimulating}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50 text-base"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>ตรวจคำตอบ & รันผังงาน (Simulate)</span>
                      </button>

                      {currentMissionIdx < MISSIONS.length - 1 && completedMissions[currentMission.id] && (
                        <button
                          onClick={() => {
                            setCurrentMissionIdx(prev => prev + 1);
                            playSound('click', soundEnabled);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-5 rounded-2xl flex items-center space-x-1.5 shadow-lg shadow-emerald-600/25 transition animate-bounce"
                        >
                          <span>ไปด่านถัดไป</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Result Banner */}
                    {gameResult && (
                      <div className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all ${
                        gameResult.success 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                      }`}>
                        {gameResult.success ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-bold">{gameResult.message}</p>
                          {gameResult.success && (
                            <p className="text-xs text-emerald-700 mt-1 font-medium">
                              🤖 หุ่นยนต์กำลังจำลองการรันผังงานทีละขั้นตอนในกล่องด้านขวามือครับ
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Available Blocks + Live Console */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Available Blocks Pool */}
                <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-blue-600" />
                      <h3 className="font-extrabold text-slate-900 text-base">บล็อกคำสั่งที่พร้อมใช้งาน</h3>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold">
                      เหลือ {availableBlocks.length} บล็อก
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">👉 คลิกบล็อกด้านล่างเพื่อนำไปเรียงในผังงานตามลำดับขั้นตอน</p>

                  <div className="space-y-2.5 min-h-[170px]">
                    {availableBlocks.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                        <p className="text-sm font-black text-emerald-800">นำบล็อกทั้งหมดไปวางบนผังงานแล้วจ้า!</p>
                        <p className="text-xs text-emerald-600 mt-0.5">กดปุ่มสีน้ำเงิน "ตรวจคำตอบ & รันผังงาน" ได้เลย</p>
                      </div>
                    ) : (
                      availableBlocks.map((block) => (
                        <div
                          key={block.id}
                          onClick={() => handleSelectBlock(block)}
                          className="group p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">
                              {block.shape === 'terminator' ? '🟢' : block.shape === 'decision' ? '🔶' : block.shape === 'inputOutput' ? '▱' : '🟦'}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition">
                                {block.text}
                              </p>
                              <span className="text-[10px] px-2 py-0.5 rounded-md border font-bold bg-blue-50 text-blue-700 border-blue-200">
                                {block.shape === 'terminator' ? 'เริ่มต้น/จบ' : block.shape === 'decision' ? 'การตัดสินใจ' : block.shape === 'inputOutput' ? 'รับ/แสดงผล' : 'การทำงาน'}
                              </span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition p-1.5 bg-blue-600 text-white rounded-xl shadow">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Simulation Terminal & Variable Watcher */}
                <div className="bg-white border border-blue-100 rounded-3xl p-5 shadow-sm shadow-blue-500/5">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      <span className="font-extrabold text-slate-900 text-sm">การทำงานของหุ่นยนต์ (Simulator)</span>
                    </div>
                    {isSimulating && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                        <span>รันขั้นตอนที่ #{simStep + 1}</span>
                      </span>
                    )}
                  </div>

                  {/* Variables Watch Card */}
                  <div className="bg-gradient-to-r from-blue-50/90 to-sky-50/90 p-3 rounded-2xl border border-blue-100 mb-3">
                    <div className="text-xs text-blue-800 font-bold mb-1.5 flex items-center space-x-1">
                      <Code2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>ค่าตัวแปรในระบบ (Live Variables):</span>
                    </div>
                    {Object.keys(simVars).length === 0 ? (
                      <p className="text-slate-400 text-xs italic">ยังไม่มีตัวแปรที่กำลังประมวลผล</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(simVars).map(([k, v]) => (
                          <span key={k} className="text-xs bg-white px-2.5 py-1 rounded-xl border border-blue-200 text-blue-900 font-bold shadow-xs">
                            {k}: <strong className="text-indigo-600 font-black">{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Terminal Log Output */}
                  <div className="space-y-2 text-xs bg-slate-900 text-emerald-400 p-4 rounded-2xl min-h-[110px] max-h-[140px] overflow-y-auto shadow-inner font-mono">
                    {simLogs.length === 0 ? (
                      <p className="text-slate-500 italic">กดปุ่ม "ตรวจคำตอบ & รันผังงาน" เพื่อดูน้องโค้ดดี้ทำงานแบบสดๆ</p>
                    ) : (
                      simLogs.map((log, i) => (
                        <div key={i} className="flex items-start space-x-2 animate-fadeIn">
                          <span className="text-blue-400 font-bold">&gt;</span>
                          <span className="text-slate-100">{log}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 2: GRADE 6 FLOWCHART HANDBOOK ================= */}
        {activeTab === 'guide' && (
          <div className="space-y-8">
            
            {/* Guide Header Banner */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm shadow-blue-500/5">
              <div className="max-w-4xl">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>หลักสูตรวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 6</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  คู่มือสัญลักษณ์ผังงาน (Flowchart) ฉบับเข้าใจง่ายสำหรับ ป.6
                </h2>
                <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed font-normal">
                  ผังงาน (Flowchart) คือ การใช้รูปภาพสัญลักษณ์แทนลำดับขั้นตอนการแก้ปัญหาหรือการสั่งงานคอมพิวเตอร์ ช่วยให้เรามองเห็นภาพรวม คิดอย่างเป็นขั้นตอน และแก้ปัญหาได้อย่างถูกต้องแม่นยำ
                </p>
              </div>
            </div>

            {/* 1. All Standard Symbols for Grade 6 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">
                  สัญลักษณ์ผังงานที่น้องๆ ป.6 ต้องรู้ ({PRIMARY_SYMBOLS.length} สัญลักษณ์หลัก)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PRIMARY_SYMBOLS.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-blue-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 rounded-3xl p-6 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Visual Shape Preview Box */}
                      <div className="h-32 bg-gradient-to-br from-blue-50/50 via-slate-50 to-sky-50/30 rounded-2xl border border-blue-100 flex items-center justify-center p-4 mb-4">
                        {item.shapeType === 'oval' && (
                          <div className={`border-2 border-emerald-400 bg-gradient-to-r ${item.colorGradient} text-white px-7 py-2.5 rounded-full text-xs font-bold shadow-md`}>
                            เริ่มต้น / สิ้นสุด
                          </div>
                        )}
                        {item.shapeType === 'rectangle' && (
                          <div className={`border-2 border-blue-400 bg-gradient-to-r ${item.colorGradient} text-white px-7 py-3 rounded-xl text-xs font-bold shadow-md`}>
                            การปฏิบัติงาน / คำนวณ
                          </div>
                        )}
                        {item.shapeType === 'parallelogram' && (
                          <div className={`border-2 border-amber-400 bg-gradient-to-r ${item.colorGradient} text-white px-7 py-2.5 rounded-lg transform -skew-x-12 text-xs font-bold shadow-md`}>
                            <span className="transform skew-x-12 inline-block">รับข้อมูล / แสดงผล</span>
                          </div>
                        )}
                        {item.shapeType === 'diamond' && (
                          <div className={`border-2 border-indigo-400 bg-gradient-to-r ${item.colorGradient} text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md`}>
                            เงื่อนไขตัดสินใจ ?
                          </div>
                        )}
                        {item.shapeType === 'displayShape' && (
                          <div className={`border-2 border-cyan-400 bg-gradient-to-r ${item.colorGradient} text-white px-6 py-2.5 rounded-l-2xl rounded-r-sm text-xs font-bold shadow-md`}>
                            แสดงผลทางหน้าจอ
                          </div>
                        )}
                        {item.shapeType === 'circle' && (
                          <div className={`border-2 border-rose-400 bg-gradient-to-r ${item.colorGradient} text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md`}>
                            A
                          </div>
                        )}
                        {item.shapeType === 'arrow' && (
                          <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
                            <span className="w-12 h-1 bg-slate-700 rounded-full" />
                            <ArrowRight className="w-6 h-6 text-slate-800 -ml-2" />
                          </div>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </h4>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        รูปทรง: {item.shapeName}
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
                      <span className="text-[10px] text-slate-400 font-medium">วิทยาการคำนวณ ป.6</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Core 3 Flowchart Control Structures */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm shadow-blue-500/5">
              <div className="flex items-center space-x-2 mb-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-black text-slate-900">
                  โครงสร้างผังงาน 3 รูปแบบหลักที่ ป.6 ต้องรู้
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                การแก้ปัญหาและการเขียนโปรแกรมทุกอย่าง จะประกอบด้วย 3 รูปแบบโครงสร้างนี้เสมอ
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PRIMARY_STRUCTURES.map((struct, idx) => (
                  <div key={idx} className={`border rounded-3xl p-6 ${struct.color} flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{struct.icon}</span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${struct.badge}`}>
                          รูปแบบที่ {idx + 1}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base mb-1">{struct.title}</h4>
                      <p className="text-xs font-bold text-blue-600 mb-2">{struct.subtitle}</p>
                      <p className="text-xs leading-relaxed opacity-90 mb-4 font-normal">{struct.desc}</p>
                      
                      <div className="space-y-1.5 text-xs font-bold bg-white/80 p-3.5 rounded-2xl border border-slate-200/60 mb-3">
                        <div className="text-[10px] text-slate-500 font-normal mb-1">ลำดับขั้นตอนตัวอย่าง:</div>
                        {struct.exampleSteps.map((st, sIdx) => (
                          <div key={sIdx} className="flex items-center space-x-1.5 text-slate-800">
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Friendly Tips for Writing Flowcharts */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-600/20">
              <h3 className="text-lg font-black flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>เคล็ดลับ 4 ข้อง่ายๆ ในการวาดผังงานให้ได้คะแนนเต็ม 💯</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/15">
                  <div className="font-black text-amber-300 text-sm mb-1">1. เริ่มและจบเสมอ</div>
                  <p className="text-blue-100">อย่าลืมใส่ "เริ่มต้น" ที่หัว และ "สิ้นสุด" ที่ท้ายผังงานทุกครั้ง</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/15">
                  <div className="font-black text-amber-300 text-sm mb-1">2. มีหัวลูกศรชี้</div>
                  <p className="text-blue-100">เส้นเชื่อมทุกเส้นต้องมีหัวลูกศรชี้ทิศทางเสมอ จากบนลงล่าง</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/15">
                  <div className="font-black text-amber-300 text-sm mb-1">3. สัญลักษณ์ถูกต้อง</div>
                  <p className="text-blue-100">ใช้สี่เหลี่ยมผืนผ้าเมื่อคำนวณ และใช้ข้าวหลามตัดเมื่อตัดสินใจ</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/15">
                  <div className="font-black text-amber-300 text-sm mb-1">4. ข้อความสั้นกระชับ</div>
                  <p className="text-blue-100">เขียนข้อความสั้นๆ ได้ใจความ ไม่เขียนยาวจนล้นรูปสัญลักษณ์</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: GRADE 6 VIDEO LESSONS ================= */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            
            {/* Header Video Bar */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-500/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 mb-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>ห้องเรียนรู้วิดีโอและการสอนสด (Grade 6 Video Classroom)</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    ดูวิดีโอคลิปการสอนผังงาน ป.6 แบบเข้าใจง่าย
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    คลิกเลือกบทเรียน ป.6 ด้านล่าง หรือวางลิงก์ YouTube ที่ต้องการเพื่อเปิดดูในหน้านี้ได้ทันที
                  </p>
                </div>

                {/* Custom YouTube URL input form */}
                <form onSubmit={handleLoadCustomUrl} className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="วางลิงก์ YouTube ที่ต้องการ..."
                      value={customYoutubeUrl}
                      onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-60 sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-rose-600/20 flex items-center space-x-1"
                  >
                    <span>เปิดดู</span>
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </form>
              </div>
            </div>

            {/* Video Main Player + Playlist Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Embedded Real-time YouTube Player (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-blue-100 rounded-3xl p-5 shadow-sm shadow-blue-500/5">
                  
                  {/* YouTube Embed Container */}
                  <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video shadow-lg border border-slate-800">
                    <iframe
                      className="w-full h-full absolute inset-0"
                      src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* Video Details Box */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedVideo.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 font-bold flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>{selectedVideo.creator}</span>
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          ⏱️ {selectedVideo.duration}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-normal">
                      {selectedVideo.description}
                    </p>

                    {/* Key takeaways for Grade 6 */}
                    <div className="mt-4 bg-gradient-to-r from-blue-50/80 to-sky-50/80 p-4 rounded-2xl border border-blue-100">
                      <div className="text-xs font-black text-blue-900 mb-2 flex items-center space-x-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                        <span>สรุปหัวใจสำคัญของบทเรียนนี้ (Key Takeaways):</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                        {selectedVideo.keyPoints.map((point, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Video Playlist Selector (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-blue-100 rounded-3xl p-5 shadow-sm shadow-blue-500/5">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Tv className="w-4 h-4 text-blue-600" />
                      <h4 className="font-extrabold text-slate-900 text-sm">บทเรียนวิดีโอ ป.6</h4>
                    </div>
                    <span className="text-[11px] text-slate-500 font-bold">
                      {VIDEO_LESSONS.length} ตอน
                    </span>
                  </div>

                  <div className="space-y-3">
                    {VIDEO_LESSONS.map((video, idx) => {
                      const isSelected = selectedVideo.id === video.id && !customVideoId;
                      return (
                        <div
                          key={video.id}
                          onClick={() => {
                            setSelectedVideo(video);
                            setCustomVideoId(null);
                            playSound('click', soundEnabled);
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-400 shadow-md shadow-blue-500/10 ring-2 ring-blue-400/20'
                              : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'bg-blue-600 text-white shadow' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isSelected ? <Play className="w-4 h-4 fill-current" /> : <span className="font-bold text-xs">#{idx + 1}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-xs font-bold line-clamp-2 leading-snug ${
                                isSelected ? 'text-blue-900' : 'text-slate-800'
                              }`}>
                                {video.title}
                              </h5>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                                <span className="text-rose-600 font-bold">{video.creator}</span>
                                <span>{video.duration}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* External YouTube Shortcut Button */}
                  <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                    <a
                      href="https://www.youtube.com/results?search_query=%E0%B8%9C%E0%B8%B1%E0%B8%87%E0%B8%87%E0%B8%B2%E0%B8%99+Flowchart+%E0%B8%9B.6+%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%84%E0%B8%B3%E0%B8%99%E0%B8%A7%E0%B8%93"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      <span>ค้นหาคลิปสอนผังงาน ป.6 เพิ่มเติม</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* --- Global Footer --- */}
      <footer className="border-t border-blue-100 bg-white/90 py-5 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-700">Flowchart Lab ป.6 • ห้องทดลองผังงานและการแก้ปัญหา วิชาวิทยาการคำนวณ</p>
        <p className="mt-1 text-[11px]">ดีไซน์สว่างสีขาว-น้ำเงินสดใส • ฟอนต์ Prompt ทันสมัย • รองรับการดู YouTube แบบเรียลไทม์</p>
      </footer>
    </div>
  );
}
