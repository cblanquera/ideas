//types
import type { SourceFile } from 'ts-morph';
import type { ProjectConfig } from '../../types';
//project
import { VariableDeclarationKind } from 'ts-morph';

export default function generate(source: SourceFile, config: ProjectConfig) {
  //import type { Connection } from "mysql2";
  source.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: 'mysql2',
    namedImports: [ 'Connection' ]
  });
  //import mysql from "mysql2";
  source.addImportDeclaration({
    moduleSpecifier: 'mysql2',
    defaultImport: 'mysql'
  });
  //import * as core from 'drizzle-orm/mysql-core';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/mysql-core',
    defaultImport: '* as core'
  });
  //import * as orm from "drizzle-orm/mysql2";
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/mysql2',
    defaultImport: '* as orm'
  });
  //const resourceGlobal = global as unknown;
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resourceGlobal',
      initializer: 'global as unknown as { resource: Connection }'
    }]
  });
  //const resource = resourceGlobal.resource || mysql.createConnection(process.env.DATABASE_URL);
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resource',
      initializer: `resourceGlobal.resource || ${config.url.type === 'env' 
      ? `mysql.createConnection(process.env.${config.url.value} as string)`
      : `mysql.createConnection('${config.url.value}')`}`
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
    namedExports: [ 'core', 'orm', 'resource', 'schema', 'db' ]
  });
};