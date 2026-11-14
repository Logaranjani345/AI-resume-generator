import { ObjectId } from 'mongodb';
import type { Collection, Document } from 'mongodb';
import { getDatabase } from './index.ts';
import type { ResumeData, SkillsMap } from '../types/resume.ts';

interface ResumeDocument
  extends Document, Omit<ResumeData, 'id' | 'updatedAt'> {
  _id: ObjectId;
  userId: ObjectId;
  updatedAt: Date;
}

function resumesCollection(): Promise<Collection<ResumeDocument>> {
  return getDatabase().then((database) =>
    database.collection<ResumeDocument>('resumes')
  );
}

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

function toResumeData(document: ResumeDocument): ResumeData {
  const { _id, userId: _userId, updatedAt, ...resumeData } = document;
  return {
    ...resumeData,
    id: _id.toHexString(),
    updatedAt: updatedAt.toISOString(),
  };
}

function makeResumeDocument(
  userId: ObjectId,
  data: ResumeData
): ResumeDocument {
  const resumeData = { ...data };
  delete resumeData.id;
  delete resumeData.updatedAt;

  return {
    ...resumeData,
    title: data.title || 'Untitled Resume',
    template: data.template || 'executive',
    skills: normalizeSkills(data.skills),
    _id: new ObjectId(),
    userId,
    updatedAt: new Date(),
  };
}

export async function getUserResumes(userId: ObjectId): Promise<ResumeData[]> {
  const resumes = await resumesCollection();
  const documents = await resumes
    .find({ userId })
    .sort({ updatedAt: -1, _id: -1 })
    .toArray();
  return documents.map(toResumeData);
}

export async function createUserResume(
  userId: ObjectId,
  data: ResumeData
): Promise<ResumeData> {
  const resumes = await resumesCollection();
  const document = makeResumeDocument(userId, data);
  await resumes.insertOne(document);
  return toResumeData(document);
}

export async function updateUserResume(
  userId: ObjectId,
  resumeId: ObjectId,
  data: ResumeData
): Promise<ResumeData | null> {
  const resumes = await resumesCollection();
  const updatedDocument = makeResumeDocument(userId, data);
  const { _id: _newId, userId: _newUserId, ...updates } = updatedDocument;
  const result = await resumes.updateOne(
    { _id: resumeId, userId },
    { $set: updates }
  );

  if (result.matchedCount === 0) {
    return null;
  }

  const saved = await resumes.findOne({ _id: resumeId, userId });
  return saved ? toResumeData(saved) : null;
}

export async function deleteUserResume(
  userId: ObjectId,
  resumeId: ObjectId
): Promise<boolean> {
  const resumes = await resumesCollection();
  const result = await resumes.deleteOne({ _id: resumeId, userId });
  return result.deletedCount > 0;
}
