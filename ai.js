require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processResume(rawText) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `
You are a professional resume expert and career coach.
Analyze the resume text below carefully and thoroughly.

Return ONLY a raw valid JSON object — no explanation, no markdown, no code fences.

Use exactly this structure:
{
  "resume": {
    "name": "full name here",
    "email": "email here",
    "phone": "phone number here",
    "linkedin": "linkedin URL or username if present, else empty string",
    "github": "github URL or username if present, else empty string",
    "summary": "write a 2-3 sentence professional summary based on the resume content if no summary is present",
    "skillGroups": [
      { "category": "Languages", "values": "Java, C/C++, JavaScript" },
      { "category": "Backend & APIs", "values": "Node.js, Express.js, REST APIs" },
      { "category": "Databases", "values": "PostgreSQL, MySQL, MongoDB" },
      { "category": "Tools", "values": "Git, Postman, Android Studio" }
    ],
    "experience": [
      {
        "title": "job title or project name",
        "company": "company name or 'Personal Project' for self-built projects",
        "duration": "Mon YYYY – Mon YYYY",
        "bullets": [
          "Achievement or responsibility 1 — quantify with numbers/% where possible",
          "Achievement 2"
        ]
      }
    ],
    "education": [
      {
        "degree": "degree name",
        "school": "university or school name",
        "location": "city, state/country",
        "years": "Aug 2023 – Present",
        "note": "CGPA: 7.91 or Percentage: 76%"
      }
    ],
    "certificates": [
      { "name": "Certificate Name", "issuer": "Issuer Name", "date": "Mon YYYY" }
    ],
    "achievements": [
      { "text": "Achievement description", "date": "Mon YYYY" }
    ],
    "extracurricular": [
      { "text": "Activity description", "date": "Mon YYYY" }
    ]
  },
  "score": {
    "overall": 7,
    "breakdown": {
      "content":      { "score": 7, "max": 10, "comment": "one line comment on content quality" },
      "impact":       { "score": 6, "max": 10, "comment": "one line comment on quantification and impact" },
      "skills":       { "score": 8, "max": 10, "comment": "one line comment on skills relevance" },
      "formatting":   { "score": 7, "max": 10, "comment": "one line comment on structure and layout" },
      "completeness": { "score": 7, "max": 10, "comment": "one line comment on missing sections or info" }
    },
    "strengths": [
      "Strength 1 — specific positive thing about the resume",
      "Strength 2 — specific positive thing"
    ],
    "improvements": [
      "Improvement 1 — specific actionable fix",
      "Improvement 2 — specific actionable fix",
      "Improvement 3 — specific actionable fix",
      "Improvement 4 — specific actionable fix"
    ]
  }
}

Rules:
- skillGroups MUST group skills by category (Languages, Backend, Databases, Tools, etc.) — never a flat list
- Extract ALL certificates, achievements, extracurricular found in the resume
- Always generate a summary if one is not present
- Score honestly — do not inflate. A fresh grad with no work experience should not score above 7 overall
- Improvements must be specific and actionable, not generic advice
- If any field has no data, use empty string "" or empty array []

Resume text to analyze:
${rawText}
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(text);
}

module.exports = { processResume };