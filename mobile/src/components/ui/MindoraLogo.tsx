import { Image } from 'react-native';

// The app-icon asset already carries the real Canva-redesigned Mindora mark
// (gradient circle + thoughtmark) - Login/Register previously used a generic
// lucide Sparkles glyph in a hand-rolled gradient box instead, a leftover
// from before the rebrand that never got swapped like web's AuthView.tsx was.
export function MindoraLogo({ size = 64 }: { size?: number }) {
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../../assets/icon.png')}
      style={{ width: size, height: size, borderRadius: size * 0.28, marginBottom: 16 }}
      resizeMode="cover"
    />
  );
}
