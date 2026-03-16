'use client';

import { useEffect, useState } from 'react';

export type SignupVariant = 'banner' | 'modal' | 'return' | null;

const Q_KEY = 'wai_q_count';       // total questions asked (lifetime)
const SESSION_KEY = 'wai_sessions'; // number of visits
const DISMISSED_KEY = 'wai_dismissed'; // last dismissed timestamp
const SIGNED_UP_KEY = 'wai_signed_up';

function getInt(key: string): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

function setInt(key: string, val: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, String(val));
}

// Call once on app mount to increment session count
export function recordSession() {
  if (typeof window === 'undefined') return;
  // Only count as new session if last session was > 30 min ago
  const lastSession = parseInt(localStorage.getItem('wai_last_session') || '0', 10);
  const now = Date.now();
  if (now - lastSession > 30 * 60 * 1000) {
    setInt(SESSION_KEY, getInt(SESSION_KEY) + 1);
    localStorage.setItem('wai_last_session', String(now));
  }
}

// Call every time a question is submitted
export function recordQuestion() {
  if (typeof window === 'undefined') return;
  setInt(Q_KEY, getInt(Q_KEY) + 1);
}

export function getQuestionCount(): number {
  return getInt(Q_KEY);
}

export function getSessionCount(): number {
  return getInt(SESSION_KEY);
}

export function isSignedUp(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIGNED_UP_KEY) === '1';
}

// Determine what prompt to show, if any
export function resolvePromptVariant(): SignupVariant {
  if (isSignedUp()) return null;

  const dismissed = parseInt(localStorage.getItem(DISMISSED_KEY) || '0', 10);
  const hoursSinceDismissed = (Date.now() - dismissed) / (1000 * 60 * 60);
  // Don't show again within 4 hours of dismissal
  if (dismissed && hoursSinceDismissed < 4) return null;

  const questions = getQuestionCount();
  const sessions = getSessionCount();

  // 3rd+ return session → modal
  if (sessions >= 3 && questions >= 3) return 'return';

  // Hit the limit (5+) → modal
  if (questions >= 5) return 'modal';

  // After question 3 → soft banner
  if (questions >= 3) return 'banner';

  return null;
}

export function recordDismissal() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DISMISSED_KEY, String(Date.now()));
}

export function useSignupTrigger(questionJustAsked: boolean) {
  const [variant, setVariant] = useState<SignupVariant>(null);

  useEffect(() => {
    // Check on mount for return-visit prompt
    const v = resolvePromptVariant();
    if (v === 'return') setVariant('return');
  }, []);

  useEffect(() => {
    if (!questionJustAsked) return;
    // Re-evaluate after a question is submitted
    const v = resolvePromptVariant();
    if (v) setVariant(v);
  }, [questionJustAsked]);

  function dismiss() {
    recordDismissal();
    setVariant(null);
  }

  function onSignedUp() {
    setVariant(null);
  }

  return { variant, dismiss, onSignedUp };
}
