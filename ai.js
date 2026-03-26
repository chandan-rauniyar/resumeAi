require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processResume(rawText) {
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `
You are a professional resume expert.
Analyze the resume text below carefully.

Return ONLY a raw valid JSON object — no explanation, no markdown, no code fences.

Use exactly this structure:
{
  "resume": {
    "name": "full name here",
    "email": "email here",
    "phone": "phone here",
    "summary": "professional summary here",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
      {
        "title": "job title",
        "company": "company name",
        "duration": "start year - end year",
        "bullets": ["achievement or responsibility 1", "achievement 2"]
      }
    ],
    "education": [
      {
        "degree": "degree name",
        "school": "university or school name",
        "year": "graduation year"
      }
    ]
  },
  "tips": [
    "Tip 1: specific actionable improvement",
    "Tip 2: specific actionable improvement",
    "Tip 3: specific actionable improvement",
    "Tip 4: specific actionable improvement"
  ]
}

If any field is missing from the resume, use an empty string "" or empty array [].

Resume text to analyze:
${rawText}
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Remove markdown code fences if Gemini adds them
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(text);
}

module.exports = { processResume };