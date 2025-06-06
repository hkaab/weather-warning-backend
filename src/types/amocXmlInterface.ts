/**
 * Interface representing the structure of the parsed AMOC XML.
 * This helps provide type safety when accessing properties.
 */
export interface AmocXmlInterface {
  amoc: {
    'product-type'?: string[];
    service?: string[];
    'issue-time-utc'?: string[];
    'expiry-time'?: string[];
    identifier?: string[];
    // Add other fields you might use from the XML
    // e.g., location?: any[];
  };
}
