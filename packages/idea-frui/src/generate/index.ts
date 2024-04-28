//types
import type { PluginWithCLIProps } from '@ossph/idea';
//project
import path from 'path';
import { Project, IndentationText } from 'ts-morph';
import { Model, Fieldset, ensolute } from 'idea-spec';
//generators
import generateList from './list';
import generateView from './view';
import generateForm from './form';

// Sample idea config
//
// plugin "idea-frui" {
//   lang "ts"
//   output "./modules/[name]/components"
// }

/**
 * This is the The params comes form the cli
 */
export default function generate({ config, schema, cli }: PluginWithCLIProps) {
  //we need an output path
  if (typeof config.output !== 'string') {
    return cli.terminal.error('Output path is required');
  }
  //populate model cache
  for (const name in schema.model) {
    Model.add(schema.model[name]);
  }
  //populate fieldset cache
  for (const name in schema.type) {
    Fieldset.add(schema.type[name]);
  }

  //output "modules/[name]/components"
  const output = ensolute(config.output, cli.cwd);
  if (typeof output !== 'string') {
    return cli.terminal.error('Output path is invalid');
  } else if (!output.includes('[name]')) {
    return cli.terminal.error('Output path must include [name]');
  }
  
  // /FULL_PATH/modules
  const dirname = output.includes(`${path.sep}[name]`) 
    ? output.split(`${path.sep}[name]`)[0]
    : output.split('[name]')[0];
  //determine outfile
  const filename = output.split(dirname)[1].startsWith('/')
    //cannot have leading slash (will error)
    ? output.split(dirname)[1].substring(1)
    : output.split(dirname)[1];
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

  //loop through the models
  for (const name in Model.configs) {
    const model = new Model(name);
    generateList(source, model, filename);
    generateView(source, model, filename);
    generateForm(source, model, filename);
  }

  //if you want ts, tsx files
  if ((config.lang || 'ts') == 'ts') {
    project.saveSync();
  //if you want js, d.ts files
  } else {
    project.emit();
  }
};