//types
import type { SourceFile } from 'ts-morph';
import type { ProjectConfig } from '../../types';
//project
import { VariableDeclarationKind } from 'ts-morph';

export default function generate(source: SourceFile, config: ProjectConfig) {
  //import type { NeonQueryFunction } from '@neondatabase/serverless;
  source.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: '@neondatabase/serverless',
    namedImports: [ 'NeonQueryFunction' ]
  });
  //import { neon } from '@neondatabase/serverless';
  source.addImportDeclaration({
    moduleSpecifier: '@neondatabase/serverless',
    namedImports: [ 'neon' ]
  });
  //import * as core from 'drizzle-orm/pg-core';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/pg-core',
    defaultImport: '* as core'
  });
  //import * as orm from 'drizzle-orm/neon-http';
  source.addImportDeclaration({
    moduleSpecifier: 'drizzle-orm/neon-http',
    defaultImport: '* as orm'
  });
  //const resourceGlobal = global as unknown;
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resourceGlobal',
      initializer: 'global as unknown as { resource: NeonQueryFunction<false, false> }'
    }]
  });
  //const resource = resourceGlobal.resource || neon(process.env.DRIZZLE_DATABASE_URL!);
  source.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'resource',
      initializer: `resourceGlobal.resource || ${config.url.type === 'env' 
        ? `neon(process.env.${config.url.value} as string)`
        : `neon('${config.url.value}')`
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