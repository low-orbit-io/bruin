import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^bruin$/, replacement: resolve('./src/index.ts') },
      { find: /^bruin(.*)$/, replacement: resolve('./src/$1.ts') },
    ],
  },
  test: {
    name: 'bruin',
    // Keeping globals to true triggers React Testing Library's auto cleanup
    // https://vitest.dev/guide/migration.html
    globals: true,
    environment: 'happy-dom',
    dir: 'tests',
    reporters: process.env.GITHUB_ACTIONS
      ? ['default', 'github-actions']
      : ['default'],
    setupFiles: ['tests/setup.ts'],
    deps: {
      inline: ['react', 'react-dom'],
    },
    coverage: {
      include: ['src/**/'],
      reporter: ['text', 'json', 'html', 'text-summary'],
      reportsDirectory: './coverage/',
      provider: 'v8',
    },
    projects: [
      {
        resolve: {
          alias: [
            { find: /^bruin$/, replacement: resolve('./src/index.ts') },
            { find: /^bruin(.*)$/, replacement: resolve('./src/$1.ts') },
          ],
        },
        test: {
          name: 'vanilla',
          include: ['tests/vanilla/**'],
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: [
            { find: /^bruin$/, replacement: resolve('./src/index.ts') },
            { find: /^bruin(.*)$/, replacement: resolve('./src/$1.ts') },
          ],
        },
        test: {
          name: 'react',
          include: ['tests/react/**'],
          environment: 'happy-dom',
          setupFiles: ['tests/setup.ts'],
        },
      },
    ],
  },
});
