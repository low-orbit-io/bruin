import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

// Environment variables for testing different builds
const testBuild = process.env.TEST_BUILD; // 'cjs', 'esm', 'tsup-cjs', 'tsup-esm', or undefined (source)

// Define aliases based on TEST_BUILD environment variable
const getAliases = () => {
  // Default: test from source
  if (!testBuild) {
    return [
      { find: /^bruin$/, replacement: resolve('./src/index.ts') },
      { find: /^bruin(.*)$/, replacement: resolve('./src/$1.ts') },
    ];
  }

  // Testing built artifacts
  let buildDir = 'dist';
  let ext = '.js';

  if (testBuild === 'tsup-cjs') {
    buildDir = 'dist-tsup';
    ext = '.js';
  } else if (testBuild === 'tsup-esm') {
    buildDir = 'dist-tsup';
    ext = '.mjs';
  } else if (testBuild === 'esm') {
    buildDir = 'dist/esm';
    ext = '.mjs';
  } else if (testBuild === 'cjs') {
    buildDir = 'dist';
    ext = '.js';
  }

  return [
    {
      find: 'bruin/vanilla',
      replacement: resolve(`./${buildDir}/vanilla${ext}`),
    },
    {
      find: 'bruin/middleware',
      replacement: resolve(`./${buildDir}/middleware${ext}`),
    },
    { find: 'bruin/react', replacement: resolve(`./${buildDir}/react${ext}`) },
    { find: 'bruin', replacement: resolve(`./${buildDir}/index${ext}`) },
    { find: /^bruin\/(.*)$/, replacement: resolve(`./${buildDir}/$1${ext}`) },
  ];
};

export default defineConfig({
  resolve: {
    alias: getAliases(),
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
          alias: getAliases(),
        },
        test: {
          name: 'vanilla',
          include: ['tests/vanilla/**'],
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: getAliases(),
        },
        test: {
          name: 'sequences',
          include: ['tests/sequences/**'],
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: getAliases(),
        },
        test: {
          name: 'middleware',
          include: ['tests/middleware/**'],
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: getAliases(),
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
