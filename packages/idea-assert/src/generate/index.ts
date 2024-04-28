//types
import type { PluginWithCLIProps } from '@ossph/idea';
//project
import path from 'path';
import { Project, IndentationText } from 'ts-morph';
import { Model, Fieldset, ensolute } from 'idea-spec';
//generators
import generateSplit from './split';
import generateMain from './main';

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
 */
export default function generate({ config, schema, cli }: PluginWithCLIProps) {
  //we need idea-ts
  if (!schema.plugin?.['idea-ts']) {
    return cli.terminal.error('idea-ts plugin is required');
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
    tsConfigFilePath: path.resolve(__dirname, '../../tsconfig.json'),
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
  if (output.includes('[name]')) {
    generateSplit(source, filename, output, types);
  } else {
    generateMain(source, filename, output, types);
  }
  //if you want ts, tsx files
  if ((config.lang || tsConfig.lang || 'ts') == 'ts') {
    project.saveSync();
  //if you want js, d.ts files
  } else {
    project.emit();
  }
};