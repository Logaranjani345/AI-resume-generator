import express from 'express';
import { MongoServerError, ObjectId } from 'mongodb';

import { createUserAccount, findUserByEmail } from '../src/db/users.ts';
import { createSession, deleteSession } from '../src/db/sessions.ts';

import {
  createUserResume,
  deleteUserResume,
  getUserResumes,
  updateUserResume,
} from '../src/db/resumes.ts';

import {
  appendChatMessage,
  clearUserChatMessages,
  getUserChatMessages,
} from '../src/db/chat.ts';

import {
  AuthRequest,
  clearSessionCookie,
  getSessionToken,
  optionalAuth,
  requireAuth,
  setSessionCookie,
} from '../src/middleware/auth.ts';

import { hashPassword, verifyPassword } from '../src/lib/password.ts';

import {
  analyzeAtsAndResume,
  generateSummaryOrObjective,
  polishBulletPoints,
  sendChatTurn,
  suggestRelevantSkills,
} from '../src/services/gemini.ts';

import type { ChatPersonaId, ResumeData } from '../src/types/resume.ts';

import {
  buildResumePdfArrayBuffer,
  type PdfExportOptions,
} from '../src/utils/pdfExport.ts';

function getCredentials(
  body: unknown
): { email: string; password: string } | null {
  if (!body || typeof body !== 'object') return null;
  const credentials = body as { email?: unknown; password?: unknown };
  if (
    typeof credentials.email !== 'string' ||
    typeof credentials.password !== 'string'
  ) {
    return null;
  }

  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length === 0 ||
    password.length > 128
  ) {
    return null;
  }

  return { email, password };
}

const app = express();

