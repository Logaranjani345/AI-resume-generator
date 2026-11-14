import { GoogleGenAI, Type } from '@google/genai';
import type {
  AtsAnalysisResult,
  ChatPersonaId,
  ResumeData,
  SkillsMap,
} from '../types/resume.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured on the server. Please verify Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function summarizeResumeForPrompt(resume: Partial<ResumeData>): string {
  const skillsFlat = resume.skills
    ? Object.entries(resume.skills)
        .filter(([, list]) => Array.isArray(list) && list.length > 0)
        .map(([cat, list]) => `${cat}: ${list.join(', ')}`)
        .join(' | ')
    : 'None listed';

  const eduText = (resume.educations || [])
    .filter((e) => e.institution || e.degree)
    .map(
      (e) =>
        `${e.degree} ${e.specialization ? `in ${e.specialization}` : ''} at ${e.institution} (${e.graduationYear}, ${e.score})`
    )
    .join('; ');

  const projText = (resume.projects || [])
    .filter((p) => p.title || p.description)
    .map(
      (p) =>
        `${p.title} [${p.technologies}]: ${p.description} | Contributions: ${p.contributions}`
    )
    .join('\n');

  const expText = (resume.experiences || [])
    .filter((x) => x.company || x.jobTitle)
    .map(
      (x) =>
        `${x.jobTitle} at ${x.company} (${x.duration}): ${x.responsibilities} | Achievements: ${x.achievements}`
    )
    .join('\n');

  const certText = (resume.certifications || [])
    .filter((c) => c.name || c.achievement)
    .map((c) => `${c.name} (${c.issuer}, ${c.completionDate}) ${c.achievement}`)
    .join('; ');

  return [
    `Name: ${resume.fullName || 'Not provided'}`,
    `Target Job Role: ${resume.targetRole || 'Not specified'}`,
    `Career Objective: ${resume.careerObjective || 'Not provided'}`,
    `Summary: ${resume.summary || 'Not provided'}`,
    `Education: ${eduText || 'Not provided'}`,
    `Skills: ${skillsFlat || 'Not provided'}`,
    `Projects:\n${projText || 'Not provided'}`,
    `Experience:\n${expText || 'Not provided'}`,
    `Certifications & Achievements: ${certText || 'Not provided'}`,
  ].join('\n');
}

export async function generateSummaryOrObjective(
  mode: 'summary' | 'career_objective',
  resume: Partial<ResumeData>
): Promise<{ text: string; modelUsed: string }> {
  const ai = getAiClient();
  const isFast = mode === 'career_objective';
  const model = isFast ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

  const instruction =
    mode === 'summary'
      ? 'You are a senior technical resume writer. Write a concise, 3-to-4 line ATS-friendly professional summary based strictly on the provided candidate details. NEVER invent skills, companies, metrics, certifications, or degrees that are not in the input. Plain text only, no markdown headings or bullet points.'
      : 'You are a career mentor. Write a crisp 1-to-2 sentence career objective tailored to the candidate target role and actual background. NEVER fabricate qualifications or experience. Plain text only.';

  const response = await ai.models.generateContent({
    model,
    contents: `Candidate Profile:\n${summarizeResumeForPrompt(resume)}`,
    config: {
      systemInstruction: instruction,
    },
  });

  return {
    text: (response.text || '').trim(),
    modelUsed: model,
  };
}

export async function polishBulletPoints(
  kind: 'project' | 'experience',
  payload: {
    titleOrRole: string;
    context: string;
    rawText: string;
    targetRole?: string;
  }
): Promise<{ text: string; modelUsed: string }> {
  const ai = getAiClient();
  const model = 'gemini-4-hydrogen';

  const systemInstruction =
    kind === 'project'
      ? 'You are an engineering resume editor. Rewrite the project description and contributions into 2 to 4 concise, action-verb-led bullet points starting with "- ". Preserve 100% factual accuracy—do NOT invent metrics, percentages, users, or technologies that the user did not mention.'
      : 'You are an engineering resume editor. Improve the work experience responsibilities and achievements into 3 to 4 crisp, achievement-oriented bullet points starting with "- ". Preserve factual accuracy strictly and never fabricate numbers or accomplishments.';

  const prompt = [
    `Target Role: ${payload.targetRole || 'Software Engineer'}`,
    `Title / Position: ${payload.titleOrRole}`,
    `Technologies / Company Context: ${payload.context}`,
    `Original Notes:\n${payload.rawText}`,
  ].join('\n\n');

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { systemInstruction },
  });

  return {
    text: (response.text || '').trim(),
    modelUsed: model,
  };
}

