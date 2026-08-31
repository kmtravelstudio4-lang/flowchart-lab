# 🔒 FLOWCHART QUEST — PRODUCTION FREEZE REPORT
**ระดับชั้น:** ชั้นประถมศึกษาปีที่ 6 (ว 4.2 ป.6/1)
**สถานะ:** RELEASE CANDIDATE (พร้อมทดลองใช้งานจริงในห้องเรียน)
**เป้าหมายการใช้งาน:** คุณครู 1 คน + นักเรียน ~30 คน (Mobile, Tablet, Desktop)

---

## 1. System Architecture (สถาปัตยกรรมระบบ)

```
                         FIREBASE FIRESTORE
              (Master Database & Single Source of Truth)
                                │
    ┌───────────────┬───────────┴───────────┬───────────────┐
    ▼               ▼                       ▼               ▼
 /lessons      /classrooms              /students        /scores
    │               │                       │               │
    ▼               ▼                       ▼               ▼
/progress   /learningEvidence            /events       /certificates
                                │
                        onSnapshot() Stream
                                │
                           React State
                                │
           ┌────────────────────┴────────────────────┐
           ▼                                         ▼
   Student (Mobile/Tablet)                   Teacher (Desktop)
```

* **Firestore Cloud:** Master Single Source of Truth สำหรับข้อมูล Persistent ทั้ง 10 Collections
* **IndexedDB / Firestore Local Cache:** Persistent Cache รองรับ Offline-First
* **LocalStorage:** จัดเก็บเฉพาะ Session ชั่วคราวบนเครื่องและ UI drafts
* **Static JSON (`system_config.json`):** Default Seed เท่านั้น (ไม่เขียนทับ Cloud)
* **Google Sheets:** Export และ External Report เท่านั้น
* **GitHub:** Source Code & Deployment CI/CD เท่านั้น

---

## 2. Firebase Configuration & Collections

* **Project ID:** `flowchart-quest-p6` (รองรับ Environment Variables `VITE_FIREBASE_*`)
* **Core Collections:**
  1. `/lessons/{lessonId}` — บทเรียน, ลิงก์ Google Drive PDF แนวนอน, สรุปเนื้อหา
  2. `/classrooms/{classroomId}` — รายชื่อห้องเรียน และรหัส PIN ประจำห้อง
  3. `/students/{studentId}` — ทะเบียนประวัตินักเรียน (`source: 'self_registration' | 'teacher_roster'`)
  4. `/scores/{studentId}` — ทะเบียนคะแนนสอบ (Pre-Test, Post-Test, M1-M4, Final, Total Max 100)
  5. `/progress/{studentId}` — สถานะความคืบหน้าของด่าน และค่าประสบการณ์ (XP) สด
  6. `/learningEvidence/{evidenceId}` — ผลการวินิจฉัยข้อผิดพลาดและรูบริกประเมิน
  7. `/events/{eventId}` — บันทึก Telemetry Log กิจกรรมสดของผู้เรียน
  8. `/sessions/{sessionId}` — เซสชันการเรียนสด พร้อมเวลา Ping
  9. `/certificates/{certificateId}` — ประวัติการออกเกียรติบัตรเพื่อการตรวจสอบ
  10. `/systemConfig/{configId}` — การตั้งค่าเกณฑ์และระบบส่วนกลาง

---

## 3. Student Self-Registration Flow

1. นักเรียนกรอก: **ชื่อ-นามสกุล**, **เลือกห้องเรียน**, **กรอกเลขที่**
2. กดปุ่ม **"🚀 เริ่มเรียน"**
3. ระบบสร้าง/ใช้ซ้ำ **Stable Student ID**: `STD_[RoomCode]_[Number]_[StudentName]`
4. ส่งข้อมูลขึ้น Firestore 5 Collections ทันที:
   * `/students/{studentId}` (`source: 'self_registration'`)
   * `/sessions/{sessionId}` (`status: 'active'`)
   * `/progress/{studentId}` (`currentStage: 'learning'`, `XP: 0`)
   * `/scores/{studentId}` (`preTest: 0, postTest: 0, totalScore: 0`)
   * `/events/{eventId}` (`type: 'REGISTER'`)
5. Teacher Dashboard ได้รับข้อมูลผ่าน `onSnapshot()` และแสดงแถวพร้อมป้าย `👤 นักเรียนกรอกเอง` และ `🟢 กำลังเรียน` ทันทีโดย **ไม่ต้องกด Refresh**

---

## 4. Score System & Integrity Bounds

* **Pre-Test:** $\le 10$ คะแนน
* **Post-Test:** $\le 10$ คะแนน
* **Mission 1 (ลำดับขั้นตอน):** $\le 15$ คะแนน
* **Mission 2 (ทางเลือก/เงื่อนไข):** $\le 15$ คะแนน
* **Mission 3 (ทำซ้ำ/Looping):** $\le 15$ คะแนน
* **Mission 4 (แก้จุดบกพร่อง/Debugging):** $\le 20$ คะแนน
* **Final Challenge (ออกแบบผังงานรวม):** $\le 35$ คะแนน
* **คะแนนรวมสุทธิ (Total Score):** คำนวณจาก $M1+M2+M3+M4+\text{Final} \le 100$ คะแนน (เกณฑ์ผ่าน $\ge 60$ คะแนน)

---

## 5. Security & Service Worker Safe Scope

* **Firestore Security Rules:** ครอบคลุมทั้ง 10 Collections พร้อม Validation ตรวจสอบขอบเขตคะแนน ไม่ใช้ `allow read, write: if true;`
* **Secret Leak Prevention:** ไม่พบ Hardcoded GitHub PAT (`ghp_`), Private Keys หรือ Service Account ใน Frontend
* **Service Worker Scope (`public/sw.js`):** แคชเฉพาะ App Shell & Static Assets (`/`, `/index.html`, `/manifest.json`, `/kru-king-logo.png`) **ไม่แคช Dynamic API ของ Firestore**

---

## 6. Automated QA Test Suite Results

```text
================================================================
🎯 COMPREHENSIVE PRODUCTION ACCEPTANCE QA SUMMARY
================================================================
  ✅ node test_self_registration.mjs        -> 8/8 CHECKS PASSED (100%)
  ✅ node test_production_acceptance.mjs    -> 17/17 PHASES PASSED (100%)
  ✅ node test_full_realtime.mjs            -> 6/6 TESTS PASSED (100%)
  ✅ node test_final_freeze_audit.mjs       -> 35/35 PHASES PASSED (100%)
  ✅ npm run build                          -> BUILD SUCCESSFUL (Exit Code 0)
  ✅ npm run lint                           -> 0 ERRORS
================================================================
```

---

## 7. Checklist การทดสอบสดบนอุปกรณ์จริงสำหรับคุณครู (Physical Test Checklist)

| ลำดับการทดสอบ | อุปกรณ์ A (เครื่องนักเรียน - Mobile/Tablet) | อุปกรณ์ B (เครื่องครู - Desktop) | ผลที่คาดหวัง |
|---|---|---|:---:|
| **Test 1: Self-Registration** | กรอกชื่อ `เด็กชายทดสอบ สด`, ห้อง ป.6/1, เลขที่ 15 แล้วกด "เริ่มเรียน" | เปิดหน้า Teacher Dashboard | รายชื่อปรากฏทันทีพร้อมป้าย `👤 นักเรียนกรอกเอง` และ `🟢 กำลังเรียน (บทเรียน)` โดย **ไม่ต้องกด Refresh** |
| **Test 2: PDF Real-Time** | เปิดหน้าบทเรียนที่ 1 ดูเอกสาร PDF แนวนอน | เข้า Admin เปลี่ยนลิงก์ Google Drive PDF ของบทเรียนที่ 1 แล้วกดบันทึก | หน้าจอนักเรียนสลับเอกสาร PDF ใหม่ทันที **โดยไม่ต้องกด Refresh** |
| **Test 3: Live Score Stream** | เข้าทำ Mission 1 จนจบ (ได้ 15 คะแนน) | ดูตารางคะแนนใน Teacher Dashboard | ช่องคะแนน `M1` อัปเดตเป็น `15` สดทันที |
| **Test 4: Stage Progress** | กดผ่านเข้าสู่ Mission 2 | ดูตารางใน Teacher Dashboard | สถานะเปลี่ยนเป็น `🟢 กำลังเรียน (mission2)` สดทันที |
| **Test 5: Offline Resilience** | ปิดสัญญาณ Wi-Fi/4G แล้วทำด่านเกมต่อ | สังเกตระบบ | เกมไม่ค้าง บันทึกลงเครื่อง เมื่อเปิดเน็ต ข้อมูลจะ Sync ขึ้น Cloud สู่ครูอัตโนมัติ |

---

## 8. Final Status Verdict

* 🟢 **CODE & CLOUD INTEGRATION VERIFIED**
* 🟢 **AUTOMATED QA VERIFIED (66/66 Checks Passed)**
* 🟢 **PRODUCTION BUILD COMPILED**
* 🟡 **MANUAL PHYSICAL CROSS-DEVICE TEST REQUIRED (พร้อมสำหรับการเปิดทดสอบจริงในห้องเรียน)**
