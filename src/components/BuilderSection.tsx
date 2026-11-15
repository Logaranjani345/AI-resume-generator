import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  SectionKey,
  SkillsMap,
} from '../types/resume';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface BuilderSectionProps {
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  saveStatus: string | null;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  isSignedIn: boolean;
  onSignIn: () => void;
  onNavigate: (section: SectionKey) => void;
}

type BuilderTab =
  | 'personal'
  | 'education'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'certifications';

const SKILL_CATEGORIES: Array<{
  key: keyof SkillsMap;
  label: string;
  placeholder: string;
}> = [
  {
    key: 'languages',
    label: 'Programming Languages',
    placeholder: 'e.g. TypeScript, Python, Java, SQL',
  },
  {
    key: 'frameworks',
    label: 'Frameworks & Libraries',
    placeholder: 'e.g. React, Node.js, Express, Flask',
  },
  {
    key: 'databases',
    label: 'Databases',
    placeholder: 'e.g. PostgreSQL, SQLite, MongoDB',
  },
  {
    key: 'technical',
    label: 'Technical Skills',
    placeholder: 'e.g. REST APIs, System Design, Unit Testing',
  },
  {
    key: 'tools',
    label: 'Development Tools',
    placeholder: 'e.g. Git, Docker, GitHub Actions, Linux',
  },
  {
    key: 'soft',
    label: 'Soft Skills',
    placeholder: 'e.g. Technical Writing, Team Collaboration',
  },
];

