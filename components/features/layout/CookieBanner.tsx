'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { GoogleAnalytics } from '@next/third-parties/google';

const COOKIE_CONSENT_KEY = 'cookie-consent';
type Consent = 'accepted' | 'declined' | null;

function GoogleAnalyticsWrapper({ consent }: { consent: Consent }) {
  if (consent === 'accepted' && process.env.NEXT_PUBLIC_GA_ID) {
    return <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />;
  }

  return null;
}

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as Consent;
    // Consent is intentionally read after hydration so the server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored);
    const timer = !stored
      ? setTimeout(() => {
          setIsVisible(true);
          setIsAnimating(true);
        }, 1500)
      : undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_KEY) return;
      setConsent(event.newValue as Consent);
      setIsVisible(false);
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setConsent('accepted');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setConsent('declined');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  return (
    <>
      <GoogleAnalyticsWrapper consent={consent} />

      {!isVisible ? null : (
        <div
          role="region"
          aria-label="Cookie preferences"
          aria-live="polite"
          aria-atomic="true"
          className={`fixed right-0 bottom-0 left-0 z-[60] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out sm:p-6 ${
            isAnimating ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto max-w-4xl">
            <div className="relative max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] p-3 shadow-2xl sm:p-6">
              {/* Close button */}
              <button
                onClick={handleDecline}
                aria-label="Close cookie banner"
                className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
                {/* Icon */}
                <div className="hidden flex-shrink-0 text-3xl sm:block">🍪</div>

                {/* Content */}
                <div className="flex-1">
                  <p className="pr-10 text-xs leading-5 text-[var(--color-text)] sm:pr-0 sm:text-sm sm:leading-relaxed">
                    We use cookies to analyze site traffic and improve your experience. By using our
                    site, you agree to our{' '}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-2 text-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors font-medium"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>

                {/* Actions */}
                <div className="grid w-full flex-shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row sm:gap-3">
                  <button
                    onClick={handleDecline}
                    className="min-h-11 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    className="min-h-11 px-4 text-sm font-medium rounded-lg bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90 transition-opacity"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
