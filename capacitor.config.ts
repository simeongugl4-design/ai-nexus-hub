import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.megakumul',
  appName: 'MegaKUMUL',
  webDir: 'dist',
  server: {
    url: 'https://92d88fa6-7aec-4107-a66f-b157bdd32ff9.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
