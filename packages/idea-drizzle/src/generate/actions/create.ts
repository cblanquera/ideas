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
    return await db.insert(schema.${model.camel}).values({
      ${model.assertions.map(column => {
        if (column.multiple) {
          return engine === 'sqlite' 
            ? `${column.name}: JSON.stringify(input.${column.name} || [])`
            : `${column.name}: input.${column.name} || []`;  
        } else if (['Json', 'Object', 'Hash'].includes(column.type)) {
          return engine === 'sqlite' 
            ? `${column.name}: JSON.stringify(input.${column.name} || {})`
            : `${column.name}: input.${column.name} || {}`;  
        }
        const helper = map.helper[column.type];
        return helper 
          ? `${column.name}: ${helper}(input.${column.name})`
          : `${column.name}: input.${column.name}`;
      }).join(',\n')}
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
  method = 'create',
  assert = 'assert'
) {
  //export default async function create(
  //  data: ProfileCreateInput
  //): Promise<ResponsePayload<Profile>>
  source.addFunction({
    isExported: exported,
    name: method,
    isAsync: true,
    parameters: [
      { name: 'input', type: `${model.title}CreateInput` }
    ],
    returnType: `Promise<ResponsePayload<${model.title}>>`,
    statements: body(config, model, assert)
  });
};