app.use(express.json({ limit: '2mb' }));

  app.get('/api/auth/me', optionalAuth, (req: AuthRequest, res) => {
    res.json({
      user: req.user
        ? { id: req.user.id.toHexString(), email: req.user.email }
        : null,
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const credentials = getCredentials(req.body);
    if (!credentials || credentials.password.length < 8) {
      return res.status(400).json({
        error: 'Enter a valid email and a password between 8 and 128 characters.',
      });
    }

    try {
      const passwordHash = await hashPassword(credentials.password);
      const user = await createUserAccount(credentials.email, passwordHash);
      const token = await createSession(user._id);
      setSessionCookie(res, token);
      return res.status(201).json({
        user: { id: user._id.toHexString(), email: user.email },
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return res.status(409).json({
          error: 'An account with that email already exists.',
        });
      }
      console.error('Account registration failed:', error);
      return res
        .status(500)
        .json({ error: 'Unable to create your account right now.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const credentials = getCredentials(req.body);
    if (!credentials) {
      return res.status(400).json({ error: 'Enter a valid email and password.' });
    }

    try {
      const user = await findUserByEmail(credentials.email);
      const passwordMatches = user
        ? await verifyPassword(credentials.password, user.passwordHash)
        : false;
      if (!user || !passwordMatches) {
        return res.status(401).json({ error: 'Email or password is incorrect.' });
      }

      const token = await createSession(user._id);
      setSessionCookie(res, token);
      return res.json({
        user: { id: user._id.toHexString(), email: user.email },
      });
    } catch (error) {
      console.error('Account sign-in failed:', error);
      return res.status(500).json({ error: 'Unable to sign in right now.' });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    const token = getSessionToken(req);
    try {
      if (token) await deleteSession(token);
      clearSessionCookie(res);
      return res.json({ ok: true });
    } catch (error) {
      console.error('Account sign-out failed:', error);
      return res.status(500).json({ error: 'Unable to sign out right now.' });
    }
  });

  // Authenticated Resume CRUD endpoints (MongoDB)
  app.get('/api/resumes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserResumes(req.user!.id);
      res.json({ resumes: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load resumes' });
    }
  });

  app.post('/api/resumes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const payload = req.body as ResumeData;
      const created = await createUserResume(req.user!.id, payload);
      res.status(201).json({ resume: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create resume' });
    }
  });

  app.put('/api/resumes/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid resume ID' });
      }
      const updated = await updateUserResume(
        req.user!.id,
        new ObjectId(req.params.id),
        req.body as ResumeData
      );
      if (!updated) {
        return res.status(404).json({ error: 'Resume not found' });
      }
      res.json({ resume: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update resume' });
    }
  });

  app.delete('/api/resumes/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid resume ID' });
      }
      const removed = await deleteUserResume(
        req.user!.id,
        new ObjectId(req.params.id)
      );
      if (!removed) {
        return res.status(404).json({ error: 'Resume not found' });
      }
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete resume' });
    }
  });

  // Authenticated Chat History endpoints
  app.get('/api/chat', requireAuth, async (req: AuthRequest, res) => {
    try {
      const messages = await getUserChatMessages(req.user!.id);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch chat history' });
    }
  });

  app.delete('/api/chat', requireAuth, async (req: AuthRequest, res) => {
    try {
      await clearUserChatMessages(req.user!.id);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to clear chat history' });
    }
  });

  // Server-side Resume PDF generation endpoint
  app.post('/api/generate-pdf', (req, res) => {
    try {
      const body = req.body || {};
      const resumePayload = (body.resume ?? body) as ResumeData;
      if (!resumePayload || typeof resumePayload !== 'object') {
        return res.status(400).json({ error: 'Invalid resume payload.' });
      }

      const rawOptions = body.options as Partial<PdfExportOptions> | undefined;
      const options: PdfExportOptions = {
        includeSocialLinks: rawOptions?.includeSocialLinks !== false,
        margins: rawOptions?.margins === 'compact' ? 'compact' : 'standard',
      };

      const arrayBuffer = buildResumePdfArrayBuffer(resumePayload, options);
      const pdfBuffer = Buffer.from(arrayBuffer);

      const safeFileName =
        (resumePayload.fullName || resumePayload.title || 'Resume')
          .trim()
          .replace(/[^a-zA-Z0-9_-]+/g, '_') + '_Resume.pdf';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFileName}"`
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate resume PDF.',
      });
    }
  });

  // Server-side Gemini AI content & ATS analysis endpoint
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { task, resume, payload, jobDescription } = req.body || {};
      if (!task) {
        return res.status(400).json({ error: 'Missing AI task type' });
      }

      if (task === 'summary' || task === 'career_objective') {
        const result = await generateSummaryOrObjective(task, resume || {});
        return res.json(result);
      }

      if (task === 'project_bullets' || task === 'experience_improve') {
        if (!payload?.rawText?.trim()) {
          return res.status(400).json({
            error: 'Please enter a draft description or notes first so AI can rewrite it accurately.',
          });
        }
        const result = await polishBulletPoints(
          task === 'project_bullets' ? 'project' : 'experience',
          payload
        );
        return res.json(result);
      }

      if (task === 'skills_suggest') {
        const result = await suggestRelevantSkills(resume || {});
        return res.json(result);
      }

      if (task === 'ats_analysis') {
        const result = await analyzeAtsAndResume(
          resume || {},
          typeof jobDescription === 'string' ? jobDescription : ''
        );
        return res.json(result);
      }

      return res.status(400).json({ error: `Unsupported AI task: ${task}` });
    } catch (error: any) {
      console.error('Gemini AI generate error:', error);
      const status = error?.status === 429 ? 429 : 500;
      res.status(status).json({
        error:
          error?.message ||
          'AI service is temporarily unavailable. Please try again in a moment.',
      });
    }
  });

  // Server-side Multi-turn Gemini Chatbot endpoint (persists when authenticated)
  app.post('/api/ai/chat', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { message, persona, history, resumeContext } = req.body || {};
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      const activePersona: ChatPersonaId =
        persona === 'ats-reviewer' || persona === 'quick-editor'
          ? persona
          : 'career-coach';

      const dbUserId = req.user?.id || null;
      let dbHistory: Array<{ role: 'user' | 'model'; content: string }> = [];

      if (dbUserId) {
        const saved = await getUserChatMessages(dbUserId);
        dbHistory = saved.map((m) => ({ role: m.role, content: m.content }));
      }

      const effectiveHistory =
        dbUserId !== null
          ? dbHistory
          : Array.isArray(history)
            ? history
                .filter(
                  (h: any) =>
                    (h.role === 'user' || h.role === 'model') &&
                    typeof h.content === 'string'
                )
                .map((h: any) => ({ role: h.role, content: h.content }))
            : [];

      const { reply, modelUsed } = await sendChatTurn({
        persona: activePersona,
        history: effectiveHistory,
        userMessage: message.trim(),
        resumeContext: resumeContext || null,
      });

      if (dbUserId !== null) {
        await appendChatMessage(dbUserId, {
          role: 'user',
          persona: activePersona,
          modelUsed,
          content: message.trim(),
        });
        await appendChatMessage(dbUserId, {
          role: 'model',
          persona: activePersona,
          modelUsed,
          content: reply,
        });
      }

      res.json({ reply, modelUsed, persona: activePersona });
    } catch (error: any) {
      console.error('Gemini AI chat error:', error);
      const status = error?.status === 429 ? 429 : 500;
      res.status(status).json({
        error:
          error?.message ||
          'Unable to reach the Gemini Assistant right now. Please try again.',
      });
    }
  });

 export default app;