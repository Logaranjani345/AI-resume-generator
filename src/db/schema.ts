import { relations } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export interface SkillsData {
  technical: string[];
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  soft: string[];
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resumes = pgTable('resumes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull().default('Primary Resume'),
  template: text('template').notNull().default('executive'),
  fullName: text('full_name').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  location: text('location').notNull().default(''),
  linkedin: text('linkedin').notNull().default(''),
  github: text('github').notNull().default(''),
  portfolio: text('portfolio').notNull().default(''),
  targetRole: text('target_role').notNull().default(''),
  careerObjective: text('career_objective').notNull().default(''),
  summary: text('summary').notNull().default(''),
  jobDescription: text('job_description').notNull().default(''),
  skills: jsonb('skills')
    .$type<SkillsData>()
    .notNull()
    .default({
      technical: [],
      languages: [],
      frameworks: [],
      databases: [],
      tools: [],
      soft: [],
    }),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const educations = pgTable('educations', {
  id: serial('id').primaryKey(),
  resumeId: integer('resume_id')
    .references(() => resumes.id, { onDelete: 'cascade' })
    .notNull(),
  institution: text('institution').notNull().default(''),
  degree: text('degree').notNull().default(''),
  specialization: text('specialization').notNull().default(''),
  graduationYear: text('graduation_year').notNull().default(''),
  score: text('score').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  resumeId: integer('resume_id')
    .references(() => resumes.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull().default(''),
  technologies: text('technologies').notNull().default(''),
  description: text('description').notNull().default(''),
  contributions: text('contributions').notNull().default(''),
  githubLink: text('github_link').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const experiences = pgTable('experiences', {
  id: serial('id').primaryKey(),
  resumeId: integer('resume_id')
    .references(() => resumes.id, { onDelete: 'cascade' })
    .notNull(),
  company: text('company').notNull().default(''),
  jobTitle: text('job_title').notNull().default(''),
  duration: text('duration').notNull().default(''),
  responsibilities: text('responsibilities').notNull().default(''),
  achievements: text('achievements').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const certifications = pgTable('certifications', {
  id: serial('id').primaryKey(),
  resumeId: integer('resume_id')
    .references(() => resumes.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull().default(''),
  issuer: text('issuer').notNull().default(''),
  completionDate: text('completion_date').notNull().default(''),
  achievement: text('achievement').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').notNull(),
  persona: text('persona').notNull().default('career-coach'),
  modelUsed: text('model_used').notNull().default('gemini-4-hydrogen'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  chatMessages: many(chatMessages),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  owner: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  educations: many(educations),
  projects: many(projects),
  experiences: many(experiences),
  certifications: many(certifications),
}));

export const educationsRelations = relations(educations, ({ one }) => ({
  resume: one(resumes, {
    fields: [educations.resumeId],
    references: [resumes.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  resume: one(resumes, {
    fields: [projects.resumeId],
    references: [resumes.id],
  }),
}));

export const experiencesRelations = relations(experiences, ({ one }) => ({
  resume: one(resumes, {
    fields: [experiences.resumeId],
    references: [resumes.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  resume: one(resumes, {
    fields: [certifications.resumeId],
    references: [resumes.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));
