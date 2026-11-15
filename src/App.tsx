/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, Menu, MessageSquare, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthDialog } from './components/AuthDialog';
import { HomeSection } from './components/HomeSection';
import { BuilderSection } from './components/BuilderSection';
import { PreviewSection } from './components/PreviewSection';
import { SuggestionsSection } from './components/SuggestionsSection';
import { GeminiChatbot } from './components/GeminiChatbot';
import {
  EMPTY_RESUME,
  ResumeData,
  ResumeTemplateId,
  SAMPLE_RESUME,
  SectionKey,
} from './types/resume';

interface NavigationProps {
  activeSection: SectionKey;
  onSelectSection: (section: SectionKey) => void;
  userEmail: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

const NAV_LINKS: Array<{ id: SectionKey; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'builder', label: 'Resume Builder' },
  { id: 'preview', label: 'Preview' },
  { id: 'suggestions', label: 'AI Suggestions' },
];

export function Navigation({
  activeSection,
  onSelectSection,
  userEmail,
  onSignIn,
  onSignOut,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (section: SectionKey) => {
    onSelectSection(section);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-primary-brown/10 bg-slate-950/95 backdrop-blur-xl">
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap font-display text-lg font-bold tracking-tight text-primary-brown"
          className="flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap font-display text-lg font-bold tracking-tight text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-slate-900">
            <span className="text-sm font-extrabold">R</span>
          </span>

          Resume<span className="-ml-2 text-sky-600">Studio</span>
          <span>
            Resume<span className="text-sky-600">Studio</span>
          </span>
        </button>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 rounded-xl border border-primary-brown/10 bg-white/70 p-1 md:flex"
          className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 md:flex"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-slate-900'

                    : 'text-slate-700 hover:bg-secondary-cream hover:text-primary-brown'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {userEmail ? (
            <button
              type="button"
              onClick={onSignOut}
              title={`Signed in as ${userEmail}`}

              className="inline-flex min-h-[38px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-primary-brown/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-primary-brown transition-colors hover:border-sky-600/50 hover:bg-secondary-cream"
              className="inline-flex min-h-[38px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:border-sky-600/50 hover:bg-white/10"

            >
              <span className="max-w-[140px] truncate hidden sm:inline">
                {userEmail}
              </span>
              <LogOut className="h-3.5 w-3.5 text-sky-600" />
              <span className="sm:hidden">Sign out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}

              className="inline-flex min-h-[38px] shrink-0 items-center whitespace-nowrap rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-primary-brown hover:bg-sky-700"

              className="inline-flex min-h-[38px] shrink-0 items-center whitespace-nowrap rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-slate-900 hover:bg-sky-700"

            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}

            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary-brown/15 text-primary-brown hover:bg-secondary-cream md:hidden"

            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-silver hover:bg-white/5 md:hidden"

          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"

          className="border-t border-primary-brown/10 bg-background-cream px-4 py-3 md:hidden"

          className="border-t border-white/10 bg-slate-950 px-4 py-3 md:hidden"

        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 font-semibold text-slate-900'

                      : 'text-slate-700 hover:bg-secondary-cream hover:text-primary-brown'

                      : 'text-slate-400 hover:bg-white/5 hover:text-white'

                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

const AUTO_SAVE_PREF_KEY = 'resumeStudio_autoSave';
const LOCAL_DRAFT_KEY = 'resumeStudio_localDraft';

function ResumeAppShell() {
  const { user, signOutUser, authError } = useAuth();

  const [activeSection, setActiveSection] = useState<SectionKey>('home');
  const [resume, setResume] = useState<ResumeData>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (cached) {
        return JSON.parse(cached) as ResumeData;
      }
    } catch {
      // Ignore invalid local draft
    }
    return EMPTY_RESUME;
  });
  const [savedResumes, setSavedResumes] = useState<ResumeData[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_SAVE_PREF_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const lastSavedSnapshotRef = useRef<string>(JSON.stringify(resume));
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef<boolean>(false);

  const handleToggleAutoSave = () => {
    setAutoSaveEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTO_SAVE_PREF_KEY, String(next));
      } catch {
        // Ignore storage quota errors
      }
      if (!next && autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      setSaveStatus(next ? 'Auto-save enabled' : 'Auto-save off');
      return next;
    });
  };

  const fetchSavedResumes = useCallback(async () => {
    if (!user) {
      setSavedResumes([]);
      return;
    }
    setLoadingResumes(true);
    setAppError(null);
    try {
      const res = await fetch('/api/resumes', {
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load saved resumes.');
      }
      const list = Array.isArray(data.resumes) ? data.resumes : [];
      setSavedResumes(list);
      if (list.length > 0 && !resume.id && !resume.fullName) {
        lastSavedSnapshotRef.current = JSON.stringify(list[0]);
        setResume(list[0]);
      }
    } catch (err: any) {
      setAppError(err.message);
    } finally {
      setLoadingResumes(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedResumes();
  }, [fetchSavedResumes]);

  const persistResumeToCloud = useCallback(
    async (draft: ResumeData, statusLabel: string) => {
      if (!user || isSavingRef.current) return;
      isSavingRef.current = true;
      setSaving(true);
      setAppError(null);
      const sentSnapshot = JSON.stringify(draft);
      try {
        const isUpdate = Boolean(draft.id);
        const url = isUpdate ? `/api/resumes/${draft.id}` : '/api/resumes';
        const method = isUpdate ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: sentSnapshot,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to save resume.');
        }
        const saved = data.resume as ResumeData;

        // Preserve any concurrent user edits while syncing server-assigned id/updatedAt
        setResume((latest) => {
          const merged = {
            ...latest,
            id: saved.id,
            updatedAt: saved.updatedAt,
          };
          if (JSON.stringify(latest) === sentSnapshot) {
            lastSavedSnapshotRef.current = JSON.stringify(merged);
          } else {
            lastSavedSnapshotRef.current = sentSnapshot;
          }
          return merged;
        });

        setSaveStatus(statusLabel);
        await fetchSavedResumes();
      } catch (err: any) {
        setAppError(err.message);
      } finally {
        isSavingRef.current = false;
        setSaving(false);
      }
    },
    [user, fetchSavedResumes]
  );

  // Debounced auto-save whenever resume changes and auto-save is enabled
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const currentSnapshot = JSON.stringify(resume);
    if (currentSnapshot === lastSavedSnapshotRef.current) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (user) {
        persistResumeToCloud(resume, 'Auto-saved');
      } else {
        try {
          localStorage.setItem(LOCAL_DRAFT_KEY, currentSnapshot);
          lastSavedSnapshotRef.current = currentSnapshot;
          setSaveStatus('Auto-saved locally');
        } catch {
          // Ignore storage quota errors
        }
      }
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [resume, autoSaveEnabled, user, persistResumeToCloud]);

  const handleSaveResume = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setSaveStatus(null);
    await persistResumeToCloud(resume, 'Saved');
  };

  const handleDeleteSavedResume = async (id: string) => {
    if (!user) return;
    setAppError(null);
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete resume.');
      }
      if (resume.id === id) {
        lastSavedSnapshotRef.current = JSON.stringify(EMPTY_RESUME);
        setResume(EMPTY_RESUME);
      }
      await fetchSavedResumes();
    } catch (err: any) {
      setAppError(err.message);
    }
  };

  const handleSelectTemplate = (template: ResumeTemplateId) => {
    setResume((prev) => ({ ...prev, template }));
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      setAppError(
        error instanceof Error ? error.message : 'Unable to sign out right now.'
      );
    }
  };

  return (

    <div className="flex min-h-screen flex-col bg-background-cream text-dark-text">

    <div className="flex min-h-screen flex-col bg-slate-950 text-white">

      <Navigation
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        userEmail={user?.email || null}
        onSignIn={() => setAuthDialogOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="resume-print-main mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {(authError || appError) && (

          <div className="mb-6 rounded-xl border border-secondary-cream bg-white px-4 py-3 text-sm text-primary-brown shadow-sm">

          <div className="mb-6 rounded-xl border border-silver/30 bg-white/5 px-4 py-3 text-sm text-golden-yellow">

            {authError || appError}
          </div>
        )}

        {activeSection === 'home' && (
          <HomeSection
            onNavigate={setActiveSection}
            onLoadSample={() => {
              const next = { ...SAMPLE_RESUME, id: undefined };
              lastSavedSnapshotRef.current = JSON.stringify(next);
              setResume(next);
              setActiveSection('builder');
            }}
            onCreateNew={() => {
              const next = { ...EMPTY_RESUME, id: undefined };
              lastSavedSnapshotRef.current = JSON.stringify(next);
              setResume(next);
              setActiveSection('builder');
            }}
            savedResumes={savedResumes}
            activeResumeId={resume.id}
            onSelectSavedResume={(selected) => {
              lastSavedSnapshotRef.current = JSON.stringify(selected);
              setResume(selected);
              setActiveSection('builder');
            }}
            onDeleteSavedResume={handleDeleteSavedResume}
            isSignedIn={Boolean(user)}
            onSignIn={() => setAuthDialogOpen(true)}
            loadingResumes={loadingResumes}
          />
        )}

        {activeSection === 'builder' && (
          <BuilderSection
            resume={resume}
            onChange={setResume}
            onSave={handleSaveResume}
            saving={saving}
            saveStatus={saveStatus}
            autoSaveEnabled={autoSaveEnabled}
            onToggleAutoSave={handleToggleAutoSave}
            isSignedIn={Boolean(user)}
            onSignIn={() => setAuthDialogOpen(true)}
            onNavigate={setActiveSection}
          />
        )}

        {activeSection === 'preview' && (
          <PreviewSection
            resume={resume}
            onSelectTemplate={handleSelectTemplate}
            onNavigate={setActiveSection}
          />
        )}

        {activeSection === 'suggestions' && (
          <SuggestionsSection
            resume={resume}
            onChangeJobDescription={(jd) =>
              setResume((prev) => ({ ...prev, jobDescription: jd }))
            }
            onOpenChat={() => setChatOpen(true)}
          />
        )}
      </main>


      <footer className="no-print border-t border-primary-brown/10 bg-background-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-slate-600 sm:px-6">
          <span>ResumeStudio · ATS-Friendly Resume Builder</span>

      <footer className="no-print border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-slate-400 sm:px-6">
          <span>AI-Powered Resume Generator · ATS-Friendly Builder</span>

          <span>
            Always review AI-generated content for accuracy before submitting.
          </span>
        </div>
      </footer>

      {/* Gemini Multi-Turn Assistant Trigger & Drawer */}
      {!chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}

          className="no-print fixed bottom-5 right-5 z-40 inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl border border-primary-brown/10 bg-white px-4 py-2.5 text-xs font-semibold text-primary-brown shadow-lg shadow-primary-brown/10 transition-transform hover:scale-[1.02] hover:border-sky-600/50"

          className="no-print fixed bottom-5 right-5 z-40 inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-lg shadow-[#3B2418]/10 transition-transform hover:scale-[1.02] hover:border-sky-600/50"

        >
          <MessageSquare className="h-4 w-4 text-sky-600" />
          AI Assistant
        </button>
      )}

      <GeminiChatbot
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        resume={resume}
      />
      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ResumeAppShell />
    </AuthProvider>
  );
}
