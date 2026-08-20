import { useEffect, useRef, useState } from 'react';

// The site key is public by design - Cloudflare's own docs embed it directly
// in page markup (data-sitekey="..."), unlike the secret key which never
// leaves auth-service. VITE_TURNSTILE_SITE_KEY overrides this for a
// different environment/widget; the literal default is this app's real
// production widget so the build works without new Docker build-arg plumbing.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAEWhANuGDYcQFFUh';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (container: HTMLElement, options: Record<string, unknown>) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId?: string) => void;
  };
}

function loadTurnstileScript(): Promise<void> {
  const win = window as TurnstileWindow;
  if (win.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });
}

interface TurnstileWidgetProps {
  // A short identifier (letters/numbers/underscores/hyphens) describing the
  // protected surface, matching Cloudflare's data-action convention -
  // "login" vs "register" so each is distinguishable in the Cloudflare
  // dashboard's analytics if it's ever needed.
  action: 'login' | 'register';
  onVerify: (token: string) => void;
  // Bumping this remounts the widget for a fresh, unused token - Turnstile
  // tokens are single-use, so a failed submit (wrong password, duplicate
  // username, etc.) needs a new one before the user can retry.
  resetKey: number;
}

export default function TurnstileWidget({ action, onVerify, resetKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        const win = window as TurnstileWindow;
        if (cancelled || !containerRef.current || !win.turnstile) return;
        widgetIdRef.current = win.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme: 'dark',
          callback: (token: string) => onVerify(token),
          'expired-callback': () => onVerify(''),
          'error-callback': () => setError('CAPTCHA failed to load. Please refresh the page.'),
        });
      })
      .catch(() => setError('CAPTCHA failed to load. Please refresh the page.'));

    return () => {
      cancelled = true;
      const win = window as TurnstileWindow;
      if (widgetIdRef.current && win.turnstile) {
        win.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, resetKey]);

  if (!SITE_KEY) return null;

  return (
    <div className="mt-1">
      <div ref={containerRef} />
      {error && <p className="text-[#f87171] text-[0.75rem] mt-1">{error}</p>}
    </div>
  );
}
