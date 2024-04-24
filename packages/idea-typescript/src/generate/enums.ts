//types
import type { Terminal } from '@ossph/idea';
//project
import path from 'path';
import { Project, SourceFile, IndentationText } from 'ts-morph';
import { Loader } from '@ossph/idea';
import { Enum, deconstruct } from '@blanquera/idea-spec';

/**
 * This is the The params comes form the cli
 */
export default function generate(out: string, lang: string, cli: Terminal) {
  //enums "modules/enums.ts"
  //enums "modules/[name].ts"
  //enums "./modules/enums.ts"
  //enums "./modules/[name].ts"
  //enums "../modules/enums.ts"
  //enums "../modules/[name].ts"
  //enums "env(OUTPUT)"
  const output = deconstruct<string>(out);
  // /FULL_PATH/modules/enums.ts"
  // /FULL_PATH/modules/[name].ts"
  // /FULL_PATH/modules/enums/[name].ts"
  const destination = output.type === 'env' 
    ? process.env[output.value]
    : Loader.absolute(output.value, cli.cwd);
  if (typeof destination !== 'string') {
    return cli.terminal.error('Enums path is invalid');
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
    tsConfigFilePath: path.resolve(__dirname, '../../tsconfig.json'),
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
  //loop through enums
  for (const name in Enum.configs) {
    //get the final path
    const path = outFile.replaceAll('[name]', name.toLowerCase());
    //determine the source file
    const source = split 
      ? root.createSourceFile(path, '', { overwrite: true })
      : master as SourceFile;
    //add enum using ts-morph
    const value = Enum.get(name);
    source.addEnum({
      name: name,
      isExported: true,
      // { name: "ADMIN", value: "Admin" }
      members: Object.keys(value).map(key => ({ 
        name: key, 
        value: value[key] as string
      }))
    });
    
  }
  //if you want ts, tsx files
  if (lang === 'ts') {
    project.saveSync();
  //if you want js, d.ts files
  } else {
    project.emit();
  }
};