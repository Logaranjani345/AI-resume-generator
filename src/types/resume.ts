export type SectionKey = 'home' | 'builder' | 'preview' | 'suggestions';

export type ResumeTemplateId = 'executive' | 'modern' | 'academic';

export type ChatPersonaId = 'career-coach' | 'ats-reviewer' | 'quick-editor';

export interface SkillsMap {
  technical: string[];
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  soft: string[];
}

export interface EducationItem {
  id?: number;
  institution: string;
  degree: string;
  specialization: string;
  graduationYear: string;
  score: string;
}

export interface ProjectItem {
  id?: number;
  title: string;
  technologies: string;
  description: string;
  contributions: string;
  githubLink: string;
}

export interface ExperienceItem {
  id?: number;
  company: string;
  jobTitle: string;
  duration: string;
  responsibilities: string;
  achievements: string;
}

export interface CertificationItem {
  id?: number;
  name: string;
  issuer: string;
  completionDate: string;
  achievement: string;
}

export interface ResumeData {
  id?: number;
  title: string;
  template: ResumeTemplateId;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  targetRole: string;
  careerObjective: string;
  summary: string;
  jobDescription: string;
  skills: SkillsMap;
  educations: EducationItem[];
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  certifications: CertificationItem[];
  updatedAt?: string;
}

export interface AtsAnalysisResult {
  matchingSkills: string[];
  missingKeywords: string[];
  missingInfo: string[];
  improvements: string[];
  strengthenAreas: string[];
  disclaimer: string;
}

export interface ChatMessageItem {
  id?: number;
  role: 'user' | 'model';
  persona: ChatPersonaId;
  modelUsed: string;
  content: string;
  createdAt?: string;
}

export const EMPTY_RESUME: ResumeData = {
  title: 'Software Engineering Resume',
  template: 'executive',
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  targetRole: '',
  careerObjective: '',
  summary: '',
  jobDescription: '',
  skills: {
    technical: [],
    languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    soft: [],
  },
  educations: [
    {
      institution: '',
      degree: '',
      specialization: '',
      graduationYear: '',
      score: '',
    },
  ],
  projects: [
    {
      title: '',
      technologies: '',
      description: '',
      contributions: '',
      githubLink: '',
    },
  ],
  experiences: [],
  certifications: [],
};

export const SAMPLE_RESUME: ResumeData = {
  title: 'Full-Stack Engineer Resume',
  template: 'executive',
  fullName: 'Aarav Nair',
  email: 'aarav.nair@example.edu',
  phone: '+1 (415) 555-0194',
  location: 'San Jose, CA',
  linkedin: 'https://linkedin.com/in/aaravnair-dev',
  github: 'https://github.com/aaravnair',
  portfolio: 'https://aaravnair.dev',
  targetRole: 'Full-Stack Software Engineer',
  careerObjective:
    'Computer Science graduate seeking a Full-Stack Software Engineer role to build reliable web services, clean user interfaces, and data-backed applications.',
  summary:
    'Computer Science graduate with hands-on experience designing TypeScript, React, Python, and PostgreSQL web applications. Built and deployed full-stack student and internship projects focused on API reliability, query optimization, and accessible responsive interfaces.',
  jobDescription: '',
  skills: {
    technical: ['RESTful APIs', 'System Design', 'Unit Testing', 'Git Workflows'],
    languages: ['TypeScript', 'Python', 'JavaScript', 'SQL'],
    frameworks: ['React', 'Node.js', 'Express', 'Flask'],
    databases: ['PostgreSQL', 'SQLite', 'Redis'],
    tools: ['Docker', 'GitHub Actions', 'Linux', 'Postman'],
    soft: ['Technical Writing', 'Cross-Team Collaboration', 'Code Review'],
  },
  educations: [
    {
      institution: 'San Jose State University',
      degree: 'B.S. in Computer Science',
      specialization: 'Software Engineering & Distributed Systems',
      graduationYear: '2026',
      score: '3.82 / 4.00 CGPA',
    },
  ],
  projects: [
    {
      title: 'Campus Study Room Scheduler',
      technologies: 'React, TypeScript, Express, PostgreSQL',
      description:
        'Built a real-time room reservation platform for university study spaces supporting conflict detection and calendar exports.',
      contributions:
        '- Designed normalized PostgreSQL booking schema with unique constraint checks to eliminate double-bookings.\n- Implemented responsive booking grid and instant filter bar, cutting reservation completion time to under 30 seconds.',
      githubLink: 'https://github.com/aaravnair/study-scheduler',
    },
  ],
  experiences: [
    {
      company: 'CloudScale Labs',
      jobTitle: 'Software Engineering Intern',
      duration: 'May 2025 – Aug 2025',
      responsibilities:
        'Developed internal dashboard views and REST endpoints for tracking deployment metrics across staging environments.',
      achievements:
        '- Reduced dashboard initial query latency by 38% by adding composite indexes and server-side pagination.\n- Wrote 24 integration tests covering authentication middleware and CSV export endpoints.',
    },
  ],
  certifications: [
    {
      name: 'Google Cloud Digital Leader',
      issuer: 'Google Cloud',
      completionDate: 'Jan 2026',
      achievement: 'Finalist, University Engineering Hackathon 2025',
    },
  ],
};
