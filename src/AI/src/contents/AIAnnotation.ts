import { type AdditionalProperties } from '../AdditionalProperties';
import { type AnnotatedRegion } from './AnnotatedRegion';

/**
 * Represents an annotation on content.
 */
export class AIAnnotation {
  /**
   * Gets or sets any target regions for the annotation, pointing to where in the associated {@link AIContent} this annotation applies.
   *
   * The most common form of {@link AnnotatedRegion} is {@link TextSpanAnnotatedRegion}, which provides starting and ending character indices
   * for {@link TextContent}.
   */
  public annotatedRegions?: AnnotatedRegion[];

  /**
   * Gets or sets the raw representation of the annotation from an underlying implementation.
   *
   * If an {@link AIAnnotation} is created to represent some underlying object from another object
   * model, this property can be used to store that original object. This can be useful for debugging or
   * for enabling a consumer to access the underlying object model, if needed.
   */
  public rawRepresentation?: unknown;

  /**
   * Gets or sets additional metadata specific to the provider or source type.
   */
  public additionalProperties?: AdditionalProperties;
}
