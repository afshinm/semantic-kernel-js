import { AdditionalProperties } from '../AdditionalProperties';
import { AIFunctionParameterMetadata } from './AIFunctionParameterMetadata';
import { AIFunctionReturnParameterMetadata } from './AIFunctionReturnParameterMetadata';


export class AIFunctionMetadata {
  private _name: string = '';
  private _description: string = '';
  public readonly parameters?: AIFunctionParameterMetadata;
  private readonly _returnParameter?: AIFunctionReturnParameterMetadata;
  private readonly _additionalProperties?: AdditionalProperties;

  constructor({
    name,
    description,
    parameters,
    returnParameter,
  }: {
    name: string;
    description?: string;
    parameters?: AIFunctionParameterMetadata;
    returnParameter?: AIFunctionReturnParameterMetadata;
    additionalProperties?: AdditionalProperties;
  }) {
    this._name = name;
    this._description = description || '';
    this.parameters = parameters;
    this._returnParameter = returnParameter;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get returnParameter() {
    return this._returnParameter;
  }

  get additionalProperties() {
    return this._additionalProperties;
  }
}
