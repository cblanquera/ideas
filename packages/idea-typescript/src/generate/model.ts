//types
import type { SourceFile } from 'ts-morph';
import type { ColumnRelationLink } from '@blanquera/idea-spec';
import type { Projects } from '../types';
//project
import { Model, Fieldset } from '@blanquera/idea-spec';
//helpers
import { map, relativeImport, formatCode } from '../helpers';

/**
 * Generate model types
 */
export default function generateModel(
  source: SourceFile, 
  model: Model, 
  projects: Projects
) {
  const imported: string[] = [];
  //if split files, we should import
  if (projects.types.output.includes('[name]')) {
    //loop through the relation
    model.relations.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      //get relation so we can import the parent model
      const relation = column.relation as ColumnRelationLink;
      //import type { Profile } from '../profile/types';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: relativeImport(
          relation.child.model.destination(projects.types.output),
          relation.parent.model.destination(projects.types.output)
        ),
        namedImports: [ relation.parent.model.title ]
      });
    });
    //loop through the fieldsets
    model.fieldsets.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      //get the fieldset
      const fieldset = column.fieldset as Fieldset;
      //import type { Profile } from '../profile/types';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: relativeImport(
          model.destination(projects.types.output),
          fieldset.destination(projects.types.output)
        ),
        namedImports: [ fieldset.title ]
      });
    });
  }

  const imports: string[] = [];
  //if there is an enum project
  if (projects.enums) {
    //loop through enums
    model.enums.forEach(column => {
      if (imported.includes(column.type)) return;
      imported.push(column.type);
      //if enum output path is dynamic
      if (projects.enums.output.includes('[name]')) {
        //import Roles from '../profile/enum';
        source.addImportDeclaration({
          isTypeOnly: true,
          moduleSpecifier: relativeImport(
            model.destination(projects.types.output),
            projects.enums.output.replace(
              '[name]', 
              column.type.toLowerCase()
            )
          ),
          defaultImport: column.type
        });
      } else {
        imports.push(column.type);
      }
    });
    if (imports.length > 0 && projects.enums.output !== projects.types.output) {
      //import { Roles, .. } from '../enums';
      source.addImportDeclaration({
        isTypeOnly: true,
        moduleSpecifier: relativeImport(
          model.destination(projects.types.output),
          projects.enums.output
        ),
        namedImports: imports
      });
    }
  }
  //export type Profile
  source.addTypeAlias({
    isExported: true,
    name: model.title,
    type: formatCode(`{
      ${model.columns.filter(
        //filter out columns that are not in the model map
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
      //...also include enum names
      ...model.enums.map(column => column.type),
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