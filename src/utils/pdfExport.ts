import { jsPDF } from 'jspdf';
import type { ResumeData } from '../types/resume';

function ensureHttpUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export interface PdfExportOptions {
  includeSocialLinks: boolean;
  margins: 'standard' | 'compact';
}

const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  includeSocialLinks: true,
  margins: 'standard',
};

export function buildResumePdfDocument(
  resume: ResumeData,
  options: PdfExportOptions = DEFAULT_PDF_OPTIONS
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const isCompact = options.margins === 'compact';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = isCompact ? 32 : 48;
  const topMargin = isCompact ? 36 : 52;
  const bottomMargin = isCompact ? 36 : 48;
  const maxWidth = pageWidth - marginX * 2;
  const sectionPadTop = isCompact ? 5 : 8;
  const headingBottomGap = isCompact ? 11 : 14;
  const lineHeightFactor = isCompact ? 1.28 : 1.4;

  const accentColor: [number, number, number] =
    resume.template === 'modern'
      ? [2, 132, 199]
      : resume.template === 'academic'
        ? [15, 23, 42]
        : [3, 105, 161];

  const primaryFont = resume.template === 'academic' ? 'times' : 'helvetica';
  let y = topMargin;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = topMargin;
    }
  };

  const addSectionHeading = (title: string) => {
    ensureSpace(26);
    y += sectionPadTop;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...accentColor);
    doc.text(title.toUpperCase(), marginX, y);
    y += 5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.75);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += headingBottomGap;
    doc.setTextColor(15, 23, 42);
  };

  const addWrappedText = (
    text: string,
    fontSize = 9.5,
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    color: [number, number, number] = [30, 41, 59],
    indent = 0
  ) => {
    if (!text.trim()) return;
    doc.setFont(primaryFont, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text.trim(), maxWidth - indent) as string[];
    const lineHeight = fontSize * lineHeightFactor;
    for (const line of lines) {
      ensureSpace(lineHeight + 2);
      doc.text(line, marginX + indent, y);
      y += lineHeight;
    }
  };

  // Header: Name & Target Role
  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(resume.fullName || 'Your Name', marginX, y);
  y += 18;

  if (resume.targetRole) {
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...accentColor);
    doc.text(resume.targetRole, marginX, y);
    y += 15;
  }

  // Contact & Clickable Links Row
  const contactItems: Array<{ label: string; url?: string }> = [];
  if (resume.email) {
    contactItems.push({ label: resume.email, url: `mailto:${resume.email}` });
  }
  if (resume.phone) {
    contactItems.push({ label: resume.phone });
  }
  if (resume.location) {
    contactItems.push({ label: resume.location });
  }
  if (options.includeSocialLinks && resume.linkedin) {
    contactItems.push({ label: 'LinkedIn', url: ensureHttpUrl(resume.linkedin) });
  }
  if (options.includeSocialLinks && resume.github) {
    contactItems.push({ label: 'GitHub', url: ensureHttpUrl(resume.github) });
  }
  if (options.includeSocialLinks && resume.portfolio) {
    contactItems.push({ label: 'Portfolio', url: ensureHttpUrl(resume.portfolio) });
  }

  if (contactItems.length > 0) {
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9);
    let cursorX = marginX;
    const separator = '  |  ';
    const sepWidth = doc.getTextWidth(separator);

    contactItems.forEach((item, index) => {
      const itemWidth = doc.getTextWidth(item.label);
      if (cursorX + itemWidth > pageWidth - marginX) {
        cursorX = marginX;
        y += 13;
      }
      if (item.url) {
        doc.setTextColor(2, 132, 199);
        doc.textWithLink(item.label, cursorX, y, { url: item.url });
      } else {
        doc.setTextColor(71, 85, 105);
        doc.text(item.label, cursorX, y);
      }
      cursorX += itemWidth;

      if (index < contactItems.length - 1) {
        doc.setTextColor(148, 163, 184);
        doc.text(separator, cursorX, y);
        cursorX += sepWidth;
      }
    });
    y += 14;
  }

  // Summary or Career Objective
  if ((resume.summary || '').trim()) {
    addSectionHeading('Professional Summary');
    addWrappedText(resume.summary, 9.5, 'normal');
  } else if ((resume.careerObjective || '').trim()) {
    addSectionHeading('Career Objective');
    addWrappedText(resume.careerObjective, 9.5, 'normal');
  }

  // Education
  const validEdu = (resume.educations || []).filter(
    (e) => e.institution || e.degree
  );
  if (validEdu.length > 0) {
    addSectionHeading('Education');
    for (const edu of validEdu) {
      ensureSpace(32);
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const degreeLine = [edu.degree, edu.specialization]
        .filter(Boolean)
        .join(' — ');
      doc.text(degreeLine || edu.institution, marginX, y);

      if (edu.graduationYear) {
        doc.setFont(primaryFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const yrW = doc.getTextWidth(edu.graduationYear);
        doc.text(edu.graduationYear, pageWidth - marginX - yrW, y);
      }
      y += 13;

      const subLine = [edu.institution, edu.score].filter(Boolean).join('  ·  ');
      if (subLine) {
        addWrappedText(subLine, 9, 'normal', [71, 85, 105]);
      }
      y += 4;
    }
  }

  // Skills
  const skills = resume.skills || {
    languages: [],
    frameworks: [],
    databases: [],
    technical: [],
    tools: [],
    soft: [],
  };
  const skillGroups: Array<[string, string[]]> = [
    ['Programming Languages', skills.languages || []],
    ['Frameworks & Libraries', skills.frameworks || []],
    ['Databases', skills.databases || []],
    ['Technical Concepts', skills.technical || []],
    ['Developer Tools', skills.tools || []],
    ['Soft Skills', skills.soft || []],
  ];
  const nonEmptySkills = skillGroups.filter(([, arr]) => arr.length > 0);
  if (nonEmptySkills.length > 0) {
    addSectionHeading('Skills');
    for (const [label, items] of nonEmptySkills) {
      addWrappedText(`${label}: ${items.join(', ')}`, 9.2, 'normal');
      y += 1;
    }
  }

  // Experience
  const validExp = (resume.experiences || []).filter(
    (x) => x.company || x.jobTitle
  );
  if (validExp.length > 0) {
    addSectionHeading('Work Experience');
    for (const exp of validExp) {
      ensureSpace(36);
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const heading = [exp.jobTitle, exp.company].filter(Boolean).join(' — ');
      doc.text(heading, marginX, y);

      if (exp.duration) {
        doc.setFont(primaryFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const durW = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, pageWidth - marginX - durW, y);
      }
      y += 13;

      if (exp.responsibilities.trim()) {
        addWrappedText(exp.responsibilities, 9.2, 'normal');
      }
      if (exp.achievements.trim()) {
        const lines = exp.achievements
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
          const bulletText = line.startsWith('-') || line.startsWith('•') ? line : `• ${line}`;
          addWrappedText(bulletText, 9.2, 'normal', [30, 41, 59], 8);
        }
      }
      y += 5;
    }
  }

  // Projects
  const validProj = (resume.projects || []).filter(
    (p) => p.title || p.description
  );
  if (validProj.length > 0) {
    addSectionHeading('Projects');
    for (const proj of validProj) {
      ensureSpace(36);
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title || 'Project', marginX, y);

      if (options.includeSocialLinks && (proj.githubLink || '').trim()) {
        doc.setFont(primaryFont, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(2, 132, 199);
        const linkLabel = 'GitHub Repository';
        const linkW = doc.getTextWidth(linkLabel);
        doc.textWithLink(linkLabel, pageWidth - marginX - linkW, y, {
          url: ensureHttpUrl(proj.githubLink),
        });
      }
      y += 13;

      if ((proj.technologies || '').trim()) {
        addWrappedText(`Stack: ${proj.technologies}`, 8.8, 'italic', [71, 85, 105]);
      }
      if ((proj.description || '').trim()) {
        addWrappedText(proj.description, 9.2, 'normal');
      }
      if ((proj.contributions || '').trim()) {
        const lines = proj.contributions
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
          const bulletText = line.startsWith('-') || line.startsWith('•') ? line : `• ${line}`;
          addWrappedText(bulletText, 9.2, 'normal', [30, 41, 59], 8);
        }
      }
      y += 5;
    }
  }

  // Certifications & Achievements
  const validCerts = (resume.certifications || []).filter(
    (c) => c.name || c.achievement
  );
  if (validCerts.length > 0) {
    addSectionHeading('Certifications & Achievements');
    for (const cert of validCerts) {
      const parts = [
        cert.name,
        cert.issuer,
        cert.completionDate,
        cert.achievement,
      ]
        .filter(Boolean)
        .join(' · ');
      addWrappedText(`• ${parts}`, 9.2, 'normal', [30, 41, 59], 4);
    }
  }

  return doc;
}

export function buildResumePdfArrayBuffer(
  resume: ResumeData,
  options: PdfExportOptions = DEFAULT_PDF_OPTIONS
): ArrayBuffer {
  const doc = buildResumePdfDocument(resume, options);
  return doc.output('arraybuffer');
}

export function exportResumeToPdf(
  resume: ResumeData,
  options: PdfExportOptions = DEFAULT_PDF_OPTIONS
): void {
  const doc = buildResumePdfDocument(resume, options);
  const cleanFileName =
    (resume.fullName || resume.title || 'Resume')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_') + '_Resume.pdf';

  doc.save(cleanFileName);
}
