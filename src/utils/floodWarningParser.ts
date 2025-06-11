import { parseXmlAsync } from './xmlParser';
import { AmocProductTypeChar, AmocServiceTypeChar, PRODUCT_TYPE_MAP, SERVICE_TYPE_MAP } from '../types/amocTypes';
import { AmocXmlInterface } from '../types/amocXmlInterface';
import { FloodWarningInfoInterface } from '../types/floodWarningInfoInterface';



/**
 * Parses flood warning XML data from the BOM (Bureau of Meteorology).
 * This class is responsible for extracting structured information and associated
 * warning text from the AMOC XML format.
 */
export class FloodWarningParser {
  // Store the parsed XML object once to avoid repeated parsing
  private parsedXml: AmocXmlInterface | null = null;
  private xmlString: string; // Keep the original string if needed for re-parsing or debugging
  /**
   * Initializes the parser with the XML string.
   * @param xmlString The raw XML string content of the flood warning.
   */
  constructor(xmlString: string) {
    this.xmlString = xmlString;
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
  private getXmlValue(obj: unknown, path: string[], defaultValue: string = ''): string {
    let current: unknown = obj;
    for (const key of path) {
      if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, key)) {
        return defaultValue;
      }
      current = (current as Record<string, unknown>)[key];
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

}