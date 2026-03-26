const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateTemplateC(resume, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = 595;
    const H = 842;
    const SIDEBAR_W = 200;
    const MAIN_X = SIDEBAR_W + 1;
    const MAIN_W = W - SIDEBAR_W - 50;
    const MAIN_MARGIN = 24;

    // ── COLORS ──
    const DARK = '#1A1A2E';       // Very dark navy
    const ACCENT = '#E94560';     // Vivid red-pink accent
    const SIDEBAR_BG = '#16213E'; // Deep dark blue sidebar
    const MAIN_BG = '#F8F9FA';    // Light gray main
    const WHITE = '#FFFFFF';
    const LIGHT_TEXT = '#A8B2D8';
    const BODY_TEXT = '#2D3561';
    const MID_TEXT = '#5C6B8A';

    // ── BACKGROUND ──
    doc.rect(0, 0, SIDEBAR_W, H).fill(SIDEBAR_BG);
    doc.rect(SIDEBAR_W, 0, W - SIDEBAR_W, H).fill(WHITE);

    // Accent top strip on sidebar
    doc.rect(0, 0, SIDEBAR_W, 6).fill(ACCENT);

    // ── SIDEBAR CONTENT ──

    // Name block
    doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE)
       .text(resume.name || 'Your Name', 16, 26, { width: SIDEBAR_W - 28 });

    const nameBottomY = doc.y;

    // Accent underline under name
    doc.rect(16, nameBottomY + 4, 40, 3).fill(ACCENT);

    let sy = nameBottomY + 16;

    // Contact info
    if (resume.email) {
      doc.fontSize(8).font('Helvetica').fillColor(LIGHT_TEXT)
         .text('EMAIL', 16, sy, { characterSpacing: 1 });
      sy = doc.y + 1;
      doc.fontSize(9).font('Helvetica').fillColor(WHITE)
         .text(resume.email, 16, sy, { width: SIDEBAR_W - 28 });
      sy = doc.y + 8;
    }

    if (resume.phone) {
      doc.fontSize(8).font('Helvetica').fillColor(LIGHT_TEXT)
         .text('PHONE', 16, sy, { characterSpacing: 1 });
      sy = doc.y + 1;
      doc.fontSize(9).font('Helvetica').fillColor(WHITE)
         .text(resume.phone, 16, sy, { width: SIDEBAR_W - 28 });
      sy = doc.y + 8;
    }

    // Sidebar section helper
    function sidebarSection(title, startY) {
      // Accent dot + title
      doc.rect(16, startY, 3, 14).fill(ACCENT);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(ACCENT)
         .text(title, 24, startY + 2, { width: SIDEBAR_W - 36, characterSpacing: 1 });
      const afterTitle = doc.y + 4;
      // Thin rule
      doc.moveTo(16, afterTitle).lineTo(SIDEBAR_W - 16, afterTitle)
         .strokeColor('#2E4A7A').lineWidth(0.5).stroke();
      return afterTitle + 6;
    }

    // ── SKILLS in sidebar ──
    sy += 8;
    sy = sidebarSection('SKILLS', sy);

    (resume.skills || []).forEach((skill) => {
      // Skill bar background
      doc.roundedRect(16, sy, SIDEBAR_W - 32, 16, 3).fill('#1F3461');
      // Skill bar fill (70% default visual fill)
      doc.roundedRect(16, sy, (SIDEBAR_W - 32) * 0.72, 16, 3).fill('#2E4A7A');
      doc.fontSize(8.5).font('Helvetica').fillColor(WHITE)
         .text(skill, 22, sy + 4, { width: SIDEBAR_W - 44, ellipsis: true });
      sy += 22;
    });

    // ── EDUCATION in sidebar ──
    sy += 8;
    if (sy < H - 150) {
      sy = sidebarSection('EDUCATION', sy);
      (resume.education || []).forEach((edu) => {
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor(WHITE)
           .text(edu.degree || '', 16, sy, { width: SIDEBAR_W - 28 });
        sy = doc.y + 1;
        doc.fontSize(8).font('Helvetica').fillColor(LIGHT_TEXT)
           .text(edu.school || '', 16, sy, { width: SIDEBAR_W - 28 });
        sy = doc.y + 1;
        if (edu.year) {
          doc.fontSize(8).font('Helvetica').fillColor(ACCENT)
             .text(edu.year, 16, sy, { width: SIDEBAR_W - 28 });
          sy = doc.y + 3;
        }
        sy += 6;
      });
    }

    // ── ACHIEVEMENTS/CERTIFICATIONS in sidebar ──
    sy += 4;
    if (resume.certificates?.length && sy < H - 100) {
      sy = sidebarSection('CERTIFICATIONS', sy);
      resume.certificates.forEach((cert) => {
        doc.fontSize(8).font('Helvetica').fillColor(LIGHT_TEXT)
           .text(`› ${cert}`, 16, sy, { width: SIDEBAR_W - 28, lineGap: 2 });
        sy = doc.y + 4;
      });
    }

    if (resume.achievements?.length && sy < H - 80) {
      sy += 6;
      sy = sidebarSection('ACHIEVEMENTS', sy);
      resume.achievements.forEach((ach) => {
        doc.fontSize(8).font('Helvetica').fillColor(LIGHT_TEXT)
           .text(`› ${ach}`, 16, sy, { width: SIDEBAR_W - 28, lineGap: 2 });
        sy = doc.y + 4;
      });
    }

    // ── MAIN CONTENT AREA ──
    // Top accent strip
    doc.rect(MAIN_X, 0, W - SIDEBAR_W, 6).fill(ACCENT);

    let my = 24;
    const MX = MAIN_X + MAIN_MARGIN;

    // Main section helper
    function mainSection(title) {
      // Section title with accent left border
      doc.rect(MX - 8, my, 3, 14).fill(ACCENT);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(BODY_TEXT)
         .text(title, MX, my + 1, { width: MAIN_W, characterSpacing: 0.8 });
      my = doc.y + 2;
      doc.moveTo(MX, my).lineTo(MX + MAIN_W, my)
         .strokeColor('#DCE3EF').lineWidth(1).stroke();
      my += 8;
    }

    // ── SUMMARY ──
    if (resume.summary) {
      mainSection('ABOUT ME');
      doc.fontSize(9.5).font('Helvetica').fillColor(MID_TEXT)
         .text(resume.summary, MX, my, { width: MAIN_W, lineGap: 3, align: 'justify' });
      my = doc.y + 14;
    }

    // ── EXPERIENCE / PROJECTS ──
    const expData = resume.experience?.length ? resume.experience : [];
    if (expData.length) {
      mainSection('PROJECTS & EXPERIENCE');

      expData.forEach((exp, idx) => {
        if (my > H - 100) { doc.addPage(); my = 30; }

        // Title row with date badge on the right
        const titleStr = `${exp.title || ''}${exp.company ? '  ·  ' + exp.company : ''}`;
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor(BODY_TEXT)
           .text(titleStr, MX, my, { width: MAIN_W - 80, continued: false });

        if (exp.duration) {
          // Date badge
          const badgeX = MX + MAIN_W - 72;
          doc.roundedRect(badgeX, my - 1, 72, 14, 3).fill('#FDECEA');
          doc.fontSize(8).font('Helvetica').fillColor(ACCENT)
             .text(exp.duration, badgeX + 4, my + 2, { width: 64, align: 'center' });
        }

        my = doc.y + 4;

        (exp.bullets || []).forEach((b) => {
          // Accent dot bullet
          doc.circle(MX + 3, my + 4, 2).fill(ACCENT);
          doc.fontSize(9).font('Helvetica').fillColor(MID_TEXT)
             .text(b, MX + 12, my, { width: MAIN_W - 12, lineGap: 2 });
          my = doc.y + 3;
        });

        if (idx < expData.length - 1) {
          my += 6;
          doc.moveTo(MX, my - 3).lineTo(MX + MAIN_W, my - 3)
             .strokeColor('#EEF2F7').lineWidth(1).stroke();
          my += 4;
        } else {
          my += 8;
        }
      });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateTemplateC };