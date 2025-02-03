import { KernelArguments } from '../functions';
import { PromptTemplate } from './PromptTemplate';
import { handlebarsPromptTemplate } from './handlebarsPromptTemplate';

export class KernelPromptTemplate implements PromptTemplate {
  constructor(
    private readonly template: string,
    private readonly args: KernelArguments
  ) {}

  render() {
    return handlebarsPromptTemplate(this.template).render(undefined, this.args);
  }
}
