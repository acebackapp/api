/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
          },
          target: 'es2022',
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },
  testMatch: ['**/src/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/supabase/functions/', // Deno edge function tests
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'json', 'json-summary', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      statements: 100,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.*\\.config\\.(ts|js)$',
    '.*\\.d\\.ts$',
    '/tests/',
    'src/schema/index.ts',
    'src/db/index.ts',
    '/supabase/functions/', // Deno edge function tests
  ],
};
