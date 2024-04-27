//types
import type { Directory } from 'ts-morph';
//project
import { VariableDeclarationKind } from 'ts-morph';
import { Loader } from '@ossph/idea';
import { Model, Fieldset } from 'idea-spec';
//generators
import { body as createBody } from './create';
import { body as updateBody } from './update';
//helpers
import { formatCode } from '../helpers';

export default function generate(
  source: Directory, 
  filename: string, 
  output: string, 
  types: string
) {
  const file = source.createSourceFile(filename, '', { overwrite: true });
    //import { assert } from 'idea-assert';
    file.addImportDeclaration({
      moduleSpecifier: 'idea-assert',
      namedImports: [ 'assert' ]
    });
    const imports: string[] = [];
    //loop through models
    for (const name in Model.configs) {
      const model = new Model(name);
      //if types path are dynamic
      if (types.includes('[name]')) {
        //import { ProfileCreateInput, ProfileUpdateInput } from '../profile/types';
        file.addImportDeclaration({
          moduleSpecifier: Loader.relative(
            output,
            model.destination(types)
          ),
          namedImports: [ 
            `${model.title}CreateInput`, 
            `${model.title}UpdateInput` 
          ]
        });
      //types is a static path
      } else {
        //just add to global imports
        imports.push(
          `${model.title}CreateInput`, 
          `${model.title}UpdateInput` 
        );
      }
      //export const profile = { create, update }
      file.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [{
          name: model.camel,
          initializer: formatCode(`{
            create(input: ${model.title}CreateInput): Record<string, any>|null {
              ${createBody(model)}
            },
            update(input: ${model.title}UpdateInput): Record<string, any>|null {
              ${updateBody(model)}
            },
          }`)
        }]
      });
    }
    //loop through fieldsets
    for (const name in Fieldset.configs) {
      const fieldset = new Fieldset(name);
      //if types path are dynamic
      if (types.includes('[name]')) {
        //import { ProfileCreateInput, ProfileUpdateInput } from '../profile/types';
        file.addImportDeclaration({
          moduleSpecifier: Loader.relative(
            output,
            fieldset.destination(types)
          ),
          namedImports: [ 
            `${fieldset.title}CreateInput`, 
            `${fieldset.title}UpdateInput` 
          ]
        });
      //types is a static path
      } else {
        //just add to global imports
        imports.push(
          `${fieldset.title}CreateInput`, 
          `${fieldset.title}UpdateInput` 
        );
      }
      //export const profile = { create, update }
      file.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [{
          name: fieldset.camel,
          initializer: formatCode(`{
            create(input: ${fieldset.title}CreateInput): Record<string, any>|null {
              ${createBody(fieldset)}
            },
            update(input: ${fieldset.title}UpdateInput): Record<string, any>|null {
              ${updateBody(fieldset)}
            },
          }`)
        }]
      });
    }

    //const assertions = { profile, ...};
    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: 'assertions',
        initializer: formatCode(`{
          ${[
            ...Object.keys(Model.configs).map(name => {
              const model = new Model(name);
              return `${model.camel}`;
            }),
            ...Object.keys(Fieldset.configs).map(name => {
              const fieldset = new Fieldset(name);
              return `${fieldset.camel}`;
            })
          ].join(',\n')}
        }`)
      }]
    });

    file.addExportAssignment({
      expression: 'assertions',
      isExportEquals: false
    });

    //if there are global imports
    if (imports.length > 0) {
      file.addImportDeclaration({
        moduleSpecifier: Loader.relative(output, types),
        namedImports: imports
      });
    }
}