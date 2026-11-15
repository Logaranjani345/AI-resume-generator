import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  SearchCheck,
  Sparkles,
} from 'lucide-react';
import type { AtsAnalysisResult, ResumeData } from '../types/resume';

interface SuggestionsSectionProps {
  resume: ResumeData;
  onChangeJobDescription: (jd: string) => void;
  onOpenChat: () => void;
}

export function SuggestionsSection({
  resume,
  onChangeJobDescription,
  onOpenChat,
}: SuggestionsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AtsAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'ats_analysis',
          resume,
          jobDescription: resume.jobDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to run ATS analysis.');
      }
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Unable to run ATS analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Job Description Input Card */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-primary-brown/5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              AI Suggestions & ATS Keyword Comparison
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Paste a target job description (optional) to compare keywords,
              find missing resume details, and get factual improvement ideas.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenChat}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <MessageSquare className="h-4 w-4" />
            Ask Gemini Career Coach
          </button>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="ats-job-description"
            className="block text-sm font-semibold text-slate-800"
          >
            Target Job Description (Optional)
          </label>
          <textarea
            id="ats-job-description"
            rows={5}
            value={resume.jobDescription}
            onChange={(e) => onChangeJobDescription(e.target.value)}
            placeholder="Paste the job posting responsibilities, required stack, and qualifications here..."
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-500">
            AI analyzes only what you entered and will never guarantee passing
            every employer ATS.
          </p>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchCheck className="h-4 w-4" />
            )}
            {loading ? 'Analyzing Resume...' : 'Run ATS & Resume Review'}
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-sky-600" />
          <h2 className="mt-3 font-display text-base font-semibold text-slate-900">
            Ready to review your resume
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Click <strong>Run ATS & Resume Review</strong> above to inspect
            matching skills, missing keywords, and sections to strengthen.
          </p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Matching Skills */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Matching Skills Found
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {analysis.matchingSkills.length} verified matches
              </p>
              {analysis.matchingSkills.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No direct keyword overlaps identified yet. Add a target job
                  description or expand your skills section.
                </p>
              ) : (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                  {analysis.matchingSkills.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Missing Keywords */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-4 w-4" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Missing Keywords
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {analysis.missingKeywords.length} terms to consider if accurate
              </p>
              {analysis.missingKeywords.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No major missing keywords flagged.
                </p>
              ) : (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                  {analysis.missingKeywords.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SuggestionListCard
              title="Missing Information"
              items={analysis.missingInfo}
              emptyText="All essential profile and link sections look complete."
            />
            <SuggestionListCard
              title="ATS Readability & Improvements"
              items={analysis.improvements}
              emptyText="No immediate formatting or wording issues detected."
            />
            <SuggestionListCard
              title="Areas to Strengthen"
              items={analysis.strengthenAreas}
              emptyText="Project and experience depth looks solid."
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-600">
            <strong className="text-slate-800">Verification Note:</strong>{' '}
            {analysis.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionListCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="font-display text-base font-semibold text-slate-900">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">{emptyText}</p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
