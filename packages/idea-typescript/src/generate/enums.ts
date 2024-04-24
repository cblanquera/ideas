//types
import type { Projects } from '../types';
//project
import { SourceFile } from 'ts-morph';
import { Enum } from '@blanquera/idea-spec';

/**
 * This is the The params comes form the cli
 */
export default function generate(projects: Projects) {
  //enums "modules/enums"
  //enums "modules/[name]"
  //enums "./modules/enums"
  //enums "./modules/[name]"
  //enums "../modules/enums"
  //enums "../modules/[name]"
  //enums "env(OUTPUT)"
  //check if we need to split types by files 
  //or put it into one singular file
  const split = projects.enums.output.includes('[name]');
  //determine outfile
  //get master source file
  const master = projects.enums.file 
    ? projects.enums.file
    : !split 
    ? projects.enums.source.createSourceFile(
        projects.enums.filename, 
        '', 
        { overwrite: true }
      )
    : null;
  //loop through enums
  for (const name in Enum.configs) {
    //determine the source file
    const source = split 
      ? projects.enums.source.createSourceFile(
          projects.enums.filename.replaceAll('[name]', name.toLowerCase()), 
          '', 
          { overwrite: true }
        )
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
};