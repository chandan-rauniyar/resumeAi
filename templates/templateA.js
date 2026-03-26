const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateTemplateA(resume, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = 595;
    const MARGIN = 50;
    const CONTENT_W = W - MARGIN * 2;

    const C_DARK  = '#1A1A1A';
    const C_MID   = '#555555';
    const C_LIGHT = '#888888';
    const C_RULE  = '#CCCCCC';

    // ── wrap text into array of lines ──
    function wrapLines(text, font, size, maxW) {
      doc.font(font).fontSize(size);
      const words = String(text).split(' ');
      const lines = [];
      let line = '';
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (doc.widthOfString(test) > maxW) {
          if (line) lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines.length ? lines : [''];
    }

    // ── draw text right-aligned at exact y ──
    function drawRight(text, font, size, color, y) {
      doc.font(font).fontSize(size).fillColor(color);
      const tw = doc.widthOfString(String(text));
      doc.text(String(text), W - MARGIN - tw, y, { lineBreak: false });
    }

    // ── section header + rule, returns new y ──
    function sectionHeader(title, y) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(C_DARK)
         .text(title, MARGIN, y, { lineBreak: false });
      y += 16;
      doc.moveTo(MARGIN, y - 2).lineTo(W - MARGIN, y - 2)
         .strokeColor(C_DARK).lineWidth(0.8).stroke();
      return y + 6;
    }

    // ── new page guard ──
    function checkPage(y, needed = 60) {
      if (y < needed) { doc.addPage(); return 50; }
      return y;
    }

    // ════════════════════════════════
    // HEADER
    // ════════════════════════════════
    doc.font('Helvetica-Bold').fontSize(24).fillColor(C_DARK);
    const nameW = doc.widthOfString(resume.name || 'Your Name');
    doc.text(resume.name || 'Your Name', (W - nameW) / 2, 50, { lineBreak: false });
    let y = 78;

    // Contact — email | linkedin | github | phone (2 lines if too wide)
    const contactParts = [
      resume.email, resume.linkedin, resume.github, resume.phone
    ].filter(Boolean);

    doc.font('Helvetica').fontSize(9).fillColor(C_MID);
    const fullContact = contactParts.join('  |  ');
    if (doc.widthOfString(fullContact) <= CONTENT_W) {
      const cw = doc.widthOfString(fullContact);
      doc.text(fullContact, (W - cw) / 2, y, { lineBreak: false });
      y += 13;
    } else {
      const l1 = [resume.email, resume.phone].filter(Boolean).join('  |  ');
      const l2 = [resume.linkedin, resume.github].filter(Boolean).join('  |  ');
      doc.text(l1, (W - doc.widthOfString(l1)) / 2, y, { lineBreak: false });
      y += 12;
      doc.text(l2, (W - doc.widthOfString(l2)) / 2, y, { lineBreak: false });
      y += 12;
    }

    doc.moveTo(MARGIN, y + 2).lineTo(W - MARGIN, y + 2)
       .strokeColor(C_RULE).lineWidth(1).stroke();
    y += 14;

    // ════════════════════════════════
    // SKILLS — compact grouped rows
    // ════════════════════════════════
    y = sectionHeader('SKILLS', y);

    // Support both skillGroups [{category, values}] and legacy skills []
    const skillGroups = resume.skillGroups?.length
      ? resume.skillGroups
      : resume.skills?.length
        ? resume.skills.map((s) =>
            typeof s === 'string' ? { category: null, values: s }
            : Array.isArray(s)   ? { category: s[0], values: s[1] }
            : s
          )
        : [];

    for (const group of skillGroups) {
      y = checkPage(y, 25);
      const cat    = group.category || null;
      const vals   = group.values || group;

      if (cat) {
        // "Category: value1, value2, ..." all on same line, wrapping continuation indented
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C_DARK);
        const catLabel = cat + ': ';
        const catW = doc.widthOfString(catLabel);
        doc.text(catLabel, MARGIN, y, { lineBreak: false });

        const valLines = wrapLines(String(vals), 'Helvetica', 10, CONTENT_W - catW);
        doc.font('Helvetica').fontSize(10).fillColor(C_DARK);
        doc.text(valLines[0], MARGIN + catW, y, { lineBreak: false });
        y += 13;
        for (let i = 1; i < valLines.length; i++) {
          doc.text(valLines[i], MARGIN + catW, y, { lineBreak: false });
          y += 13;
        }
      } else {
        doc.font('Helvetica').fontSize(10).fillColor(C_DARK)
           .text(String(vals), MARGIN + 4, y, { lineBreak: false });
        y += 13;
      }
    }
    y += 6;

    // ════════════════════════════════
    // PROJECTS / EXPERIENCE
    // ════════════════════════════════
    const items = resume.experience?.length ? resume.experience
                : resume.projects?.length   ? resume.projects : [];

    if (items.length) {
      y = checkPage(y, 80);
      y = sectionHeader('PROJECTS', y);

      for (const item of items) {
        y = checkPage(y, 60);
        const projName = item.title || item.name || '';
        const duration = item.duration || '';

        // Name LEFT, date RIGHT — exact same line
        doc.font('Helvetica-Bold').fontSize(11).fillColor(C_DARK)
           .text(projName, MARGIN, y, { lineBreak: false });
        if (duration) drawRight(duration, 'Helvetica', 10, C_MID, y);
        y += 15;

        // Company if meaningful
        const company = item.company || '';
        if (company && !/(personal project|hackathon)/i.test(company)) {
          doc.font('Helvetica').fontSize(9.5).fillColor(C_MID)
             .text(company, MARGIN + 4, y, { lineBreak: false });
          y += 13;
        }

        // Bullets
        for (const bullet of (item.bullets || [])) {
          y = checkPage(y, 25);
          doc.font('Helvetica').fontSize(9.5).fillColor(C_DARK)
             .text('•', MARGIN + 8, y, { lineBreak: false });
          const bLines = wrapLines(bullet, 'Helvetica', 9.5, CONTENT_W - 22);
          for (const ln of bLines) {
            doc.font('Helvetica').fontSize(9.5).fillColor(C_DARK)
               .text(ln, MARGIN + 20, y, { lineBreak: false });
            y += 13;
          }
        }
        y += 6;
      }
    }

    // ════════════════════════════════
    // CERTIFICATES
    // ════════════════════════════════
    const certs = resume.certificates || [];
    if (certs.length) {
      y = checkPage(y, 60);
      y = sectionHeader('CERTIFICATES', y);

      for (const cert of certs) {
        y = checkPage(y, 30);
        let name, issuer, date;

        if (typeof cert === 'object' && !Array.isArray(cert)) {
          name   = cert.name   || cert.title || '';
          issuer = cert.issuer || cert.organization || '';
          date   = cert.date   || cert.year || '';
        } else if (Array.isArray(cert)) {
          [name, issuer, date] = cert;
        } else {
          // "Name — Issuer, Date" string
          const parts = String(cert).split('—');
          name   = parts[0]?.trim() || '';
          const rest = (parts[1] || '').split(',');
          issuer = rest[0]?.trim() || '';
          date   = rest[1]?.trim() || '';
        }

        doc.font('Helvetica-Bold').fontSize(10).fillColor(C_DARK)
           .text(name, MARGIN, y, { lineBreak: false });
        if (date) drawRight(date, 'Helvetica', 9.5, C_MID, y);
        y += 13;
        if (issuer) {
          doc.font('Helvetica').fontSize(9.5).fillColor(C_LIGHT)
             .text(issuer, MARGIN + 4, y, { lineBreak: false });
          y += 12;
        }
      }
      y += 4;
    }

    // ════════════════════════════════
    // ACHIEVEMENTS
    // ════════════════════════════════
    const achs = resume.achievements || [];
    if (achs.length) {
      y = checkPage(y, 50);
      y = sectionHeader('ACHIEVEMENTS', y);

      for (const ach of achs) {
        y = checkPage(y, 20);
        let text, date;
        if (typeof ach === 'object' && !Array.isArray(ach)) {
          text = ach.text || ach.description || String(ach);
          date = ach.date || '';
        } else if (Array.isArray(ach)) {
          [text, date] = ach;
        } else {
          const parts = String(ach).split('·');
          text = parts[0]?.trim() || '';
          date = parts[1]?.trim() || '';
        }

        doc.font('Helvetica').fontSize(9.5).fillColor(C_DARK)
           .text('•', MARGIN + 8, y, { lineBreak: false });
        const aLines = wrapLines(text, 'Helvetica', 9.5, CONTENT_W - 22);
        doc.font('Helvetica').fontSize(9.5).fillColor(C_DARK)
           .text(aLines[0], MARGIN + 20, y, { lineBreak: false });
        if (date) drawRight(date, 'Helvetica', 9, C_MID, y);
        y += 13;
        for (let i = 1; i < aLines.length; i++) {
          doc.text(aLines[i], MARGIN + 20, y, { lineBreak: false });
          y += 13;
        }
      }
      y += 4;
    }

    // ════════════════════════════════
    // EXTRACURRICULAR
    // ════════════════════════════════
    const extra = resume.extracurricular || [];
    if (extra.length) {
      y = checkPage(y, 50);
      y = sectionHeader('EXTRACURRICULAR ACTIVITIES', y);

      for (const item of extra) {
        y = checkPage(y, 20);
        let text, date;
        if (typeof item === 'object' && !Array.isArray(item)) {
          text = item.text || String(item);
          date = item.date || '';
        } else if (Array.isArray(item)) {
          [text, date] = item;
        } else {
          const parts = String(item).split('·');
          text = parts[0]?.trim() || '';
          date = parts[1]?.trim() || '';
        }

        doc.font('Helvetica').fontSize(9.5).fillColor(C_DARK)
           .text('•', MARGIN + 8, y, { lineBreak: false });
        const eLines = wrapLines(text, 'Helvetica', 9.5, CONTENT_W - 22);
        doc.font('Helvetica').fontSize(9.5).fillColor(C_DARK)
           .text(eLines[0], MARGIN + 20, y, { lineBreak: false });
        if (date) drawRight(date, 'Helvetica', 9, C_MID, y);
        y += 13;
        for (let i = 1; i < eLines.length; i++) {
          doc.text(eLines[i], MARGIN + 20, y, { lineBreak: false });
          y += 13;
        }
      }
      y += 4;
    }

    // ════════════════════════════════
    // EDUCATION
    // ════════════════════════════════
    if (resume.education?.length) {
      y = checkPage(y, 80);
      y = sectionHeader('EDUCATION', y);

      for (const edu of resume.education) {
        y = checkPage(y, 45);
        const school   = edu.school || edu.institution || '';
        const location = edu.location || '';
        const degree   = edu.degree || '';
        const years    = edu.years || edu.year || edu.duration || '';
        const note     = edu.note || edu.cgpa || edu.gpa || '';

        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C_DARK)
           .text(school, MARGIN, y, { lineBreak: false });
        if (location) drawRight(location, 'Helvetica', 9.5, C_MID, y);
        y += 13;

        doc.font('Helvetica').fontSize(10).fillColor(C_DARK)
           .text(degree, MARGIN + 4, y, { lineBreak: false });
        if (years) drawRight(years, 'Helvetica', 9.5, C_MID, y);
        y += 12;

        if (note) {
          doc.font('Helvetica').fontSize(9.5).fillColor(C_LIGHT)
             .text(note, MARGIN + 4, y, { lineBreak: false });
          y += 12;
        }
        y += 4;
      }
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateTemplateA };