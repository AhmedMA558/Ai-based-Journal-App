import { useState } from 'react';
import { View, Text } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { API_BASE_URL } from '@/config/env';

// Cloudflare has no official React Native SDK - the standard workaround is
// embedding the real web widget inside a WebView and bridging the token
// back to RN via postMessage. Loading the widget from a REAL URL under the
// app's own production origin (not react-native-webview's `source={{html}}`,
// which has no real origin at all) is required - Turnstile validates the
// requesting page's origin against the hostnames configured for the site
// key in the Cloudflare dashboard, and an opaque inline-HTML WebView can
// never pass that check ("Unable to connect to website", confirmed live on
// a real device). frontend/public/turnstile-embed.html is the real page
// this loads, served from the same origin the web app's own working widget
// already uses.
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAEWhANuGDYcQFFUh';

interface TurnstileGateProps {
  action: 'login' | 'register';
  onVerify: (token: string) => void;
  // Changing this remounts the WebView for a fresh, unused token - Turnstile
  // tokens are single-use, so a failed submit needs a new one before retry.
  resetKey: number;
}

export function TurnstileGate({ action, onVerify, resetKey }: TurnstileGateProps) {
  const [error, setError] = useState('');

  if (!SITE_KEY) return null;

  const embedUrl = `${API_BASE_URL}/turnstile-embed.html?action=${action}&sitekey=${encodeURIComponent(SITE_KEY)}`;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'verify') {
        setError('');
        onVerify(payload.token);
      } else if (payload.type === 'expire') {
        onVerify('');
      } else if (payload.type === 'error') {
        setError('CAPTCHA failed to load. Please check your connection.');
      }
    } catch {
      // Ignore malformed messages.
    }
  };

  return (
    // 150x140 matches the embed page's 'compact' Turnstile size - the
    // 'normal' size (300x65) didn't fit the app's card width and clipped
    // the Cloudflare branding on the right, confirmed live on a real device.
    <View style={{ height: 140, width: 150, alignSelf: 'center' }}>
      <WebView
        key={resetKey}
        originWhitelist={['*']}
        source={{ uri: embedUrl }}
        onMessage={handleMessage}
        onError={() => setError('CAPTCHA failed to load. Please check your connection.')}
        onHttpError={() => setError('CAPTCHA failed to load. Please check your connection.')}
        scrollEnabled={false}
        style={{ backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
      />
      {error ? <Text className="text-[#f87171] text-xs mt-1 text-center">{error}</Text> : null}
    </View>
  );
}
