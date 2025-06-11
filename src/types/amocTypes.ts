// Define the known product types
export type AmocProductTypeChar = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'M' | 'O' | 'Q' | 'R' | 'S' | 'T' | 'W' | 'X';
// Define the known service types
export type AmocServiceTypeChar = 'COM' | 'HFW' | 'TWS' | 'WAP' | 'WSA' | 'WSD' | 'WSF' | 'WSM' | 'WSP' | 'WSS' | 'WSW';


/**
 * Defines the AMOC ID prefixes for Australian states/territories.
 */
export type AmocIdPrefix = "IDD" | "IDN" | "IDQ" | "IDS" | "IDT" | "IDV" | "IDW" | "UNK"; // Added UNK for unknown

/**
 * Maps single-character product codes to their full descriptions.
 * Using a `Readonly<Record<...>>` ensures this map cannot be modified after creation.
 */
export const PRODUCT_TYPE_MAP: Readonly<Record<AmocProductTypeChar, string>> = {
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
export const SERVICE_TYPE_MAP: Readonly<Record<AmocServiceTypeChar, string>> = {
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