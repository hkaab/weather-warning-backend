// jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/tests/**/*.test.ts"], // Specify where your test files are
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"], 

  // If you are experiencing issues with ES Modules and ts-jest,
  // ensure your tsconfig.json has "module": "NodeNext" and "moduleResolution": "NodeNext"
  // And your package.json has "type": "module"
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};