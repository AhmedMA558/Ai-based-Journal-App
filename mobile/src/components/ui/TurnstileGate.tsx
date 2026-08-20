import { useState } from 'react';
import { View, Text } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

// Cloudflare has no official React Native SDK (confirmed via their own docs)
// - the standard workaround is embedding the real web widget inside a WebView
// and bridging the token back to RN via postMessage, which is what this does.
// The site key is public by design (meant to be embedded in page/app markup),
// unlike the secret key which never leaves auth-service - EXPO_PUBLIC_ vars
// are baked into the client bundle the same way, so this mirrors that.
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAEWhANuGDYcQFFUh';

function buildHtml(action: 'login' | 'register') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    html, body { margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div class="cf-turnstile"
       data-sitekey="${SITE_KEY}"
       data-action="${action}"
       data-theme="dark"
       data-callback="onVerify"
       data-expired-callback="onExpire"
       data-error-callback="onError"></div>
  <script>
    function onVerify(token) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token })); }
    function onExpire() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expire' })); }
    function onError() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' })); }
  </script>
</body>
</html>`;
}

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
    <View style={{ height: 76, width: '100%' }}>
      <WebView
        key={resetKey}
        originWhitelist={['*']}
        source={{ html: buildHtml(action) }}
        onMessage={handleMessage}
        scrollEnabled={false}
        style={{ backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
      />
      {error ? <Text className="text-[#f87171] text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
