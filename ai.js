require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractJSONObject(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in AI response.');
  }
  return text.slice(start, end + 1);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampScore(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(10, Math.round(num * 10) / 10));
}

function normalizeResume(resume) {
  const safe = resume || {};
  return {
    name: safe.name || '',
    email: safe.email || '',
    phone: safe.phone || '',
    linkedin: safe.linkedin || '',
    github: safe.github || '',
    summary: safe.summary || '',
    skillGroups: ensureArray(safe.skillGroups).map((group) => ({
      category: group?.category || 'Skills',
      values: group?.values || '',
    })),
    experience: ensureArray(safe.experience).map((exp) => ({
      title: exp?.title || '',
      company: exp?.company || '',
      duration: exp?.duration || '',
      bullets: ensureArray(exp?.bullets).map((b) => String(b)),
    })),
    education: ensureArray(safe.education).map((edu) => ({
      degree: edu?.degree || '',
      school: edu?.school || '',
      location: edu?.location || '',
      years: edu?.years || '',
      note: edu?.note || '',
    })),
    certificates: ensureArray(safe.certificates).map((cert) => ({
      name: cert?.name || '',
      issuer: cert?.issuer || '',
      date: cert?.date || '',
    })),
    achievements: ensureArray(safe.achievements).map((ach) => ({
      text: ach?.text || '',
      date: ach?.date || '',
    })),
    extracurricular: ensureArray(safe.extracurricular).map((extra) => ({
      text: extra?.text || '',
      date: extra?.date || '',
    })),
  };
}

