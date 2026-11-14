import { useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  allowInInputs?: boolean;
  preventDefault?: boolean;
  handler: (event: KeyboardEvent) => void;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.isContentEditable;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled = true
): void {
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const inInput = isEditableElement(event.target);
      const pressedKey = event.key.toLowerCase();

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.key.toLowerCase() !== pressedKey) continue;

        const expectsCtrlOrMeta = Boolean(shortcut.ctrlOrMeta);
        const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
        if (expectsCtrlOrMeta !== hasCtrlOrMeta) continue;

        const expectsShift = Boolean(shortcut.shift);
        if (expectsShift !== event.shiftKey) continue;

        const expectsAlt = Boolean(shortcut.alt);
        if (expectsAlt !== event.altKey) continue;

        if (inInput && !shortcut.allowInInputs && !expectsCtrlOrMeta && !expectsAlt) {
          continue;
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
