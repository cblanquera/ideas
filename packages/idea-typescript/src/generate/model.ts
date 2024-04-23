//types
import type { ColumnRelationLink } from '@blanquera/idea-spec';
//project
import path from 'path';
import { SourceFile } from 'ts-morph';
import { Model, Fieldset } from '@blanquera/idea-spec';
//helpers
import { map, formatCode } from '../helpers';

/**
 * Generate model types
 */
export default function generateModel(
  source: SourceFile, 
  model: Model, 
  destination: string
) {
  //if split files, we should import
  if (destination.includes('[name]')) {
    const imported: string[] = [];
    //loop through the relation
    model.relations.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      const relation = column.relation as ColumnRelationLink;
      const src = path.dirname(
        relation.child.model.destination(destination)
      );
      let dst = relation.parent.model.destination(destination);
      const ext = path.extname(dst);
      if (ext.length) {
        dst = dst.substring(0, dst.length - ext.length);
      }
      //import type { Profile } from '../profile/types';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: path.relative(src, dst),
        namedImports: [ relation.parent.model.title ]
      });
    });
    //loop through the fieldsets
    model.fieldsets.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      const fieldset = column.fieldset as Fieldset;
      const src = path.dirname(model.destination(destination));
      let dst = fieldset.destination(destination);
      const ext = path.extname(dst);
      if (ext.length) {
        dst = dst.substring(0, dst.length - ext.length);
      }
      //import type { Profile } from '../profile/types';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: path.relative(src, dst),
        namedImports: [ fieldset.title ]
      });
    });
  }
  //export type Profile
  source.addTypeAlias({
    isExported: true,
    name: model.title,
    type: formatCode(`{
      ${model.columns.filter(
        //filter out columns that are not in the model map
        column => !!map[column.type]
      ).map(column => (
        //name?: string
        `${column.name}${
          !column.required ? '?' : ''
        }: ${map[column.type]}${
          column.multiple ? '[]' : ''
        }`
      )).join(',\n')}
    }`)
  });
  //export type ProfileExtended
  if (model.relations.length || model.fieldsets.length) {
    source.addTypeAlias({
      isExported: true,
      name: `${model.title}Extended`,
      type: formatCode(`${model.title} & {
        ${[...model.relations, ...model.fieldsets].map(column => (
          //user?: User
          `${column.name}${
            !column.required ? '?' : ''
          }: ${column.type}${
            column.multiple ? '[]' : ''
          }`
        )).join(',\n')}
      }`)
    });
  } else {
    source.addTypeAlias({
      isExported: true,
      name: `${model.title}Extended`,
      type: model.title
    });
  }
  //gather all the field inputs
  const inputs = model.columns
    .filter(column => !column.generated)
    .filter(column => [
      //should be a name on the map
      ...Object.keys(map),
      //...also include fieldset names
      ...model.fieldsets.map(column => column.fieldset?.title)
    ].includes(column.type));
  //export type ProfileCreateInput
  source.addTypeAlias({
    isExported: true,
    name: `${model.title}CreateInput`,
    type: formatCode(`{
      ${inputs.map(column => (
        //name?: string
        `${column.name}${
          !column.required ? '?' : ''
        }: ${map[column.type]}${
          column.multiple ? '[]' : ''
        }`
      )).join(',\n')}
    }`)
  });
  //export type ProfileUpdateInput
  source.addTypeAlias({
    isExported: true,
    name: `${model.title}UpdateInput`,
    type: formatCode(`{
      ${inputs.map(column => (
        //name?: string
        `${column.name}?: ${map[column.type]}${
          column.multiple ? '[]' : ''
        }`
      )).join(',\n')}
    }`)
  });
}