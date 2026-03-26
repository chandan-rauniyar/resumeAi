require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { extractTextFromPDF, extractTextFromDOCX } = require('./parser');
const { processResume } = require('./ai');
const { generateTemplateA } = require('./templates/templateA');
const { generateTemplateB } = require('./templates/templateB');
const { generateTemplateC } = require('./templates/templateC');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
console.log('🤖 Resume Bot is running...');

// ── /start command ──
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 *Welcome to Resume Builder Bot!*\n\n` +
    `Send me your resume as:\n` +
    `📝 *Plain text* — just type it\n` +
    `📄 *PDF file* — upload it\n` +
    `📃 *Word file* — upload .docx\n\n` +
    `I will:\n` +
    `📊 Score your resume out of 10\n` +
    `✅ Give you improvement suggestions\n` +
    `🎨 Return *3 styled PDF resumes*`,
    { parse_mode: 'Markdown' }
  );
});

// ── Handle plain text messages ──
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    await handleResume(msg.chat.id, msg.text);
  }
});

// ── Handle file uploads ──
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const doc = msg.document;
  const fileName = doc.file_name || 'resume';
  const ext = path.extname(fileName).toLowerCase();

  if (!['.pdf', '.docx'].includes(ext)) {
    return bot.sendMessage(chatId, '❌ Please send a PDF or DOCX file only.');
  }

  await bot.sendMessage(chatId, `📎 Received *${fileName}* — extracting text...`, {
    parse_mode: 'Markdown',
  });

  try {
    const fileLink = await bot.getFileLink(doc.file_id);
    const response = await axios({ url: fileLink, responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    let rawText = '';
    if (ext === '.pdf')  rawText = await extractTextFromPDF(buffer);
    if (ext === '.docx') rawText = await extractTextFromDOCX(buffer);

    if (!rawText || !rawText.trim()) {
      return bot.sendMessage(
        chatId,
        '❌ Could not extract text from this file.\nTry typing your resume as plain text instead.'
      );
    }

    await handleResume(chatId, rawText);
  } catch (err) {
    console.error('File error:', err.message);
    bot.sendMessage(chatId, '❌ File processing failed. Please try again.');
  }
});

// ── Build score bar (e.g. ████░░░░░░ 7/10) ──
function scoreBar(score, max = 10) {
  const filled = Math.round(score);
  const empty = max - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + `  ${score}/${max}`;
}

// ── Build score emoji based on value ──
function scoreEmoji(score) {
  if (score >= 9) return '🌟';
  if (score >= 7) return '✅';
  if (score >= 5) return '⚠️';
  return '❌';
}

// ── Format the full score message ──
function buildScoreMessage(score) {
  const { overall, breakdown, strengths, improvements } = score;

  const overallEmoji = scoreEmoji(overall);
  const stars = '⭐'.repeat(Math.round(overall / 2));

  let msg = `${overallEmoji} *Resume Score: ${overall}/10*\n`;
  msg += `${stars}\n\n`;

  msg += `📊 *Score Breakdown:*\n`;
  msg += `┌─────────────────────────────\n`;

  const labels = {
    content:      '📝 Content    ',
    impact:       '💥 Impact     ',
    skills:       '🛠 Skills     ',
    formatting:   '🎨 Formatting ',
    completeness: '📋 Complete   ',
  };

  for (const [key, label] of Object.entries(labels)) {
    const item = breakdown[key];
    if (!item) continue;
    msg += `│ ${label} ${scoreBar(item.score)}\n`;
    msg += `│   └ ${item.comment}\n`;
  }
  msg += `└─────────────────────────────\n\n`;

  if (strengths?.length) {
    msg += `💪 *What's Working:*\n`;
    strengths.forEach((s, i) => {
      msg += `${i + 1}. ${s}\n`;
    });
    msg += `\n`;
  }

  if (improvements?.length) {
    msg += `🔧 *What to Improve:*\n`;
    improvements.forEach((imp, i) => {
      msg += `${i + 1}. ${imp}\n`;
    });
  }

  return msg;
}

// ── Core logic ──
async function handleResume(chatId, rawText) {
  await bot.sendMessage(chatId, '🤖 Analyzing your resume with AI...\n⏳ Please wait 10–20 seconds.');

  try {
    const result = await processResume(rawText);
    const { resume, score } = result;

    // ── 1. Send Score Report ──
    if (score) {
      const scoreMsg = buildScoreMessage(score);
      await bot.sendMessage(chatId, scoreMsg, { parse_mode: 'Markdown' });
    }

    // ── 2. Generate PDFs ──
    await bot.sendMessage(chatId, '🎨 Generating 3 resume templates...');

    const pathA = `resume_classic_${chatId}.pdf`;
    const pathB = `resume_modern_${chatId}.pdf`;
    const pathC = `resume_creative_${chatId}.pdf`;

    await generateTemplateA(resume, pathA);
    await generateTemplateB(resume, pathB);
    await generateTemplateC(resume, pathC);

    await bot.sendDocument(chatId, pathA, {}, { filename: 'Resume_Classic.pdf',   caption: '🗂 Template A — Classic' });
    await bot.sendDocument(chatId, pathB, {}, { filename: 'Resume_Modern.pdf',    caption: '✨ Template B — Modern Blue' });
    await bot.sendDocument(chatId, pathC, {}, { filename: 'Resume_Creative.pdf',  caption: '🎨 Template C — Creative Dark' });

    [pathA, pathB, pathC].forEach((p) => fs.unlink(p, () => {}));

    await bot.sendMessage(chatId, '✅ Done! Send another resume anytime to get a new score and templates.');

  } catch (err) {
    console.error('Resume processing error:', err.message);
    bot.sendMessage(chatId, '❌ Something went wrong. Please try again in a moment.');
  }
}