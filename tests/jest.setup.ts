// jest.setup.ts

// This file is executed once before all test files in Jest.

// 1. Global Console Mocking (Optional but Recommended for Unit Tests)
//    This prevents console.log/warn/error from cluttering your test output
//    unless you explicitly want them to. For unit tests, you usually want
//    to assert on specific logger calls via mocks, not see general output.
//    If you need to see some console output during debugging a test,
//    you can temporarily comment these out or use `console.log('DEBUG:', variable)`
//    which won't be caught by this simple mock.

// You might also put these in `beforeAll` and `afterAll` within a describe block
// if you only want to silence console during specific tests, but for global setup,
// this is common.
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// You might want to restore them after all tests if you have other processes
// that run after Jest that rely on console output.
// afterAll(() => {
//   jest.restoreAllMocks();
// });


// 2. Mocking Node.js built-in modules that are commonly used but problematic in tests
//    (e.g., if you don't want actual file system operations in unit tests by default).
//    However, for your `fileOperations.test.ts`, you already have a specific mock for 'fs/promises'.
//    If you had other files importing 'fs' (the callback-based API) or 'path',
//    you could mock them here globally if needed.
//    Generally, module-specific mocks are best done at the top of the test file
//    where they are used, using `jest.mock('module-name', ...)`.

// Example (uncomment if you need a global mock for 'fs'):
// jest.mock('fs', () => ({
//   promises: {
//     readFile: jest.fn(),
//     unlink: jest.fn(),
//     mkdir: jest.fn(),
//     // ... other fs.promises methods your code uses
//   },
//   // If you use the callback-based fs functions directly
//   // readFileSync: jest.fn(),
//   // existsSync: jest.fn(),
// }));


// 3. Setup for custom matchers (if you have any)
// For example:
// import * as customMatchers from './customMatchers';
// expect.extend(customMatchers);


// 4. Setting up environment variables for tests (if your app relies on them)
// For example:
// process.env.NODE_ENV = 'test';
// process.env.DB_HOST = 'test_db_host';


// 5. Global before/after hooks (less common, usually better per-suite)
// For example:
// beforeAll(async () => {
//   // Setup a test database connection once for all tests
// });
//
// afterAll(async () => {
//   // Disconnect from the test database
// });

// Remember to configure Jest to use this setup file!
// See the next section for how to do that in jest.config.js