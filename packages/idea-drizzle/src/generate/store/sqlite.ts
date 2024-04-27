//types
import type { SourceFile } from 'ts-morph';
import type { ProjectConfig } from '../../types';
//project
import { VariableDeclarationKind } from 'ts-morph';

export default function generate(source: SourceFile, config: ProjectConfig) {
  //import Database from 'better-sqlite3';
  source.addImportDeclaration({
    moduleSpecifier: 'better-sqlite3',
    defaultImport: 'Database'
  });
  //import * as core from 'drizzle-orm/sqlite-core';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/sqlite-core',
    defaultImport: '* as core'
  });
  //import * as orm from 'drizzle-orm/libsql';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/libsql',
    defaultImport: '* as orm'
  });
  //const resourceGlobal = global as unknown;
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resourceGlobal',
      initializer: 'global as unknown as { resource: typeof Database }'
    }]
  });
  //const resource = resourceGlobal.resource || new Database(process.env.DATABASE_FILE);
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resource',
      initializer: `resourceGlobal.resource || ${config.url.type === 'env' 
      ? `new Database(process.env.${config.url.value} as string)`
      : `new Database('${config.url.value}')`}`
    }]
  });
  //const db = orm.drizzle(resource, { schema });
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'db',
      initializer: 'orm.drizzle(resource, { schema })'
    }]
  });
  //if (process.env.NODE_ENV !== 'production') {
  //  resourceGlobal.resource = resource
  //}
  source.addStatements(`if (process.env.NODE_ENV !== 'production') {`);
  source.addStatements(`  resourceGlobal.resource = resource`);
  source.addStatements(`}`);
  //export { core, orm, resource, db };
  source.addExportDeclaration({
    namedExports: [ 'core', 'orm', 'resource', 'db' ]
  });
};