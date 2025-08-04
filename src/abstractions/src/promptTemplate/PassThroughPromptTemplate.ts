import { PromptTemplate } from './PromptTemplate';
import { PromptTemplateConfig } from './PromptTemplateConfig';

export class PassThroughPromptTemplate implements PromptTemplate {
  constructor(private readonly promptConfig: PromptTemplateConfig) {}

  render() {
    return this.promptConfig.prompt;
  }
}
