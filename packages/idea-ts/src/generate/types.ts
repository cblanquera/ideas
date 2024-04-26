//types
import type { Projects } from '../types';
//project
import { SourceFile } from 'ts-morph';
import { Model, Fieldset } from 'idea-spec';
//generators
import generateModel from './model';
import generateFieldset from './fieldset';

/**
 * This is the The params comes form the cli
 */
export default function generate(projects: Projects) {
  //check if we need to split types by files 
  //or put it into one singular file
  const split = projects.types.output.includes('[name]');
  //determine outfile
  //get master source file
  const master = projects.types.file 
    ? projects.types.file
    : !split 
    ? projects.types.source.createSourceFile(
        projects.types.filename, 
        '', 
        { overwrite: true }
      )
    : null;
  //loop through models
  for (const name in Model.configs) {
    //get the model
    const model = new Model(name);
    //determine the source file
    const source = split? projects.types.source.createSourceFile(
      //the final path
      model.destination(projects.types.filename), 
      '', 
      { overwrite: true }
    ): master as SourceFile;
    //generate the model
    generateModel(source, model, projects);
  }
  //loop through fieldsets
  for (const name in Fieldset.configs) {
    //get the fieldset
    const fieldset = new Fieldset(name);
    //determine the source file
    const source = split? projects.types.source.createSourceFile(
      //the final path
      fieldset.destination(projects.types.filename), 
      '', 
      { overwrite: true }
    ): master as SourceFile;
    //generate the fieldset
    generateFieldset(source, fieldset, projects);
  }
};