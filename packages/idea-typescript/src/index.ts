//types
import type { PluginProps } from '@ossph/idea';
//project
import path from 'path';
import { Project, SourceFile, IndentationText } from 'ts-morph';
import { Loader } from '@ossph/idea';
import { Model, Fieldset, Enum, deconstruct } from '@blanquera/idea-map';
//generators
import generateModel from './generate/model';
import generateFieldset from './generate/fieldset';

// Sample idea config
// plugin "@blanquera/idea-typescript" {
//   lang "ts"
//   output "./modules/types.ts"
// }
// or 
// plugin "@blanquera/idea-typescript" {
//   lang "ts"
//   output "./modules/[name]/types.ts"
// }
// or 
// plugin "@blanquera/idea-typescript" {
//   lang "ts"
//   output "env(OUTPUT)"
// }

/**
 * This is the The params comes form the cli
 */
export default function generate({ config, schema, cli }: PluginProps) {
  if (!schema.model) {
    return cli.terminal.error('No models found in schema');
  }

  //populate model cache
  for (const name in schema.model) {
    Model.add(schema.model[name]);
  }
  //populate fieldset cache
  for (const name in schema.type) {
    Fieldset.add(schema.type[name]);
  }
  //populate enum cach
  for (const name in schema.enum) {
    Enum.add(name, schema.enum[name]);
  }

  if (typeof config.output !== 'string') {
    return cli.terminal.error('Output path is required');
  }
  //output "modules/types.ts"
  //output "modules/[name]/types.ts"
  //output "./modules/types.ts"
  //output "./modules/[name]/types.ts"
  //output "../modules/types.ts"
  //output "../modules/[name]/types.ts"
  //output "env(OUTPUT)"
  const output = deconstruct<string>(config.output);
  // /FULL_PATH/modules/types.ts"
  // /FULL_PATH/modules/[name]/types.ts"
  // /FULL_PATH/modules/types/[name].ts"
  const destination = output.type === 'env' 
    ? process.env[output.value]
    : Loader.absolute(output.value);
  if (typeof destination !== 'string') {
    return cli.terminal.error('Output path is invalid');
  }
  // /FULL_PATH/modules
  const outDir = destination.includes(`${path.sep}[name]`) 
    ? destination.split(`${path.sep}[name]`)[0]
    : destination.includes('[name]') 
    ? destination.split('[name]')[0]
    : path.dirname(destination);
  //determine outfile
  const outFile = destination.split(outDir)[1].startsWith('/')
    //cannot have leading slash (will error)
    ? destination.split(outDir)[1].substring(1)
    : destination.split(outDir)[1];
  //set up the ts-morph project
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      outDir: outDir,
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
  const root = project.createDirectory(outDir);
  //check if we need to split types by files 
  //or put it into one singular file
  const split = destination.includes('[name]');
  //determine outfile
  //get master source file
  const master = !split 
    ? root.createSourceFile(outFile, '', { overwrite: true })
    : null;
  //loop through models
  for (const name in Model.configs) {
    //get the model
    const model = new Model(name);
    //get the final path
    const path = model.destination(outFile);
    //determine the source file
    const source = split 
      ? root.createSourceFile(path, '', { overwrite: true })
      : master as SourceFile;
    //generate the model
    generateModel(source, model, destination);
  }
  //loop through fieldsets
  for (const name in Fieldset.configs) {
    //get the fieldset
    const fieldset = new Fieldset(name);
    //get the final path
    const path = fieldset.destination(outFile);
    //determine the source file
    const source = split 
      ? root.createSourceFile(path, '', { overwrite: true })
      : master as SourceFile;
    //generate the fieldset
    generateFieldset(source, fieldset, destination);
  }
  //if you want ts, tsx files
  if ((config.lang || 'ts') == 'ts') {
    project.saveSync();
  //if you want js, d.ts files
  } else {
    project.emit();
  }
};