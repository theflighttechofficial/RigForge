import React, { useEffect, useState } from 'react';
import { inject } from '@vercel/analytics';

// Analytics only load after the visitor says yes. The choice lives in this browser.
const CONSENT_KEY = 'silicon_matrix_analytics_consent';
type Consent = 'granted' | 'denied' | null;

const readConsent = (): Consent => {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
};

let analyticsLoaded = false;
function loadAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;
  inject({
    // Scan sessions and the one-time agent links carry tokens; never report them
    beforeSend: (event) => (event.url.includes('/api/') ? null : event)
  });
}

// Lets the footer reopen the banner
export const OPEN_CONSENT_EVENT = 'silicon-matrix:open-consent';

export const ConsentBanner: React.FC<{ onOpenPrivacy: () => void }> = ({ onOpenPrivacy }) => {
  const [consent, setConsent] = useState<Consent>(readConsent);
  const [open, setOpen] = useState(consent === null);

  useEffect(() => {
    if (consent === 'granted') loadAnalytics();
  }, [consent]);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const choose = (value: 'granted' | 'denied') => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Private mode: the choice lasts for this visit only
    }
    setConsent(value);
    setOpen(false);
    // Withdrawing consent after the script loaded takes effect on the next page load
    if (value === 'denied' && analyticsLoaded) window.location.reload();
  };

  if (!open) return null;

  return (
    <div
      // Sits above the phone CTA bar
      role="dialog"
      aria-live="polite"
      aria-label="Analytics consent"
      className="fixed z-50 inset-x-3 bottom-20 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-300"
    >
      <p className="font-semibold text-white">Help improve this site?</p>
      <p className="mt-1 leading-relaxed">
        With your OK we count page views using Vercel Web Analytics. It sets no cookies and does not identify you. The site works the same either way.{' '}
        <button onClick={onOpenPrivacy} className="text-cyan-400 underline underline-offset-2 cursor-pointer">
          Privacy policy
        </button>
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => choose('granted')} className="px-3.5 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold cursor-pointer">
          Allow
        </button>
        <button onClick={() => choose('denied')} className="px-3.5 py-2 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-100 font-semibold cursor-pointer">
          No thanks
        </button>
      </div>
    </div>
  );
};
