import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

import { nodePolyfills } from "vite-plugin-node-polyfills"

export default defineConfig({
  plugins: [
    sveltekit(),
    nodePolyfills({
      protocolImports: true
    })
  ],
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        'artifacts/PROJECT_NAME.json'
      ]
    }
  }
});
