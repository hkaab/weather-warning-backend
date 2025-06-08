// tests/unit/bomService.test.ts

// 1. Mock External Modules

// Mock basic-ftp Client
const mockClientAccess = jest.fn();
const mockClientCd = jest.fn();
const mockClientList = jest.fn();
const mockClientDownloadTo = jest.fn();
const mockClientClose = jest.fn();

// We need a way to control client.closed state
let mockClientClosedState = false; // Default to not closed initially (after constructor)

jest.mock('basic-ftp', () => ({
    Client: jest.fn(() => ({
        access: mockClientAccess,
        cd: mockClientCd,
        list: mockClientList,
        downloadTo: mockClientDownloadTo,
        close: mockClientClose,
        ftp: {
            verbose: false, // Default
            get closed() { return mockClientClosedState; }, // Mock getter for 'closed'
            set closed(val: boolean) { mockClientClosedState = val; } // Mock setter for 'closed'
        }
    })),
    // If FileInfo is used as a class/constructor, mock it too, but here it's an interface.
}));

// MOCK THE MAIN 'fs' MODULE
jest.mock('fs', () => {
    // This is the object that 'fs' module will resolve to in your tests
    // It must contain a 'promises' property, which then contains your mocked functions
    return {
        // This is necessary because your source code imports 'promises' from 'fs'
        promises: {
            mkdir: jest.fn(),
            readFile: jest.fn(),
            unlink: jest.fn(),
        }, 
    };
});

import * as fs from 'fs'; // Use * as to ensure we get the entire mocked module structure

// Mock fs/promises
const mockFsMkdir = (fs.promises.mkdir as jest.Mock); // Mock mkdir to resolve successfully

// Mock path module (path.join is pure, but good to mock if necessary, or just use it as is)
jest.mock('path', () => ({
    join: jest.fn((...args: string[]) => args.join('/')), // Simple mock for testing paths
}));

// Mock config module
const mockConfigImplementation  = {
    bomFtp: {
        Host: 'mock_ftp_host',
        secure: false,
        Dir: 'mock_ftp_dir',
        tempDownloadsDir: '/tmp/bom_downloads',
        maxRetries: 3,
        retryDelay: 100, // Ms for testing
    },
    nodeEnv: 'test', // Set to 'test' for consistent behavior
    log: {
        level: 'info', // Default log level for testing
        file: {
            enabled: false, // Disable file logging in tests
        }
    },
};

jest.doMock('../../src/config/config', () => ({
    __esModule: true, // Needed for default exports in Jest
    default: mockConfigImplementation,
}));

// Mock readFileAndDelete utility
const mockReadFileAndDelete = jest.fn();
jest.mock('../../src/utils/fileOperations', () => ({
    readFileAndDelete: mockReadFileAndDelete,
}));

// Mock retry utility
// For unit tests of BomService, we typically want 'retry' to just execute the function immediately
// unless we are specifically testing the retry utility itself.
const mockRetry = jest.fn(async (fn: () => Promise<any>) => await fn());
jest.mock('../../src/utils/retry', () => ({
    retry: mockRetry,
}));

// Define the mock logger instance and getLogger within the mock factory
const mockLoggerInstance = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
};

const mockGetLogger = jest.fn(() => mockLoggerInstance); // The mock implementation for getLogger

jest.mock('../../src/utils/logger', () => ({
    getLogger: mockGetLogger, // Export the mock getLogger function
    mockLoggerInstance: mockLoggerInstance, // Also export the instance directly for tests
}));

const { BomService: BomServiceConstructor } = require('../../src/services/bomService');
import { Client, FileInfo } from 'basic-ftp'; // For type hinting in tests
import { getLogger } from '../../src/utils/logger';
const MockClient = (Client as jest.Mock);

const mockConfig = mockConfigImplementation; // Align name with previous tests for consistency

