//types
import type { SourceFile } from 'ts-morph';
import type { ProjectConfig } from '../../types';
//project
import { VariableDeclarationKind } from 'ts-morph';

export default function generate(source: SourceFile, config: ProjectConfig) {
  //import postgres from 'postgres';
  source.addImportDeclaration({
    moduleSpecifier: 'postgres',
    defaultImport: 'postgres'
  });
  //import * as core from 'drizzle-orm/pg-core';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/pg-core',
    defaultImport: '* as core'
  });
  //import * as orm from 'drizzle-orm/postgres-js';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/postgres-js',
    defaultImport: '* as orm'
  });
  //const resourceGlobal = global as unknown { resource: postgres.Sql };
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resourceGlobal',
      initializer: 'global as unknown as { resource: postgres.Sql }'
    }]
  });
  //const resource = resourceGlobal.resource || postgres(process.env.DATABASE_URL);
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resource',
      initializer: `resourceGlobal.resource || ${config.url.type === 'env' 
        ? `postgres(process.env.${config.url.value} as string)`
        : `postgres('${config.url.value}')`
      }`
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