function renderResumePlainText(resume) {
  const lines = [];
  const name = resume.name || 'Candidate Name';
  lines.push(name);
  lines.push([resume.email, resume.phone].filter(Boolean).join(' | '));
  lines.push('');

  if (resume.summary) {
    lines.push('SUMMARY');
    lines.push(resume.summary);
    lines.push('');
  }

  if (resume.skillGroups?.length) {
    lines.push('SKILLS');
    resume.skillGroups.forEach((group) => {
      if (group.category && group.values) {
        lines.push(`${group.category}: ${group.values}`);
      }
    });
    lines.push('');
  }

  if (resume.experience.length) {
    lines.push('EXPERIENCE');
    resume.experience.forEach((exp) => {
      lines.push(`${exp.title} - ${exp.company}`.trim());
      if (exp.duration) lines.push(exp.duration);
      exp.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push('');
    });
  }

  if (resume.education.length) {
    lines.push('EDUCATION');
    resume.education.forEach((edu) => {
      lines.push(`${edu.degree} - ${edu.school}`.trim());
      if (edu.location) lines.push(edu.location);
      if (edu.years) lines.push(edu.years);
      if (edu.note) lines.push(edu.note);
      lines.push('');
    });
  }

  if (resume.certificates.length) {
    lines.push('CERTIFICATES');
    resume.certificates.forEach((cert) => {
      lines.push(`${cert.name} - ${cert.issuer} (${cert.date})`.trim());
    });
    lines.push('');
  }

  if (resume.achievements.length) {
    lines.push('ACHIEVEMENTS');
    resume.achievements.forEach((ach) => {
      lines.push(`${ach.text} (${ach.date})`.trim());
    });
    lines.push('');
  }

  if (resume.extracurricular.length) {
    lines.push('EXTRACURRICULAR');
    resume.extracurricular.forEach((extra) => {
      lines.push(`${extra.text} (${extra.date})`.trim());
    });
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

function renderResumeMarkdown(resume) {
  const lines = [];
  lines.push(`# ${resume.name || 'Candidate Name'}`);
  const contact = [resume.email, resume.phone, resume.linkedin, resume.github].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);
  lines.push('');

  if (resume.summary) {
    lines.push('## Summary');
    lines.push(resume.summary);
    lines.push('');
  }

  if (resume.skillGroups?.length) {
    lines.push('## Skills');
    resume.skillGroups.forEach((group) => {
      if (group.category && group.values) {
        lines.push(`### ${group.category}`);
        lines.push(group.values);
        lines.push('');
      }
    });
  }

  if (resume.experience.length) {
    lines.push('## Experience');
    resume.experience.forEach((exp) => {
      lines.push(`### ${exp.title || 'Role'} - ${exp.company || 'Company'}`);
      if (exp.duration) lines.push(`*${exp.duration}*`);
      if (exp.bullets.length) {
        lines.push(exp.bullets.map((b) => `- ${b}`).join('\n'));
      }
      lines.push('');
    });
  }

  if (resume.education.length) {
    lines.push('## Education');
    resume.education.forEach((edu) => {
      lines.push(`- **${edu.degree || 'Degree'}** - ${edu.school || 'School'}`);
      if (edu.location) lines.push(`  - ${edu.location}`);
      if (edu.years) lines.push(`  - ${edu.years}`);
      if (edu.note) lines.push(`  - ${edu.note}`);
    });
    lines.push('');
  }

  if (resume.certificates.length) {
    lines.push('## Certificates');
    resume.certificates.forEach((cert) => {
      lines.push(`- ${cert.name || 'Certificate'} - ${cert.issuer || 'Issuer'} (${cert.date || ''})`);
    });
    lines.push('');
  }

  if (resume.achievements.length) {
    lines.push('## Achievements');
    resume.achievements.forEach((ach) => {
      lines.push(`- ${ach.text || 'Achievement'} (${ach.date || ''})`);
    });
    lines.push('');
  }

  if (resume.extracurricular.length) {
    lines.push('## Extracurricular');
    resume.extracurricular.forEach((extra) => {
      lines.push(`- ${extra.text || 'Activity'} (${extra.date || ''})`);
    });
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

async function generateJson(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/^json\s*/i, '').replace(/^\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(extractJSONObject(text));
}

async function scoreResumeAgainstJD(jobDescription, resumeText) {
  const prompt = `
You are an ATS and senior hiring expert.
Compare the candidate resume against the provided job description.

Return ONLY a valid raw JSON object with this exact shape:
{
  "matchScore": 0,
  "missingSkills": ["skill 1", "skill 2"],
  "strengths": ["strength 1", "strength 2"],
  "smartSuggestions": [
    "Add React experience",
    "Improve action verbs",
    "Quantify achievements"
  ]
}

Rules:
- matchScore must be a number from 0 to 10 with one decimal place.
- missingSkills: 3 to 8 concise items.
- strengths: 3 to 6 concise items.
- smartSuggestions: 4 to 8 actionable resume improvements.

Job Description:
${jobDescription}

Resume:
${resumeText}
`;

  const parsed = await generateJson(prompt);
  return {
    matchScore: clampScore(parsed?.matchScore),
    missingSkills: ensureArray(parsed?.missingSkills).map((x) => String(x)).slice(0, 10),
    strengths: ensureArray(parsed?.strengths).map((x) => String(x)).slice(0, 10),
    smartSuggestions: ensureArray(parsed?.smartSuggestions).map((x) => String(x)).slice(0, 12),
  };
}

async function improveResume(resumeText, jobDescription = '') {
  const prompt = `
You are a professional resume editor.
Make small, targeted improvements to enhance clarity and impact while preserving the original content and structure.
${jobDescription ? 'Also make minor adjustments to better align with the target role in the job description.' : ''}

Return ONLY a valid raw JSON object with this exact shape:
{
  "resume": {
    "name": "full name",
    "email": "email",
    "phone": "phone",
    "linkedin": "linkedin URL or username if present, else empty string",
    "github": "github URL or username if present, else empty string",
    "summary": "keep original summary or make minor improvements if present, else create brief one",
    "skillGroups": [
      { "category": "Languages", "values": "Java, C/C++, JavaScript" },
      { "category": "Backend & APIs", "values": "Node.js, Express.js, REST APIs" },
      { "category": "Databases", "values": "PostgreSQL, MySQL, MongoDB" },
      { "category": "Tools", "values": "Git, Postman, Android Studio" }
    ],
    "experience": [
      {
        "title": "keep original job title",
        "company": "keep original company name",
        "duration": "keep original duration format",
        "bullets": [
          "keep original content, make small grammar/impact improvements",
          "add metrics only if clearly implied in original text"
        ]
      }
    ],
    "education": [
      {
        "degree": "keep original degree",
        "school": "keep original school",
        "location": "keep original location",
        "years": "keep original years",
        "note": "keep original notes like CGPA/percentage"
      }
    ],
    "certificates": [
      { "name": "keep original certificate name", "issuer": "keep original issuer", "date": "keep original date" }
    ],
    "achievements": [
      { "text": "keep original achievement text", "date": "keep original date" }
    ],
    "extracurricular": [
      { "text": "keep original activity text", "date": "keep original date" }
    ]
  },
  "improvementsMade": ["what was improved"],
  "smartSuggestions": ["next improvement"]
}

Rules:
- PRESERVE all original content, facts, and structure
- Make ONLY minor improvements: fix grammar, strengthen 1-2 action verbs per bullet, add numbers/metrics if clearly present in original
- Do NOT change job titles, company names, dates, or core content
- Do NOT add new information or achievements not present in original
- Keep the same number of experience entries, education entries, etc.
- Group skills by category but keep original skill names
- Extract ALL certificates, achievements, extracurricular found in the resume
- Keep original summary if present, or make it slightly more professional

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}
Original Resume:
${resumeText}
`;

  const parsed = await generateJson(prompt);
  const resume = normalizeResume(parsed?.resume);

  return {
    resume,
    improvementsMade: ensureArray(parsed?.improvementsMade).map((x) => String(x)).slice(0, 12),
    smartSuggestions: ensureArray(parsed?.smartSuggestions).map((x) => String(x)).slice(0, 12),
    plainText: renderResumePlainText(resume),
    markdown: renderResumeMarkdown(resume),
  };
}

module.exports = {
  scoreResumeAgainstJD,
  improveResume,
};