interface MindoraMarkProps {
  size?: number;
  className?: string;
}

// The Mindora glyph on its own (no background tile) - two open-book pages
// meeting at a spine, with a small sparkle accent, matching favicon.svg's
// mark exactly. Used wherever the app's own gradient tile (Navbar's brand
// header, AuthView's login/register header) already provides the background.
export default function MindoraMark({ size = 24, className }: MindoraMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M50,71.9 C 30,71.9 16.3,56.3 16.3,37.5 C 16.3,21.9 28.1,12.5 42.5,17.5 C 32.5,23.8 26.3,32.5 26.3,42.5 C 26.3,55 36.3,62.5 50,62.5 C 63.8,62.5 73.8,55 73.8,42.5 C 73.8,32.5 67.5,23.8 57.5,17.5 C 71.9,12.5 83.8,21.9 83.8,37.5 C 83.8,56.3 70,71.9 50,71.9 Z"
        fill="#ffffff"
        fillOpacity="0.97"
      />
      <path
        d="M66.25,11.25 L68.75,17.5 L75,19.4 L68.75,21.25 L66.25,27.5 L63.75,21.25 L57.5,19.4 L63.75,17.5 Z"
        fill="#e0e7ff"
      />
    </svg>
  );
}
