import { UsageDetails } from '../UsageDetails';
import { AIContent } from './AIContent';

/**
 * Represents usage information associated with a chat response.
 */
export class UsageContent extends AIContent {
  private _details: UsageDetails;

  constructor(details?: UsageDetails) {
    super();
    if (details) {
      this._details = details;
    } else {
      this._details = new UsageDetails();
    }
  }

  get details() {
    return this._details;
  }

  set details(value: UsageDetails) {
    this._details = value;
  }
}
