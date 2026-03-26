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
    // Download file from Telegram servers
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

// ── Core logic — runs for both text and file ──
async function handleResume(chatId, rawText) {
  await bot.sendMessage(chatId, '🤖 Analyzing your resume with Gemini AI...\n⏳ Please wait 10–20 seconds.');

  try {
    const result = await processResume(rawText);
    const { resume, tips } = result;

    // Send improvement tips first
    const tipText =
      `✅ *Improvement Suggestions:*\n\n` +
      tips.map((t, i) => `${i + 1}. ${t}`).join('\n');
    await bot.sendMessage(chatId, tipText, { parse_mode: 'Markdown' });

    await bot.sendMessage(chatId, '🎨 Generating 3 resume templates...');

    // Unique filenames per user to avoid conflicts
    const pathA = `resume_classic_${chatId}.pdf`;
    const pathB = `resume_modern_${chatId}.pdf`;
    const pathC = `resume_creative_${chatId}.pdf`;

    // Generate all 3 PDFs
    await generateTemplateA(resume, pathA);
    await generateTemplateB(resume, pathB);
    await generateTemplateC(resume, pathC);

    // Send all 3 PDFs back
    await bot.sendDocument(chatId, pathA, {}, { filename: 'Resume_Classic.pdf',   caption: '🗂 Template A — Classic' });
    await bot.sendDocument(chatId, pathB, {}, { filename: 'Resume_Modern.pdf',    caption: '✨ Template B — Modern Blue' });
    await bot.sendDocument(chatId, pathC, {}, { filename: 'Resume_Creative.pdf',  caption: '🎨 Template C — Creative Green' });

    // Cleanup temp files
    [pathA, pathB, pathC].forEach((p) => fs.unlink(p, () => {}));

    await bot.sendMessage(chatId, '✅ Done! Download any template you like. Send another resume anytime.');

  } catch (err) {
    console.error('Resume processing error:', err.message);
    bot.sendMessage(chatId, '❌ Something went wrong. Please try again in a moment.');
  }
}