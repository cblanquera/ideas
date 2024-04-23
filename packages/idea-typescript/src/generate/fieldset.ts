//project
import path from 'path';
import { SourceFile } from 'ts-morph';
import { Fieldset } from '@blanquera/idea-map';
//helpers
import { map, formatCode } from '../helpers';

/**
 * Generate fieldset types
 */
export default function generateFieldset(
  source: SourceFile, 
  fieldset: Fieldset, 
  destination: string
) {
  //if split files, we should import
  if (destination.includes('[name]')) {
    const imported: string[] = [];
    //loop through the fieldsets
    fieldset.fieldsets.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      const child = column.fieldset as Fieldset;
      const src = path.dirname(fieldset.destination(destination));
      let dst = child.destination(destination);
      const ext = path.extname(dst);
      if (ext.length) {
        dst = dst.substring(0, dst.length - ext.length);
      }
      //import type { Profile } from '../profile/types';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: path.relative(src, dst),
        namedImports: [ child.title ]
      });
    });
  }
  //export type Profile
  source.addTypeAlias({
    isExported: true,
    name: fieldset.title,
    type: formatCode(`{
      ${fieldset.columns.filter(
        //filter out columns that are not in the map
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
  if (fieldset.fieldsets.length) {
    source.addTypeAlias({
      isExported: true,
      name: `${fieldset.title}Extended`,
      type: formatCode(`${fieldset.title} & {
        ${fieldset.fieldsets.map(column => (
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
      name: `${fieldset.title}Extended`,
      type: formatCode(fieldset.title)
    });
  }
  //gather all the field inputs
  const inputs = fieldset.columns
    .filter(column => !column.generated)
    .filter(column => [ 
      //should be a name on the map
      ...Object.keys(map),
      //...also include fieldset names
      ...fieldset.fieldsets.map(column => column.fieldset?.title)
    ].includes(column.type));
  //export type ProfileCreateInput
  source.addTypeAlias({
    isExported: true,
    name: `${fieldset.title}CreateInput`,
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
    name: `${fieldset.title}UpdateInput`,
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