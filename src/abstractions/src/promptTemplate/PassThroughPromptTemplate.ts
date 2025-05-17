import { PromptTemplate } from './PromptTemplate';

export class PassThroughPromptTemplate implements PromptTemplate {
  constructor(private readonly prompt: string) {}

  render() {
    return this.prompt;
  }
}
