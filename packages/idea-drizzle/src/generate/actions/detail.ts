//types
import type { SourceFile } from 'ts-morph';
import type { Model } from 'idea-spec';
//helpers
import { formatCode, map } from '../../helpers';

export function body(model: Model, search: string) {
  const ids = model.ids.map(column => column.name);
  return model.active ? formatCode(`
    return ${search}({
      filter: { ${model.active.name}: -1, ${ids.map(id => `${id}`).join(', ')} },
      take: 1
    }).then(response => ({
      ...response,
      results: response.results?.[0] || null
    }));
  `) : formatCode(`
    return ${search}({
      filter: { ${ids.map(id => `${id}`).join(', ')} },
      take: 1
    }).then(response => ({
      ...response,
      results: response.results?.[0] || null
    }));
  `);
};

export default function generate(
  source: SourceFile, 
  model: Model,
  exported = true,
  method = 'detail',
  search = 'search'
) {
  //export async function detail(
  //  id: string,
  //): Promise<ResponsePayload<Profile>>
  source.addFunction({
    isExported: exported,
    name: method,
    isAsync: true,
    parameters: model.ids.map(
      column => ({ name: column.name, type: map.type[column.type] })
    ),
    returnType: `Promise<ResponsePayload<${model.title}Extended|null>>`,
    statements: body(model, search)
  });
};