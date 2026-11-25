/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/tests/**/*.test.ts', '<rootDir>/src/tests/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      '<rootDir>/jest.transform.cjs',
      {
        diagnostics: false,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          target: 'es2022',
          module: 'commonjs',
          types: ['jest', 'node'],
          paths: {
            '@/*': ['./src/*'],
          },
        },
      },
    ],
  },
};
