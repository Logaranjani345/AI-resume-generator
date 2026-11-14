import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  certifications,
  educations,
  experiences,
  projects,
  resumes,
} from './schema.ts';
import type { ResumeData, ResumeTemplateId, SkillsMap } from '../types/resume.ts';

function normalizeSkills(raw: Partial<SkillsMap> | undefined): SkillsMap {
  return {
    technical: Array.isArray(raw?.technical) ? raw.technical : [],
    languages: Array.isArray(raw?.languages) ? raw.languages : [],
    frameworks: Array.isArray(raw?.frameworks) ? raw.frameworks : [],
    databases: Array.isArray(raw?.databases) ? raw.databases : [],
    tools: Array.isArray(raw?.tools) ? raw.tools : [],
    soft: Array.isArray(raw?.soft) ? raw.soft : [],
  };
}

export async function getUserResumes(userId: number): Promise<ResumeData[]> {
  try {
    const rows = await db.query.resumes.findMany({
      where: eq(resumes.userId, userId),
      orderBy: [desc(resumes.updatedAt), desc(resumes.id)],
      with: {
        educations: { orderBy: [asc(educations.sortOrder), asc(educations.id)] },
        projects: { orderBy: [asc(projects.sortOrder), asc(projects.id)] },
        experiences: { orderBy: [asc(experiences.sortOrder), asc(experiences.id)] },
        certifications: { orderBy: [asc(certifications.sortOrder), asc(certifications.id)] },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      template: (row.template as ResumeTemplateId) || 'executive',
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      location: row.location,
      linkedin: row.linkedin,
      github: row.github,
      portfolio: row.portfolio,
      targetRole: row.targetRole,
      careerObjective: row.careerObjective,
      summary: row.summary,
      jobDescription: row.jobDescription,
      skills: normalizeSkills(row.skills),
      educations: row.educations.map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        specialization: e.specialization,
        graduationYear: e.graduationYear,
        score: e.score,
      })),
      projects: row.projects.map((p) => ({
        id: p.id,
        title: p.title,
        technologies: p.technologies,
        description: p.description,
        contributions: p.contributions,
        githubLink: p.githubLink,
      })),
      experiences: row.experiences.map((x) => ({
        id: x.id,
        company: x.company,
        jobTitle: x.jobTitle,
        duration: x.duration,
        responsibilities: x.responsibilities,
        achievements: x.achievements,
      })),
      certifications: row.certifications.map((c) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        completionDate: c.completionDate,
        achievement: c.achievement,
      })),
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    }));
  } catch (error) {
    console.error('Database error in getUserResumes:', error);
    throw new Error('Unable to load saved resumes right now.', { cause: error });
  }
}

export async function createUserResume(
  userId: number,
  data: ResumeData
): Promise<ResumeData> {
  try {
    const insertedId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(resumes)
        .values({
          userId,
          title: data.title || 'Untitled Resume',
          template: data.template || 'executive',
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
          portfolio: data.portfolio || '',
          targetRole: data.targetRole || '',
          careerObjective: data.careerObjective || '',
          summary: data.summary || '',
          jobDescription: data.jobDescription || '',
          skills: normalizeSkills(data.skills),
        })
        .returning({ id: resumes.id });

      const resumeId = created.id;
      await insertChildSections(tx, resumeId, data);
      return resumeId;
    });

    const all = await getUserResumes(userId);
    const match = all.find((r) => r.id === insertedId);
    if (!match) {
      throw new Error('Created resume could not be retrieved.');
    }
    return match;
  } catch (error) {
    console.error('Database error in createUserResume:', error);
    throw new Error('Unable to save new resume.', { cause: error });
  }
}

export async function updateUserResume(
  userId: number,
  resumeId: number,
  data: ResumeData
): Promise<ResumeData | null> {
  try {
    const updated = await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: resumes.id })
        .from(resumes)
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));

      if (existing.length === 0) {
        return false;
      }

      await tx
        .update(resumes)
        .set({
          title: data.title || 'Untitled Resume',
          template: data.template || 'executive',
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
          portfolio: data.portfolio || '',
          targetRole: data.targetRole || '',
          careerObjective: data.careerObjective || '',
          summary: data.summary || '',
          jobDescription: data.jobDescription || '',
          skills: normalizeSkills(data.skills),
          updatedAt: new Date(),
        })
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));

      await tx.delete(educations).where(eq(educations.resumeId, resumeId));
      await tx.delete(projects).where(eq(projects.resumeId, resumeId));
      await tx.delete(experiences).where(eq(experiences.resumeId, resumeId));
      await tx.delete(certifications).where(eq(certifications.resumeId, resumeId));

      await insertChildSections(tx, resumeId, data);
      return true;
    });

    if (!updated) {
      return null;
    }

    const all = await getUserResumes(userId);
    return all.find((r) => r.id === resumeId) || null;
  } catch (error) {
    console.error('Database error in updateUserResume:', error);
    throw new Error('Unable to update resume.', { cause: error });
  }
}

export async function deleteUserResume(
  userId: number,
  resumeId: number
): Promise<boolean> {
  try {
    const deleted = await db
      .delete(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
      .returning({ id: resumes.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database error in deleteUserResume:', error);
    throw new Error('Unable to delete resume.', { cause: error });
  }
}

type TxType = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertChildSections(
  tx: TxType,
  resumeId: number,
  data: ResumeData
) {
  if (Array.isArray(data.educations) && data.educations.length > 0) {
    await tx.insert(educations).values(
      data.educations.map((e, idx) => ({
        resumeId,
        institution: e.institution || '',
        degree: e.degree || '',
        specialization: e.specialization || '',
        graduationYear: e.graduationYear || '',
        score: e.score || '',
        sortOrder: idx,
      }))
    );
  }

  if (Array.isArray(data.projects) && data.projects.length > 0) {
    await tx.insert(projects).values(
      data.projects.map((p, idx) => ({
        resumeId,
        title: p.title || '',
        technologies: p.technologies || '',
        description: p.description || '',
        contributions: p.contributions || '',
        githubLink: p.githubLink || '',
        sortOrder: idx,
      }))
    );
  }

  if (Array.isArray(data.experiences) && data.experiences.length > 0) {
    await tx.insert(experiences).values(
      data.experiences.map((x, idx) => ({
        resumeId,
        company: x.company || '',
        jobTitle: x.jobTitle || '',
        duration: x.duration || '',
        responsibilities: x.responsibilities || '',
        achievements: x.achievements || '',
        sortOrder: idx,
      }))
    );
  }

  if (Array.isArray(data.certifications) && data.certifications.length > 0) {
    await tx.insert(certifications).values(
      data.certifications.map((c, idx) => ({
        resumeId,
        name: c.name || '',
        issuer: c.issuer || '',
        completionDate: c.completionDate || '',
        achievement: c.achievement || '',
        sortOrder: idx,
      }))
    );
  }
}
