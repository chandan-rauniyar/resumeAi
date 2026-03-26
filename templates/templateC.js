const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateTemplateC(resume, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = 595;
    const SIDEBAR_W = 190;
    const MAIN_X = SIDEBAR_W + 20;
    const MAIN_W = W - SIDEBAR_W - 40;

    // ── Dark green sidebar ──
    doc.rect(0, 0, SIDEBAR_W, 842).fill('#1B4D3E');

    // Name in sidebar
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#FFFFFF')
       .text(resume.name || 'Your Name', 14, 36, { width: SIDEBAR_W - 20 });

    doc.fontSize(9).font('Helvetica').fillColor('#A9DFBF')
       .text(resume.email || '', 14, doc.y + 6, { width: SIDEBAR_W - 20 });
    doc.text(resume.phone || '', 14, doc.y + 2, { width: SIDEBAR_W - 20 });

    // Divider in sidebar
    let sy = doc.y + 14;
    doc.moveTo(14, sy).lineTo(SIDEBAR_W - 14, sy)
       .strokeColor('#A9DFBF').lineWidth(0.5).stroke();
    sy += 12;

    // Skills in sidebar
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#A9DFBF')
       .text('SKILLS', 14, sy, { width: SIDEBAR_W - 20 });
    sy = doc.y + 6;

    (resume.skills || []).forEach((skill) => {
      doc.fontSize(10).font('Helvetica').fillColor('#FFFFFF')
         .text(`› ${skill}`, 14, sy, { width: SIDEBAR_W - 20, lineGap: 2 });
      sy = doc.y + 2;
    });

    // Education in sidebar
    sy += 14;
    doc.moveTo(14, sy).lineTo(SIDEBAR_W - 14, sy)
       .strokeColor('#A9DFBF').lineWidth(0.5).stroke();
    sy += 12;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#A9DFBF')
       .text('EDUCATION', 14, sy, { width: SIDEBAR_W - 20 });
    sy = doc.y + 6;

    (resume.education || []).forEach((edu) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
         .text(edu.degree || '', 14, sy, { width: SIDEBAR_W - 20 });
      sy = doc.y + 1;
      doc.fontSize(9).font('Helvetica').fillColor('#A9DFBF')
         .text(`${edu.school || ''} (${edu.year || ''})`, 14, sy, { width: SIDEBAR_W - 20 });
      sy = doc.y + 6;
    });

    // ── Main content area ──
    let my = 40;

    function mainSection(title) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1B4D3E')
         .text(title, MAIN_X, my, { width: MAIN_W });
      my = doc.y;
      doc.moveTo(MAIN_X, my).lineTo(MAIN_X + MAIN_W, my)
         .strokeColor('#1B4D3E').lineWidth(1).stroke();
      my += 6;
    }

    // Summary
    if (resume.summary) {
      mainSection('PROFESSIONAL SUMMARY');
      doc.fontSize(11).font('Helvetica').fillColor('#2C3E50')
         .text(resume.summary, MAIN_X, my, { width: MAIN_W, lineGap: 3 });
      my = doc.y + 12;
    }

    // Experience
    if (resume.experience?.length) {
      mainSection('EXPERIENCE');
      resume.experience.forEach((exp) => {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
           .text(`${exp.title || ''} @ ${exp.company || ''}`, MAIN_X, my, { width: MAIN_W });
        my = doc.y;
        doc.fontSize(10).font('Helvetica').fillColor('#7F8C8D')
           .text(exp.duration || '', MAIN_X, my);
        my = doc.y + 3;
        (exp.bullets || []).forEach((b) => {
          doc.fontSize(10).font('Helvetica').fillColor('#2C3E50')
             .text(`• ${b}`, MAIN_X + 8, my, { width: MAIN_W - 8, lineGap: 2 });
          my = doc.y + 1;
        });
        my += 8;
      });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateTemplateC };