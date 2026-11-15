import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ChatMessageItem,
  ChatPersonaId,
  ResumeData,
} from '../types/resume';
import { useAuth } from '../context/AuthContext';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData;
}

const PERSONA_OPTIONS: Array<{
  id: ChatPersonaId;
  label: string;
  description: string;
}> = [
  {
    id: 'career-coach',
    label: 'Career Coach',
    description: 'Placement & strategy advice (gemini-4-hydrogen)',
  },
  {
    id: 'ats-reviewer',
    label: 'ATS Reviewer',
    description: 'Strict recruiter keyword critique (gemini-4-hydrogen)',
  },
  {
    id: 'quick-editor',
    label: 'Quick Editor',
    description: 'Fast bullet & phrasing rewrites (gemini-3.1-flash-lite)',
  },
];

export function GeminiChatbot({
  isOpen,
  onClose,
  resume,
}: GeminiChatbotProps) {
  const { user } = useAuth();
  const [persona, setPersona] = useState<ChatPersonaId>('career-coach');
  const [includeResume, setIncludeResume] = useState(true);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      setMessages([]);
      setError(null);
      if (!user) {
        setLoadingHistory(false);
        return;
      }
      setLoadingHistory(true);
      try {
        const res = await fetch('/api/chat', {
          credentials: 'same-origin',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load conversation history.');
        }
        if (active && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load conversation history.'
          );
        }
      } finally {
        if (active) setLoadingHistory(false);
      }
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);
    const optimisticUserMsg: ChatMessageItem = {
      role: 'user',
      persona,
      modelUsed:
        persona === 'quick-editor'
          ? 'gemini-3.1-flash-lite'
          : 'gemini-4-hydrogen',
      content: trimmed,
    };

    const nextHistory = [...messages, optimisticUserMsg];
    setMessages(nextHistory);
    setInput('');
    setSending(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify({
          message: trimmed,
          persona,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          resumeContext: includeResume ? resume : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          persona,
          modelUsed: data.modelUsed || optimisticUserMsg.modelUsed,
          content: data.reply,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    setError(null);
    if (user) {
      try {
        const response = await fetch('/api/chat', {
          method: 'DELETE',
          credentials: 'same-origin',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to clear conversation history.');
        }
      } catch (clearError) {
        setError(
          clearError instanceof Error
            ? clearError.message
            : 'Unable to clear conversation history.'
        );
        return;
      }
    }
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Gemini Career Assistant"
      className="no-print fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-5 w-5 text-sky-600" />
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Gemini Resume Assistant
            </h2>
            <p className="text-xs text-slate-500">
              {user ? 'History saved to your account' : 'Session chat'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear conversation"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assistant"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Role & Context Controls */}
      <div className="space-y-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-200/70 p-1">
          {PERSONA_OPTIONS.map((opt) => {
            const active = persona === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPersona(opt.id)}
                title={opt.description}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap truncate ${
                  active
                    ? 'bg-sky-600 text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <label className="flex cursor-pointer items-center justify-between text-xs text-slate-600">
          <span>Include my current resume as context</span>
          <input
            type="checkbox"
            checked={includeResume}
            onChange={(e) => setIncludeResume(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
        </label>
      </div>

      {/* Scrollable Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-10 text-xs text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">
              Ask anything about your resume or target role:
            </p>
            <div className="flex flex-col gap-2">
              {[
                'How can I make my project descriptions stronger for backend roles?',
                'What keywords am I missing for a fresher full-stack engineer role?',
                'Rewrite my professional summary to be under 3 lines.',
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setInput(starter)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {msg.content}
              </div>
              <span className="mt-1 text-[11px] text-slate-400">
                {msg.role === 'user' ? 'You' : `${msg.persona} · ${msg.modelUsed}`}
              </span>
            </div>
          ))
        )}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
            Gemini is drafting a response...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-200 bg-white p-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Ask for bullet rewrites, ATS feedback, or interview prep..."
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
