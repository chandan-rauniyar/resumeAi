require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromDOC,
  extractTextFromTXT,
} = require('./parser');
const { scoreResumeAgainstJD, improveResume } = require('./ai');
const { generateTemplateA } = require('./templates/templateA');
const { generateTemplateB } = require('./templates/templateB');
const { generateTemplateC } = require('./templates/templateC');

if (!process.env.BOT_TOKEN) {
  console.error('Missing BOT_TOKEN. Add it to your .env file.');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY. Add it to your .env file.');
  process.exit(1);
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const sessions = new Map();

console.log('Resume Assistant Bot is running...');

function defaultSession() {
  return {
    mode: null,
    step: 'awaiting_mode',
    jobDescription: '',
    resumeText: '',
  };
}

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, defaultSession());
  }
  return sessions.get(chatId);
}

function resetSession(chatId) {
  sessions.set(chatId, defaultSession());
}

function modeKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['1) JD Match Score'],
        ['2) Resume Fixer'],

      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}

async function showMainMenu(chatId) {
  resetSession(chatId);
  await bot.sendMessage(
    chatId,
    [
      'Welcome to Resume AI Assistant.',
      '',
      'Choose a feature:',
      '1) JD + Resume -> Match Score (out of 10)',
      '2) Resume Fixer (improved content + formatting)',
      '',
      'You can type /reset anytime.',
    ].join('\n'),
    modeKeyboard()
  );
}

