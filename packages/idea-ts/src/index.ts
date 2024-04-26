//types
import type { PluginWithCLIProps } from '@ossph/idea';
import type { Projects } from './types';
//project
import path from 'path';
import { Project, IndentationText } from 'ts-morph';
import { Model, Fieldset, Enum, ensolute } from 'idea-spec';
//transformers
import enumGenerator from './generate/enums';
import typeGenerator from './generate/types';

// Sample idea config
// plugin "idea-ts" {
//   lang "ts"
//   enums "./modules/enums"
//   types "./modules/types"
// }
// or 
// plugin "idea-ts" {
//   lang "ts"
//   enums "./modules/[name]"
//   types "./modules/[name]/types"
// }
// or 
// plugin "idea-ts" {
//   lang "ts"
//   enums "env(ENUMS)"
//   types "env(TYPES)"
// }

/**
 * This is the The params comes form the cli
 */
export default function generate({ config, schema, cli }: PluginWithCLIProps) {
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
  
  const lang = config.lang as string || 'ts';
  const types = typeof config.types === 'string' 
    ? ensolute(config.types, cli.cwd)
    : config.types;
  const enums = typeof config.enums === 'string' 
    ? ensolute(config.enums, cli.cwd)
    : config.enums;

  const projects: Projects = {};
  //if there is an enum output path
  if (typeof enums === 'string') {
    projects.enums = make(enums);
  } 
  //if there is a type output path
  if (typeof types === 'string') {
    //if types and enums paths are the same, use the same project
    if (enums === types && !enums.includes('[name]')) {
      //should share the same file
      projects.enums.file = projects.enums.source.createSourceFile(
        projects.enums.filename, 
        '', 
        { overwrite: true }
      )
      projects.types = projects.enums;
    } else {
      projects.types = make(types);
    }
  }
  //if there is an enum output path
  if (typeof enums === 'string') {
    //generate enums
    enumGenerator(projects);
  } 
  //if there is a type output path
  if (typeof config.types === 'string') {
    //generate typescript
    typeGenerator(projects);
  }

  //if you want ts, tsx files
  if (lang === 'ts') {
    projects.types.project.saveSync();
    if (enums !== types) {
      projects.enums.project.saveSync();
    }
  //if you want js, d.ts files
  } else {
    projects.types.project.emit();
  }
};

export function make(output: string) {
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

  return { output, dirname, filename, project, source };
}