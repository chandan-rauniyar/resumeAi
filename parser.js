const mammoth = require('mammoth');

// Extract text from PDF using pdfjs-dist (works on Node 22)
async function extractTextFromPDF(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

// Extract text from DOCX buffer
async function extractTextFromDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Extract text from DOC buffer (older Word format)
async function extractTextFromDOC(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Extract text from TXT buffer
async function extractTextFromTXT(buffer) {
  return buffer.toString('utf8');
}

module.exports = { extractTextFromPDF, extractTextFromDOCX, extractTextFromDOC, extractTextFromTXT };