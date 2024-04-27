//types
import { Directory } from 'ts-morph';
import { Loader } from '@ossph/idea';
import { Model, Fieldset } from 'idea-spec';
//generators
import generateCreate from './create';
import generateUpdate from './update';
//helpers

export default function generate(
  source: Directory, 
  filename: string, 
  output: string, 
  types: string
) {
  //loop through models
  for (const name in Model.configs) {
    //get the model
    const model = new Model(name);
    //get the final path
    const path = model.destination(filename);
    //determine the source file
    const file = source.createSourceFile(path, '', { overwrite: true });
    //import { assert } from 'idea-assert';
    file.addImportDeclaration({
      moduleSpecifier: 'idea-assert',
      namedImports: [ 'assert' ]
    });
    //import { ProfileCreateInput, ProfileUpdateInput } from '../profile/types';
    file.addImportDeclaration({
      moduleSpecifier: Loader.relative(
        model.destination(output),
        model.destination(types)
      ),
      namedImports: [ 
        `${model.title}CreateInput`, 
        `${model.title}UpdateInput` 
      ]
    });
    //generate the model
    generateCreate(file, model);
    generateUpdate(file, model);
  }
  //loop through fieldsets
  for (const name in Fieldset.configs) {
    //get the fieldset
    const fieldset = new Fieldset(name);
    //get the final path
    const path = fieldset.destination(filename);
    //determine the source file
    const file = source.createSourceFile(path, '', { overwrite: true });
    //import { assert } from 'idea-assert';
    file.addImportDeclaration({
      moduleSpecifier: 'idea-assert',
      namedImports: [ 'assert' ]
    });
    //import { ProfileCreateInput, ProfileUpdateInput } from '../profile/types';
    file.addImportDeclaration({
      moduleSpecifier: Loader.relative(
        fieldset.destination(output),
        fieldset.destination(types)
      ),
      namedImports: [ 
        `${fieldset.title}CreateInput`, 
        `${fieldset.title}UpdateInput` 
      ]
    });
    //generate the fieldset
    generateCreate(file, fieldset);
    generateUpdate(file, fieldset);
  }
}