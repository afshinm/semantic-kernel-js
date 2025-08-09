import { defaultServiceId, PromptExecutionSettings, ServiceId } from '../promptExecutionSettings';
import { InputVariable } from './InputVariable';

export type PromptTemplateFormat = 'handlebars' | 'passthrough';

export class PromptTemplateConfig {
  prompt: string = '';
  name?: string;
  description?: string;
  // TODO: replace this with the SemanticKernelPromptTemplate type
  templateFormat: PromptTemplateFormat = 'passthrough';
  inputVariables: InputVariable[] = [];
  /**
   * Gets or sets a value indicating whether to allow potentially dangerous content to be inserted into the prompt from functions.
   */
  allowDangerouslySetContent: boolean;

  private _executionSettings: Record<ServiceId, PromptExecutionSettings> = {};

  constructor({
    prompt,
    templateFormat,
    inputVariables = [],
    name,
    description,
    allowDangerouslySetContent,
  }: {
    prompt: string;
    templateFormat: PromptTemplateFormat;
    inputVariables?: InputVariable[];
    name?: string;
    description?: string;
    allowDangerouslySetContent?: boolean;
  }) {
    this.prompt = prompt;
    this.name = name;
    this.description = description;
    this.templateFormat = templateFormat;
    this.inputVariables = inputVariables ?? [];
    this.allowDangerouslySetContent = allowDangerouslySetContent ?? false;
  }

  set executionSettings(value: Record<string, PromptExecutionSettings>) {
    if (Object.keys(value).length !== 0) {
      for (const [key, settings] of Object.entries(value)) {
        // Ensures that if a service id is provided it must match the key in the dictionary.
        if (settings.serviceId && settings.serviceId.trim() !== '' && key !== settings.serviceId) {
          throw new Error(`Service id '${settings.serviceId}' must match the key '${key}'.`);
        }
      }
    }

    this._executionSettings = value;
  }

  get executionSettings(): Record<string, PromptExecutionSettings> {
    return this._executionSettings;
  }

  /**
   * Adds execution settings for a specific service.
   * @param settings The execution settings to add.
   * @param serviceId The service id to associate with the settings (optional).
   */
  addExecutionSettings(settings: PromptExecutionSettings, serviceId?: ServiceId): void {
    if (!settings) {
      throw new Error('settings must not be null or undefined.');
    }

    if (serviceId && settings.serviceId && settings.serviceId.trim() !== '') {
      throw new Error(`Service id must not be passed when 'serviceId' is already provided in execution settings.`);
    }

    const key = serviceId ?? settings.serviceId ?? defaultServiceId;

    if (this._executionSettings[key]) {
      throw new Error(`Execution settings for service id '${key}' already exists.`);
    }

    this._executionSettings[key] = settings;
  }
}
