// ==============================================================================
// FLOWCHART QUEST — CORE GAME ENGINE & LEARNING PROGRESSION
// Stage Configurations, Timer State Machine, Attempt & Feedback Model
// Philosophy: Learning Attempt over Game Over. Wrong answers NEVER lock progress.
// ==============================================================================

export const TIMER_STATES = {
  NOT_STARTED: 'NOT_STARTED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  TIME_UP: 'TIME_UP',
  COMPLETED: 'COMPLETED'
};

export const STAGES_CONFIG = [
  {
    index: 1,
    id: 'pretest',
    stageNumber: 1,
    title: 'ภารกิจที่ 1: สำรวจความรู้ก่อนเรียน',
    subtitle: 'วัดความรู้พื้นฐานก่อนออกผจญภัยในโลกผังงาน',
    timeLimit: 300, // 5 minutes
    allowContinueOnWrong: true,
    category: 'pretest'
  },
  {
    index: 2,
    id: 'learning',
    stageNumber: 2,
    title: 'ภารกิจที่ 2: ห้องเรียนรู้สื่อและสัญลักษณ์',
    subtitle: 'ทำความเข้าใจความหมายและหน้าที่ของสัญลักษณ์ Flowchart',
    timeLimit: 600, // 10 minutes
    allowContinueOnWrong: true,
    category: 'concept'
  },
  {
    index: 3,
    id: 'mission1',
    stageNumber: 3,
    title: 'ภารกิจที่ 3: ตามล่าสัญลักษณ์ (Symbol Hunter)',
    subtitle: 'จับคู่สัญลักษณ์ผังงานและข้อความการทำงานให้ถูกต้อง',
    timeLimit: 120, // 2 minutes
    allowContinueOnWrong: true,
    category: 'matching'
  },
  {
    index: 4,
    id: 'mission2',
    stageNumber: 4,
    title: 'ภารกิจที่ 4: เรียงลำดับขั้นตอน (Sequence Master)',
    subtitle: 'จัดลำดับผังงานแบบลำดับ (Sequence) จากบนลงล่าง',
    timeLimit: 180, // 3 minutes
    allowContinueOnWrong: true,
    category: 'sequence'
  },
  {
    index: 5,
    id: 'mission3',
    stageNumber: 5,
    title: 'ภารกิจที่ 5: ทางแยกตัดสินใจ (Decision Matrix)',
    subtitle: 'วิเคราะห์เงื่อนไข จริง (True) หรือ เท็จ (False)',
    timeLimit: 180, // 3 minutes
    allowContinueOnWrong: true,
    category: 'decision'
  },
  {
    index: 6,
    id: 'mission4',
    stageNumber: 6,
    title: 'ภารกิจที่ 7: วงวนทำซ้ำ (Loop Detective)',
    subtitle: 'ติดตามค่าตัวแปรและการทำงานวนซ้ำอย่างเป็นระบบ',
    timeLimit: 240, // 4 minutes
    allowContinueOnWrong: true,
    category: 'loop'
  },
  {
    index: 7,
    id: 'final',
    stageNumber: 7,
    title: 'ภารกิจที่ 7: วิศวกรผังงาน (Algorithm Forge)',
    subtitle: 'ประกอบผังงานแก้ปัญหาในชีวิตประจำวันแบบครบวงจร',
    timeLimit: 300, // 5 minutes
    allowContinueOnWrong: true,
    category: 'synthesis'
  },
  {
    index: 8,
    id: 'posttest',
    stageNumber: 8,
    title: 'ภารกิจที่ 8: ประเมินความรู้หลังเรียน (Post-Test)',
    subtitle: 'ทดสอบความเข้าใจและรับเกียรติบัตรการเรียนรู้',
    timeLimit: 300, // 5 minutes
    allowContinueOnWrong: true,
    category: 'posttest'
  }
];

/**
 * Helper to get Stage config by id
 */
export const getStageConfig = (stageId) => {
  return STAGES_CONFIG.find(s => s.id === stageId) || {
    id: stageId,
    stageNumber: 1,
    title: `ภารกิจ ${stageId}`,
    subtitle: 'การเรียนรู้ผังงาน',
    timeLimit: 180,
    allowContinueOnWrong: true
  };
};

/**
 * Format Seconds into MM:SS
 */
