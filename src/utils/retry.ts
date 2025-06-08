// src/utils/retry.ts

import { getLogger } from "./logger"; // Assuming you have this logger utility

const retryLogger = getLogger('RetryUtility');

/**
 * Retries an asynchronous function a specified number of times with an exponential backoff delay.
 *
 * @param fn The asynchronous function to retry.
 * @param maxRetries The maximum number of retry attempts.
 * @param delayMs The initial delay in milliseconds before the first retry. This delay will double on each subsequent retry (exponential backoff).
 * @param identifier An optional string to identify the operation being retried for logging purposes.
 * @returns The result of the successful function call.
 * @throws The error from the last failed attempt if all retries are exhausted.
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delayMs: number,
    identifier: string = 'Operation'
): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const currentDelay = delayMs * Math.pow(2, i);
            retryLogger.warn(`${identifier} failed (attempt ${i + 1}/${maxRetries}). Retrying in ${currentDelay / 1000}s... Error: ${error instanceof Error ? error.message : String(error)}`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
        }
    }
    retryLogger.error(`${identifier} failed after ${maxRetries} attempts.`);
    throw lastError; // Re-throw the last error after all retries are exhausted
}