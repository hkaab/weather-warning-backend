import { Client, FileInfo } from "basic-ftp";
import * as fs from "fs/promises"; // Use fs/promises for async file operations
import path from "path"; // For consistent path manipulation
import { FtpConfigInterface } from "../types/ftpConfigInterface";
import config from "../config/config";
import { getLogger } from "../utils/logger";
import { readFileAndDelete } from "../utils/fileOperations";
import { retry } from "../utils/retry";


export class BomService {
  /**
   * BomService is responsible for interacting with the BOM FTP server to download XML and text files.
   * It provides methods to download specific files based on a key, which corresponds to the file's base name.
   */
  private ftpConfig: FtpConfigInterface;
  private localDownloadDir: string;
  private bomServiceLogger = getLogger('BomService');
  private readonly MAX_RETRIES: number = config.bomFtp.maxRetries;
  private readonly RETRY_DELAY_MS: number = config.bomFtp.retryDelay;
  
  /**
   * Creates an instance of BomService.
   * @param host The FTP server host (default is from config).
   * @param secure Whether to use a secure connection (default is false).
   * @param directory The directory on the FTP server to navigate to (default is from config).
   * @param localDownloadDir The local directory where files will be downloaded (default is from config).
   */
  constructor(
    host: string = config.bomFtp.Host,
    secure: boolean = config.bomFtp.secure,
    directory: string = config.bomFtp.Dir,

    localDownloadDir: string = config.bomFtp.tempDownloadsDir // A dedicated directory for downloads
  ) {
      this.ftpConfig = { host, secure, directory };
      this.localDownloadDir = localDownloadDir;
      // Ensure the local download directory exists
      fs.mkdir(this.localDownloadDir, { recursive: true }).catch(console.error);
    }

  /**
   * Connects to the FTP server and changes to the specified directory.
   * @returns A connected FTP client instance.
   * @throws If the connection or directory change fails.
   */
  private async connectAndNavigate(): Promise<Client> {
    // Validate FTP configuration
    if (!this.ftpConfig.host) {
      throw new Error("FTP host is not configured.");
    }
    if (!this.ftpConfig.directory) {  
      throw new Error("FTP directory is not configured.");
    } 
    // Create a new FTP client instance
    const client = new Client();

    // Set verbose to true for debugging, can be configured or removed in production
    if (config.nodeEnv === "development") {
      this.bomServiceLogger.info(`Connecting to FTP server at ${this.ftpConfig.host}...`);
      this.bomServiceLogger.info(`Navigating to directory: ${this.ftpConfig.directory}`);
      client.ftp.verbose = true;
    } else {
      client.ftp.verbose = false; // Disable verbose logging in production
    }

      try {
            await retry(
                async () => {
                    // Close client before re-accessing if it was already connected from a failed attempt
                    if (!client.ftp.closed) {
                        client.close();
                        await new Promise(resolve => setTimeout(resolve, 100)); // Small pause
                    }
                    await client.access({
                        host: this.ftpConfig.host,
                        secure: this.ftpConfig.secure,
                    });
                    await client.cd(this.ftpConfig.directory);
                    return client; // Return the client on success
                },
                this.MAX_RETRIES,
                this.RETRY_DELAY_MS,
                `FTP Connect/Navigate to ${this.ftpConfig.host}${this.ftpConfig.directory}`
            );
            return client; // Return client if retry was successful
        } catch (err) {
            this.bomServiceLogger.error("FTP connection or navigation failed after retries:", err);
            client.close(); // Ensure client is closed on final failure
            throw new Error(`Failed to connect to FTP or navigate to directory: ${err}`);
        }
  }

  /**
   * Downloads a specific XML file from the FTP server based on a key.
   * @param key The base name of the file (e.g., "IDV60000").
   * @returns The content of the downloaded XML file, or an empty string if not found or an error occurs.
   */
  async downloadXml(key: string): Promise<string> {
    let client: Client | null = null;
    try {
      client = await this.connectAndNavigate();
      const remoteFileName = `${key}.amoc.xml`;
      const localFilePath = path.join(this.localDownloadDir, `${key}.xml`);

      const files = await client.list();
      const targetFile = files.find(
        (file: FileInfo) => file.name === remoteFileName
      );

      if (targetFile) {
        // Download the file to the local directory
        await client.downloadTo(localFilePath, targetFile.name);
        return await readFileAndDelete(localFilePath);
      } else {
        this.bomServiceLogger.warn(`XML file '${remoteFileName}' not found on FTP server.`);
        return "";
      }
    } catch (err) {
      this.bomServiceLogger.error(`Error downloading XML file for key '${key}':`, err);
      return "";
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  /**
   * Downloads a specific text file from the FTP server based on a key.
   * @param key The base name of the file (e.g., "IDV60000_warnings").
   * @returns The content of the downloaded text file, or an empty string if not found or an error occurs.
   */
  async downloadText(key: string): Promise<string> {
    let client: Client | null = null;
    try {
      client = await this.connectAndNavigate();
      const remoteFileName = `${key}.txt`;
      const localFilePath = path.join(this.localDownloadDir, remoteFileName);

      // basic-ftp's download method will create the file if it doesn't exist
      await client.downloadTo(localFilePath, remoteFileName);

      return await readFileAndDelete(localFilePath);

    } catch (err: any) { // Use 'any' for err if type is not strictly known, or check instanceof
      if (err.code === 550) { // FTP error code for "File not found"
        this.bomServiceLogger.warn(`Text file '${key}.txt' not found on FTP server.`);
      } else {
        this.bomServiceLogger.error(`Error downloading text file for key '${key}':`, err);
      }
      return "";
    } finally {
      if (client) {
        client.close();
      }
    }
  }
  /**
   * Downloads a file from the FTP server based on a key.
   * @param key The base name of the file (e.g., "IDV60000").
   * @returns The content of the downloaded file, or an empty string if not found or an error occurs.
   */
  async  getWarnings(stateAmocId: string): Promise<string[]> {
  let client: Client | null = null; // Initialize client to null for robust finally block

  try {
    client = await this.connectAndNavigate();
    // Set verbose to true for debugging, can be configured or removed in production
    if (!client) {
      throw new Error("Failed to connect to FTP server.");
    }

    client.ftp.verbose = true;

    const files: FileInfo[] = await client.list();

    const warns: string[] = []; // Initialize an empty object to store warnings
  
    // Filter files that end with ".amoc.xml" and add them to the warns object
    files
      .filter((file: FileInfo) => file.name.startsWith(stateAmocId) && file.name.endsWith(".amoc.xml"))
      .forEach((file: FileInfo) => {
        warns.push(file.name.replace(/\.amoc\.xml/, ""));
      });

    return warns;
  } catch (err) {
    this.bomServiceLogger.error("Failed to retrieve warnings from FTP:", err);
    // Return an empty object on error instead of throwing, as per original intent
    // (though throwing and letting the caller handle is often preferred for errors)
    return [];
  } finally {
    // Ensure the client is always closed, even if an error occurs
    if (client) {
      client.close();
    }
  }}
}