describe('BomService', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock states that persist across instances/tests
        mockClientClosedState = true; // Default state for client constructor, will be set by `connectAndNavigate`
        mockClientAccess.mockResolvedValue(undefined);
        mockClientCd.mockResolvedValue(undefined);
        mockClientList.mockResolvedValue([]);
        mockClientDownloadTo.mockResolvedValue(undefined);
        mockClientClose.mockImplementation(() => { mockClientClosedState = true; }); // Simulate client.close() setting closed state
        mockFsMkdir.mockResolvedValue(undefined);
        mockReadFileAndDelete.mockResolvedValue('mocked file content');
        mockRetry.mockImplementation(async (fn: () => Promise<any>) => await fn()); // Ensure retry just calls fn
        mockConfig.nodeEnv = 'test'; // Reset to default test environment
    });

    // Test Constructor
    describe('constructor', () => {
        let bomService: InstanceType<typeof BomServiceConstructor>;
        it('should initialize with default config values and create download directory', () => {
            bomService = new BomServiceConstructor();
            expect(bomService['ftpConfig']).toEqual({
                host: mockConfig.bomFtp.Host,
                secure: mockConfig.bomFtp.secure,
                directory: mockConfig.bomFtp.Dir,
            });

            expect(bomService['localDownloadDir']).toBe(mockConfig.bomFtp.tempDownloadsDir);
            expect(mockFsMkdir).toHaveBeenCalledTimes(1);
            expect(mockFsMkdir).toHaveBeenCalledWith(mockConfig.bomFtp.tempDownloadsDir, { recursive: true });
        });

        it('should use provided constructor arguments', () => {
            const customHost = 'custom.ftp.host';
            const customDir = '/custom/dir';
            const customLocalDir = '/custom/local';
            let bomService = new BomServiceConstructor(customHost, true, customDir, customLocalDir);
            expect(bomService['ftpConfig']).toEqual({
                host: customHost,
                secure: true,
                directory: customDir,
            });
            expect(bomService['localDownloadDir']).toBe(customLocalDir);
            expect(mockFsMkdir).toHaveBeenCalledWith(customLocalDir, { recursive: true });
        });
    });

    // Test private connectAndNavigate method
    describe('connectAndNavigate', () => {
        let bomService: InstanceType<typeof BomServiceConstructor>;
        beforeEach(() => {
            const mockClientInstanceForSpy = new MockClient(); // This will now create an instance with correct properties
            bomService = new BomServiceConstructor();
            // Reset the mock logger instance for each test
            mockGetLogger.mockReturnValue(mockLoggerInstance);
            jest.spyOn(bomService as any, 'connectAndNavigate').mockResolvedValue(
            mockClientInstanceForSpy
        );
        });

        it('should disable verbose logging in production environment', async () => {
            mockConfig.nodeEnv = 'production';
            let bomService: InstanceType<typeof BomServiceConstructor>;
            bomService = new BomServiceConstructor();
            const client = await bomService['connectAndNavigate']();
            expect(client.ftp.verbose).toBe(false);
            expect(mockLoggerInstance.info).not.toHaveBeenCalledWith(expect.stringContaining('Connecting to FTP')); // No verbose logs
        });

        it('should throw error if FTP host is not configured', async () => {
            mockConfig.bomFtp.Host = ''; // Temporarily unconfigure host
            const testService = new BomServiceConstructor(
                mockConfig.bomFtp.Host, 
                mockConfig.bomFtp.secure,
                mockConfig.bomFtp.Dir,
                mockConfig.bomFtp.tempDownloadsDir,
                mockConfig.bomFtp.maxRetries,
                mockConfig.bomFtp.retryDelay
            );
            await expect(testService['connectAndNavigate']()).rejects.toThrow("FTP host is not configured.");
            expect(mockLoggerInstance.error).not.toHaveBeenCalled(); // This is a validation error, not an FTP connection error
            expect(mockClientAccess).not.toHaveBeenCalled();
            expect(mockClientClose).not.toHaveBeenCalled(); // Client not created/accessed yet
        });

        it('should throw error if FTP directory is not configured', async () => {
            mockConfig.bomFtp.Dir = ''; // Temporarily unconfigure directory
            let bomService: InstanceType<typeof BomServiceConstructor>;
            bomService = new BomServiceConstructor(
                "host", 
                mockConfig.bomFtp.secure,
                null,
                mockConfig.bomFtp.tempDownloadsDir,
                mockConfig.bomFtp.maxRetries,
                mockConfig.bomFtp.retryDelay
            );
            const mockLoggerInstance = (getLogger as jest.Mock).mock.results[0].value;
            await expect(bomService['connectAndNavigate']()).rejects.toThrow("FTP directory is not configured.");
            expect(mockLoggerInstance.error).not.toHaveBeenCalled();
            expect(mockClientAccess).not.toHaveBeenCalled();
            expect(mockClientClose).not.toHaveBeenCalled();
        });

    });

    // Test downloadXml method
    describe('downloadXml', () => {
        const testKey = 'IDQ10090';
        const remoteFileName = `${testKey}.amoc.xml`;
        const localFilePath = `/tmp/bom_downloads/${testKey}.xml`;
        const mockFileContent = 'xml content';
        let bomService: InstanceType<typeof BomServiceConstructor>;

        beforeEach(() => {
            bomService = new BomServiceConstructor();
            // Ensure connectAndNavigate returns a working client mock
            jest.spyOn(bomService as any, 'connectAndNavigate').mockResolvedValue({
                list: mockClientList,
                downloadTo: mockClientDownloadTo,
                close: mockClientClose,
                ftp: { closed: false }, // Mock client state
            } as unknown as Client); // Cast to Client
            mockReadFileAndDelete.mockResolvedValue(mockFileContent);
        });

        it('should download XML file, read its content, and delete it if found', async () => {
            const mockFileInfo: FileInfo = {
                name: remoteFileName, type: 1, size: 100, modifiedAt: new Date(),
                rawModifiedAt: '',
                isDirectory: false,
                isSymbolicLink: false,
                isFile: false,
                date: ''
            };
            mockClientList.mockResolvedValueOnce([mockFileInfo]); // File is found

            const result = await bomService.downloadXml(testKey);

            expect(bomService['connectAndNavigate']).toHaveBeenCalledTimes(1);
            expect(mockClientList).toHaveBeenCalledTimes(1);
            expect(mockClientDownloadTo).toHaveBeenCalledTimes(1);
            expect(mockReadFileAndDelete).toHaveBeenCalledTimes(1);
            expect(mockReadFileAndDelete).toHaveBeenCalledWith(localFilePath);
            expect(result).toBe(mockFileContent);
            expect(mockClientClose).toHaveBeenCalledTimes(1); // Ensure client is closed in finally
            expect(mockLoggerInstance.warn).not.toHaveBeenCalled(); // No warning for file not found
            expect(mockLoggerInstance.error).not.toHaveBeenCalled(); // No errors logged
        });

        it('should return empty string and warn if XML file not found on FTP', async () => {
            mockClientList.mockResolvedValueOnce([]); // No files found
            const mockLoggerInstance = (getLogger as jest.Mock).mock.results[0].value;

            const result = await bomService.downloadXml(testKey);

            expect(bomService['connectAndNavigate']).toHaveBeenCalledTimes(1);
            expect(mockClientList).toHaveBeenCalledTimes(1);
            expect(mockRetry).not.toHaveBeenCalled(); // No download attempt if file not listed
            expect(mockClientDownloadTo).not.toHaveBeenCalled();
            expect(mockReadFileAndDelete).not.toHaveBeenCalled();
            expect(result).toBe("");
            expect(mockClientClose).toHaveBeenCalledTimes(1);
            expect(mockLoggerInstance.warn).toHaveBeenCalledWith(`XML file '${remoteFileName}' not found on FTP server.`);
        });
    });

    // Test downloadText method
    describe('downloadText', () => {
        const testKey = 'IDQ10090_warnings';
        const remoteFileName = `${testKey}.txt`;
        const localFilePath = `/tmp/bom_downloads/${remoteFileName}`;
        const mockFileContent = 'text content';
        let bomService: InstanceType<typeof BomServiceConstructor>;

        beforeEach(() => {
            bomService = new BomServiceConstructor();
            jest.spyOn(bomService as any, 'connectAndNavigate').mockResolvedValue({
                list: mockClientList, // Not used in downloadText directly
                downloadTo: mockClientDownloadTo,
                close: mockClientClose,
                ftp: { closed: false },
            } as unknown as Client);
            mockReadFileAndDelete.mockResolvedValue(mockFileContent);
        });

        it('should download text file, read its content, and delete it', async () => {
            mockClientDownloadTo.mockResolvedValueOnce(undefined); // Download succeeds
            const mockLoggerInstance = (getLogger as jest.Mock).mock.results[0].value;
            const result = await bomService.downloadText(testKey);

            expect(bomService['connectAndNavigate']).toHaveBeenCalledTimes(1);
            expect(mockClientDownloadTo).toHaveBeenCalledTimes(1);
            expect(mockReadFileAndDelete).toHaveBeenCalledTimes(1);
            expect(mockReadFileAndDelete).toHaveBeenCalledWith(localFilePath);
            expect(result).toBe(mockFileContent);
            expect(mockClientClose).toHaveBeenCalledTimes(1);
            expect(mockLoggerInstance.warn).not.toHaveBeenCalled();
            expect(mockLoggerInstance.error).not.toHaveBeenCalled();
        });

    });

    // Test getWarnings method
    describe('getWarnings', () => {
        const stateAmocId = 'IDV60000';
        let bomService: InstanceType<typeof BomServiceConstructor>;
        beforeEach(() => {
            bomService = new BomServiceConstructor();
            jest.spyOn(bomService, 'connectAndNavigate').mockResolvedValue({
                list: mockClientList,
                close: mockClientClose,
                ftp: { closed: false },
            } as unknown as Client);
        });

        it('should return a list of warning IDs', async () => {
            const mockFiles: FileInfo[] = [
                {
                    name: 'IDV60000.amoc.xml', type: 1, size: 100, modifiedAt: new Date(),
                    rawModifiedAt: '',
                    isDirectory: false,
                    isSymbolicLink: false,
                    isFile: false,
                    date: ''
                },
                {
                    name: 'IDV60000_other.txt', type: 1, size: 50, modifiedAt: new Date(),
                    rawModifiedAt: '',
                    isDirectory: false,
                    isSymbolicLink: false,
                    isFile: false,
                    date: ''
                },
                {
                    name: 'IDV60001.amoc.xml', type: 1, size: 120, modifiedAt: new Date(),
                    rawModifiedAt: '',
                    isDirectory: false,
                    isSymbolicLink: false,
                    isFile: false,
                    date: ''
                },
                {
                    name: 'IDV60000warnings.amoc.xml', type: 1, size: 120, modifiedAt: new Date(),
                    rawModifiedAt: '',
                    isDirectory: false,
                    isSymbolicLink: false,
                    isFile: false,
                    date: ''
                }, // Test filtering
            ];
            mockClientList.mockResolvedValueOnce(mockFiles);
            const mockLoggerInstance = (getLogger as jest.Mock).mock.results[0].value;

            const warnings = await bomService.getWarnings(stateAmocId);

            expect(bomService['connectAndNavigate']).toHaveBeenCalledTimes(1);
            expect(mockClientList).toHaveBeenCalledTimes(1);
            expect(warnings).toEqual(['IDV60000', 'IDV60000warnings']); // Ensure only matching ones are picked
            expect(mockClientClose).toHaveBeenCalledTimes(1);
            expect(mockLoggerInstance.error).not.toHaveBeenCalled();
        });

        it('should return an empty array if no warnings are found', async () => {
            mockClientList.mockResolvedValueOnce([]); // No files
            const mockLoggerInstance = (getLogger as jest.Mock).mock.results[0].value;

            const warnings = await bomService.getWarnings(stateAmocId);

            expect(warnings).toEqual([]);
            expect(mockClientList).toHaveBeenCalledTimes(1);
            expect(mockLoggerInstance.error).not.toHaveBeenCalled();
            expect(mockClientClose).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array and log error if listing files fails', async () => {
            const listError = new Error('FTP list failed');
            mockRetry.mockRejectedValueOnce(listError); // Simulate list failure via retry
            const warnings = await bomService.getWarnings(stateAmocId);

            expect(warnings).toEqual([]);
            expect(mockClientList).toHaveBeenCalledTimes(1); // Mock was set to reject when called
            expect(mockClientClose).toHaveBeenCalledTimes(1);
        });
    });
});