/**
 * Represents an input variable for prompt functions.
 */
export class InputVariable {
  public _name: string = '';
  private _description: string = '';

  constructor({
    name,
    description,
    defaultValue,
    isRequired,
    jsonSchema,
    allowDangerouslySetContent,
  }: {
    name: string;
    description?: string;
    defaultValue?: unknown;
    isRequired?: boolean;
    jsonSchema?: string;
    allowDangerouslySetContent?: boolean;
  }) {
    this._name = name;

    if (description) {
      this._description = description;
    }

    this.default = defaultValue;
    this.isRequired = isRequired ?? true;
    this.jsonSchema = jsonSchema;
    this.allowDangerouslySetContent = allowDangerouslySetContent ?? false;
  }

  /**
   * Gets or sets the name of the variable.
   */
  public get name(): string {
    return this._name;
  }

  /**
   * Gets or sets the name of the variable.
   */
  public set name(value: string) {
    this._name = value;
  }

  /**
   * Gets or sets the name of the variable.
   */
  public get description(): string {
    return this._description;
  }

  /**
   * Gets or sets a description of the variable.
   */
  public set description(value: string) {
    this._description = value;
  }

  /**
   * Default value for the variable.
   */
  public default?: unknown;

  /**
   * Indicates whether the variable is considered required.
   */
  public isRequired: boolean;

  /**
   * JSON Schema describing this variable.
   */
  public jsonSchema?: string;

  /**
   * Indicates whether to handle the variable value as potentially dangerous content.
   */
  public allowDangerouslySetContent: boolean;
}
