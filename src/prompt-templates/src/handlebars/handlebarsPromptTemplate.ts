import { PromptTemplate } from '@semantic-kernel/abstractions';
import Handlebars from 'handlebars';

export const handlebarsPromptTemplate = (template: string): PromptTemplate => {
  return {
    render: async (_, props) => {
      const compiledTemplate = Handlebars.compile(template);
      // TODO: add Kernel plugins as helpers

      return compiledTemplate(props);
    },
  };
};
