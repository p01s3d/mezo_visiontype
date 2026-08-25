import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

function zerionProxyConfig(apiKey: string | undefined): ProxyOptions {
  return {
    target: 'https://api.zerion.io',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/zerion/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        if (apiKey) {
          const auth = Buffer.from(`${apiKey}:`).toString('base64');
          proxyReq.setHeader('Authorization', `Basic ${auth}`);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const zerionProxy = zerionProxyConfig(env.VITE_ZERION_API_KEY);

  return {
    // Only GitHub Pages needs the repo-name subpath (set via GITHUB_PAGES in
    // deploy-pages.yml) — Vercel/Netlify/local preview all serve from root,
    // and also build with mode "production", so keying off mode alone would
    // break asset paths on those hosts.
    base: process.env.GITHUB_PAGES ? '/mezo_visiontype/' : '/',
    plugins: [react()],
    server: {
      proxy: {
        '/api/zerion': zerionProxy,
      },
    },
    preview: {
      proxy: {
        '/api/zerion': zerionProxy,
      },
    },
  };
});
