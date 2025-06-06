/**
 * Interface for the structured flood warning information returned by the parser.
 */
export interface FloodWarningInfoInterface {
  productType: string;
  service: string;
  issueTimeUtc: string;
  expiryTime: string;
}