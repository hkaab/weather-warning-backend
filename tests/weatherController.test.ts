import { Request, Response, NextFunction } from 'express';
import { getWarnings, getWarningById } from '../src/controllers/weatherController'; 
import { BomService } from '../src/services/bomService'; 
import { getAmocToStateId } from '../src/utils/stateMapping'; 
import { FloodWarningParser } from '../src/parsers/floodWarningParser'; 

// --- Mock External Dependencies ---

// Mock BomService
jest.mock('../src/services/bomService');
// Create a mock instance of BomService that will be returned by the constructor
const mockBomServiceInstance = {
  getWarnings: jest.fn(),
  downloadXml: jest.fn(),
  downloadText: jest.fn(),
};
// Cast the mocked class to its type to ensure correct mocking
const mockBomService = BomService as jest.MockedClass<typeof BomService>;
// Make the BomService constructor return our predefined mock instance
mockBomService.mockImplementation(() => mockBomServiceInstance as any);


// Mock getAmocToStateId utility function
jest.mock('../src/utils/stateMapping');
const mockGetAmocToStateId = getAmocToStateId as jest.MockedFunction<typeof getAmocToStateId>;

// Mock FloodWarningParser
jest.mock('../src/parsers/floodWarningParser');
// Create a mock instance of FloodWarningParser that will be returned by its constructor
const mockFloodWarningParserInstance = {
  getWarningInfo: jest.fn(),
  getIdentifier: jest.fn(),
  getWarningText: jest.fn(),
};
// Cast the mocked class to its type to ensure correct mocking
const mockFloodWarningParser = FloodWarningParser as jest.MockedClass<typeof FloodWarningParser>;
// Make the FloodWarningParser constructor return our predefined mock instance
mockFloodWarningParser.mockImplementation(() => mockFloodWarningParserInstance as any);

// --- Mock Express Request, Response, NextFunction ---
let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
let mockNext: NextFunction;

