//types
import type { PluginWithCLIProps } from '@ossph/idea';
//project
import path from 'path';
import { Project, SourceFile, IndentationText } from 'ts-morph';
import { Loader } from '@ossph/idea';
import { Model, Fieldset, ensolute } from 'idea-spec';
//helpers
import { formatCode } from './helpers';
import assert from './assert';

// Sample idea config
//
// plugin "idea-assert" {
//   lang "ts"
//   output "./modules/[name]/assert"
// }
//
// or 
//
// plugin "idea-assert" {
//   lang "ts"
//   output "./modules/assert"
// }

/**
 * This is the The params comes form the cli
 * TODO: Enums, Unqiue
 */
export default function generate({ config, schema, cli }: PluginWithCLIProps) {
  //we need idea-ts
  if (!schema.plugin?.['idea-ts']) {
    return cli.terminal.error('idea-ts plugin is required');
  //we need types from idea-ts
  } else if (!schema.plugin['idea-ts'].types) {
    return cli.terminal.error('types in `idea-ts` is required');
  //we need an output path
  } else if (typeof config.output !== 'string') {
    return cli.terminal.error('Output path is required');
  }
  //short name for idea-ts
  const tsConfig = schema.plugin['idea-ts'];
  //get absolute types
  const types = typeof tsConfig.types === 'string' 
    ? ensolute(tsConfig.types, cli.cwd) as string
    : tsConfig.types as unknown as string;
  //recheck types
  if (!types) {
    return cli.terminal.error('Types path is invalid');
  }
  //populate model cache
  for (const name in schema.model) {
    Model.add(schema.model[name]);
  }
  //populate fieldset cache
  for (const name in schema.type) {
    Fieldset.add(schema.type[name]);
  }

  //output "modules/assert"
  //output "modules/[name]/assert"
  //output "./modules/assert"
  //output "./modules/[name]/validators"
  //output "../modules/validators"
  //output "../modules/[name]/validators"
  //output "env(OUTPUT)"
  const output = ensolute(config.output, cli.cwd);
  if (typeof output !== 'string') {
    return cli.terminal.error('Output path is invalid');
  }
  
  // /FULL_PATH/modules
  const dirname = output.includes(`${path.sep}[name]`) 
    ? output.split(`${path.sep}[name]`)[0]
    : output.includes('[name]') 
    ? output.split('[name]')[0]
    : path.dirname(output);
  //determine outfile
  const filename = path.extname(output) === '.ts'
    ? (
      output.split(dirname)[1].startsWith('/')
        //cannot have leading slash (will error)
        ? output.split(dirname)[1].substring(1)
        : output.split(dirname)[1]
    ): (
      output.split(dirname)[1].startsWith('/')
        //cannot have leading slash (will error)
        ? output.split(dirname)[1].substring(1) + '.ts'
        : output.split(dirname)[1] + '.ts'
    );
  //set up the ts-morph project
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      outDir: dirname,
      // Generates corresponding '.d.ts' file.
      declaration: true, 
      // Generates a sourcemap for each corresponding '.d.ts' file.
      declarationMap: true, 
      // Generates corresponding '.map' file.
      sourceMap: true, 
    },
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces
    }
  });
  //create the output directory if not exists
  const source = project.createDirectory(dirname);
  //check if we need to split types by files 
  //or put it into one singular file
  const split = output.includes('[name]');
  if (split) {
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
      generateAssert(file, model);
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
      generateAssert(file, fieldset);
    }
  } else {
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
      //generate export body
      generateAssert(file, model);
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
      //generate export body
      generateAssert(file, fieldset);
    }
    //if there are global imports
    if (imports.length > 0) {
      file.addImportDeclaration({
        moduleSpecifier: Loader.relative(output, types),
        namedImports: imports
      });
    }
  }
  //if you want ts, tsx files
  if ((tsConfig.lang || 'ts') == 'ts') {
    project.saveSync();
  //if you want js, d.ts files
  } else {
    project.emit();
  }
};

function generateAssert(source: SourceFile, fieldset: Fieldset) {
  //export function assertProfileCreate(data: ProfileCreateInput): Record<string, any>|null
  source.addFunction({
    isExported: true,
    name: `assert${fieldset.title}Create`,
    parameters: [
      { name: 'input', type: `${fieldset.title}CreateInput` }
    ],
    returnType: 'Record<string, any>|null',
    statements: formatCode(`
      //collect errors, if any
      const errors: Record<string, any> = {};
      ${fieldset.assertions.map(column => {
        const input = `input.${column.name}`;
        const error = `errors.${column.name}`;
        //see if column is required
        const required = column.assertions.find(
          assertion => assertion.method === 'required'
        );
        //for each assertion
        const assertions = column.assertions.filter(
          //filter out invalid methods
          assertion => Object.keys(assert).includes(assertion.method)
        ).filter(
          //filter out required
          assertion => assertion.method !== 'required'
        ).map(assertion => {
          const { method, message } = assertion;
          const args = assertion.args.map(
            arg => typeof arg === 'string'? `'${arg}'`: arg 
          );
          const assert = args.length > 0
            ? `assert.${method}(${input}, ${ args.join(', ')})`
            : `assert.${method}(${input})`;
          return `if (!${assert}) {
            ${error} = '${message}';
          }`;  
        });

        //see if required
        if (required) {
          assertions.unshift(`//check ${column.name}
          if (!assert.required(${input})) {
            ${error} = '${required.message}';
          }`);
          return assertions.join(' else ');
        }
        return `//check ${column.name}
          if (typeof ${input} !== 'undefined') {
            ${assertions.join(' else ')}
          }
        `;
      }).join('\n')}

      return Object.keys(errors).length > 0 ? errors : null;
    `)
  });

  //export function assertProfileUpdate(data: ProfileUpdateInput): Record<string, any>|null
  source.addFunction({
    isExported: true,
    name: `assert${fieldset.title}Update`,
    parameters: [
      { name: 'input', type: `${fieldset.title}UpdateInput` }
    ],
    returnType: 'Record<string, any>|null',
    statements: formatCode(`
      //collect errors, if any
      const errors: Record<string, any> = {};
      ${fieldset.assertions.map(column => {
        const input = `input.${column.name}`;
        const error = `errors.${column.name}`;
        //for each assertion
        const assertions = column.assertions.filter(
          //filter out invalid methods
          assertion => Object.keys(assert).includes(assertion.method)
        ).filter(
          //filter out required
          assertion => assertion.method !== 'required'
        ).map(assertion => {
          const { method, message } = assertion;
          const args = assertion.args.map(
            arg => typeof arg === 'string'? `'${arg}'`: arg 
          );
          const assert = args.length > 0
            ? `assert.${method}(${input}, ${ args.join(', ')})`
            : `assert.${method}(${input})`;
          return `if (!${assert}) {
            ${error} = '${message}';
          }`;  
        });
        return `//check ${column.name}
          if (typeof ${input} !== 'undefined') {
            ${assertions.join(' else ')}
          }
        `;
      }).join('\n')}

      return Object.keys(errors).length > 0 ? errors : null;
    `)
  });
}