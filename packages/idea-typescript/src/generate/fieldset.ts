//project
import { SourceFile } from 'ts-morph';
import { Fieldset } from '@blanquera/idea-spec';
//helpers
import { map, relativeImport, formatCode } from '../helpers';

/**
 * Generate fieldset types
 */
export default function generateFieldset(
  source: SourceFile, 
  fieldset: Fieldset, 
  destination: string,
  enums?: string
) {
  const imported: string[] = [];
  //if split files, we should import
  if (destination.includes('[name]')) {
    //loop through the fieldsets
    fieldset.fieldsets.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      const child = column.fieldset as Fieldset;
      //import type { Profile } from '../profile/types';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: relativeImport(
          fieldset.destination(destination),
          child.destination(destination)
        ),
        namedImports: [ child.title ]
      });
    });
  }

  const imports: string[] = [];
  //if there is an enum output path
  if (typeof enums === 'string') {
    //loop through enums
    fieldset.enums.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      //if enum output path is dynamic
      if (enums.includes('[name]')) {
        //import Roles from '../profile/enum.ts';
        source.addImportDeclaration({
          isTypeOnly: true,
          moduleSpecifier: relativeImport(
            fieldset.destination(destination),
            enums.replace('[name]', column.type.toLowerCase())
          ),
          defaultImport: column.type
        });
      } else {
        imports.push(column.type);
      }
    });

    if (imports.length > 0 && enums !== destination) {
      //import { Roles, .. } from '../enums.ts';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: relativeImport(
          fieldset.destination(destination),
          enums
        ),
        namedImports: imports
      });
    }
  }
  //export type Profile
  source.addTypeAlias({
    isExported: true,
    name: fieldset.title,
    type: formatCode(`{
      ${fieldset.columns.filter(
        //filter out columns that are not in the map
        column => !!map[column.type] || !!column.enum
      ).map(column => (
        //name?: string
        `${column.name}${
          !column.required ? '?' : ''
        }: ${map[column.type] || column.type}${
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
      //...also include enum names
      ...fieldset.enums.map(column => column.type),
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