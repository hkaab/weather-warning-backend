// Define the known product types
export type AmocProductTypeChar = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'M' | 'O' | 'Q' | 'R' | 'S' | 'T' | 'W' | 'X';
// Define the known service types
export type AmocServiceTypeChar = 'COM' | 'HFW' | 'TWS' | 'WAP' | 'WSA' | 'WSD' | 'WSF' | 'WSM' | 'WSP' | 'WSS' | 'WSW';


/**
 * Defines the AMOC ID prefixes for Australian states/territories.
 */
export type AmocIdPrefix = "IDD" | "IDN" | "IDQ" | "IDS" | "IDT" | "IDV" | "IDW" | "UNK"; // Added UNK for unknown