describe('Weather Controller', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset singleton logger for testing purposes (important for unit tests)
    // This requires a specific method in the logger to reset the singleton state for Jest.
    // If your LoggerManager has a static reset method, call it here.
    // For this example, we're relying on jest.mock and jest.clearAllMocks.

    // Initialize mock Request, Response, NextFunction
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(), // .status() should return `this` for chaining
      send: jest.fn(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    // Reset BomService mock implementation (ensure methods are clean mocks)
    mockBomServiceInstance.getWarnings.mockClear();
    mockBomServiceInstance.downloadXml.mockClear();
    mockBomServiceInstance.downloadText.mockClear();
    // Default mock implementations for BomService methods
    mockBomServiceInstance.getWarnings.mockResolvedValue([]);
    mockBomServiceInstance.downloadXml.mockResolvedValue('');
    mockBomServiceInstance.downloadText.mockResolvedValue('');


    // Reset stateMapping mock
    mockGetAmocToStateId.mockClear();
    mockGetAmocToStateId.mockReturnValue('IDV'); // Default to a valid ID for most tests

    // Reset FloodWarningParser mock implementation (ensure methods are clean mocks)
    mockFloodWarningParserInstance.getWarningInfo.mockClear();
    mockFloodWarningParserInstance.getIdentifier.mockClear();
    mockFloodWarningParserInstance.getWarningText.mockClear();
    // Default mock implementations for FloodWarningParser methods
    mockFloodWarningParserInstance.getWarningInfo.mockResolvedValue({});
    mockFloodWarningParserInstance.getIdentifier.mockResolvedValue('');
    mockFloodWarningParserInstance.getWarningText.mockResolvedValue('');
  });

  // --- Test Suite for getWarnings ---
  describe('getWarnings', () => {
    it('should return warnings for a valid state', async () => {
      // Arrange
      mockRequest.query = { state: 'Vic' };
      const mockWarnings = [{ title: 'Flood Warning Vic', type: 'Warning' }];
      mockBomServiceInstance.getWarnings.mockResolvedValue(mockWarnings); // Use the instance mock

      // Act
      await getWarnings(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockGetAmocToStateId).toHaveBeenCalledWith('Vic');
      expect(mockBomService).toHaveBeenCalledTimes(1); // BomService instantiated once
      expect(mockBomServiceInstance.getWarnings).toHaveBeenCalledWith('IDV'); // Use the instance mock
      expect(mockResponse.send).toHaveBeenCalledWith(mockWarnings);
      expect(mockResponse.status).not.toHaveBeenCalled(); // Default to 200 OK
      expect(mockNext).not.toHaveBeenCalled(); // No error passed to next
    });

    it('should return 400 if state query parameter is missing', async () => {
      // Arrange
      mockRequest.query = {}; // No state query param

      // Act
      await getWarnings(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'State query parameter is required' });
      expect(mockBomService).not.toHaveBeenCalled(); // Service should not be called
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if state provided is invalid', async () => {
      // Arrange
      mockRequest.query = { state: 'XYZ' };
      mockGetAmocToStateId.mockReturnValue('UNK'); // Simulate invalid state

      // Act
      await getWarnings(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockGetAmocToStateId).toHaveBeenCalledWith('XYZ');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'No warnings found for the specified state' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if no warnings are found for the specified state', async () => {
      // Arrange
      mockRequest.query = { state: 'NSW' };
      mockBomServiceInstance.getWarnings.mockResolvedValue([]); // No warnings
      mockGetAmocToStateId.mockReturnValue('IDN'); 
      // Act
      await getWarnings(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockGetAmocToStateId).toHaveBeenCalledWith('NSW');
      expect(mockBomServiceInstance.getWarnings).toHaveBeenCalledWith('IDN');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'No warnings found for the specified state' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next(error) if BomService.getWarnings throws an error', async () => {
      // Arrange
      mockRequest.query = { state: 'WA' };
      const serviceError = new Error('FTP connection failed');
      mockBomServiceInstance.getWarnings.mockRejectedValue(serviceError); // Use the instance mock

      // Act
      await getWarnings(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockBomServiceInstance.getWarnings).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError); // Error passed to next middleware
      expect(mockResponse.status).not.toHaveBeenCalled(); // Response not sent by controller
      expect(mockResponse.send).not.toHaveBeenCalled();
    });
  });

  // --- Test Suite for getWarningById ---
  describe('getWarningById', () => {
    const mockWarningId = 'IDV60000';
    const mockXmlContent = '<amoc><identifier>IDV60000</identifier><issue-time-utc>...</issue-time-utc></amoc>';
    const mockWarningText = 'This is the actual warning text content.';
    const mockWarningInfo = { productType: 'Warning', service: 'Public Weather Services', issueTimeUtc: '2023-01-01T12:00:00Z', expiryTime: '2023-01-02T12:00:00Z' };

    it('should return warning details including text for a valid ID', async () => {
      // Arrange
      mockRequest.params = { id: mockWarningId };
      mockBomServiceInstance.downloadXml.mockResolvedValue(mockXmlContent); // Use the instance mock
      mockBomServiceInstance.downloadText.mockResolvedValue(mockWarningText); // Use the instance mock
      mockFloodWarningParserInstance.getWarningInfo.mockResolvedValue(mockWarningInfo); // Use the instance mock


      // Act
      await getWarningById(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockBomService).toHaveBeenCalledTimes(1); // BomService instantiated once
      expect(mockBomServiceInstance.downloadXml).toHaveBeenCalledWith(mockWarningId); // Use the instance mock
      expect(mockBomServiceInstance.downloadText).toHaveBeenCalledWith(mockWarningId); // Use the instance mock

      expect(mockFloodWarningParser).toHaveBeenCalledTimes(1); // Parser instantiated once
      // Ensure the FloodWarningParser constructor receives the correct BomService instance and XML
      expect(mockFloodWarningParser).toHaveBeenCalledWith(mockBomServiceInstance, mockXmlContent);
      expect(mockFloodWarningParserInstance.getWarningInfo).toHaveBeenCalledTimes(1); // Use the instance mock
      expect(mockResponse.send).toHaveBeenCalledWith({ ...mockWarningInfo, text: mockWarningText });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if warning ID is missing', async () => {
      // Arrange
      mockRequest.params = {}; // No ID param

      // Act
      await getWarningById(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Warning ID is required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if warning ID format is invalid', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid/id!' }; // ID with invalid characters

      // Act
      await getWarningById(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Invalid warning ID format' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
