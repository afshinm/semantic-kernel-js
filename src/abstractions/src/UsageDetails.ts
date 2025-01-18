import { AdditionalProperties } from './AdditionalProperties';

/**
 * Provides usage details about a request/response.
 */
export class UsageDetails {
  /**
   * Gets or sets the number of tokens in the input.
   */
  inputTokenCount?: number;

  /**
   * Gets or sets the number of tokens in the output.
   */
  outputTokenCount?: number;

  /**
   * Gets or sets the total number of tokens used to produce the response.
   */
  totalTokenCount?: number;

  /**
   * Gets or sets a dictionary of additional usage counts.
   *
   * All values set here are assumed to be summable. For example, when middleware makes multiple calls to an underlying
   * service, it may sum the counts from multiple results to produce an overall UsageDetail
   */
  additionalCounts?: AdditionalProperties<number>;

  /**
   * Adds usage data from another <see cref="UsageDetails"/> into this instance
   */
  add(usage: UsageDetails) {
    if (usage.inputTokenCount !== undefined) {
      if (this.inputTokenCount !== undefined) {
        this.inputTokenCount += usage.inputTokenCount;
      } else {
        this.inputTokenCount = usage.inputTokenCount;
      }
    }

    if (usage.outputTokenCount !== undefined) {
      if (this.outputTokenCount !== undefined) {
        this.outputTokenCount += usage.outputTokenCount;
      } else {
        this.outputTokenCount = usage.outputTokenCount;
      }
    }

    if (usage.totalTokenCount !== undefined) {
      if (this.totalTokenCount !== undefined) {
        this.totalTokenCount += usage.totalTokenCount;
      } else {
        this.totalTokenCount = usage.totalTokenCount;
      }
    }

    if (usage.additionalCounts) {
      if (!this.additionalCounts) {
        this.additionalCounts = new AdditionalProperties(usage.additionalCounts);
      } else {
        for (const [key, value] of usage.additionalCounts) {
          const existingValue = this.additionalCounts.get(key);
          const newValue = existingValue !== undefined ? value + existingValue : value;
          this.additionalCounts.set(key, newValue);
        }
      }
    }
  }
}
