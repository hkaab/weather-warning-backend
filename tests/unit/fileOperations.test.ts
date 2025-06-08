// tests/unit/fileOperations.test.ts

// MOCK THE MAIN 'fs' MODULE
jest.mock('fs', () => {
    // This is the object that 'fs' module will resolve to in your tests
    // It must contain a 'promises' property, which then contains your mocked functions
    return {
        // This is necessary because your source code imports 'promises' from 'fs'
        promises: {
            readFile: jest.fn(),
            unlink: jest.fn(),
        },
    };
});

// Mock the logger utility
jest.mock('../../src/utils/logger', () => ({
    getLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    })),
}));

// Import the function to be tested
import { readFileAndDelete } from '../../src/utils/fileOperations';

// IMPORTANT: Now, when you import from 'fs', you're getting the mocked version.
// You still need to access the 'promises' property on it.
import * as fs from 'fs'; // Use * as to ensure we get the entire mocked module structure
// --- Directly cast the functions from the imported 'fs.promises' object ---
// This is the cleanest way to get the mock functions with correct typing.
const mockReadFile = (fs.promises.readFile as jest.Mock);
const mockUnlink = (fs.promises.unlink as jest.Mock);

// Import the logger utility to verify logging behavior
import { getLogger } from '../../src/utils/logger';
// Get the mocked logger instance
const mockLogger = (getLogger as jest.Mock).mock.results[0].value;


describe('readFileAndDelete', () => {
    const mockFilePath = '/tmp/test-file.txt';
    const mockFileContent = 'This is test file content.';
    const mockEncoding = 'utf8';

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should read the file content and then delete the file successfully', async () => {
        // Arrange
        mockReadFile.mockResolvedValue(mockFileContent);
        mockUnlink.mockResolvedValue(undefined);

        // Act
        const result = await readFileAndDelete(mockFilePath, mockEncoding);

        // Assert
        expect(result).toBe(mockFileContent);
        expect(mockReadFile).toHaveBeenCalledTimes(1);
        expect(mockReadFile).toHaveBeenCalledWith(mockFilePath, { encoding: mockEncoding });
        expect(mockUnlink).toHaveBeenCalledTimes(1);
        expect(mockUnlink).toHaveBeenCalledWith(mockFilePath);

        expect(mockLogger.info).toHaveBeenCalledWith(`Attempting to read file: ${mockFilePath}`);
        expect(mockLogger.info).toHaveBeenCalledWith(`Successfully read file: ${mockFilePath}`);
        expect(mockLogger.info).toHaveBeenCalledWith(`Attempting to delete file: ${mockFilePath}`);
        expect(mockLogger.info).toHaveBeenCalledWith(`Successfully deleted file: ${mockFilePath}`);
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw "File not found" error if readFile fails with ENOENT', async () => {
        const error = new Error('No such file or directory') as any;
        error.code = 'ENOENT';
        mockReadFile.mockRejectedValue(error);
        mockUnlink.mockResolvedValue(undefined);

        await expect(readFileAndDelete(mockFilePath)).rejects.toThrow('File not found: ' + mockFilePath);
        expect(mockReadFile).toHaveBeenCalledTimes(1);
        expect(mockUnlink).not.toHaveBeenCalled();

        expect(mockLogger.info).toHaveBeenCalledWith(`Attempting to read file: ${mockFilePath}`);
        expect(mockLogger.error).toHaveBeenCalledWith(`Error: File not found at ${mockFilePath}.`);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should throw "Permission denied" error if readFile fails with EACCES', async () => {
        const error = new Error('Permission denied') as any;
        error.code = 'EACCES';
        mockReadFile.mockRejectedValue(error);
        mockUnlink.mockResolvedValue(undefined);

        await expect(readFileAndDelete(mockFilePath)).rejects.toThrow('Permission denied: ' + mockFilePath);
        expect(mockReadFile).toHaveBeenCalledTimes(1);
        expect(mockUnlink).not.toHaveBeenCalled();

        expect(mockLogger.info).toHaveBeenCalledWith(`Attempting to read file: ${mockFilePath}`);
        expect(mockLogger.error).toHaveBeenCalledWith(`Error: Permission denied to access ${mockFilePath}.`);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should throw "Permission denied" error if unlink fails with EACCES', async () => {
        mockReadFile.mockResolvedValue(mockFileContent);
        const error = new Error('Permission denied to delete') as any;
        error.code = 'EACCES';
        mockUnlink.mockRejectedValue(error);

        await expect(readFileAndDelete(mockFilePath)).rejects.toThrow('Permission denied: ' + mockFilePath);
        expect(mockReadFile).toHaveBeenCalledTimes(1);
        expect(mockUnlink).toHaveBeenCalledTimes(1);
        expect(mockUnlink).toHaveBeenCalledWith(mockFilePath);

        expect(mockLogger.info).toHaveBeenCalledWith(`Attempting to read file: ${mockFilePath}`);
        expect(mockLogger.info).toHaveBeenCalledWith(`Successfully read file: ${mockFilePath}`);
        expect(mockLogger.info).toHaveBeenCalledWith(`Attempting to delete file: ${mockFilePath}`);
        expect(mockLogger.error).toHaveBeenCalledWith(`Error: Permission denied to access ${mockFilePath}.`);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should re-throw any other unexpected error from readFile', async () => {
        const unexpectedError = new Error('Disk full') as any;
        unexpectedError.code = 'ENOSPC';
        mockReadFile.mockRejectedValue(unexpectedError);
        mockUnlink.mockResolvedValue(undefined);

        await expect(readFileAndDelete(mockFilePath)).rejects.toThrow('Disk full');
        expect(mockReadFile).toHaveBeenCalledTimes(1);
        expect(mockUnlink).not.toHaveBeenCalled();

        expect(mockLogger.error).toHaveBeenCalledWith(
            `An unexpected error occurred while processing ${mockFilePath}:`,
            unexpectedError.message
        );
    });

    it('should re-throw any other unexpected error from unlink', async () => {
        mockReadFile.mockResolvedValue(mockFileContent);
        const unexpectedError = new Error('Disk error during unlink') as any;
        unexpectedError.code = 'EIO';
        mockUnlink.mockRejectedValue(unexpectedError);

        await expect(readFileAndDelete(mockFilePath)).rejects.toThrow('Disk error during unlink');
        expect(mockReadFile).toHaveBeenCalledTimes(1);
        expect(mockUnlink).toHaveBeenCalledTimes(1);

        expect(mockLogger.error).toHaveBeenCalledWith(
            `An unexpected error occurred while processing ${mockFilePath}:`,
            unexpectedError.message
        );
    });

    it('should use default encoding "utf8" if not provided', async () => {
        mockReadFile.mockResolvedValue(mockFileContent);
        mockUnlink.mockResolvedValue(undefined);

        await readFileAndDelete(mockFilePath);

        expect(mockReadFile).toHaveBeenCalledWith(mockFilePath, { encoding: 'utf8' });
    });

    it('should use specified encoding if provided', async () => {
        const customEncoding = 'latin1';
        mockReadFile.mockResolvedValue(mockFileContent);
        mockUnlink.mockResolvedValue(undefined);

        await readFileAndDelete(mockFilePath, customEncoding);

        expect(mockReadFile).toHaveBeenCalledWith(mockFilePath, { encoding: customEncoding });
    });
});