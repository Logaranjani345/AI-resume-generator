import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Layers3,
  Plus,
  SearchCheck,
  Sparkles,
  Target,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import type { ResumeData, SectionKey } from '../types/resume';

interface HomeSectionProps {
  onNavigate: (section: SectionKey) => void;
  onLoadSample: () => void;
  onCreateNew: () => void;
  savedResumes: ResumeData[];
  activeResumeId?: string;
  onSelectSavedResume: (resume: ResumeData) => void;
  onDeleteSavedResume: (id: string) => void;
  isSignedIn: boolean;
  onSignIn: () => void;
  loadingResumes: boolean;
}

const FEATURES = [
  {
    icon: WandSparkles,
    title: 'AI-Powered Resume Writing',
    description:
      'Turn your real experience into clear, confident resume language.',
  },
  {
    icon: SearchCheck,
    title: 'ATS-Friendly Formatting',
    description:
      'Compare your resume with a role and find relevant keywords to review.',
  },
  {
    icon: Layers3,
    title: 'Professional Resume Templates',
    description:
      'Choose a polished layout that keeps your experience easy to scan.',
  },
  {
    icon: Bot,
    title: 'AI Suggestions',
    description:
      'Get thoughtful suggestions while keeping your story true to you.',
  },
  {
    icon: Eye,
    title: 'Live Resume Preview',
    description:
      'See your changes take shape instantly across three distinct styles.',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description:
      'Export a clean, selectable-text resume for your next application.',
  },
];

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

    <div className="page-enter space-y-16 pb-8">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-primary-brown/10 bg-white px-6 py-10 shadow-xl shadow-primary-brown/5 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <div className="pointer-events-none absolute -right-28 -top-32 -z-10 h-96 w-96 rounded-full bg-sky-600/20 blur-3xl" />

    <div className="space-y-16 pb-8">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 px-6 py-10 shadow-xl shadow-[#3B2418]/5 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <div className="pointer-events-none absolute -right-28 -top-32 -z-10 h-96 w-96 rounded-full bg-sky-600/10 blur-3xl" />


        <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-8">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-600/30 bg-sky-600/10 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.16em] text-sky-600">
              <Sparkles className="h-3.5 w-3.5" />
              AI-POWERED RESUME BUILDER
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.7rem]">

              Build a Resume That{' '}
              <span className="box-decoration-clone rounded-sm bg-accent-blue px-1 text-primary-brown">
                Opens New Opportunities.
              </span>

              Build a Resume That Opens{' '}
              <span className="text-sky-600">New Opportunities.</span>

            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Create polished, ATS-friendly resumes with intelligent AI
              assistance. Present your education, skills, projects, and
              experience with confidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('builder')}
                className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-sky-600/10 hover:-translate-y-0.5 hover:bg-sky-700"
              >
                Create My Resume
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('preview')}

                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-primary-brown/25 bg-white px-5 py-3 text-sm font-semibold text-primary-brown hover:border-sky-600/50 hover:bg-secondary-cream"

                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-silver hover:border-sky-600/50 hover:bg-white/10"

              >
                Explore Templates
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={onLoadSample}
              className="mt-4 text-xs font-medium text-slate-400 underline decoration-white/20 underline-offset-4 hover:text-sky-600"
            >
              Or explore with a sample resume
            </button>


            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-primary-brown/10 pt-6">

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6">

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <BadgeCheck className="h-4 w-4 text-sky-600" />
                Factual AI suggestions
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileCheck2 className="h-4 w-4 text-sky-600" />
                ATS-friendly export
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[490px] lg:justify-self-end">
            <div className="hero-grid pointer-events-none absolute -inset-8 -z-10 rounded-[32px] opacity-60" />

            <div className="hero-float overflow-hidden rounded-2xl border border-primary-brown/10 bg-secondary-cream shadow-2xl shadow-primary-brown/15">
              <div className="flex items-center gap-2 border-b border-primary-brown/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-brown/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary-brown/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary-brown/20" />
                <div className="ml-3 flex-1 rounded-md border border-primary-brown/10 bg-white/70 px-3 py-1 text-[10px] text-slate-400">

            <div className="hero-float overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl shadow-black/10">
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-silver/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-silver/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-silver/50" />
                <div className="ml-3 flex-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-[10px] text-slate-400">

                  resumestudio.app / preview
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="resume-mockup rounded-xl bg-white p-5 shadow-xl sm:p-7">
                  <div className="flex items-start justify-between gap-4 border-b border-silver/60 pb-4">
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.18em] text-silver">
                        SOFTWARE ENGINEER
                      </p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                        Alex Morgan
                      </h2>
                      <p className="mt-1 text-[10px] text-silver">
                        San Francisco, CA · alex.morgan@email.com
                      </p>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600/15">
                      <FileText className="h-4 w-4 text-sky-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_0.72fr] gap-5 pt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-[9px] font-bold tracking-[0.16em]">
                          EXPERIENCE
                        </h3>
                        <p className="text-[10px] font-semibold">
                          Product Engineer
                        </p>
                        <p className="mt-0.5 text-[8px] text-silver">
                          Northstar Labs · 2022 — Present
                        </p>
                        <div className="mt-2 space-y-1.5">
                          <span className="block h-1.5 w-full rounded bg-silver/45" />
                          <span className="block h-1.5 w-[94%] rounded bg-silver/45" />
                          <span className="block h-1.5 w-[80%] rounded bg-silver/45" />
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-2 text-[9px] font-bold tracking-[0.16em]">
                          SELECTED PROJECT
                        </h3>
                        <p className="text-[10px] font-semibold">
                          Customer Insights Platform
                        </p>
                        <div className="mt-2 space-y-1.5">
                          <span className="block h-1.5 w-full rounded bg-silver/45" />
                          <span className="block h-1.5 w-[86%] rounded bg-silver/45" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-[9px] font-bold tracking-[0.16em]">
                          EXPERTISE
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {['React', 'TypeScript', 'Node.js', 'SQL'].map(
                            (skill) => (
                              <span
                                key={skill}
                                className="rounded bg-silver/30 px-1.5 py-1 text-[8px]"
                              >
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-2 text-[9px] font-bold tracking-[0.16em]">
                          EDUCATION
                        </h3>
                        <p className="text-[9px] font-semibold">
                          B.S. Computer Science
                        </p>
                        <p className="mt-0.5 text-[8px] text-silver">
                          Pacific University
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-silver/60 pt-3">
                    <span className="text-[8px] font-medium tracking-wide text-silver">
                      PROFESSIONAL · ATS-READY
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-600/15 px-2 py-1 text-[8px] font-bold text-sky-600">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Live preview
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-3 hidden items-center gap-2 rounded-xl border border-primary-brown/10 bg-white px-3 py-2.5 shadow-xl sm:flex">

            <div className="absolute -bottom-4 -left-3 hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 shadow-xl sm:flex">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/15">
                <Sparkles className="h-4 w-4 text-sky-600" />
              </div>
              <div>

                <p className="text-[10px] font-semibold text-primary-brown">

                <p className="text-[10px] font-semibold text-white">

                  AI-assisted
                </p>
                <p className="text-[9px] text-slate-400">Your story, refined</p>
              </div>
            </div>

            <div className="absolute -right-3 top-14 hidden items-center gap-2 rounded-xl border border-primary-brown/10 bg-white px-3 py-2.5 shadow-xl sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/15">
                <Target className="h-4 w-4 text-sky-600" />
              </div>
              <p className="text-[10px] font-semibold text-primary-brown">

            <div className="absolute -right-3 top-14 hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 shadow-xl sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/15">
                <Target className="h-4 w-4 text-sky-600" />
              </div>
              <p className="text-[10px] font-semibold text-white">

                ATS-ready format
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-sky-600">
              EVERYTHING YOU NEED
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              From first draft to final export.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-400">
            A focused toolkit to help you create, refine, and share your next
            opportunity-ready resume.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}

              className="group rounded-2xl border border-primary-brown/10 bg-slate-900 p-5 shadow-sm shadow-primary-brown/5 transition-all duration-200 hover:-translate-y-1 hover:border-sky-600/50 hover:bg-slate-900/80 hover:shadow-md sm:p-6"

              className="group rounded-2xl border border-white/10 bg-slate-900 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-sky-600/50 hover:bg-slate-50 sm:p-6"

            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-600/20 bg-sky-600/10 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-slate-900">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-[10px] font-bold tracking-[0.14em] text-slate-400">
                0{index + 1}
              </p>
              <h3 className="mt-1 font-display text-base font-semibold text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>


      <section className="rounded-2xl border border-primary-brown/10 bg-slate-900 p-6 shadow-sm shadow-primary-brown/5 sm:p-8">

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8">

        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-sky-600">
              YOUR WORKSPACE
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
              Your Saved Resumes
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              {isSignedIn
                ? 'Your resumes are synced securely to your account.'
                : 'Sign in to save and manage your resumes across sessions.'}
            </p>
          </div>

          {isSignedIn ? (
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-sky-600/50 hover:bg-white/10"
            >
              <Plus className="h-4 w-4 text-sky-600" />
              New Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-sky-700"
            >
              Sign in to save resumes
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isSignedIn && (
          <div className="pt-5">
            {loadingResumes ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/5"
                  />
                ))}
              </div>
            ) : savedResumes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-7 text-center">
                <FileText className="mx-auto h-6 w-6 text-sky-600" />
                <p className="mt-3 text-sm text-slate-400">
                  No resumes saved yet. Start building and save your first
                  resume here.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('builder')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-sky-700"
                >
                  Open Resume Builder
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savedResumes.map((item) => {
                  const isActive = item.id === activeResumeId;
                  return (
                    <article
                      key={item.id}
                      className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                        isActive
                          ? 'border-sky-600 bg-sky-600/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      }`}
                    >
                      <div>
                        <h3 className="truncate font-display text-sm font-semibold text-white">
                          {item.title || 'Untitled Resume'}
                        </h3>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {[item.targetRole || 'No target role', item.template]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                        <button
                          type="button"
                          onClick={() => onSelectSavedResume(item)}
                          className="text-xs font-semibold text-sky-600 hover:text-white"
                        >
                          {isActive ? 'Currently Loaded' : 'Load & Edit'}
                        </button>
                        {item.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteSavedResume(item.id!)}
                            aria-label={`Delete ${item.title}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-sky-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </article>
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
