const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateTemplateB(resume, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = 595; // A4 width in points

    // ── Colored header block ──
    doc.rect(0, 0, W, 110).fill('#2E86C1');

    doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF')
       .text(resume.name || 'Your Name', 40, 28, { align: 'left' });

    doc.fontSize(11).font('Helvetica').fillColor('#D6EAF8')
       .text(`${resume.email || ''}   |   ${resume.phone || ''}`, 40, 70);

    // ── Body starts below header ──
    let y = 130;
    const left = 40;
    const lineW = W - 80;

    function sectionTitle(title) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#2E86C1')
         .text(title, left, y);
      y = doc.y;
      doc.moveTo(left, y).lineTo(left + lineW, y)
         .strokeColor('#2E86C1').lineWidth(1).stroke();
      y += 6;
    }

    function bodyText(text, indent = 0) {
      doc.fontSize(11).font('Helvetica').fillColor('#2C3E50')
         .text(text, left + indent, y, { width: lineW - indent, lineGap: 2 });
      y = doc.y + 4;
    }

    // ── Summary ──
    if (resume.summary) {
      sectionTitle('SUMMARY');
      bodyText(resume.summary);
      y += 8;
    }

    // ── Skills ──
    if (resume.skills?.length) {
      sectionTitle('SKILLS');
      bodyText(resume.skills.join('   •   '));
      y += 8;
    }

    // ── Experience ──
    if (resume.experience?.length) {
      sectionTitle('EXPERIENCE');
      resume.experience.forEach((exp) => {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
           .text(`${exp.title || ''} — ${exp.company || ''}`, left, y);
        y = doc.y;
        doc.fontSize(10).font('Helvetica').fillColor('#7F8C8D')
           .text(exp.duration || '', left, y);
        y = doc.y + 2;
        (exp.bullets || []).forEach((b) => {
          bodyText(`• ${b}`, 10);
        });
        y += 6;
      });
    }

    // ── Education ──
    if (resume.education?.length) {
      sectionTitle('EDUCATION');
      resume.education.forEach((edu) => {
        bodyText(`${edu.degree || ''} — ${edu.school || ''} (${edu.year || ''})`);
      });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateTemplateB };