const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateTemplateA(resume, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // ── Header ──
    doc.fontSize(26).font('Helvetica-Bold').fillColor('#000000')
       .text(resume.name || 'Your Name', { align: 'center' });

    doc.fontSize(11).font('Helvetica').fillColor('#555555')
       .text(`${resume.email || ''}   |   ${resume.phone || ''}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(1).stroke();
    doc.moveDown(0.8);

    // ── Summary ──
    if (resume.summary) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('SUMMARY');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000000').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#333333').text(resume.summary, { lineGap: 3 });
      doc.moveDown(0.8);
    }

    // ── Skills ──
    if (resume.skills?.length) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('SKILLS');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000000').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#333333')
         .text(resume.skills.join('  •  '), { lineGap: 3 });
      doc.moveDown(0.8);
    }

    // ── Experience ──
    if (resume.experience?.length) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('EXPERIENCE');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000000').lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      resume.experience.forEach((exp) => {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
           .text(`${exp.title || ''} — ${exp.company || ''}`);
        doc.fontSize(10).font('Helvetica').fillColor('#777777')
           .text(exp.duration || '');
        (exp.bullets || []).forEach((b) => {
          doc.fontSize(11).font('Helvetica').fillColor('#333333')
             .text(`• ${b}`, { indent: 12, lineGap: 2 });
        });
        doc.moveDown(0.6);
      });
    }

    // ── Education ──
    if (resume.education?.length) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('EDUCATION');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000000').lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      resume.education.forEach((edu) => {
        doc.fontSize(11).font('Helvetica').fillColor('#333333')
           .text(`${edu.degree || ''} — ${edu.school || ''} (${edu.year || ''})`, { lineGap: 3 });
      });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateTemplateA };