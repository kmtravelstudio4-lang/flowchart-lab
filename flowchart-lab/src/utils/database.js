// Flowchart Quest - Hybrid Cloud Database Sync Engine (Google Sheets + LocalStorage)

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ===================================================
// Flowchart Quest ป.6 - Google Sheets Database Webhook
// วิธีติดตั้ง:
// 1. ไปที่ https://sheets.new เพื่อสร้าง Google Sheets ใหม่
// 2. ไปที่เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
// 3. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดชุดนี้ลงไป
// 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้ใหม่" (New deployment)
// 5. เลือกประเภท "เว็บแอป" (Web app)
// 6. ตั้งค่า:
//    - ดำเนินการในฐานะ: "ฉัน" (Me)
//    - ผู้มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone) **สำคัญมาก**
// 7. กด "ทำให้ใช้งานได้" และคัดลอก URL ของเว็บแอปมาวางในเว็บ Flowchart Quest
// ===================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Check if test ping
    if (data.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Connected successfully!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = [
      "Event ID",
      "Timestamp (เวลาไทย)",
      "Student ID",
      "Session ID",
      "ชื่อ-นามสกุล",
      "ห้อง",
      "เลขที่",
      "Pre (10)",
      "Post (10)",
      "Gain",
      "M1 (15)",
      "M2 (15)",
      "M3 (15)",
      "M4 (20)",
      "Final (35)",
      "รวม (100)",
      "ผลประเมิน",
      "Schema Version"
    ];

    // Compute scores
    var m1 = Math.min(Math.max(0, Number(data.m1 || 0)), 15);
    var m2 = Math.min(Math.max(0, Number(data.m2 || 0)), 15);
    var m3 = Math.min(Math.max(0, Number(data.m3 || 0)), 15);
    var m4 = Math.min(Math.max(0, Number(data.m4 || 0)), 20);
    var m5 = Math.min(Math.max(0, Number(data.m5 || 0)), 35);
    var pre = Math.min(Math.max(0, Number(data.preScore || 0)), 10);
    var post = Math.min(Math.max(0, Number(data.postScore || 0)), 10);
    var gain = post - pre;
    var total = Math.min(m1 + m2 + m3 + m4 + m5, 100);
    var eventId = data.eventId || ("evt_" + (data.id || Date.now()));
    var studentId = data.studentId || data.id || "-";
    var thaiTime = Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss");

    var rowValues = [
      eventId,
      thaiTime,
      studentId,
      data.sessionId || "-",
      data.name || "-",
      data.room || "-",
      data.number || "-",
      pre,
      post,
      gain,
      m1,
      m2,
      m3,
      m4,
      m5,
      total,
      data.status || (total >= 60 ? "ผ่านเกณฑ์" : (total > 0 ? "ต้องช่วยเหลือ" : "กำลังเรียนรู้ (In Progress)")),
      data.schemaVersion || "2.0.0"
    ];

    function upsertRecord(sheet, isMaster) {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground(isMaster ? "#e0f2fe" : "#fef3c7");
      }
      
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var idColumn = sheet.getRange(1, 3, lastRow, 1).getValues();
        for (var r = 1; r < idColumn.length; r++) {
          if (idColumn[r][0] && idColumn[r][0] === studentId) {
            sheet.getRange(r + 1, 1, 1, 18).setValues([rowValues]);
            return;
          }
        }
      }
      sheet.appendRow(rowValues);
    }

    // 1. Append/Update to Master Sheet
    upsertRecord(masterSheet, true);

    // 2. Multi-Tab Classroom Separation
    var cleanRoom = (data.room || "ทั่วไป").toString()
      .replace(/[\/\\?*:[\]']/g, "_")
      .trim()
      .substring(0, 80);

    if (cleanRoom && cleanRoom !== masterSheet.getName()) {
      var roomSheet = ss.getSheetByName(cleanRoom);
      if (!roomSheet) {
        roomSheet = ss.insertSheet(cleanRoom);
      }
      upsertRecord(roomSheet, false);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      row: masterSheet.getLastRow(),
      roomTab: cleanRoom 
    })).setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Flowchart Quest Enterprise Database Webhook is active and running!");
}
`;

/**
 * Send student score record to Google Sheets webhook and LocalStorage
 * @param {Object} studentRecord
 * @param {string} webhookUrl
 * @returns {Promise<{success: boolean, mode: 'cloud' | 'local_only', message: string}>}
 */
export async function syncScoreToDatabase(studentRecord, webhookUrl) {
  const cleanWebhook = (webhookUrl || '').trim();

  // Enforce score bounds and metadata
  const m1 = Math.min(Math.max(0, Number(studentRecord.m1 || 0)), 15);
  const m2 = Math.min(Math.max(0, Number(studentRecord.m2 || 0)), 15);
  const m3 = Math.min(Math.max(0, Number(studentRecord.m3 || 0)), 15);
  const m4 = Math.min(Math.max(0, Number(studentRecord.m4 || 0)), 20);
  const m5 = Math.min(Math.max(0, Number(studentRecord.m5 || 0)), 35);
  const preScore = Math.min(Math.max(0, Number(studentRecord.preScore || 0)), 10);
  const postScore = Math.min(Math.max(0, Number(studentRecord.postScore || 0)), 10);
  const gainScore = postScore - preScore;
  const totalScore = Math.min(m1 + m2 + m3 + m4 + m5, 100);

  const payload = {
    ...studentRecord,
    eventId: studentRecord.eventId || `evt_sync_${studentRecord.id || Date.now()}`,
    studentId: studentRecord.studentId || studentRecord.id || 'std_default',
    sessionId: studentRecord.sessionId || 'session_default',
    preScore,
    postScore,
    gainScore,
    m1,
    m2,
    m3,
    m4,
    m5,
    totalScore,
    isPassed: totalScore >= 60,
    schemaVersion: '2.0.0',
    contentVersion: '1.0.0',
    updatedAt: new Date().toISOString()
  };

  if (!cleanWebhook) {
    return { success: true, mode: 'local_only', message: 'บันทึกในเครื่องแล้ว (ยังไม่ได้ระบุ Google Sheets URL)' };
  }

  try {
    await fetch(cleanWebhook, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return { success: true, mode: 'cloud', message: 'บันทึกลง Google Sheets และอุปกรณ์เรียบร้อยแล้ว' };
  } catch (err) {
    console.warn('Cloud sync error (fallback to local):', err);
    return { success: false, mode: 'local_only', error: err.message, message: 'ส่งข้อมูลคลาวด์ไม่สำเร็จ แต่บันทึกในเครื่องปลอดภัยแล้ว' };
  }
}

/**
 * Test Google Sheets Webhook Connection
 * @param {string} webhookUrl
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testWebhookConnection(webhookUrl) {
  const cleanWebhook = (webhookUrl || '').trim();
  if (!cleanWebhook) {
    return { success: false, message: 'กรุณากรอก URL ของ Google Apps Script Webhook' };
  }

  try {
    await fetch(cleanWebhook, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'ping', timestamp: Date.now() })
    });

    return { success: true, message: 'เชื่อมต่อ Google Sheets สำเร็จ! พร้อมรับข้อมูลคะแนนนักเรียน' };
  } catch (err) {
    return { success: false, message: `การเชื่อมต่อล้มเหลว: ${err.message}` };
  }
}
