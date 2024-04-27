//types
import type { ProjectConfig } from '../../types';
//project
import { Project, IndentationText } from 'ts-morph';
//generators
import generateSchema from './schema';
import generateMysql from './mysql';
import generateSqlite from './sqlite';
import generatePostgres from './postgres';
import generatePG from './pg';
import generateVercel from './vercel';
import generatePlanetScale from './planetscale';
import generateNeon from './neon';
import generateXata from './xata';
//helpers
import path from 'path';

export default function generate(config: ProjectConfig) {
  const dirname = path.dirname(config.paths.store);
  const extname = path.extname(config.paths.store);
  const basename = path.basename(config.paths.store, extname);
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../../../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      outDir: dirname,
      declaration: true, // Generates corresponding '.d.ts' file.
      declarationMap: true, // Generates a sourcemap for each corresponding '.d.ts' file.
      sourceMap: true, // Generates corresponding '.map' file.
    },
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces
    }
  });
  const source = project.createDirectory(dirname);
  const file = source.createSourceFile(`${basename}.ts`, '', {
    overwrite: true
  });

  const engine = config.engine.type === 'env' 
    ? process.env[config.engine.value] 
    : config.engine.value;

  generateSchema(file, config);

  switch (engine) {
    case 'neon':
      generateNeon(file, config);
      break;
    case 'xata':
      generateXata(file, config);
      break;
    case 'postgres':
      generatePostgres(file, config);
      break;
    case 'pg':
      generatePG(file, config);
      break;
    case 'vercel':
      generateVercel(file, config);
      break;
    case 'planetscale':
      generatePlanetScale(file, config);
      break;
    case 'mysql':
      generateMysql(file, config);
      break;
    case 'sqlite':
      generateSqlite(file, config);
      break;
  }

  //if you want ts, tsx files
  if (config.lang === 'ts') {
    project.saveSync();
  //if you want js, d.ts files
  } else {
    project.emit();
  }
};