export function BuilderSection({
  resume,
  onChange,
  onSave,
  saving,
  saveStatus,
  autoSaveEnabled,
  onToggleAutoSave,
  isSignedIn,
  onSignIn,
  onNavigate,
}: BuilderSectionProps) {
  const [activeTab, setActiveTab] = useState<BuilderTab>('personal');
  const [aiBusyKey, setAiBusyKey] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [suggestedSkills, setSuggestedSkills] =
    useState<Partial<SkillsMap> | null>(null);

  const updateField = <K extends keyof ResumeData>(
    key: K,
    value: ResumeData[K]
  ) => {
    onChange({ ...resume, [key]: value });
  };

  const callAiGenerate = async (body: Record<string, unknown>) => {
    setAiError(null);
    setAiNotice(null);
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'AI generation failed.');
    }
    return data;
  };

  const handleGenerateSummary = async () => {
    setAiBusyKey('summary');
    try {
      const data = await callAiGenerate({ task: 'summary', resume });
      if (data.text) {
        updateField('summary', data.text);
        setAiNotice(
          'Generated professional summary. Please verify accuracy against your actual background.'
        );
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiBusyKey(null);
    }
  };

  const handleGenerateObjective = async () => {
    setAiBusyKey('objective');
    try {
      const data = await callAiGenerate({ task: 'career_objective', resume });
      if (data.text) {
        updateField('careerObjective', data.text);
        setAiNotice(
          'Generated career objective. Review and adjust wording to match your goals.'
        );
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiBusyKey(null);
    }
  };

  const handleSuggestSkills = async () => {
    setAiBusyKey('skills');
    try {
      const data = await callAiGenerate({ task: 'skills_suggest', resume });
      setSuggestedSkills(data.suggestions || {});
      setAiNotice(
        data.note ||
          'Review suggested skills below and click any item you genuinely know to add it.'
      );
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiBusyKey(null);
    }
  };

  const handleRewriteProject = async (idx: number) => {
    const project = resume.projects[idx];
    const rawText = [project.description, project.contributions]
      .filter(Boolean)
      .join('\n');
    setAiBusyKey(`project-${idx}`);
    try {
      const data = await callAiGenerate({
        task: 'project_bullets',
        payload: {
          titleOrRole: project.title,
          context: project.technologies,
          rawText,
          targetRole: resume.targetRole,
        },
      });
      if (data.text) {
        const next = [...resume.projects];
        next[idx] = { ...project, contributions: data.text };
        updateField('projects', next);
        setAiNotice(
          'Rewrote project key contributions into bullet points. Please verify every detail.'
        );
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiBusyKey(null);
    }
  };

  const handleImproveExperience = async (idx: number) => {
    const exp = resume.experiences[idx];
    const rawText = [exp.responsibilities, exp.achievements]
      .filter(Boolean)
      .join('\n');
    setAiBusyKey(`exp-${idx}`);
    try {
      const data = await callAiGenerate({
        task: 'experience_improve',
        payload: {
          titleOrRole: exp.jobTitle,
          context: `${exp.company} (${exp.duration})`,
          rawText,
          targetRole: resume.targetRole,
        },
      });
      if (data.text) {
        const next = [...resume.experiences];
        next[idx] = { ...exp, achievements: data.text };
        updateField('experiences', next);
        setAiNotice(
          'Improved work experience bullets. Confirm that all statements remain strictly factual.'
        );
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiBusyKey(null);
    }
  };

  const addSkillFromSuggestion = (cat: keyof SkillsMap, skill: string) => {
    const existing = resume.skills[cat] || [];
    if (existing.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    updateField('skills', {
      ...resume.skills,
      [cat]: [...existing, skill],
    });
  };

  const tabs: Array<{ id: BuilderTab; label: string }> = [
    { id: 'personal', label: 'Personal & Role' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'certifications', label: 'Certifications' },
  ];

  useKeyboardShortcuts([
    {
      key: 's',
      ctrlOrMeta: true,
      allowInInputs: true,
      handler: () => {
        if (saving) return;
        if (isSignedIn) {
          void onSave();
        } else {
          onSignIn();
        }
      },
    },
    {
      key: 'p',
      ctrlOrMeta: true,
      shift: true,
      allowInInputs: true,
      handler: () => {
        onNavigate('preview');
      },
    },
    ...tabs.map((tab, index) => ({
      key: String(index + 1),
      alt: true,
      allowInInputs: true,
      handler: () => {
        setActiveTab(tab.id);
      },
    })),
  ]);

  return (
    <div className="page-enter space-y-6">
      {/* Builder Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm shadow-primary-brown/5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <label htmlFor="resume-title" className="sr-only">
            Resume Title
          </label>
          <input
            id="resume-title"
            type="text"
            value={resume.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Resume Title (e.g. Backend SWE 2026)"
            className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
          {saveStatus && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${
                saveStatus === 'Auto-save off'
                  ? 'text-slate-500'
                  : 'text-sky-700'
              }`}
            >
              {saveStatus !== 'Auto-save off' && (
                <Check className="h-3.5 w-3.5" />
              )}
              {saveStatus}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex min-h-[40px] items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span
              id="autosave-label"
              className="text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0"
            >
              Auto-save
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={autoSaveEnabled}
              aria-labelledby="autosave-label"
              onClick={onToggleAutoSave}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                autoSaveEnabled ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  autoSaveEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('preview')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Eye className="h-4 w-4" />
            Live Preview
          </button>

          {isSignedIn ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {resume.id ? 'Save Changes' : 'Save Resume'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              Sign in to Save
            </button>
          )}
        </div>
      </div>

      {/* Section Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-sky-600 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {(aiError || aiNotice) && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${
            aiError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{aiError || aiNotice}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-primary-brown/5 md:p-8">
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Personal Information & Target Role
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Use a professional email and active links so recruiters can
                verify your work directly from the PDF.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldInput
                label="Full Name"
                value={resume.fullName}
                onChange={(v) => updateField('fullName', v)}
                placeholder="Aarav Nair"
              />
              <FieldInput
                label="Target Job Role"
                value={resume.targetRole}
                onChange={(v) => updateField('targetRole', v)}
                placeholder="Full-Stack Software Engineer"
              />
              <FieldInput
                label="Professional Email"
                type="email"
                value={resume.email}
                onChange={(v) => updateField('email', v)}
                placeholder="name@example.com"
              />
              <FieldInput
                label="Phone Number"
                value={resume.phone}
                onChange={(v) => updateField('phone', v)}
                placeholder="+1 (555) 123-4567"
              />
              <FieldInput
                label="Location"
                value={resume.location}
                onChange={(v) => updateField('location', v)}
                placeholder="Bengaluru, IN / San Jose, CA"
              />
              <FieldInput
                label="LinkedIn Profile"
                value={resume.linkedin}
                onChange={(v) => updateField('linkedin', v)}
                placeholder="https://linkedin.com/in/username"
              />
              <FieldInput
                label="GitHub Profile"
                value={resume.github}
                onChange={(v) => updateField('github', v)}
                placeholder="https://github.com/username"
              />
              <FieldInput
                label="Portfolio Website"
                value={resume.portfolio}
                onChange={(v) => updateField('portfolio', v)}
                placeholder="https://yourportfolio.dev"
              />
            </div>

            {/* Career Objective */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-800">
                  Career Objective
                </label>
                <button
                  type="button"
                  onClick={handleGenerateObjective}
                  disabled={aiBusyKey !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                >
                  {aiBusyKey === 'objective' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate Objective with AI
                </button>
              </div>
              <textarea
                rows={2}
                value={resume.careerObjective}
                onChange={(e) => updateField('careerObjective', e.target.value)}
                placeholder="Concise 1-2 sentence career objective for freshers/students..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Professional Summary */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-800">
                  Professional Summary
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={aiBusyKey !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                >
                  {aiBusyKey === 'summary' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate Summary with AI
                </button>
              </div>
              <textarea
                rows={4}
                value={resume.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="3-4 line summary highlighting your real stack, projects, and experience..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Education Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add your degrees or coursework in reverse chronological order.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField('educations', [
                    ...resume.educations,
                    {
                      institution: '',
                      degree: '',
                      specialization: '',
                      graduationYear: '',
                      score: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Add Education
              </button>
            </div>

            {resume.educations.length === 0 ? (
              <EmptyBlock
                message="No education entries yet."
                actionLabel="Add First Degree"
                onAction={() =>
                  updateField('educations', [
                    {
                      institution: '',
                      degree: '',
                      specialization: '',
                      graduationYear: '',
                      score: '',
                    },
                  ])
                }
              />
            ) : (
              <div className="space-y-6 divide-y divide-slate-200">
                {resume.educations.map((edu, idx) => (
                  <div
                    key={idx}
                    className="space-y-4 pt-6 first:pt-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        Entry {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'educations',
                            resume.educations.filter((_, i) => i !== idx)
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FieldInput
                        label="Institution Name"
                        value={edu.institution}
                        onChange={(v) =>
                          updateItem<EducationItem>(
                            resume.educations,
                            idx,
                            { ...edu, institution: v },
                            (next) => updateField('educations', next)
                          )
                        }
                        placeholder="University / College Name"
                      />
                      <FieldInput
                        label="Degree"
                        value={edu.degree}
                        onChange={(v) =>
                          updateItem(
                            resume.educations,
                            idx,
                            { ...edu, degree: v },
                            (next) => updateField('educations', next)
                          )
                        }
                        placeholder="B.Tech / B.S. in Computer Science"
                      />
                      <FieldInput
                        label="Department / Specialization"
                        value={edu.specialization}
                        onChange={(v) =>
                          updateItem(
                            resume.educations,
                            idx,
                            { ...edu, specialization: v },
                            (next) => updateField('educations', next)
                          )
                        }
                        placeholder="Artificial Intelligence & Data Engineering"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FieldInput
                          label="Graduation Year"
                          value={edu.graduationYear}
                          onChange={(v) =>
                            updateItem(
                              resume.educations,
                              idx,
                              { ...edu, graduationYear: v },
                              (next) => updateField('educations', next)
                            )
                          }
                          placeholder="2026"
                        />
                        <FieldInput
                          label="CGPA / Percentage"
                          value={edu.score}
                          onChange={(v) =>
                            updateItem(
                              resume.educations,
                              idx,
                              { ...edu, score: v },
                              (next) => updateField('educations', next)
                            )
                          }
                          placeholder="8.9 / 10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Categorized Skills
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Separate items with commas. Grouped skills improve recruiter
                  and ATS scannability.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSuggestSkills}
                disabled={aiBusyKey !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              >
                {aiBusyKey === 'skills' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Suggest Skills for Target Role
              </button>
            </div>

            {suggestedSkills && (
              <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-sky-900">
                    Suggested Skills — Click to add only skills you truly know
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSuggestedSkills(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {SKILL_CATEGORIES.map(({ key, label }) => {
                    const list = suggestedSkills[key] || [];
                    if (list.length === 0) return null;
                    return (
                      <div key={key} className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-600">
                          {label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((skill) => {
                            const alreadyAdded = (
                              resume.skills[key] || []
                            ).some(
                              (s) => s.toLowerCase() === skill.toLowerCase()
                            );
                            return (
                              <button
                                key={skill}
                                type="button"
                                disabled={alreadyAdded}
                                onClick={() =>
                                  addSkillFromSuggestion(key, skill)
                                }
                                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  alreadyAdded
                                    ? 'border-slate-200 bg-slate-100 text-slate-400'
                                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                {alreadyAdded ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                                {skill}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {SKILL_CATEGORIES.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={(resume.skills[key] || []).join(', ')}
                    onChange={(e) => {
                      const items = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      updateField('skills', {
                        ...resume.skills,
                        [key]: items,
                      });
                    }}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Projects
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Describe what you built and your real contributions. Use AI to
                  convert rough notes into crisp bullet points.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField('projects', [
                    ...resume.projects,
                    {
                      title: '',
                      technologies: '',
                      description: '',
                      contributions: '',
                      githubLink: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </button>
            </div>

            {resume.projects.length === 0 ? (
              <EmptyBlock
                message="No projects added yet."
                actionLabel="Add First Project"
                onAction={() =>
                  updateField('projects', [
                    {
                      title: '',
                      technologies: '',
                      description: '',
                      contributions: '',
                      githubLink: '',
                    },
                  ])
                }
              />
            ) : (
              <div className="space-y-8 divide-y divide-slate-200">
                {resume.projects.map((proj, idx) => (
                  <div key={idx} className="space-y-4 pt-6 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        Project {idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleRewriteProject(idx)}
                          disabled={aiBusyKey !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {aiBusyKey === `project-${idx}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          Rewrite Bullets with AI
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'projects',
                              resume.projects.filter((_, i) => i !== idx)
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FieldInput
                        label="Project Title"
                        value={proj.title}
                        onChange={(v) =>
                          updateItem<ProjectItem>(
                            resume.projects,
                            idx,
                            { ...proj, title: v },
                            (next) => updateField('projects', next)
                          )
                        }
                        placeholder="AI-Powered Resume Generator"
                      />
                      <FieldInput
                        label="Technologies Used"
                        value={proj.technologies}
                        onChange={(v) =>
                          updateItem(
                            resume.projects,
                            idx,
                            { ...proj, technologies: v },
                            (next) => updateField('projects', next)
                          )
                        }
                        placeholder="React, TypeScript, Express, PostgreSQL"
                      />
                    </div>

                    <FieldInput
                      label="GitHub Repository Link"
                      value={proj.githubLink}
                      onChange={(v) =>
                        updateItem(
                          resume.projects,
                          idx,
                          { ...proj, githubLink: v },
                          (next) => updateField('projects', next)
                        )
                      }
                      placeholder="https://github.com/username/project"
                    />

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-800">
                        Project Description
                      </label>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) =>
                          updateItem(
                            resume.projects,
                            idx,
                            { ...proj, description: e.target.value },
                            (next) => updateField('projects', next)
                          )
                        }
                        placeholder="Brief overview of what the project solves..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-800">
                        Key Contributions (one bullet per line)
                      </label>
                      <textarea
                        rows={3}
                        value={proj.contributions}
                        onChange={(e) =>
                          updateItem(
                            resume.projects,
                            idx,
                            { ...proj, contributions: e.target.value },
                            (next) => updateField('projects', next)
                          )
                        }
                        placeholder="- Built REST API endpoints with validation...&#10;- Designed database schema..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Work Experience & Internships
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Optional for freshers with no prior work history, or add
                  internships, part-time roles, and full-time jobs.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField('experiences', [
                    ...resume.experiences,
                    {
                      company: '',
                      jobTitle: '',
                      duration: '',
                      responsibilities: '',
                      achievements: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Add Experience
              </button>
            </div>

            {resume.experiences.length === 0 ? (
              <EmptyBlock
                message="No work experience entries added yet."
                actionLabel="Add Internship / Role"
                onAction={() =>
                  updateField('experiences', [
                    {
                      company: '',
                      jobTitle: '',
                      duration: '',
                      responsibilities: '',
                      achievements: '',
                    },
                  ])
                }
              />
            ) : (
              <div className="space-y-8 divide-y divide-slate-200">
                {resume.experiences.map((exp, idx) => (
                  <div key={idx} className="space-y-4 pt-6 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        Role {idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleImproveExperience(idx)}
                          disabled={aiBusyKey !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {aiBusyKey === `exp-${idx}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          Polish Bullets with AI
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'experiences',
                              resume.experiences.filter((_, i) => i !== idx)
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FieldInput
                        label="Company Name"
                        value={exp.company}
                        onChange={(v) =>
                          updateItem<ExperienceItem>(
                            resume.experiences,
                            idx,
                            { ...exp, company: v },
                            (next) => updateField('experiences', next)
                          )
                        }
                        placeholder="Acme Systems"
                      />
                      <FieldInput
                        label="Job Title"
                        value={exp.jobTitle}
                        onChange={(v) =>
                          updateItem(
                            resume.experiences,
                            idx,
                            { ...exp, jobTitle: v },
                            (next) => updateField('experiences', next)
                          )
                        }
                        placeholder="Software Engineering Intern"
                      />
                      <FieldInput
                        label="Duration"
                        value={exp.duration}
                        onChange={(v) =>
                          updateItem(
                            resume.experiences,
                            idx,
                            { ...exp, duration: v },
                            (next) => updateField('experiences', next)
                          )
                        }
                        placeholder="May 2025 – Aug 2025"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-800">
                        Responsibilities
                      </label>
                      <textarea
                        rows={2}
                        value={exp.responsibilities}
                        onChange={(e) =>
                          updateItem(
                            resume.experiences,
                            idx,
                            { ...exp, responsibilities: e.target.value },
                            (next) => updateField('experiences', next)
                          )
                        }
                        placeholder="Describe your day-to-day scope and team..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-800">
                        Achievements & Impact Bullets
                      </label>
                      <textarea
                        rows={3}
                        value={exp.achievements}
                        onChange={(e) =>
                          updateItem(
                            resume.experiences,
                            idx,
                            { ...exp, achievements: e.target.value },
                            (next) => updateField('experiences', next)
                          )
                        }
                        placeholder="- Reduced page load time by...&#10;- Automated test coverage for..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Certifications & Achievements
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Include verified certificates, hackathon placements, or
                  academic honors.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField('certifications', [
                    ...resume.certifications,
                    {
                      name: '',
                      issuer: '',
                      completionDate: '',
                      achievement: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Add Certification
              </button>
            </div>

            {resume.certifications.length === 0 ? (
              <EmptyBlock
                message="No certifications or achievements added yet."
                actionLabel="Add Certification / Honor"
                onAction={() =>
                  updateField('certifications', [
                    {
                      name: '',
                      issuer: '',
                      completionDate: '',
                      achievement: '',
                    },
                  ])
                }
              />
            ) : (
              <div className="space-y-6 divide-y divide-slate-200">
                {resume.certifications.map((cert, idx) => (
                  <div key={idx} className="space-y-4 pt-6 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        Item {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'certifications',
                            resume.certifications.filter((_, i) => i !== idx)
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FieldInput
                        label="Certification Name"
                        value={cert.name}
                        onChange={(v) =>
                          updateItem<CertificationItem>(
                            resume.certifications,
                            idx,
                            { ...cert, name: v },
                            (next) => updateField('certifications', next)
                          )
                        }
                        placeholder="AWS Certified Cloud Practitioner"
                      />
                      <FieldInput
                        label="Issuing Organization"
                        value={cert.issuer}
                        onChange={(v) =>
                          updateItem(
                            resume.certifications,
                            idx,
                            { ...cert, issuer: v },
                            (next) => updateField('certifications', next)
                          )
                        }
                        placeholder="Amazon Web Services"
                      />
                      <FieldInput
                        label="Completion Date"
                        value={cert.completionDate}
                        onChange={(v) =>
                          updateItem(
                            resume.certifications,
                            idx,
                            { ...cert, completionDate: v },
                            (next) => updateField('certifications', next)
                          )
                        }
                        placeholder="Jan 2026"
                      />
                      <FieldInput
                        label="Relevant Achievement (optional)"
                        value={cert.achievement}
                        onChange={(v) =>
                          updateItem(
                            resume.certifications,
                            idx,
                            { ...cert, achievement: v },
                            (next) => updateField('certifications', next)
                          )
                        }
                        placeholder="Top 5% in Cohort / Hackathon Finalist"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-right text-xs text-slate-500">
        Shortcuts: Ctrl+S / Cmd+S to save · Ctrl+Shift+P to preview · Alt+1–6 to
        switch sections
      </p>
    </div>
  );
}

function updateItem<T>(
  list: T[],
  index: number,
  nextItem: T,
  commit: (next: T[]) => void
) {
  const copy = [...list];
  copy[index] = nextItem;
  commit(copy);
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
      />
    </div>
  );
}

function EmptyBlock({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
      <p className="text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
      >
        <Plus className="h-3.5 w-3.5" />
        {actionLabel}
      </button>
    </div>
  );
}
