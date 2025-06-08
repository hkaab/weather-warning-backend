// File: src/interfaces/envConfigInterface.ts
export interface EnvConfigInterface {
  port: number;
  nodeEnv: string;
  bomFtp: {
    Host:string;
    secure: boolean;
    Dir: string;
    maxRetries: number;
    retryDelay: number; 
    tempDownloadsDir: string;
  },
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