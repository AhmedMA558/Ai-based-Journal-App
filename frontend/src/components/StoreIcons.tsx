// Real store logomarks for the download page's "coming soon" badges - lucide's
// generic `Apple` (a plain fruit outline) and `PlayCircle` (a generic media-play
// glyph) aren't the actual App Store/Google Play brand marks, so they didn't read
// as real store badges. These are hand-drawn to match the real logomarks
// (Apple's bitten-apple silhouette, Google Play's four-color play-triangle),
// sized/used the same way lucide icons are elsewhere in this file.

interface StoreIconProps {
  size?: number;
  className?: string;
}

export function AppleLogo({ size = 22, className }: StoreIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.417 2.06-1.25 2.86-.968.936-2.045 1.475-3.11 1.386-.13-1.11.42-2.28 1.25-3.06.876-.83 2.06-1.4 3.11-1.19zM20.9 17.32c-.52 1.2-.77 1.74-1.44 2.79-.94 1.46-2.26 3.28-3.9 3.3-1.46.02-1.84-.95-3.82-.94-1.98.01-2.4.96-3.86.94-1.64-.02-2.89-1.66-3.83-3.12C1.24 16.79.5 13.3 1.6 10.93c.78-1.68 2.2-2.74 3.75-2.76 1.5-.02 2.9 1.01 3.82 1.01.9 0 2.6-1.25 4.4-1.07.75.03 2.86.3 4.21 2.28-.11.07-2.51 1.47-2.48 4.37.03 3.47 3.05 4.63 3.09 4.65-.03.08-.48 1.65-1.49 3.91z" />
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
