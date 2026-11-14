import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  createUserResume,
  deleteUserResume,
  getUserResumes,
  updateUserResume,
} from './src/db/resumes.ts';
import {
  appendChatMessage,
  clearUserChatMessages,
  getUserChatMessages,
} from './src/db/chat.ts';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';
import {
  analyzeAtsAndResume,
  generateSummaryOrObjective,
  polishBulletPoints,
  sendChatTurn,
  suggestRelevantSkills,
} from './src/services/gemini.ts';
import type { ChatPersonaId, ResumeData } from './src/types/resume.ts';
import {
  buildResumePdfArrayBuffer,
  type PdfExportOptions,
} from './src/utils/pdfExport.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Authenticated Resume CRUD endpoints (Cloud SQL PostgreSQL)
  app.get('/api/resumes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || ''
      );
      const list = await getUserResumes(dbUser.id);
      res.json({ resumes: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load resumes' });
    }
  });

  app.post('/api/resumes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || ''
      );
      const payload = req.body as ResumeData;
      const created = await createUserResume(dbUser.id, payload);
      res.status(201).json({ resume: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create resume' });
    }
  });

  app.put('/api/resumes/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const resumeId = Number(req.params.id);
      if (!Number.isInteger(resumeId) || resumeId <= 0) {
        return res.status(400).json({ error: 'Invalid resume ID' });
      }
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || ''
      );
      const updated = await updateUserResume(
        dbUser.id,
        resumeId,
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
      const resumeId = Number(req.params.id);
      if (!Number.isInteger(resumeId) || resumeId <= 0) {
        return res.status(400).json({ error: 'Invalid resume ID' });
      }
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || ''
      );
      const removed = await deleteUserResume(dbUser.id, resumeId);
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
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || ''
      );
      const messages = await getUserChatMessages(dbUser.id);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch chat history' });
    }
  });

  app.delete('/api/chat', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || ''
      );
      await clearUserChatMessages(dbUser.id);
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

  // Server-side Multi-turn Gemini Chatbot endpoint (persists to Cloud SQL when authenticated)
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, persona, history, resumeContext } = req.body || {};
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      const activePersona: ChatPersonaId =
        persona === 'ats-reviewer' || persona === 'quick-editor'
          ? persona
          : 'career-coach';

      let dbUserId: number | null = null;
      let dbHistory: Array<{ role: 'user' | 'model'; content: string }> = [];

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = await adminAuth.verifyIdToken(
            authHeader.split('Bearer ')[1]
          );
          const dbUser = await getOrCreateUser(
            decoded.uid,
            decoded.email || ''
          );
          dbUserId = dbUser.id;
          const saved = await getUserChatMessages(dbUser.id);
          dbHistory = saved.map((m) => ({ role: m.role, content: m.content }));
        } catch {
          // If token is invalid/expired, reject rather than silently dropping auth
          return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
        }
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

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
