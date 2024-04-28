//types
import type { Directory } from 'ts-morph';
import type { Column } from 'idea-spec';
import type { ProjectConfig } from '../../types';
import type { Relations } from './types';
//helpers
import path from 'path';
import { 
  Project, 
  VariableDeclarationKind,
  IndentationText
} from 'ts-morph';
import { Loader } from '@ossph/idea';
import { Model } from 'idea-spec';
import { camelize, formatCode } from '../../helpers';
import getColumn from './column';

//schema "./modules/[name]/schema"
//schema "./modules/schema"

export default function generate(config: ProjectConfig) {
  const output = config.paths.schema;
  // /FULL_PATH/modules
  const dirname = output.includes(`${path.sep}[name]`) 
    ? output.split(`${path.sep}[name]`)[0]
    : output.includes('[name]') 
    ? output.split('[name]')[0]
    : path.dirname(output);
  //determine outfile
  const filename = path.extname(output) === '.ts' ? (
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

  if (config.paths.schema.includes('[name]')) {
    generateSplit(source, filename, config);
  } else {
    generateMain(source, filename, config);
  }

  //if you want ts, tsx files
  if (config.lang == 'ts') {
    project.saveSync();
  //if you want js, d.ts files
  } else {
    project.emit();
  }
}

function generateSplit(
  source: Directory,
  filename: string,
  config: ProjectConfig
) {
  const engine = config.engine.type === 'env' 
    ? `process.env.${config.engine.value}` 
    : config.engine.value;
  //loop through models
  for (const name in Model.configs) {
    const model = new Model(name);
    const relations: Relations = Object.fromEntries(model.relations.map(column => {
      const foreignTable = camelize(column.type);
      const foreignId = column.relation?.parent.key.name;
      const localTable = model.name;
      const localId = column.relation?.child.key.name;
      return [localId, { localTable, localId, foreignTable, foreignId }];
    }).filter(relation => relation[0]));
  
    const definitions = model.columns.map(column => ({
      column, 
      type: getColumn(column, engine, relations)
    }));
  
    const methods = definitions
      .map(definition => definition.type[0])
      .map(method => method?.name)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
  
    const columns = definitions
      .map(definition => [
        definition.column, 
        definition.type
      ] as [ Column, { name: string, args: string[] }[] ])
      .filter(column => column[1].length > 0)
      .map(column => [
        column[0], 
        column[1].map(
          column => `${column.name}(${column.args.join(', ')})`
        )
      ] as [Column, string[]])
      .map(column => `${column[0].name}: ${column[1].join('.')}`) as string[];
    
    const indexes = model.columns.map(column => {
      if (column.unique) {
        if (!methods.includes('uniqueIndex')) methods.push('uniqueIndex');
        return `${
          column.name
        }Index: uniqueIndex('${
          model.lower
        }_${
          column.name
        }_idx').on(${
          model.camel
        }.${column.name})`;
      } else if (column.indexable) {
        if (!methods.includes('index')) methods.push('index');
        return `${
          column.name
        }Index: index('${
          model.lower
        }_${
          column.name
        }_idx').on(${
          model.camel
        }.${column.name})`;
      }
      return false;
    }).filter(Boolean) as string[];
  
    if (model.ids.length > 0) {
      methods.push('primaryKey');
      const keyName = model.ids.length > 1 
        ? `${model.camel}PrimaryKeys`
        : `${model.camel}PrimaryKey` 
      indexes.unshift(`${keyName}: primaryKey({ columns: [${
        model.ids.map(column => `${model.camel}.${column.name}`).join(', ')
      }] })`);
    }

    const file = source.createSourceFile(
      model.destination(filename), 
      '', 
      { overwrite: true }
    );

    //import { sql } from 'drizzle-orm/sql';
    if (model.columns.some(column => column.default === 'now()')) {
      file.addImportDeclaration({
        moduleSpecifier: 'drizzle-orm/sql',
        namedImports: [ 'sql' ]
      });
    }

    //import { pgTable as table, integer, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
    //...or...
    //import { mysqlTable as table, int as integer, mysqlEnum, uniqueIndex, varchar, serial } from 'drizzle-orm/mysql-core';
    //...or...
    //import { sqliteTable as table, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
    if (['neon', 'xata', 'postgres', 'pg', 'vercel'].includes(engine)) {
      file.addImportDeclaration({
        moduleSpecifier: 'drizzle-orm/pg-core',
        namedImports: ['pgTable as table', ...methods]
      });
    } else if (['planetscale', 'mysql'].includes(engine)) {
      file.addImportDeclaration({
        moduleSpecifier: 'drizzle-orm/mysql-core',
        namedImports: ['mysqlTable as table', ...methods]
      });
    } else if (['sqlite'].includes(engine)) {
      file.addImportDeclaration({
        moduleSpecifier: 'drizzle-orm/sqlite-core',
        namedImports: ['sqliteTable as table', ...methods]
      });
    }
    //import { createId as cuid } from '@paralleldrive/cuid2';
    if (model.columns.some(column => column.default === 'cuid()')) {
      file.addImportDeclaration({
        moduleSpecifier: '@paralleldrive/cuid2',
        namedImports: ['createId as cuid']
      });
    }
    //import { nanoid } from 'nanoid'
    const nanoids = model.columns.filter(
      column => typeof column.default === 'string' 
        && /^nanoid\(\d*\)$/.test(column.default)
    );
    if (nanoids.length > 0) {
      file.addImportDeclaration({
        moduleSpecifier: 'nanoid',
        namedImports: ['nanoid']
      });
    }

    Object.values(Object.fromEntries(model.relations.map(
        column => [column.type, column.model as Model]
    ))).forEach(foreign => {
      //import profile from '[paths.schema]'
      file.addImportDeclaration({
        moduleSpecifier: Loader.relative(
          model.destination(config.paths.schema), 
          foreign.destination(config.paths.schema)
        ),
        defaultImport: foreign.camel
      });
    });

    //export default table('Auth', {});
    file.addExportAssignment({
      isExportEquals: false,
      expression: formatCode(`table('${model.title}', {
        ${columns.join(',\n        ')}
      }, ${model.camel} => ({
        ${indexes.join(',\n        ')}
      }))`)
    });
  }
}

function generateMain(
  source: Directory,
  filename: string,
  config: ProjectConfig
) {
  const engine = config.engine.type === 'env' 
    ? `process.env.${config.engine.value}` 
    : config.engine.value;
  const file = source.createSourceFile(
    filename, 
    '', 
    { overwrite: true }
  );
  //collect imports that need to be imported
  const imports: Record<string, string[]> = {};
  for (const name in Model.configs) {
    const model = new Model(name);
    const relations: Relations = Object.fromEntries(model.relations.map(column => {
      const foreignTable = camelize(column.type);
      const foreignId = column.relation?.parent.key.name;
      const localTable = model.name;
      const localId = column.relation?.child.key.name;
      return [localId, { localTable, localId, foreignTable, foreignId }];
    }).filter(relation => relation[0]));
  
    const definitions = model.columns.map(column => ({
      column, 
      type: getColumn(column, engine, relations)
    }));
  
    const methods = definitions
      .map(definition => definition.type[0])
      .map(method => method?.name)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
  
    const columns = definitions
      .map(definition => [
        definition.column, 
        definition.type
      ] as [ Column, { name: string, args: string[] }[] ])
      .filter(column => column[1].length > 0)
      .map(column => [
        column[0], 
        column[1].map(
          column => `${column.name}(${column.args.join(', ')})`
        )
      ] as [Column, string[]])
      .map(column => `${column[0].name}: ${column[1].join('.')}`) as string[];
    
    const indexes = model.columns.map(column => {
      if (column.unique) {
        if (!methods.includes('uniqueIndex')) methods.push('uniqueIndex');
        return `${
          column.name
        }Index: uniqueIndex('${
          model.lower
        }_${
          column.name
        }_idx').on(${
          model.camel
        }.${column.name})`;
      } else if (column.indexable) {
        if (!methods.includes('index')) methods.push('index');
        return `${
          column.name
        }Index: index('${
          model.lower
        }_${
          column.name
        }_idx').on(${
          model.camel
        }.${column.name})`;
      }
      return false;
    }).filter(Boolean) as string[];
  
    if (model.ids.length > 0) {
      methods.push('primaryKey');
      const keyName = model.ids.length > 1 
        ? `${model.camel}PrimaryKeys`
        : `${model.camel}PrimaryKey` 
      indexes.unshift(`${keyName}: primaryKey({ columns: [${
        model.ids.map(column => `${model.camel}.${column.name}`).join(', ')
      }] })`);
    }
  
    //import { sql } from 'drizzle-orm/sql';
    if (model.columns.some(column => column.default === 'now()')) {
      imports['drizzle-orm/sql'] = [ 'sql' ];
    }
  
    //import { pgTable as table, integer, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
    //...or...
    //import { mysqlTable as table, int as integer, mysqlEnum, uniqueIndex, varchar, serial } from 'drizzle-orm/mysql-core';
    //...or...
    //import { sqliteTable as table, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
    if (['neon', 'xata', 'postgres', 'pg', 'vercel'].includes(engine)) {
      //if the import doesn't exist, 
      if (!imports['drizzle-orm/pg-core']) {
        //create it
        imports['drizzle-orm/pg-core'] = [];
      }
      //just add it and we will worry about unique later
      imports['drizzle-orm/pg-core'].push('pgTable as table', ...methods)
    } else if (['planetscale', 'mysql'].includes(engine)) {
      //if the import doesn't exist, 
      if (!imports['drizzle-orm/mysql-core']) {
        //create it
        imports['drizzle-orm/mysql-core'] = [];
      }
      //just add it and we will worry about unique later
      imports['drizzle-orm/mysql-core'].push('mysqlTable as table', ...methods);
    } else if (['sqlite'].includes(engine)) {
      //if the import doesn't exist, 
      if (!imports['drizzle-orm/sqlite-core']) {
        //create it
        imports['drizzle-orm/sqlite-core'] = [];
      }
      //just add it and we will worry about unique later
      imports['drizzle-orm/sqlite-core'].push('sqliteTable as table', ...methods);
    }
    //import { createId as cuid } from '@paralleldrive/cuid2';
    if (model.columns.some(column => column.default === 'cuid()')) {
      imports['@paralleldrive/cuid2'] = ['createId as cuid'];
    }
    //import { nanoid } from 'nanoid'
    const nanoids = model.columns.filter(
      column => typeof column.default === 'string' 
        && /^nanoid\(\d*\)$/.test(column.default)
    );
    if (nanoids.length > 0) {
      imports['nanoid'] = ['nanoid'];
    }
    
    //export const auth = table('Auth', {});
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: model.camel,
        initializer: formatCode(`table('${model.title}', {
          ${columns.join(',\n        ')}
        }, ${model.camel} => ({
          ${indexes.join(',\n        ')}
        }))`),
      }],
    });
  }

  Object.entries(imports).forEach(([moduleSpecifier, namedImports]) => {
    file.addImportDeclaration({
      moduleSpecifier,
      //make unique
      namedImports: namedImports.filter(
        (value, index, self) => self.indexOf(value) === index
      )
    });
  });

  //const schema = { auth, profile, connection };
  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'schema',
      initializer: `{ ${Object.keys(Model.configs).map(name => {
        const model = new Model(name);
        return model.camel;
      }).join(', ')} }`
    }]
  });

  //export default schema;
  file.addExportAssignment({
    isExportEquals: false,
    expression: 'schema'
  });
}