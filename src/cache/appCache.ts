// src/cache/appCache.ts
import NodeCache from 'node-cache';
// Assuming you have a config.ts in your backend project
// that exports a default object with a 'cache' property.
import config from '../config/config'; 
import { getLogger } from '../utils/logger'; // Assuming you have a logger utility

const cacheLogger = getLogger('AppCache'); // Initialize logger for the cache service

// Define default TTLs (Time To Live) in seconds,
// which can be overridden by environment variables or configuration.
const DEFAULT_TTL_SECONDS = 86400;
const DEFAULT_CHECK_PERIOD_SECONDS = 18000; 
// Initialize NodeCache.
// stdTTL: default time to live for all keys in seconds.
// checkperiod: interval to check for expired keys.
// useClones: false means stored objects are not cloned when retrieved.
//            This is often more performant but means modifying a retrieved object
//            directly modifies the cached object. Set to 'true' if you need deep copies.
const appCache = new NodeCache({
    stdTTL: config.cache?.ttlSeconds || DEFAULT_TTL_SECONDS,
    checkperiod: config.cache?.checkPeriodSeconds || DEFAULT_CHECK_PERIOD_SECONDS,
    useClones: false // Set to true if you need to ensure retrieved objects are immutable
});

// Log cache initialization details
appCache.on('ready', () => {
    cacheLogger.info('NodeCache is ready and initialized.');
    cacheLogger.info(`Cache default TTL: ${appCache.options.stdTTL} seconds, check period: ${appCache.options.checkperiod} seconds.`);
});

appCache.on('del', (key) => {
    cacheLogger.debug(`Cache key '${key}' deleted.`);
});

appCache.on('expired', (key) => {
    cacheLogger.debug(`Cache key '${key}' expired.`);
});

export default appCache;