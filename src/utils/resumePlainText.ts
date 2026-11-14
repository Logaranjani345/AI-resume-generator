import type { ResumeData } from '../types/resume';

function normalizeBullets(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
    .map((line) => `- ${line}`);
}

function sectionBlock(title: string, lines: string[]): string {
  const divider = '-'.repeat(title.length);
  return `${title.toUpperCase()}\n${divider}\n${lines.join('\n')}`;
}

export function formatResumeAsPlainText(
  resume: ResumeData,
  options: { includeSocialLinks?: boolean } = { includeSocialLinks: true }
): string {
  const includeSocial = options.includeSocialLinks !== false;
  const blocks: string[] = [];

  // Header
  const headerLines: string[] = [];
  headerLines.push(resume.fullName.trim() || 'Your Name');
  if (resume.targetRole.trim()) {
    headerLines.push(resume.targetRole.trim());
  }

  const contactParts = [
    resume.email.trim(),
    resume.phone.trim(),
    resume.location.trim(),
    includeSocial && resume.linkedin.trim()
      ? `LinkedIn: ${resume.linkedin.trim()}`
      : '',
    includeSocial && resume.github.trim()
      ? `GitHub: ${resume.github.trim()}`
      : '',
    includeSocial && resume.portfolio.trim()
      ? `Portfolio: ${resume.portfolio.trim()}`
      : '',
  ].filter(Boolean);

  if (contactParts.length > 0) {
    headerLines.push(contactParts.join(' | '));
  }
  blocks.push(headerLines.join('\n'));

  // Summary or Career Objective
  if (resume.summary.trim()) {
    blocks.push(sectionBlock('Professional Summary', [resume.summary.trim()]));
  } else if (resume.careerObjective.trim()) {
    blocks.push(
      sectionBlock('Career Objective', [resume.careerObjective.trim()])
    );
  }

  // Education
  const validEducations = resume.educations.filter(
    (e) => e.institution.trim() || e.degree.trim()
  );
  if (validEducations.length > 0) {
    const eduLines = validEducations.flatMap((edu) => {
      const title =
        [edu.degree.trim(), edu.specialization.trim()]
          .filter(Boolean)
          .join(' — ') || edu.institution.trim();
      const top = edu.graduationYear.trim()
        ? `${title} (${edu.graduationYear.trim()})`
        : title;
      const sub = [edu.institution.trim(), edu.score.trim()]
        .filter(Boolean)
        .join(' · ');
      return sub ? [top, sub, ''] : [top, ''];
    });
    if (eduLines[eduLines.length - 1] === '') eduLines.pop();
    blocks.push(sectionBlock('Education', eduLines));
  }

  // Skills
  const skillGroups: Array<[string, string[]]> = [
    ['Languages', resume.skills.languages],
    ['Frameworks & Libraries', resume.skills.frameworks],
    ['Databases', resume.skills.databases],
    ['Technical', resume.skills.technical],
    ['Tools', resume.skills.tools],
    ['Soft Skills', resume.skills.soft],
  ];
  const nonEmptySkills = skillGroups.filter(([, arr]) => arr.length > 0);
  if (nonEmptySkills.length > 0) {
    blocks.push(
      sectionBlock(
        'Skills',
        nonEmptySkills.map(([label, items]) => `${label}: ${items.join(', ')}`)
      )
    );
  }

  // Work Experience
  const validExperiences = resume.experiences.filter(
    (x) => x.company.trim() || x.jobTitle.trim()
  );
  if (validExperiences.length > 0) {
    const expLines: string[] = [];
    validExperiences.forEach((exp, idx) => {
      const roleHeader = [exp.jobTitle.trim(), exp.company.trim()]
        .filter(Boolean)
        .join(' — ');
      expLines.push(
        exp.duration.trim() ? `${roleHeader} (${exp.duration.trim()})` : roleHeader
      );
      if (exp.responsibilities.trim()) {
        expLines.push(exp.responsibilities.trim());
      }
      if (exp.achievements.trim()) {
        expLines.push(...normalizeBullets(exp.achievements));
      }
      if (idx < validExperiences.length - 1) expLines.push('');
    });
    blocks.push(sectionBlock('Work Experience', expLines));
  }

  // Projects
  const validProjects = resume.projects.filter(
    (p) => p.title.trim() || p.description.trim()
  );
  if (validProjects.length > 0) {
    const projLines: string[] = [];
    validProjects.forEach((proj, idx) => {
      const titleLine =
        includeSocial && proj.githubLink.trim()
          ? `${proj.title.trim() || 'Project'} (${proj.githubLink.trim()})`
          : proj.title.trim() || 'Project';
      projLines.push(titleLine);
      if (proj.technologies.trim()) {
        projLines.push(`Stack: ${proj.technologies.trim()}`);
      }
      if (proj.description.trim()) {
        projLines.push(proj.description.trim());
      }
      if (proj.contributions.trim()) {
        projLines.push(...normalizeBullets(proj.contributions));
      }
      if (idx < validProjects.length - 1) projLines.push('');
    });
    blocks.push(sectionBlock('Projects', projLines));
  }

  // Certifications & Achievements
  const validCerts = resume.certifications.filter(
    (c) => c.name.trim() || c.achievement.trim()
  );
  if (validCerts.length > 0) {
    const certLines = validCerts.map((cert) => {
      const text = [
        cert.name.trim(),
        cert.issuer.trim(),
        cert.completionDate.trim(),
        cert.achievement.trim(),
      ]
        .filter(Boolean)
        .join(' · ');
      return `- ${text}`;
    });
    blocks.push(sectionBlock('Certifications & Achievements', certLines));
  }

  return blocks.join('\n\n');
}
