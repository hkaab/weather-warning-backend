import { parseXmlAsync } from './xmlParser';
import { AmocProductTypeChar, AmocServiceTypeChar } from '../types/amocTypes';
import { AmocXmlInterface } from '../types/amocXmlInterface';
import { FloodWarningInfoInterface } from '../types/floodWarningInfoInterface';
import { BomService } from '../services/bomService';
import { getLogger } from "./logger";

/**
 * Maps single-character product codes to their full descriptions.
 * Using a `Readonly<Record<...>>` ensures this map cannot be modified after creation.
 */
const PRODUCT_TYPE_MAP: Readonly<Record<AmocProductTypeChar, string>> = {
  'A': 'Advice',
  'B': 'Bundle',
  'C': 'Climate',
  'D': 'Metadata',
  'E': 'Analysis',
  'F': 'Forecast',
  'M': 'Numerical Weather Prediction',
  'O': 'Observation',
  'Q': 'Reference',
  'R': 'Radar',
  'S': 'Special',
  'T': 'Satellite',
  'W': 'Warning',
  'X': 'Mixed',
};

/**
 * Maps three-character service codes to their full descriptions.
 */
const SERVICE_TYPE_MAP: Readonly<Record<AmocServiceTypeChar, string>> = {
  'COM': 'Commercial Services',
  'HFW': 'Flood Warning Service',
  'TWS': 'Tsunami Warning Services',
  'WAP': 'Analysis and Prediction',
  'WSA': 'Aviation Weather Services',
  'WSD': 'Defence Weather Services',
  'WSF': 'Fire Weather Services',
  'WSM': 'Marine Weather Services',
  'WSP': 'Public Weather Services',
  'WSS': 'Cost Recovery Services',
  'WSW': 'Disaster Mitigation',
};

/**
 * Parses flood warning XML data from the BOM (Bureau of Meteorology).
 * This class is responsible for extracting structured information and associated
 * warning text from the AMOC XML format.
 */
export class FloodWarningParser {
  // Store the parsed XML object once to avoid repeated parsing
  private parsedXml: AmocXmlInterface | null = null;
  private xmlString: string; // Keep the original string if needed for re-parsing or debugging
  private floodWarningParserLogger = getLogger('FloodWarningParser');
  private bomService: BomService; // Reference to the BOM service for downloading text
  /**
   * Initializes the parser with the XML string.
   * @param xmlString The raw XML string content of the flood warning.
   */
  constructor(bomService:BomService,xmlString: string) {
    this.xmlString = xmlString;
    this.bomService = bomService;
  }

  /**
   * Lazily parses the XML string if it hasn't been parsed yet.
   * This ensures the XML is parsed only once per instance.
   * @throws If the XML string is invalid or parsing fails.
   * @returns The parsed XML object with type `AmocXml`.
   */
  private async getParsedXml(): Promise<AmocXmlInterface> {
    if (!this.parsedXml) {
      if (!this.xmlString) {
        throw new Error('XML string is empty or not provided.');
      }
      this.parsedXml = await parseXmlAsync<AmocXmlInterface>(this.xmlString);
    }
    return this.parsedXml;
  }

  /**
   * Safely extracts a value from a potentially undefined array property of the XML object.
   * This prevents errors if a field is missing or empty in the XML.
   * @param obj The object from which to extract the value.
   * @param path The path to the property (e.g., ['amoc', 'product-type']).
   * @param defaultValue The default value to return if the path is not found or empty.
   * @returns The extracted string value or the default value.
   */
  private getXmlValue(obj: any, path: string[], defaultValue: string = ''): string {
    let current: any = obj;
    for (const key of path) {
      if (current === null || typeof current !== 'object' || !current.hasOwnProperty(key)) {
        return defaultValue;
      }
      current = current[key];
    }
    // Assume it's an array and take the first element, or return default
    if (Array.isArray(current) && current.length > 0) {
      return String(current[0]);
    }
    return defaultValue;
  }

  /**
   * Retrieves and processes the main warning information from the XML.
   * @returns A `FloodWarningInfo` object containing structured warning details.
   * @throws If the XML cannot be parsed or required fields are missing.
   */
  public async getWarningInfo(): Promise<FloodWarningInfoInterface> {
    const obj = await this.getParsedXml();

    // Use the safe `getXmlValue` helper
    const rawProductType = this.getXmlValue(obj, ['amoc', 'product-type']);
    const rawService = this.getXmlValue(obj, ['amoc', 'service']);
    const issueTimeUtc = this.getXmlValue(obj, ['amoc', 'issue-time-utc']);
    const expiryTime = this.getXmlValue(obj, ['amoc', 'expiry-time']);

    // Map raw codes to human-readable descriptions using lookup maps
    const productType = PRODUCT_TYPE_MAP[rawProductType as AmocProductTypeChar] || `Unknown (${rawProductType})`;
    const service = SERVICE_TYPE_MAP[rawService as AmocServiceTypeChar] || `Unknown (${rawService})`;

    return {
      productType,
      service,
      issueTimeUtc, // Use more descriptive name
      expiryTime,
    };
  }

  /**
   * Retrieves the identifier from the XML.
   * @returns The identifier string.
   * @throws If the XML cannot be parsed or the identifier is missing.
   */
  public async getIdentifier(): Promise<string> {
    const obj = await this.getParsedXml();
    return this.getXmlValue(obj, ['amoc', 'identifier']);
  }

  /**
   * Downloads and returns the associated warning text using the Downloader.
   * @returns The warning text as a string.
   * @throws If the identifier cannot be retrieved or downloading fails.
   */
  public async getWarningText(): Promise<string> {
    const identifier = await this.getIdentifier(); // Get identifier via dedicated method
    if (!identifier) {
      this.floodWarningParserLogger.warn('Warning text download skipped: AMOC identifier not found in XML.');
      return ''; // Return empty string if no identifier
    }
    
    this.floodWarningParserLogger.info(`Downloading warning text for identifier: ${identifier}`);
    const warningText = await this.bomService.downloadText(identifier);

    return warningText;
  }
}