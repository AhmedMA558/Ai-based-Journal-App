// Real store icons for the download page's "coming soon" badges - lucide's
// generic `Apple` (a plain fruit outline, Apple Inc.'s company logo - not
// even the right mark) and `PlayCircle` (a generic media-play glyph) aren't
// the actual App Store/Google Play brand icons, so they didn't read as real
// store badges. These are hand-drawn to match the real app icons (App
// Store's blue-gradient rounded square with the white compass/"A" mark,
// Google Play's four-color play-triangle), sized/used the same way lucide
// icons are elsewhere in this file.

interface StoreIconProps {
  size?: number;
  className?: string;
}

let appStoreGradientId = 0;

export function AppStoreLogo({ size = 22, className }: StoreIconProps) {
  const gradId = `app-store-grad-${appStoreGradientId++}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2ac0f2" />
          <stop offset="100%" stopColor="#0a6cff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="5.5" fill={`url(#${gradId})`} />
      {/* The App Store glyph: two thick rounded strokes crossing near the top
          (their separate round caps read as a heart-shaped notch) then
          diverging down to flared, rounded bottom ends, plus a crossbar -
          per the real icon, not a plain serif "A". */}
      <path
        d="M13.3 6 7 18M10.7 6 17 18"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 14.5h6" fill="none" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function GooglePlayLogo({ size = 22, className }: StoreIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4.1 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1L13.9 12v-.2L4.2 2.2l-.1.1z" fill="#00d4ff" />
      <path d="M17.15 15.24 13.9 12v-.2l3.25-3.24.07.04 3.85 2.19c1.1.62 1.1 1.64 0 2.27l-3.85 2.18-.07-.2z" fill="#ffcd00" />
      <path d="M17.22 15.15 13.9 11.8 4.1 21.7c.36.38.96.43 1.63.05l11.49-6.6" fill="#ff3d57" />
      <path d="M17.22 8.46 5.73 1.86c-.67-.38-1.27-.33-1.63.05l9.8 9.9 3.32-3.35z" fill="#00e676" />
    </svg>
  );
}
