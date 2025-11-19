import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vanilla: 'src/vanilla.ts',
    react: 'src/react.ts',
    middleware: 'src/middleware.ts',
    'middleware/immer': 'src/middleware/immer.ts',
    shallow: 'src/shallow.ts',
    'vanilla/shallow': 'src/vanilla/shallow.ts',
    'react/shallow': 'src/react/shallow.ts',
    traditional: 'src/traditional.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'immer', 'use-sync-external-store'],
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  outDir: 'dist-tsup', // Using separate output directory for testing
  esbuildOptions(options) {
    options.define = {
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
    };
  },
  // Add compilerOptions for dts generation
  tsconfig: 'tsconfig.tsup.json',
});
