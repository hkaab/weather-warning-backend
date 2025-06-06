/**
 * Defines the allowed Australian State/Territory abbreviations.
 * This is a 'string literal union type', which provides strong type checking.
 */
export type AustralianState = "NT" | "NSW" | "QLD" | "SA" | "TAS" | "VIC" | "WA" | "ACT";

/**
 * Defines the AMOC ID prefixes for Australian states/territories.
 */
export type AmocIdPrefix = "IDD" | "IDN" | "IDQ" | "IDS" | "IDT" | "IDV" | "IDW" | "UNK"; // Added UNK for unknown

/**
 * A mapping from Australian State/Territory abbreviations to their
 * corresponding AMOC ID prefixes. Using a `const` object (dictionary/map)
 * is generally more scalable and readable than a large switch statement
 * for simple lookups.
 */
const stateAmocIdMap: Record<AustralianState, AmocIdPrefix> = {
  "NT": "IDD",
  "NSW": "IDN",
  "QLD": "IDQ",
  "SA": "IDS",
  "TAS": "IDT",
  "VIC": "IDV",
  "WA": "IDW",
  "ACT": "IDN", // ACT uses the same ID as NSW
};

/**
 * Returns the AMOC (Australian Meteorological Operations Centre) ID prefix
 * for a given Australian State or Territory abbreviation.
 *
 * @param state The abbreviation of the Australian State or Territory (e.g., "NSW", "Vic").
 * @returns The corresponding AMOC ID prefix (e.g., "IDN", "IDV").
 * Returns "UNK" if the state is not recognized.
 */
export function getAmocToStateId(state: string): AmocIdPrefix {
  // Use a type guard or cast to assert the 'state' string might be an AustralianState
  // as the map key expects AustralianState.
  // The 'as any' is a temporary escape hatch for complex types,
  // ideally, 'state' would already be strongly typed if coming from a validated source.
  // A safer approach is to check if the key exists before accessing.
  if (Object.prototype.hasOwnProperty.call(stateAmocIdMap, state.toUpperCase())) {
    return stateAmocIdMap[state as AustralianState];
  }

  // If the state is not found in the map, return "UNK" for unknown.
  return "UNK";
}
