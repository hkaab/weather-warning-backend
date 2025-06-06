import dotenv from 'dotenv';
import { EnvConfigInterface } from '../types/envConfigInterface';

dotenv.config();


const config: EnvConfigInterface = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  bomFtpUrl: process.env.BOM_FTP_URL || 'ftp.bom.gov.au',
  bomFtpDir: process.env.BOM_FTP_DIR || '/anon/gen/fwo/',
  tempDownloadsDir: process.env.TEMP_DOWNLOADS_DIR || './downloads',
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