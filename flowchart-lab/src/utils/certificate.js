// High-Resolution Pure HTML5 Canvas Certificate Generator for Flowchart Quest
const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

export const generateCertificateCanvas = (info, scores = {}, timeUsedSec = 0) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');

  const {
    preScore = 0,
    postScore = 0,
    m1 = 0,
    m2 = 0,
    m3 = 0,
    m4 = 0,
    m5 = 0,
    totalMissionScore = 0
  } = scores;

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 840);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(0.3, '#eff6ff');
  bgGrad.addColorStop(0.7, '#ffffff');
  bgGrad.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 840);

  // 2. Outer Decorative Borders
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#2563eb';
  roundRect(ctx, 20, 20, 1160, 800, 28);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#93c5fd';
  roundRect(ctx, 36, 36, 1128, 768, 20);
  ctx.stroke();

  // 3. Top Header Ribbon & Kru King Branding
  ctx.fillStyle = '#2563eb';
  roundRect(ctx, 340, 50, 520, 48, 24);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Prompt, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ใบรายงานผลสัมฤทธิ์และสมรรถนะการเรียนรู้', 600, 82);

  // Top Left Kru King Badge Graphic / Text
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 16px Prompt, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🏫 ห้องสื่อครูคิง', 60, 80);

  // 4. Titles
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 36px Prompt, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('วิชาวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 6', 600, 142);

  ctx.fillStyle = '#475569';
  ctx.font = '600 17px Prompt, sans-serif';
  ctx.fillText('ตัวชี้วัด ว 4.2 ป.6/1 • การใช้เหตุผลเชิงตรรกะและการออกแบบผังงาน (Flowchart)', 600, 175);

  // 5. Student Information Card
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 2;
  roundRect(ctx, 160, 200, 880, 95, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 20px Prompt, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('มอบให้แก่: ', 200, 242);
  
  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 26px Prompt, sans-serif';
  ctx.fillText(info.name || 'นักเรียน ป.6', 310, 242, 680);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 16px Prompt, sans-serif';
  const mins = Math.floor(timeUsedSec / 60);
  const secs = timeUsedSec % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  ctx.fillText(`ชั้น: ${info.room || 'ป.6'}   •   เลขที่: ${info.number || '-'}   •   เวลาที่ใช้เรียนรู้: ${timeStr} นาที`, 200, 275);

  // 6. Scores Summary Grid (Pre-test vs Post-test & Missions Total)
  // Left: Pre vs Post Test
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 160, 315, 420, 260, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px Prompt, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📊 พัฒนาการก่อนและหลังเรียน (10 ข้อ)', 370, 350);

  // Pre-test Box
  ctx.fillStyle = '#f1f5f9';
  roundRect(ctx, 190, 375, 160, 100, 16);
  ctx.fill();
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px Prompt, sans-serif';
  ctx.fillText('ก่อนเรียน (Pre-Test)', 270, 405);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 36px Prompt, sans-serif';
  ctx.fillText(`${preScore}`, 255, 452);
  ctx.font = 'bold 18px Prompt, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('/10', 295, 452);

  // Post-test Box
  ctx.fillStyle = '#dbeafe';
  roundRect(ctx, 390, 375, 160, 100, 16);
  ctx.fill();
  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 14px Prompt, sans-serif';
  ctx.fillText('หลังเรียน (Post-Test)', 470, 405);
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 36px Prompt, sans-serif';
  ctx.fillText(`${postScore}`, 455, 452);
  ctx.font = 'bold 18px Prompt, sans-serif';
  ctx.fillStyle = '#3b82f6';
  ctx.fillText('/10', 495, 452);

  // Gain score
  const gain = postScore - preScore;
  ctx.fillStyle = gain >= 0 ? '#059669' : '#dc2626';
  ctx.font = 'bold 16px Prompt, sans-serif';
  ctx.fillText(`🚀 คะแนนพัฒนาการ (Gain Score): ${gain >= 0 ? `+${gain}` : gain} คะแนน`, 370, 520);
  ctx.fillStyle = '#64748b';
  ctx.font = '500 13px Prompt, sans-serif';
  ctx.fillText(gain >= 3 ? '🌟 มีพัฒนาการยอดเยี่ยมอย่างเห็นได้ชัด' : '👍 มีความรู้ความเข้าใจเพิ่มขึ้นตามเกณฑ์', 370, 545);

  // Right: 5 Game Missions (100 Pts)
  const scoreGrad = ctx.createLinearGradient(620, 315, 1040, 575);
  scoreGrad.addColorStop(0, '#2563eb');
  scoreGrad.addColorStop(0.5, '#4f46e5');
  scoreGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = scoreGrad;
  roundRect(ctx, 620, 315, 420, 260, 24);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Prompt, sans-serif';
  ctx.fillText('🏆 คะแนนภารกิจการเรียนรู้ (100 คะแนนเต็ม)', 830, 350);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Prompt, sans-serif';
  ctx.fillText(`${totalMissionScore}`, 800, 435);
  ctx.fillStyle = '#bfdbfe';
  ctx.font = 'bold 28px Prompt, sans-serif';
  ctx.fillText('/ 100', 915, 435);

  // Breakdown mini text
  ctx.fillStyle = '#e0e7ff';
  ctx.font = 'bold 13px Prompt, sans-serif';
  ctx.fillText(`M1:${m1}/15  •  M2:${m2}/15  •  M3:${m3}/15  •  M4:${m4}/20  •  Final:${m5}/35`, 830, 480);

  // Qualitative Level
  let qualBadge = '👍 ระดับผลการเรียน: ผ่านเกณฑ์ประเมิน (ดี)';
  if (totalMissionScore >= 80) {
    qualBadge = '🌟 ระดับผลการเรียน: ยอดเยี่ยมมาก (เกรด 4 / ดีเยี่ยม)';
  } else if (totalMissionScore < 60) {
    qualBadge = '📖 ระดับผลการเรียน: ควรได้รับการทบทวนฝึกฝนเพิ่มเติม';
  }
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 16px Prompt, sans-serif';
  ctx.fillText(qualBadge, 830, 535);

  // 7. Badges Showcase Bar
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  roundRect(ctx, 160, 595, 880, 110, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 15px Prompt, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🏅 เหรียญรางวัลและสมรรถนะที่ผ่านการประเมิน:', 185, 625);

  const badges = [
    { title: 'Symbol Hunter', sub: 'รู้จักสัญลักษณ์ (M1)', icon: '🏅' },
    { title: 'Step Master', sub: 'เรียงลำดับขั้นตอน (M2)', icon: '🏅' },
    { title: 'Flow Reader', sub: 'วิเคราะห์ผังงาน (M3)', icon: '🏅' },
    { title: 'Bug Detective', sub: 'นักสืบแก้บั๊ก (M4)', icon: '🏅' },
    { title: 'Flow Designer', sub: 'ประยุกต์ออกแบบ (Final)', icon: '🏆' }
  ];

  badges.forEach((b, i) => {
    const bx = 185 + i * 170;
    const by = 640;
    ctx.fillStyle = '#eff6ff';
    roundRect(ctx, bx, by, 155, 52, 12);
    ctx.fill();
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 13px Prompt, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${b.icon} ${b.title}`, bx + 77, by + 22);
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Prompt, sans-serif';
    ctx.fillText(b.sub, bx + 77, by + 40);
  });

  // 8. Footer & Signatures
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px Prompt, sans-serif';
  ctx.fillText('Flowchart Quest ป.6 • นวัตกรรมสื่อการเรียนรู้เชิงเกม กลุ่มสาระวิทยาการคำนวณ', 600, 745);

  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillText(`เอกสารรับรองเมื่อวันที่: ${dateStr} • ระบบบันทึกผลการประเมินแบบเรียลไทม์`, 600, 775);

  return canvas;
};

export default generateCertificateCanvas;
