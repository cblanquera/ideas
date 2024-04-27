//types
import type { SourceFile } from 'ts-morph';
import type { Column } from 'idea-spec';
import type { ProjectConfig } from '../../types';
//helpers
import { 
  VariableDeclarationKind 
} from 'ts-morph';
import { Model } from 'idea-spec';
import { map, camelize, formatCode } from '../../helpers';

type Method = { 
  name: string, 
  args: string[] 
};
type Relations = Record<string, {
  localTable: string,
  localId: string,
  foreignTable: string,
  foreignId: string
}>;

export default function generate(source: SourceFile, config: ProjectConfig) {
  const engine = config.engine.type === 'env' 
    ? `process.env.${config.engine.value}` 
    : config.engine.value;
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
    source.addVariableStatement({
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
    source.addImportDeclaration({
      moduleSpecifier,
      //make unique
      namedImports: namedImports.filter(
        (value, index, self) => self.indexOf(value) === index
      )
    });
  });

  //export const schema = { auth, profile, connection };
  source.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'schema',
      initializer: `{ ${Object.keys(Model.configs).map(name => {
        const model = new Model(name);
        return model.camel;
      }).join(', ')} }`
    }]
  });
}

function getCharLength(column: Column) {
  //if is.ceq, is.cgt, is.clt, is.cge, is.cle
  const length: [ number, number ] = [ 0, 255 ];
  column.assertions.forEach(assertion => {
    if (assertion.method === 'ceq') {
      length[0] = assertion.args[0] as number;
      length[1] = assertion.args[0] as number;
    } else if (assertion.method === 'cgt') {
      length[0] = assertion.args[0] as number;
    } else if (assertion.method === 'clt') {
      length[1] = assertion.args[0] as number;
    } else if (assertion.method === 'cge') {
      length[0] = assertion.args[0] as number;
    } else if (assertion.method === 'cle') {
      length[1] = assertion.args[0] as number;
    }
  });
  //if length is less than 1, then 
  //it's invalid so set to 255
  if (length[1] < 1) {
    length[1] = 255;
  }
  return length;
}

function getNumProfile(column: Column) {
  const minmax: [ number, number ] = [ 0, 0 ];
  column.assertions.forEach(assertion => {
    if (assertion.method === 'eq') {
      minmax[0] = assertion.args[0] as number;
      minmax[1] = assertion.args[0] as number;
    } else if (assertion.method === 'gt') {
      minmax[0] = assertion.args[0] as number;
    } else if (assertion.method === 'lt') {
      minmax[1] = assertion.args[0] as number;
    } else if (assertion.method === 'ge') {
      minmax[0] = assertion.args[0] as number;
    } else if (assertion.method === 'le') {
      minmax[1] = assertion.args[0] as number;
    }
  });

  //determine the length of each min/max
  const minIntegerLength = minmax[0].toString().split('.')[0].length;
  const maxIntegerLength = minmax[1].toString().split('.')[0].length;
  const minDecimalLength = (minmax[0].toString().split('.')[1] || '').length;
  const maxDecimalLength = (minmax[1].toString().split('.')[1] || '').length;
  //check for @step(0.01)
  const step = Array.isArray(column.attributes.step) 
    ? column.attributes.step[0] as number
    : 0;
  const stepIntegerLength = step.toString().split('.')[0].length;
  const stepDecimalLength = (step.toString().split('.')[1] || '').length;
  const integerLength = Math.max(
    minIntegerLength, 
    maxIntegerLength, 
    stepIntegerLength
  );
  const decimalLength = Math.max(
    minDecimalLength, 
    maxDecimalLength, 
    stepDecimalLength
  );

  return {
    step,
    minmax,
    minIntegerLength, 
    maxIntegerLength,
    minDecimalLength,
    maxDecimalLength,
    stepIntegerLength,
    stepDecimalLength,
    integerLength,
    decimalLength
  };
}

function getAttributes(column: Column, relations: Relations) {
  const attributes: { name: string, args: string[] }[] = [];
  if (column.required) {
    attributes.push({ name: 'notNull', args: [] });
  }
  if (typeof column.default !== 'undefined') {
    if (column.default === 'now()') {
      attributes.push({ name: 'default', args: ['sql`now()`'] });
    } else if (column.default === 'cuid()') {
      attributes.push({ name: '$default', args: ['() => cuid()'] });
    } else if (column.default === 'nanoid()') {
      attributes.push({ name: '$default', args: ['() => nanoid()'] });
    } else if (typeof column.default === 'string' 
      && /^nanoid\(\d+\)$/.test(column.default)
    ) {
      const match = column.default.match(/^nanoid\((\d+)\)$/);
      attributes.push({ 
        name: '$default', 
        args: [`() => nanoid(${match?.[1]??''})`] 
      });
    } else if (typeof column.default === 'string') {
      attributes.push({ name: 'default', args: [ `'${column.default}'` ] });
    } else {
      attributes.push({ name: 'default', args: [ `${column.default}` ] });
    }
  }
  if (column.attributes.autoincrement) {
    attributes.push({ name: 'autoincrement', args: [] });
  }

  if (relations[column.name]) {
    attributes.push({ name: 'references', args: [
      `() => ${
        relations[column.name].foreignTable
      }.${
        relations[column.name].foreignId
      }`
    ] });
  }
  return attributes;
}

function getColumn(column: Column, engine: string, relations: Relations) {
  switch (engine) {
    case 'neon':
    case 'xata':
    case 'postgres':
    case 'pg':
    case 'vercel':
      return getPostgresColumn(column, relations);
    case 'planetscale':
    case 'mysql':
      return getMysqlColumn(column, relations);
    case 'sqlite':
      return getSqliteColumn(column, relations);
  }

  return [] as { name: string, args: string[] }[];
}