function formatList(items, emptyText) {
  if (!items || !items.length) return emptyText;
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

async function downloadTelegramFileBuffer(fileId) {
  const fileLink = await bot.getFileLink(fileId);
  const response = await axios({ url: fileLink, responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function extractResumeTextFromDocument(document) {
  const fileName = document.file_name || 'resume';
  const ext = path.extname(fileName).toLowerCase();
  const allowed = ['.pdf', '.docx', '.doc', '.txt'];

  if (!allowed.includes(ext)) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }

  const buffer = await downloadTelegramFileBuffer(document.file_id);

  if (ext === '.pdf') return extractTextFromPDF(buffer);
  if (ext === '.docx') return extractTextFromDOCX(buffer);
  if (ext === '.doc') return extractTextFromDOC(buffer);
  return extractTextFromTXT(buffer);
}

async function sendImprovedOutputs(chatId, improved) {
  const tempFiles = [];
  try {
    const unique = `${chatId}_${Date.now()}`;
    const pdfPathA = path.join(os.tmpdir(), `improved_resume_classic_${unique}.pdf`);
    const pdfPathB = path.join(os.tmpdir(), `improved_resume_modern_${unique}.pdf`);
    const pdfPathC = path.join(os.tmpdir(), `improved_resume_creative_${unique}.pdf`);
    tempFiles.push(pdfPathA, pdfPathB, pdfPathC);

    await generateTemplateA(improved.resume, pdfPathA);
    await generateTemplateB(improved.resume, pdfPathB);
    await generateTemplateC(improved.resume, pdfPathC);

    await bot.sendDocument(chatId, pdfPathA, {}, { filename: 'Improved_Resume_Classic.pdf', caption: '🗂 Improved resume - Classic Template' });
    await bot.sendDocument(chatId, pdfPathB, {}, { filename: 'Improved_Resume_Modern.pdf', caption: '✨ Improved resume - Modern Blue Template' });
    await bot.sendDocument(chatId, pdfPathC, {}, { filename: 'Improved_Resume_Creative.pdf', caption: '🎨 Improved resume - Creative Dark Template' });
  } finally {
    tempFiles.forEach((p) => fs.unlink(p, () => {}));
  }
}

async function runJDMatch(chatId, session) {
  await bot.sendMessage(chatId, '🤖 Analyzing JD and resume match. Please wait...');

  const result = await scoreResumeAgainstJD(session.jobDescription, session.resumeText);

  const message = [
    `📊 Match Score: ${result.matchScore}/10`,
    '',
    '❌ Missing Skills:',
    formatList(result.missingSkills, 'No major skill gaps detected.'),
    '',
    '✅ Strengths:',
    formatList(result.strengths, 'No strengths identified.'),
    '',
    '💡 Smart Suggestions:',
    formatList(result.smartSuggestions, 'No suggestions available.'),
  ].join('\n');

  await bot.sendMessage(chatId, message);

  await bot.sendMessage(
    chatId,
    'Would you like me to also generate an improved resume tailored to this JD? Reply with YES or NO.'
  );

  session.step = 'awaiting_post_match_improve_confirm';
}

async function runResumeFixer(chatId, session) {
  await bot.sendMessage(chatId, '🎨 Improving and reformatting your resume. Please wait...');

  const improved = await improveResume(session.resumeText, session.jobDescription);

  const summary = [
    '✅ Resume Fixer complete.',
    '',
    '🔧 Improvements Made:',
    formatList(improved.improvementsMade, 'No explicit improvements returned.'),
    '',
    '💡 Smart Suggestions:',
    formatList(improved.smartSuggestions, 'No additional suggestions returned.'),
  ].join('\n');

  await bot.sendMessage(chatId, summary);
  await sendImprovedOutputs(chatId, improved);

  await bot.sendMessage(chatId, 'Done! Use /start to process another resume.', modeKeyboard());
  resetSession(chatId);
}

bot.onText(/\/start/, async (msg) => {
  await showMainMenu(msg.chat.id);
});

bot.onText(/\/reset/, async (msg) => {
  await showMainMenu(msg.chat.id);
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);

  if (!['awaiting_resume_for_match', 'awaiting_resume_for_fixer', 'awaiting_jd'].includes(session.step)) {
    await bot.sendMessage(chatId, 'Please choose a mode first with /start.');
    return;
  }

  const processingType = session.step === 'awaiting_jd' ? 'Job Description' : 'Resume';
  await bot.sendMessage(chatId, `📎 ${processingType} file received. Extracting text...`);

  try {
    const text = await extractResumeTextFromDocument(msg.document);
    if (!text || !text.trim()) {
      await bot.sendMessage(chatId, '❌ Could not extract text from this file. Try another file or paste text.');
      return;
    }

    if (session.step === 'awaiting_jd') {
      session.jobDescription = text;
      session.step = 'awaiting_resume_for_match';
      await bot.sendMessage(chatId, '📄 Great! Now upload your resume (PDF/DOC/DOCX/TXT) or paste resume text.');
      return;
    }

    session.resumeText = text;

    if (session.step === 'awaiting_resume_for_match') {
      await runJDMatch(chatId, session);
      return;
    }

    await runResumeFixer(chatId, session);
  } catch (error) {
    if (error.message === 'UNSUPPORTED_FILE_TYPE') {
      await bot.sendMessage(chatId, '❌ Unsupported file. Please upload one of: PDF, DOC, DOCX, or TXT.');
      return;
    }

    console.error('Document processing failed:', error);
    await bot.sendMessage(chatId, '❌ File processing failed. Please try again.');
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;
  if (text.startsWith('/')) return;

  const session = getSession(chatId);
  const normalized = text.trim();

  try {
    if (session.step === 'awaiting_mode') {
      if (normalized === '1' || normalized.toLowerCase().includes('jd match')) {
        session.mode = 'jd_match';
        session.step = 'awaiting_jd';
        await bot.sendMessage(chatId, '📝 Send the Job Description (text or PDF/DOC/DOCX/TXT file).');
        return;
      }

      if (normalized === '2' || normalized.toLowerCase().includes('resume fixer')) {
        session.mode = 'resume_fixer';
        session.step = 'awaiting_resume_for_fixer';
        await bot.sendMessage(chatId, '📄 Upload your resume (PDF/DOC/DOCX/TXT) or paste resume text.');
        return;
      }

      await bot.sendMessage(chatId, 'Please choose 1 or 2 from the menu.', modeKeyboard());
      return;
    }

    if (session.step === 'awaiting_jd') {
      session.jobDescription = normalized;
      session.step = 'awaiting_resume_for_match';
      await bot.sendMessage(chatId, '📄 Great! Now upload your resume (PDF/DOC/DOCX/TXT) or paste resume text.');
      return;
    }

    if (session.step === 'awaiting_resume_for_match') {
      session.resumeText = normalized;
      await runJDMatch(chatId, session);
      return;
    }

    if (session.step === 'awaiting_resume_for_fixer') {
      session.resumeText = normalized;
      await runResumeFixer(chatId, session);
      return;
    }

    if (session.step === 'awaiting_post_match_improve_confirm') {
      const decision = normalized.toLowerCase();
      if (['yes', 'y'].includes(decision)) {
        session.step = 'awaiting_resume_for_fixer';
        await runResumeFixer(chatId, session);
        return;
      }

      if (['no', 'n'].includes(decision)) {
        await bot.sendMessage(chatId, 'Okay. Use /start to run another JD match or resume fixer.', modeKeyboard());
        resetSession(chatId);
        return;
      }

      await bot.sendMessage(chatId, 'Please reply with YES or NO.');
      return;
    }

    await bot.sendMessage(chatId, 'Use /start to begin.');
  } catch (error) {
    console.error('Message handling failed:', error);
    await bot.sendMessage(chatId, '❌ Something went wrong. Use /reset and try again.');
  }
});