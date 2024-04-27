//types
import type { SourceFile } from 'ts-morph';
import type { Fieldset } from 'idea-spec';
//helpers
import assert from '../assert';
import { formatCode } from '../helpers';

export function body(fieldset: Fieldset) {
  return formatCode(`
    //collect errors, if any
    const errors: Record<string, any> = {};
    ${fieldset.assertions.map(column => {
      const input = `input.${column.name}`;
      const error = `errors.${column.name}`;
      //for each assertion
      const assertions = column.assertions.filter(
        //filter out invalid methods
        assertion => Object.keys(assert).includes(assertion.method)
      ).filter(
        //filter out required
        assertion => assertion.method !== 'required'
      ).map(assertion => {
        const { method, message } = assertion;
        const args = assertion.args.map(
          arg => typeof arg === 'string'? `'${arg}'`: arg 
        );
        const assert = args.length > 0
          ? `assert.${method}(${input}, ${ args.join(', ')})`
          : `assert.${method}(${input})`;
        return `if (!${assert}) {
          ${error} = '${message}';
        }`;  
      });
      return `//check ${column.name}
        if (typeof ${input} !== 'undefined') {
          ${assertions.join(' else ')}
        }
      `;
    }).join('\n')}

    return Object.keys(errors).length > 0 ? errors : null;
  `)
}

export default function generate(
  source: SourceFile, 
  fieldset: Fieldset,
  method = 'update'
) {
  //export function update(input: ProfileUpdateInput): Record<string, any>|null
  source.addFunction({
    isExported: true,
    name: method,
    parameters: [
      { name: 'input', type: `${fieldset.title}UpdateInput` }
    ],
    returnType: 'Record<string, any>|null',
    statements: body(fieldset)
  });
}