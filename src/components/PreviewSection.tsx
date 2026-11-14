import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  Printer,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { ResumeData, ResumeTemplateId, SectionKey } from '../types/resume';
import type { PdfExportOptions } from '../utils/pdfExport';
import { formatResumeAsPlainText } from '../utils/resumePlainText';

interface PreviewSectionProps {
  resume: ResumeData;
  onSelectTemplate: (template: ResumeTemplateId) => void;
  onNavigate: (section: SectionKey) => void;
}

const TEMPLATES: Array<{
  id: ResumeTemplateId;
  name: string;
  subtitle: string;
}> = [
  {
    id: 'executive',
    name: 'Executive Classic',
    subtitle: 'Centered header · Crisp blue dividers',
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    subtitle: 'Left-aligned · Clean sans typography',
  },
  {
    id: 'academic',
    name: 'Academic & Technical',
    subtitle: 'Traditional serif · Dense single-column',
  },
];

function formatUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function PreviewSection({
  resume,
  onSelectTemplate,
  onNavigate,
}: PreviewSectionProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [appliedOptions, setAppliedOptions] = useState<PdfExportOptions>({
    includeSocialLinks: true,
    margins: 'standard',
  });
  const [draftOptions, setDraftOptions] = useState<PdfExportOptions>({
    includeSocialLinks: true,
    margins: 'standard',
  });

  const openOptionsModal = () => {
    setExportError(null);
    setDraftOptions(appliedOptions);
    setExportModalOpen(true);
  };

  const handleCopyToClipboard = async () => {
    setCopyError(null);
    const plainText = formatResumeAsPlainText(resume, {
      includeSocialLinks: appliedOptions.includeSocialLinks,
    });
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plainText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = plainText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      setCopyError('Unable to copy automatically. Please check browser clipboard permissions.');
    }
  };

  useEffect(() => {
    if (!exportModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !exportingPdf) {
        setExportModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exportModalOpen, exportingPdf]);

  const handleApplyToPreview = () => {
    setAppliedOptions(draftOptions);
    setExportModalOpen(false);
  };

  const handleConfirmPdfExport = async () => {
    setAppliedOptions(draftOptions);
    setExportingPdf(true);
    setExportError(null);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          options: draftOptions,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || 'Unable to generate PDF on the server.'
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const cleanName =
        (resume.fullName || resume.title || 'Resume')
          .trim()
          .replace(/[^a-zA-Z0-9_-]+/g, '_') + '_Resume.pdf';
      anchor.href = url;
      anchor.download = cleanName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to download PDF.');
    } finally {
      setExportingPdf(false);
    }
  };
  const validEducations = resume.educations.filter(
    (e) => e.institution || e.degree
  );
  const validProjects = resume.projects.filter(
    (p) => p.title || p.description
  );
  const validExperiences = resume.experiences.filter(
    (x) => x.company || x.jobTitle
  );
  const validCerts = resume.certifications.filter(
    (c) => c.name || c.achievement
  );

  const skillRows: Array<[string, string[]]> = [
    ['Languages', resume.skills.languages],
    ['Frameworks & Libraries', resume.skills.frameworks],
    ['Databases', resume.skills.databases],
    ['Technical', resume.skills.technical],
    ['Tools', resume.skills.tools],
    ['Soft Skills', resume.skills.soft],
  ].filter(([, arr]) => arr.length > 0) as Array<[string, string[]]>;

  const isExecutive = resume.template === 'executive';
  const isModern = resume.template === 'modern';
  const isAcademic = resume.template === 'academic';
  const isCompactMargins = appliedOptions.margins === 'compact';
  const showSocialLinks = appliedOptions.includeSocialLinks;

  return (
    <div className="space-y-6">
      {/* Preview Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-slate-500">
            Template:
          </span>
          {TEMPLATES.map((tpl) => {
            const active = resume.template === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl.id)}
                className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-left text-xs transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-sky-600 bg-sky-50 font-semibold text-sky-900'
                    : 'border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50'
                }`}
                title={tpl.subtitle}
              >
                {tpl.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Resume
          </button>
          <button
            type="button"
            onClick={openOptionsModal}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Layout Options
          </button>
          <button
            type="button"
            onClick={handleCopyToClipboard}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            {copiedText ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedText ? 'Copied Plain Text' : 'Copy Resume to Clipboard'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={openOptionsModal}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            Download as PDF
          </button>
        </div>
      </div>

      {copyError && (
        <div className="no-print rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {copyError}
        </div>
      )}

      {/* Live ATS Resume Sheet */}
      <div
        data-margins={appliedOptions.margins}
        className={`resume-print-sheet mx-auto max-w-[850px] rounded-xl border border-slate-200 bg-white shadow-sm transition-all ${
          isCompactMargins ? 'p-5 md:p-7' : 'p-8 md:p-12'
        }`}
      >
        <article
          className={`text-slate-900 ${
            isCompactMargins ? 'space-y-4' : 'space-y-6'
          } ${isAcademic ? 'font-serif' : 'font-sans'}`}
        >
          {/* Resume Header */}
          <header
            className={`border-b ${isCompactMargins ? 'pb-3.5' : 'pb-5'} ${
              isExecutive
                ? 'border-sky-200 text-center'
                : isModern
                  ? 'border-slate-200 text-left'
                  : 'border-slate-900 text-left'
            }`}
          >
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {resume.fullName || 'Your Full Name'}
            </h1>
            {resume.targetRole && (
              <p
                className={`mt-1 text-sm font-medium ${
                  isAcademic ? 'text-slate-700' : 'text-sky-700'
                }`}
              >
                {resume.targetRole}
              </p>
            )}

            <div
              className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 ${
                isExecutive ? 'justify-center' : 'justify-start'
              }`}
            >
              {resume.email && (
                <a
                  href={`mailto:${resume.email}`}
                  className="text-sky-700 hover:underline"
                >
                  {resume.email}
                </a>
              )}
              {resume.phone && <span>· {resume.phone}</span>}
              {resume.location && <span>· {resume.location}</span>}
              {showSocialLinks && resume.linkedin && (
                <a
                  href={formatUrl(resume.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                >
                  · LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {showSocialLinks && resume.github && (
                <a
                  href={formatUrl(resume.github)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                >
                  · GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {showSocialLinks && resume.portfolio && (
                <a
                  href={formatUrl(resume.portfolio)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                >
                  · Portfolio
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </header>

          {/* Summary or Objective */}
          {(resume.summary.trim() || resume.careerObjective.trim()) && (
            <section className="space-y-2">
              <SectionHeading
                title={
                  resume.summary.trim()
                    ? 'Professional Summary'
                    : 'Career Objective'
                }
                template={resume.template}
              />
              <p className="text-sm leading-relaxed text-slate-700">
                {resume.summary.trim() || resume.careerObjective.trim()}
              </p>
            </section>
          )}

          {/* Education */}
          {validEducations.length > 0 && (
            <section className="space-y-3">
              <SectionHeading title="Education" template={resume.template} />
              <div className="space-y-2.5">
                {validEducations.map((edu, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-baseline justify-between gap-2"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {[edu.degree, edu.specialization]
                          .filter(Boolean)
                          .join(' — ') || edu.institution}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {[edu.institution, edu.score]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {edu.graduationYear && (
                      <span className="text-xs font-medium text-slate-500 tabular-nums">
                        {edu.graduationYear}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {skillRows.length > 0 && (
            <section className="space-y-2">
              <SectionHeading title="Skills" template={resume.template} />
              <div className="space-y-1 text-sm text-slate-700">
                {skillRows.map(([label, items]) => (
                  <p key={label} className="leading-relaxed">
                    <span className="font-semibold text-slate-900">
                      {label}:
                    </span>{' '}
                    {items.join(', ')}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Work Experience */}
          {validExperiences.length > 0 && (
            <section className="space-y-3">
              <SectionHeading
                title="Work Experience"
                template={resume.template}
              />
              <div className="space-y-4">
                {validExperiences.map((exp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {[exp.jobTitle, exp.company]
                          .filter(Boolean)
                          .join(' — ')}
                      </h3>
                      {exp.duration && (
                        <span className="text-xs font-medium text-slate-500 tabular-nums">
                          {exp.duration}
                        </span>
                      )}
                    </div>
                    {exp.responsibilities && (
                      <p className="text-sm leading-relaxed text-slate-700">
                        {exp.responsibilities}
                      </p>
                    )}
                    {exp.achievements && (
                      <BulletList text={exp.achievements} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {validProjects.length > 0 && (
            <section className="space-y-3">
              <SectionHeading title="Projects" template={resume.template} />
              <div className="space-y-4">
                {validProjects.map((proj, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {proj.title}
                      </h3>
                      {showSocialLinks && proj.githubLink && (
                        <a
                          href={formatUrl(proj.githubLink)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                        >
                          GitHub
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {proj.technologies && (
                      <p className="text-xs italic text-slate-500">
                        Stack: {proj.technologies}
                      </p>
                    )}
                    {proj.description && (
                      <p className="text-sm leading-relaxed text-slate-700">
                        {proj.description}
                      </p>
                    )}
                    {proj.contributions && (
                      <BulletList text={proj.contributions} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications & Achievements */}
          {validCerts.length > 0 && (
            <section className="space-y-2">
              <SectionHeading
                title="Certifications & Achievements"
                template={resume.template}
              />
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {validCerts.map((cert, idx) => (
                  <li key={idx}>
                    {[
                      cert.name,
                      cert.issuer,
                      cert.completionDate,
                      cert.achievement,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>

      {/* PDF Export Options Modal */}
      {exportModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-options-modal-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2
                  id="download-options-modal-title"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Download Options
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Customize layout and link settings before generating your PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                aria-label="Close export options"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Toggle: Include Social Links */}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <span
                    id="include-social-links-label"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Include social links
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    LinkedIn, GitHub, Portfolio, and project links
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftOptions.includeSocialLinks}
                  aria-labelledby="include-social-links-label"
                  onClick={() =>
                    setDraftOptions((prev) => ({
                      ...prev,
                      includeSocialLinks: !prev.includeSocialLinks,
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                    draftOptions.includeSocialLinks
                      ? 'bg-sky-600'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      draftOptions.includeSocialLinks
                        ? 'translate-x-4'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Radio selector: Standard vs Compact Margins */}
              <div className="space-y-2">
                <span
                  id="resume-margins-label"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Resume margins
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="resume-margins-label"
                  className="grid grid-cols-2 gap-3"
                >
                  {(
                    [
                      {
                        id: 'standard',
                        title: 'Standard',
                        desc: 'Balanced spacing · 0.67" margins',
                      },
                      {
                        id: 'compact',
                        title: 'Compact',
                        desc: 'Fits more content · 0.44" margins',
                      },
                    ] as const
                  ).map((option) => {
                    const selected = draftOptions.margins === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setDraftOptions((prev) => ({
                            ...prev,
                            margins: option.id,
                          }))
                        }
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-sky-600 bg-sky-50 text-sky-950'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-semibold">
                          {option.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {option.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {exportError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {exportError}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={exportingPdf}
                onClick={() => setExportModalOpen(false)}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={exportingPdf}
                onClick={handleApplyToPreview}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
              >
                Apply to Preview
              </button>
              <button
                type="button"
                disabled={exportingPdf}
                onClick={handleConfirmPdfExport}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exportingPdf ? 'Generating PDF...' : 'Download as PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  title,
  template,
}: {
  title: string;
  template: ResumeTemplateId;
}) {
  return (
    <h2
      className={`border-b pb-1 text-xs font-bold tracking-wider uppercase ${
        template === 'academic'
          ? 'border-slate-900 text-slate-900'
          : 'border-slate-200 text-sky-800'
      }`}
    >
      {title}
    </h2>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}