function getMysqlColumn(column: Column, relations: Relations) {
  const type = map.mysql[column.type];
  if (!type && !column.fieldset && !column.enum) {
    return [] as Method[];
  }

  let method: Method = { name: type, args: [ `'${column.name}'` ] };

  //array
  if (column.multiple) {
    method.name = 'json';
  //char, varchar
  } else if (type === 'string') {
    const length = getCharLength(column);
    if (length[0] === length[1]) {
      method = { 
        name: 'char', 
        args: [ 
          `'${column.name}'`, 
          `{ length: ${length[1]} }` 
        ] 
      };
    } else {
      method = { 
        name: 'varchar', 
        args: [ 
          `'${column.name}'`, 
          `{ length: ${length[1]} }` 
        ] 
      };
    }
  //integer, smallint, bigint, float
  } else if (type === 'number') {
    const { minmax, integerLength, decimalLength } = getNumProfile(column);

    if (decimalLength > 0) {
      method = { 
        name: 'float', 
        args: [ 
          `'${column.name}'`, 
          JSON.stringify({
            precision: integerLength + decimalLength,
            scale: decimalLength,
            unsigned: minmax[0] < 0
          }).replaceAll('"', '') 
        ] 
      };
    } else if (integerLength === 1) {
      method = { name: 'smallint', args: [ `'${column.name}'` ] };
    } else if (integerLength > 8) {
      method = { name: 'bigint', args: [ `'${column.name}'` ] };
    } else {
      method = { 
        name: 'integer', 
        args: [ 
          `'${column.name}'`, 
          JSON.stringify({
            precision: integerLength,
            unsigned: minmax[0] < 0
          }).replaceAll('"', '') 
        ] 
      };
    }
  //if it's a fieldset
  } else if (column.fieldset) {
    method.name = 'json';
  } else if (column.enum) {
    method = { 
      name: 'varchar', 
      args: [ 
        `'${column.name}'`, 
        `{ length: 255 }` 
      ] 
    };
  }

  return [ method, ...getAttributes(column, relations) ];
}

function getPostgresColumn(column: Column, relations: Relations) {
  const type = map.postgres[column.type];
  if (!type && !column.fieldset && !column.enum) {
    return [] as Method[];
  }

  let method: Method = { name: type, args: [ `'${column.name}'` ] };
  //array
  if (column.multiple) {
    method.name = 'jsonb';
  //char, varchar
  } else if (type === 'string') {
    const length = getCharLength(column);

    if (length[0] === length[1]) {
      method = { 
        name: 'char', 
        args: [ 
          `'${column.name}'`, 
          `{ length: ${length[1]} }` 
        ] 
      };
    } else {
      method = { 
        name: 'varchar', 
        args: [ 
          `'${column.name}'`, 
          `{ length: ${length[1]} }` 
        ] 
      };
    }
  //integer, smallint, bigint, float
  } else if (type === 'number') {
    const { minmax, integerLength, decimalLength } = getNumProfile(column);

    if (decimalLength > 0) {
      method = { 
        name: 'numeric', 
        args: [ 
          `'${column.name}'`, 
          JSON.stringify({
            precision: integerLength + decimalLength,
            scale: decimalLength,
            unsigned: minmax[0] < 0
          }).replaceAll('"', '') 
        ] 
      };
    } else if (integerLength === 1) {
      method = { name: 'smallint', args: [ `'${column.name}'` ] };
    } else if (integerLength > 8) {
      method = { name: 'bigint', args: [ `'${column.name}'` ] };
    } else {
      method = { 
        name: 'integer', 
        args: [ 
          `'${column.name}'`, 
          JSON.stringify({
            precision: integerLength,
            unsigned: minmax[0] < 0
          }).replaceAll('"', '') 
        ] 
      };
    }
  //if it's a type
  } else if (column.fieldset) {
    method.name = 'json';
  } else if (column.enum) {
    method = { 
      name: 'varchar', 
      args: [ 
        `'${column.name}'`, 
        `{ length: 255 }` 
      ] 
    };
  }

  return [ method, ...getAttributes(column, relations) ];
}

function getSqliteColumn(column: Column, relations: Relations) {
  const type = map.sqlite[column.type];
  if (!type && !column.fieldset && !column.enum) {
    return [] as Method[];
  }

  let method: Method = { name: type, args: [ `'${column.name}'` ] };

  //char, varchar
  if (type === 'string') {
    if (column.type === 'Json' 
      || column.type === 'Object' 
      || column.type === 'Hash'
    ) {
      method = { 
        name: 'text', 
        args: [ 
          `'${column.name}'`, 
          "{ mode: 'json' }" 
        ] 
      };
    } else {
      method = { name: 'text', args: [ `'${column.name}'` ] };
    }
  //integer, smallint, bigint, float
  } else if (type === 'number') {
    const { decimalLength } = getNumProfile(column);
    if (column.type === 'Boolean') {
      method = { 
        name: 'integer', 
        args: [ `'${column.name}'`, "{ mode: 'boolean' }" ] 
      };
    } else if (column.type === 'Float' || decimalLength > 0) {
      method = { name: 'real', args: [ `'${column.name}'` ] };
    } else {
      method = { name: 'integer', args: [ `'${column.name}'` ] };
    }
    //if it's a type
  } else if (column.fieldset) {
    method = { 
      name: 'text', 
      args: [ 
        `'${column.name}'`, 
        "{ mode: 'json' }" 
      ] 
    };
  } else if (column.enum) {
    method = { name: 'text', args: [ `'${column.name}'` ] };
  }

  return [ method, ...getAttributes(column, relations) ];
}