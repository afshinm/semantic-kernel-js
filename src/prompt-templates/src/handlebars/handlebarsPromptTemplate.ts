import { PromptTemplate } from '@semantic-kernel/abstractions';
import Handlebars from 'handlebars';

export class HandlebarsPromptTemplate implements PromptTemplate {
  constructor(private readonly prompt: string) {}

  async render(kernel, args) {
    const compiledTemplate = Handlebars.compile(this.prompt);
    // TODO: add Kernel plugins as helpers

    return compiledTemplate(args);
  }
}
