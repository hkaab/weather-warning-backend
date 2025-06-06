// Using `xml2js` is common for XML parsing in Node.js.
// It's recommended to import it with its specific types if available, or as a default import for better TS integration.
import { parseString, ParserOptions } from 'xml2js';
import { getLogger } from "../utils/logger";
const xmlParserLogger = getLogger('XmlParser');
/**
 * Parses an XML string into a JavaScript object.
 *
 * This function is refactored to return a Promise, aligning with modern async/await patterns,
 * which is generally preferred over callback-based APIs when consuming them in async functions.
 *
 * @param xml The XML string to parse.
 * @returns A Promise that resolves with the parsed XML object, or rejects if parsing fails.
 */
export function parseXmlAsync<T = any>(xml: string, options?: ParserOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    parseString(xml, options || {}, (err: any, result: T) => {
      if (err) {
        // Provide more context if possible, e.g., log the XML if it's small/safe.
        xmlParserLogger.error('XML parsing failed:', err);
        return reject(new Error(`Failed to parse XML: ${err.message}`));
      }
      resolve(result);
    });
  });
}