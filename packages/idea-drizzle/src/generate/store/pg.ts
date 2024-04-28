//types
import type { SourceFile } from 'ts-morph';
import type { ProjectConfig } from '../../types';
//project
import { VariableDeclarationKind } from 'ts-morph';
//helpers
import { formatCode } from '../../helpers';

export default function generate(source: SourceFile, config: ProjectConfig) {
  //import { Pool } from 'pg';
  source.addImportDeclaration({
    moduleSpecifier: 'pg',
    namedImports: [ 'Pool' ]
  });
  //import * as core from 'drizzle-orm/pg-core';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/pg-core',
    defaultImport: '* as core'
  });
  //import * as orm from "drizzle-orm/node-postgres";
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/node-postgres',
    defaultImport: '* as orm'
  });
  //const resourceGlobal = global as unknown as Pool;
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resourceGlobal',
      initializer: 'global as unknown as { resource: Pool }'
    }]
  });
  //const resource = resourceGlobal.resource || new Pool({ 
  //  connectionString: process.env.DATABASE_URL 
  //});
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resource',
      initializer: formatCode(`resourceGlobal.resource || new Pool({
        connectionString: ${config.url.type === 'env' 
          ? `process.env.${config.url.value} as string`
          : `'${config.url.value}'`}
      })`)
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