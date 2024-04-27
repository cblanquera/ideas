//types
import type { SourceFile } from 'ts-morph';
import type { Model } from 'idea-spec';
//helpers
import { map, formatCode } from '../../helpers';

export function body(model: Model) {
  return model.active ? formatCode(`
    return await db.update(schema.${model.camel})
      .set({ ${model.active.name}: true })
      .where(${model.ids.length > 1
        ? `sql\`${model.ids.map(id => `${id.name} = \${${id.name}}`).join(' AND ')}\``
        : `eq(schema.${model.camel}.${model.ids[0].name}, ${model.ids[0].name})`
      })
      .returning()
      .then(toResponse)
      .catch(toErrorResponse);
  `) : formatCode(`
    return await db.delete(schema.${model.camel})
      .where(${model.ids.length > 1
        ? `sql\`${model.ids.map(id => `${id.name} = \${${id.name}}`).join(' AND ')}\``
        : `eq(schema.${model.camel}.${model.ids[0].name}, ${model.ids[0].name})`
      })
      .returning()
      .then(toResponse)
      .catch(toErrorResponse);
  `)
};

export default function generate(
  source: SourceFile, 
  model: Model,
  exported = true,
  method = 'restore'
) {
  //export async function restore(
  //  id: string,
  //): Promise<ResponsePayload<Profile>>
  source.addFunction({
    isExported: exported,
    name: method,
    isAsync: true,
    parameters: model.ids.map(
      column => ({ name: column.name, type: map.type[column.type] })
    ),
    returnType: `Promise<ResponsePayload<${model.title}>>`,
    statements: body(model)
  });
};