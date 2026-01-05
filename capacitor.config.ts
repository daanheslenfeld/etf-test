import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.pigg.app',
  appName: 'PIGG',
  webDir: 'build',
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    allowsLinkPreview: false
  },
  plugins: {
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
