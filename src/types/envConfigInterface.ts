// File: src/interfaces/envConfigInterface.ts
export interface EnvConfigInterface {
  port: number;
  nodeEnv: string;
  bomFtpUrl: string;
  bomFtpDir: string;
  tempDownloadsDir: string;
  log: {
    level: string;  
    file: {
      enabled: boolean;
      fileName: string;
      directory: string;
      maxSize: string;
      maxFiles: string;
    };
    };
}