// src/utils/fileOperations.ts
import { promises as fs } from 'fs';
import { getLogger } from "../utils/logger";
const logger = getLogger('FileOperations');
/**
 * Reads the content of a file and then deletes the file.
 * Handles common file system errors.
 * @param filePath The path to the file.
 * @param encoding The encoding to use for reading the file (default: 'utf8').
 * @returns A promise that resolves with the file's content as a string.
 * @throws An error if the file cannot be read or deleted.
 */
export async function readFileAndDelete(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    let fileContent: string;

    try {
        logger.info(`Attempting to read file: ${filePath}`);
        const data = await fs.readFile(filePath, { encoding });
        fileContent = data;
        logger.info(`Successfully read file: ${filePath}`);

        logger.info(`Attempting to delete file: ${filePath}`);
        await fs.unlink(filePath);
        logger.info(`Successfully deleted file: ${filePath}`);

        return fileContent;

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            logger.error(`Error: File not found at ${filePath}.`);
            throw new Error(`File not found: ${filePath}`);
        } else if (error.code === 'EACCES') {
            logger.error(`Error: Permission denied to access ${filePath}.`);
            throw new Error(`Permission denied: ${filePath}`);
        } else {
            logger.error(`An unexpected error occurred while processing ${filePath}:`, error.message);
            throw error;
        }
    }
}