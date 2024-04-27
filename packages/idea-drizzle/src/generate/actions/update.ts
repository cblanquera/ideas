//types
import type { SourceFile } from 'ts-morph';
import type { Model } from 'idea-spec';
import type { ProjectConfig } from '../../types';
//helpers
import { map, formatCode } from '../../helpers';

export function body(config: ProjectConfig, model: Model, assert: string) {
  const engine = config.engine.type === 'env' 
    ? process.env[config.engine.value] 
    : config.engine.value;
  const ids = model.ids.map(column => column.name);
  return formatCode(`
    //collect errors, if any
    const errors = ${assert}(input);
    //if there were errors
    if (errors) {
      //return the errors
      return toErrorResponse(
        Exception
          .for('Invalid parameters')
          .withCode(400)
          .withErrors(errors)
      );
    }
    //action and return response
    return await db.update(schema.${model.camel}).set({
      ${model.assertions.map(column => {
        if (column.multiple) {
          return engine === 'sqlite' 
            ? `${column.name}: input.${column.name} ? JSON.stringify(input.${column.name} || []): undefined`
            : `${column.name}: input.${column.name} || undefined`;  
        } else if (['Json', 'Object', 'Hash'].includes(column.type)) {
          return engine === 'sqlite' 
            ? `${column.name}: input.${column.name} ? JSON.stringify(input.${column.name} || {}): undefined`
            : `${column.name}: input.${column.name} || undefined`;  
        }
        const helper = map.helper[column.type];
        return helper 
          ? `${column.name}: ${helper}(input.${column.name})`
          : `${column.name}: input.${column.name}`
      }).join(',\n')}
    }).where(${ids.length > 1
      ? `sql\`${ids.map(id => `${id} = \${${id}}`).join(' AND ')}\``
      : `eq(schema.${model.camel}.${ids[0]}, ${ids[0]})`
    })
    .returning()
    .then(results => results[0])
    .then(toResponse)
    .catch(toErrorResponse);
  `);
};

export default function generate(
  source: SourceFile, 
  config: ProjectConfig, 
  model: Model,
  exported = true,
  method = 'update',
  assert = 'assert'
) {
  //export async function action(
  //  id: string,
  //  data: ProfileUpdateInput
  //): Promise<ResponsePayload<Profile>>
  source.addFunction({
    isExported: exported,
    name: method,
    isAsync: true,
    parameters: [
      ...model.ids.map(
        column => ({ name: column.name, type: map.type[column.type] })
      ),
      { name: 'input', type: `${model.title}UpdateInput` }
    ],
    returnType: `Promise<ResponsePayload<${model.title}>>`,
    statements: body(config, model, assert)
  });
};