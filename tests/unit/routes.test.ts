import express  from 'express'; // Import express to create a test app
import request from 'supertest';

// Mock the controller functions
// We need to provide the exact path relative to the test file for jest.mock
jest.mock('../../src/controllers/weatherController', () => ({
  // Mock the named exports from weatherController
  getStateWarnings: jest.fn((req, res) => res.status(200).send('mocked warnings')),
  getWarningDetailsById: jest.fn((req, res) => res.status(200).send('mocked warning details')),
}));

// Import the mocked functions so we can assert on them
import { getStateWarnings, getWarningDetailsById } from '../../src/controllers/weatherController';
import router from '../../src/routers/routes';

// Create a simple Express app to mount our router for testing
const app = express();
app.use(router); // Mount the router

describe('Weather Router', () => {
  // Clear mock calls before each test to ensure isolation
  beforeEach(() => {
    (getStateWarnings as jest.Mock).mockClear();
    (getWarningDetailsById as jest.Mock).mockClear();
  });

  // --- GET /health route tests ---
  describe('GET /health', () => {
    it('should return 200 OK with status message', async () => {
      const response = await request(app).get('/health'); // Use supertest to make a GET request to /health

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  // --- GET / route tests (for getStateWarnings) ---
  describe('GET /', () => {
    it('should call getStateWarnings controller', async () => {
      // Set up a mock implementation for getStateWarnings to avoid errors during the request
      (getStateWarnings as jest.Mock).mockImplementationOnce((req, res) => {
        res.status(200).send({ warnings: ['mocked'] });
      });

      const response = await request(app).get('/'); // Make a GET request to the root path

      expect(getStateWarnings).toHaveBeenCalledTimes(1); // Assert that the controller function was called
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ warnings: ['mocked'] });
    });

    it('should pass query parameters to getStateWarnings (example)', async () => {
      (getStateWarnings as jest.Mock).mockImplementationOnce((req, res) => {
        res.status(200).send({ query: req.query });
      });

      const response = await request(app).get('/?state=NSW&test=true');

      expect(getStateWarnings).toHaveBeenCalledTimes(1);
      // You can check the arguments passed to the controller if needed
      const [reqMock] = (getStateWarnings as jest.Mock).mock.calls[0];
      expect(reqMock.query).toEqual({ state: 'NSW', test: 'true' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ query: { state: 'NSW', test: 'true' } });
    });
  });

  // --- GET /warning/:id route tests (for getWarningDetailsById) ---
  describe('GET /warning/:id', () => {
    it('should call getWarningDetailsById controller with correct ID', async () => {
      const testId = 'TEST12345';
      // Set up a mock implementation for getWarningDetailsById
      (getWarningDetailsById as jest.Mock).mockImplementationOnce((req, res) => {
        res.status(200).send({ id: req.params.id, details: 'found' });
      });

      const response = await request(app).get(`/warning/${testId}`);

      expect(getWarningDetailsById).toHaveBeenCalledTimes(1); // Assert that the controller function was called
      // You can check the arguments passed to the controller if needed
      const [reqMock] = (getWarningDetailsById as jest.Mock).mock.calls[0];
      expect(reqMock.params.id).toBe(testId);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: testId, details: 'found' });
    });

    it('should handle controller errors and pass to next (example)', async () => {
        const mockError = new Error('Something went wrong in controller');
        // Mock controller to throw an error, which should be caught by Express's error handling
        // For actual error handling tests, you'd typically have an error middleware
        // For simplicity, we'll ensure 'next' is called if the controller throws
        (getWarningDetailsById as jest.Mock).mockImplementationOnce((req, res, next) => {
          next(mockError); // Simulate the controller passing error to next
        });
        
        // We're expecting Express's default error handling to return 500 if next is called with an error
        // In a real app, you'd have dedicated error middleware.
        // For this test, we just check if next was called with the error.
        const response = await request(app).get('/warning/SOME_ID');

        expect(getWarningDetailsById).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(500); // Default error handling for unhandled errors
        expect(response.text).toContain('Something went wrong'); // Or whatever default error message Express provides
        // You might also assert mockNext was called if you import and mock it
    });
  });
});