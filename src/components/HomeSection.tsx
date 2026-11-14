import React from 'react';
import {
  ArrowRight,
  FileCheck2,
  FileText,
  Layers,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { ResumeData, SectionKey } from '../types/resume';

interface HomeSectionProps {
  onNavigate: (section: SectionKey) => void;
  onLoadSample: () => void;
  onCreateNew: () => void;
  savedResumes: ResumeData[];
  activeResumeId?: number;
  onSelectSavedResume: (resume: ResumeData) => void;
  onDeleteSavedResume: (id: number) => void;
  isSignedIn: boolean;
  onSignIn: () => void;
  loadingResumes: boolean;
}

export function HomeSection({
  onNavigate,
  onLoadSample,
  onCreateNew,
  savedResumes,
  activeResumeId,
  onSelectSavedResume,
  onDeleteSavedResume,
  isSignedIn,
  onSignIn,
  loadingResumes,
}: HomeSectionProps) {
  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="rounded-xl border border-slate-200 bg-white p-8 md:p-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <p className="text-xs font-medium tracking-wide text-sky-700">
              ATS-Ready Resume Studio · Gemini Writing Assistant
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15] [text-wrap:balance]">
              Build clear, truthful, ATS-friendly resumes in minutes.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
              Designed for engineering students, freshers, and experienced
              professionals. Organize your education, projects, and work
              experience, refine phrasing with Gemini AI without fabricating
              facts, compare against any job description, and export a
              selectable-text PDF.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('builder')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap shrink-0"
              >
                Open Resume Builder
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                Load Sample Student Resume
              </button>
            </div>
          </div>

          {/* Right Editorial Summary Panel */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-6 lg:col-span-5">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Built for Technical Placements
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>
                  Structured sections for personal info, education, categorized
                  skills, projects, internships, and certifications.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>
                  Gemini rewrites rough project notes into concise bullets while
                  preserving your real metrics and stack.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>
                  Three clean templates with multi-page PDF export and clickable
                  LinkedIn, GitHub, and email links.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Core Workflow Overview */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2.5 text-sky-700">
            <Layers className="h-5 w-5" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              01. Structured Input
            </h3>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
            Add multiple education records, categorized technical skills,
            GitHub-linked projects, work history, and certifications in one
            clean workspace.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2.5 text-sky-700">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              02. ATS & AI Review
            </h3>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
            Paste a target job description to uncover matching skills, missing
            keywords, and phrasing improvements—plus ask our multi-turn Gemini
            assistant anytime.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2.5 text-sky-700">
            <FileCheck2 className="h-5 w-5" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              03. Live Preview & PDF
            </h3>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
            Switch between Executive, Modern, and Academic layouts in real time
            and download a selectable-text PDF ready for job portals.
          </p>
        </div>
      </section>

      {/* Cloud SQL Saved Resumes */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Your Saved Resumes
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isSignedIn
                ? 'Synced securely to your PostgreSQL workspace.'
                : 'Sign in with Google to save, load, and manage multiple resumes across sessions.'}
            </p>
          </div>

          {isSignedIn ? (
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              New Blank Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              Sign in with Google
            </button>
          )}
        </div>

        {isSignedIn && (
          <div className="mt-5">
            {loadingResumes ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            ) : savedResumes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                <p className="text-sm text-slate-600">
                  No resumes saved yet. Build your first resume in the Builder
                  and click <strong>Save Resume</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('builder')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                >
                  Start First Resume
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {savedResumes.map((item) => {
                  const isActive = item.id === activeResumeId;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                        isActive
                          ? 'border-sky-500 bg-sky-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <h3 className="font-display text-sm font-semibold text-slate-900 truncate">
                          {item.title || 'Untitled Resume'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 truncate">
                          {[
                            item.targetRole || 'No target role',
                            item.template,
                          ].join(' · ')}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onSelectSavedResume(item)}
                          className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                        >
                          {isActive ? 'Currently Loaded' : 'Load & Edit'}
                        </button>
                        {item.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteSavedResume(item.id!)}
                            aria-label={`Delete ${item.title}`}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
