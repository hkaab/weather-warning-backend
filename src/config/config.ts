import dotenv from 'dotenv';
import { EnvConfigInterface } from '../types/envConfigInterface';

dotenv.config();

const config: EnvConfigInterface = {
  port: Number(process.env.PORT) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  bomFtp: {
    Host: process.env.BOM_FTP_HOST || 'ftp.bom.gov.au',
    secure: process.env.BOM_FTP_SECURE === 'false', // Convert string to boolean
    Dir: process.env.BOM_FTP_DIR || '/anon/gen/fwo/',
    maxRetries: Number(process.env.MAX_RETRIES) || 3, // Default to 3 retries if not set
    retryDelay: Number(process.env.RETRY_DELAY) || 1000, // Default to 1000ms (1 second) if not set
    tempDownloadsDir: process.env.TEMP_DOWNLOADS_DIR || './downloads', // Default to './downloads' if not set
    verbose: process.env.BOM_FTP_VERBOSE === 'false', // Convert string to boolean
  },
  cache: {
    ttlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 86400, 
    checkPeriodSeconds: Number(process.env.CACHE_CHECK_PERIOD_SECONDS) || 18000, 
  },  
  log: {
    level: process.env.LOG_LEVEL || 'info', // Default to 'info' if not set
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true', // Convert string to boolean
      fileName: process.env.LOG_FILE_NAME || 'app-%DATE%.log',
      directory: process.env.LOG_FILE_DIR || './logs',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m', // Default to 20MB
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d', // Default to 14 days
    },
  }};
export default config;