export async function suggestRelevantSkills(
  resume: Partial<ResumeData>
): Promise<{ suggestions: Partial<SkillsMap>; note: string; modelUsed: string }> {
  const ai = getAiClient();
  const model = 'gemini-3.1-flash-lite';

  const response = await ai.models.generateContent({
    model,
    contents: `Target Job Role: ${resume.targetRole || 'Software Engineer'}\nJob Description:\n${resume.jobDescription || 'None provided'}\n\nCurrent Resume:\n${summarizeResumeForPrompt(resume)}`,
    config: {
      systemInstruction:
        'Suggest relevant, realistic skills for the candidate to review and add ONLY if they genuinely possess them. Group suggestions into categories and avoid duplicating skills already listed.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          technical: { type: Type.ARRAY, items: { type: Type.STRING } },
          languages: { type: Type.ARRAY, items: { type: Type.STRING } },
          frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
          databases: { type: Type.ARRAY, items: { type: Type.STRING } },
          tools: { type: Type.ARRAY, items: { type: Type.STRING } },
          soft: { type: Type.ARRAY, items: { type: Type.STRING } },
          note: {
            type: Type.STRING,
            description:
              'Short reminder asking the candidate to verify they actually know each selected skill.',
          },
        },
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim());
  return {
    suggestions: {
      technical: Array.isArray(parsed.technical) ? parsed.technical : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
      databases: Array.isArray(parsed.databases) ? parsed.databases : [],
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      soft: Array.isArray(parsed.soft) ? parsed.soft : [],
    },
    note:
      parsed.note ||
      'Review these suggestions and only add skills you can confidently discuss in an interview.',
    modelUsed: model,
  };
}

export async function analyzeAtsAndResume(
  resume: Partial<ResumeData>,
  jobDescription: string
): Promise<{ analysis: AtsAnalysisResult; modelUsed: string }> {
  const ai = getAiClient();
  const model = 'gemini-4-hydrogen';

  const response = await ai.models.generateContent({
    model,
    contents: [
      `Target Job Role: ${resume.targetRole || 'Not specified'}`,
      `Target Job Description:\n${jobDescription || 'No job description provided. Perform a general ATS structure, clarity, and completeness review.'}`,
      `Candidate Resume:\n${summarizeResumeForPrompt(resume)}`,
    ].join('\n\n'),
    config: {
      systemInstruction:
        'You are an ATS and technical recruiting specialist. Compare the candidate resume against the target job description (or general engineering hiring standards if no JD is given). Identify real matching skills present in the resume, missing keywords from the JD, missing resume sections/details (like contact links, dates, project stack), concrete improvements, and areas to strengthen. NEVER fabricate qualifications and NEVER claim the resume is guaranteed to pass every ATS.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchingSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Skills/keywords verified in both the resume and target role/JD.',
          },
          missingKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Important keywords from the job description absent from the resume.',
          },
          missingInfo: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Missing resume sections, links, or factual details worth completing.',
          },
          improvements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Actionable edits for wording, clarity, and ATS readability.',
          },
          strengthenAreas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Sections or projects that could be expanded with stronger evidence.',
          },
          disclaimer: {
            type: Type.STRING,
            description:
              'Transparent note that ATS systems vary and no tool guarantees passing every ATS, plus reminder to verify factual accuracy.',
          },
        },
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim());
  return {
    analysis: {
      matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      strengthenAreas: Array.isArray(parsed.strengthenAreas) ? parsed.strengthenAreas : [],
      disclaimer:
        parsed.disclaimer ||
        'ATS scoring criteria vary by employer and platform. Always verify AI suggestions for factual accuracy before submitting.',
    },
    modelUsed: model,
  };
}

const PERSONA_CONFIG: Record<
  ChatPersonaId,
  { model: string; systemInstruction: string }
> = {
  'career-coach': {
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'You are an encouraging, practical Career Coach helping students, freshers, and engineers refine their resumes and prepare for technical job applications. Give structured, concise advice grounded strictly in the user resume context when provided. Never fabricate experience or guarantees.',
  },
  'ats-reviewer': {
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'You are a strict ATS & Technical Recruiter Reviewer. Evaluate wording, keyword alignment, section clarity, and impact without inventing metrics. Remind the user to verify any suggested rewrites against their real work.',
  },
  'quick-editor': {
    model: 'gemini-3.1-flash-lite',
    systemInstruction:
      'You are a fast, crisp Resume Bullet Editor. Give short, high-impact plain-text bullet rewrites and quick phrasing alternatives in seconds while keeping all facts strictly accurate.',
  },
};

export async function sendChatTurn(params: {
  persona: ChatPersonaId;
  history: Array<{ role: 'user' | 'model'; content: string }>;
  userMessage: string;
  resumeContext?: Partial<ResumeData> | null;
}): Promise<{ reply: string; modelUsed: string }> {
  const ai = getAiClient();
  const config = PERSONA_CONFIG[params.persona] || PERSONA_CONFIG['career-coach'];

  const systemInstruction = params.resumeContext
    ? `${config.systemInstruction}\n\nCurrent Candidate Resume Context (for factual reference only):\n${summarizeResumeForPrompt(params.resumeContext)}`
    : config.systemInstruction;

  const chat = ai.chats.create({
    model: config.model,
    config: {
      systemInstruction,
    },
    history: params.history.slice(-16).map((item) => ({
      role: item.role,
      parts: [{ text: item.content }],
    })),
  });

  const response = await chat.sendMessage({
    message: params.userMessage,
  });

  return {
    reply: (response.text || '').trim(),
    modelUsed: config.model,
  };
}