export const formatTimeMMSS = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Feedback Explanations for Common Flowchart Concepts
 */
export const FEEDBACK_EXPLANATIONS = {
  start_end: {
    correct: 'ยอดเยี่ยมมาก! สัญลักษณ์ Terminal (วงรี/ขอบมน) ใช้สำหรับจุดเริ่มต้น (Start) และจุดสิ้นสุด (Stop/End) ของผังงานเสมอ',
    wrong: 'สัญลักษณ์จุดเริ่มต้นและจุดสิ้นสุด ต้องใช้ Terminal (วงรีขอบมน) เพื่อระบุจุดเปิดและปิดการทำงานของโปรแกรม'
  },
  process: {
    correct: 'ถูกต้องเลย! สัญลักษณ์ Process (สี่เหลี่ยมผืนผ้า) ใช้สำหรับประมวลผล คำนวณ หรือกำหนดค่า',
    wrong: 'การประมวลผล คำนวณ หรือการกระทำทั่วไป ควรใช้สัญลักษณ์ Process (สี่เหลี่ยมผืนผ้า)'
  },
  decision: {
    correct: 'เก่งมาก! สัญลักษณ์ Decision (สี่เหลี่ยมข้าวหลามตัด/เพชร) ใช้สำหรับการตรวจสอบเงื่อนไข ซึ่งจะมีเส้นทางออกอย่างน้อย 2 ทางเสมอ (จริง / เท็จ)',
    wrong: 'การตัดสินใจหรือเปรียบเทียบเงื่อนไข ต้องใช้ Decision (สี่เหลี่ยมข้าวหลามตัด) และต้องมีทางออกสำหรับ จริง (Yes/True) และ เท็จ (No/False)'
  },
  input_output: {
    correct: 'ถูกต้อง! สัญลักษณ์ Input/Output (สี่เหลี่ยมด้านขนาน) ใช้สำหรับการรับข้อมูลเข้าหรือแสดงผลข้อมูล',
    wrong: 'การรับข้อมูลเข้า (Input) หรือแสดงผลข้อมูล (Output) แบบไม่ระบุอุปกรณ์ ต้องใช้รูปสี่เหลี่ยมด้านขนาน'
  },
  connector: {
    correct: 'ยอดเยี่ยม! สัญลักษณ์ Connector (วงกลมเล็ก) ใช้สำหรับจุดเชื่อมต่อเส้นทางการไหลบนหน้าเดียวกัน',
    wrong: 'จุดเชื่อมต่อผังงานเพื่อรวมเส้นทางที่ไหลมาเจอกัน นิยมใช้วงกลมเล็ก (On-page Connector)'
  },
  flowline: {
    correct: 'ถูกต้อง! Flowline (ลูกศร) แสดงทิศทางการทำงานจากบนลงล่าง หรือซ้ายไปขวา',
    wrong: 'ทิศทางการไหลของข้อมูลต้องมีหัวลูกศรกำกับเสมอ เพื่อให้ผู้อ่านทราบลำดับขั้นตอนที่ถูกต้อง'
  },
  default: {
    correct: 'ยินดีด้วย! คุณตอบได้ถูกต้องและเข้าใจหลักการคิดอย่างเป็นระบบแล้ว',
    wrong: 'ไม่เป็นไรเลย! การเรียนรู้ผังงานเกิดจากการสังเกตและทดลองทำ สามารถไปต่อได้ทันที'
  }
};

/**
 * Get Contextual Feedback Object
 */
export const getContextualFeedback = (conceptKey = 'default', isCorrect = false, customExplanation = '') => {
  const catalog = FEEDBACK_EXPLANATIONS[conceptKey] || FEEDBACK_EXPLANATIONS.default;
  if (isCorrect) {
    return {
      isCorrect: true,
      title: '🎉 ถูกต้องแล้ว!',
      badgeText: 'ตอบถูกต้อง',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      message: customExplanation || catalog.correct,
      buttonText: 'ไปต่อภารกิจถัดไป →',
      canContinue: true
    };
  }
  return {
    isCorrect: false,
    title: '💡 เรียนรู้เพิ่มเติม',
    badgeText: 'ร่วมเรียนรู้',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    message: customExplanation || catalog.wrong,
    buttonText: 'เข้าใจแล้ว ไปต่อได้เลย →',
    canContinue: true // Always true by design!
  };
};
