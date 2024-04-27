//types
import type { Directory } from 'ts-morph';
import type { Terminal } from '@ossph/idea';
import type { ProjectConfig } from '../../types';
//generators
import generateCreate, { body as createBody } from './create';
import generateDetail, { body as detailBody } from './detail';
import generateRemove, { body as removeBody } from './remove';
import generateRestore, { body as restoreBody } from './restore';
import generateSearch, { body as searchBody } from './search';
import generateUpdate, { body as updateBody } from './update';
//helpers
import path from 'path';
import { Loader } from '@ossph/idea';
import { 
  Project, 
  IndentationText, 
  VariableDeclarationKind 
} from 'ts-morph';
import { Model, ensolute } from 'idea-spec';
import { map, formatCode } from '../../helpers';

//actions "./modules/[name]/actions/[action]"
//actions "./modules/[name]/actions"
//actions "./modules/actions"

//output "./modules/[name]/assert"
//output "./modules/assert"

export default function generate(config: ProjectConfig, cli: Terminal) {
  const output = ensolute(config.paths.actions, cli.cwd);
  if (typeof output !== 'string') {
    return cli.terminal.error('Output path is invalid');
  }
  
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

  if (output.includes('[name]')) {
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
};

function generateSplit(
  source: Directory,
  filename: string,
  config: ProjectConfig
) {
  //loop through models
  for (const name in Model.configs) {
    const model = new Model(name);
    const file = source.createSourceFile(
      model.destination(filename), 
      '', 
      { overwrite: true }
    );
    //import type { SQL } from 'drizzle-orm';
    file.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: 'drizzle-orm',
      namedImports: [ 'SQL' ]
    });
    //import type { ResponsePayload, SearchParams } from 'idea-drizzle';
    file.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: 'idea-drizzle',
      namedImports: [ 'ResponsePayload', 'SearchParams' ]
    });
    //import type { ProfileModel, ProfileExtended, ProfileCreateInput, ProfileUpdateInput } from '[paths.types]';
    file.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: Loader.relative(
        config.paths.actions, 
        model.destination(config.paths.types)
      ),
      namedImports: [ 
        model.title,
        `${model.title}Extended`, 
        `${model.title}CreateInput`, 
        `${model.title}UpdateInput` 
      ]
    });
    //import { sql, eq } from 'drizzle-orm';
    file.addImportDeclaration({
      moduleSpecifier: 'drizzle-orm',
      namedImports: [ 'count', 'and' ].concat(
        model.ids.length > 1 ? [ 'sql' ] : [ 'eq' ]
      ).concat(
        model.spanables.length > 0 ? [ 'lte', 'gte' ]: []
      ).concat([ 'asc', 'desc' ]).concat(
        model.searchables.length > 0 ? [ 'or', 'ilike' ]: []
      )
    });
    //import { Exception, toResponse, toErrorResponse } from 'idea-drizzle';
    file.addImportDeclaration({
      moduleSpecifier: 'idea-drizzle',
      namedImports: [ 
        'Exception', 
        'toResponse', 
        'toErrorResponse',
        ...[
          ...model.assertions, 
          ...model.filterables, 
          ...model.spanables
        ].filter(
          column => !!map.helper[column.type]
        ).map(
          column => map.helper[column.type]
        ).filter(
          (value, index, self) => self.indexOf(value) === index
        )
      ]
    });

    if (config.paths.assert.includes('[name]')) {
      //import * as assert from '[paths.assert]';
      file.addImportDeclaration({
        moduleSpecifier: Loader.relative(
          config.paths.actions, 
          model.destination(config.paths.assert)
        ),
        defaultImport: '* as assert'
      });
    } else {
      //import assert from '[paths.assert]';
      file.addImportDeclaration({
        moduleSpecifier: Loader.relative(
          config.paths.actions, 
          config.paths.assert
        ),
        defaultImport: 'assert'
      });
    }

    const assertCreateName = config.paths.assert.includes('[name]') 
      ? `assert.create`
      : `assert.${model.camel}.create`;

    const assertUpdateName = config.paths.assert.includes('[name]') 
      ? `assert.update`
      : `assert.${model.camel}.update`;

    //import { db, schema } from '[paths.store]';
    file.addImportDeclaration({
      moduleSpecifier: Loader.relative(
        config.paths.actions, 
        model.destination(config.paths.store)
      ),
      namedImports: [ 'db', 'schema', 'core' ]
    });

    generateCreate(file, config, model, true, 'create', assertCreateName);
    generateDetail(file, model, true, 'detail');
    generateRemove(file, model, true, 'remove');
    generateRestore(file, model, true, 'restore');
    generateSearch(file, model, true, 'search');
    generateUpdate(file, config, model, true, 'update', assertUpdateName);
  }
}

function generateMain(
  source: Directory,
  filename: string,
  config: ProjectConfig
) {
  const file = source.createSourceFile(filename, '', {
    overwrite: true
  });
  //import type { SQL } from 'drizzle-orm';
  file.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: 'drizzle-orm',
    namedImports: [ 'SQL' ]
  });
  //import type { ResponsePayload, SearchParams } from 'idea-drizzle';
  file.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: 'idea-drizzle',
    namedImports: [ 'ResponsePayload', 'SearchParams' ]
  });
  //import { db, schema, core } from '[paths.store]';
  file.addImportDeclaration({
    moduleSpecifier: Loader.relative(
      config.paths.actions, 
      config.paths.store
    ),
    namedImports: [ 'db', 'schema', 'core' ]
  });
  if (!config.paths.assert.includes('[name]')) {
    //import assert from '[paths.assert]';
    file.addImportDeclaration({
      moduleSpecifier: Loader.relative(
        config.paths.actions, 
        config.paths.assert
      ),
      defaultImport: 'assert'
    });
  }

  const imports: Record<string, string[]> = {};
  //loop through models
  for (const name in Model.configs) {
    const model = new Model(name);
    //import type { 
    //  ProfileModel, 
    //  ProfileExtended, 
    //  ProfileCreateInput, 
    //  ProfileUpdateInput 
    //} from '[paths.types]';
    file.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: Loader.relative(
        config.paths.actions, 
        model.destination(config.paths.types)
      ),
      namedImports: [ 
        model.title,
        `${model.title}Extended`, 
        `${model.title}CreateInput`, 
        `${model.title}UpdateInput` 
      ]
    });
    //import { sql, eq } from 'drizzle-orm';
    if (!imports['drizzle-orm']) {
      imports['drizzle-orm'] = [];
    }
    imports['drizzle-orm'].push(...[ 'count', 'and' ].concat(
      model.ids.length > 1 ? [ 'sql' ] : [ 'eq' ]
    ).concat(
      model.spanables.length > 0 ? [ 'lte', 'gte' ]: []
    ).concat([ 'asc', 'desc' ]).concat(
      model.searchables.length > 0 ? [ 'or', 'ilike' ]: []
    ));
    //import { Exception, toResponse, toErrorResponse } from 'idea-drizzle';
    if (!imports['idea-drizzle']) {
      imports['idea-drizzle'] = [];
    }

    imports['idea-drizzle'].push(
      'Exception', 
      'toResponse', 
      'toErrorResponse',
      ...[
        ...model.assertions, 
        ...model.filterables, 
        ...model.spanables
      ].filter(
        column => !!map.helper[column.type]
      ).map(
        column => map.helper[column.type]
      ).filter(
        (value, index, self) => self.indexOf(value) === index
      )
    );
    if (config.paths.assert.includes('[name]')) {
      //import * as assert from '[paths.assert]';
      file.addImportDeclaration({
        moduleSpecifier: Loader.relative(
          config.paths.actions, 
          model.destination(config.paths.assert)
        ),
        defaultImport: `* as assert${model.title}`
      });
    }

    const assertCreateName = config.paths.assert.includes('[name]') 
      ? `assert${model.title}.create`
      : `assert.${model.camel}.create`;

    const assertUpdateName = config.paths.assert.includes('[name]') 
      ? `assert${model.title}.update`
      : `assert.${model.camel}.update`;

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{
        name: model.camel,
        initializer: formatCode(`{
          async create(input: ${model.title}CreateInput): Promise<ResponsePayload<${model.title}>> {
            ${createBody(config, model, assertCreateName)}
          },
          async detail(${model.ids.map(
            column => `${column.name}: ${map.type[column.type]}`
          ).join(', ')}): Promise<ResponsePayload<${model.title}Extended|null>> {
            ${detailBody(model, `${model.camel}.search`)}
          },
          async remove(${model.ids.map(
            column => `${column.name}: ${map.type[column.type]}`
          ).join(', ')}): Promise<ResponsePayload<${model.title}>> {
            ${removeBody(model)}
          },
          async restore(${model.ids.map(
            column => `${column.name}: ${map.type[column.type]}`
          ).join(', ')}): Promise<ResponsePayload<${model.title}>> {
            ${restoreBody(model)}
          },
          async search(query: SearchParams): Promise<ResponsePayload<${model.title}Extended[]>> {
            ${searchBody(model)}
          },
          async update(${model.ids.map(
            column => `${column.name}: ${map.type[column.type]}`
          ).join(', ')}, input: ${model.title}UpdateInput): Promise<ResponsePayload<${model.title}>> {
            ${updateBody(config, model, assertUpdateName)}
          },
        }`)
      }]
    });
  }

  //const actions = { profile, ...};
  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'actions',
      initializer: formatCode(`{
        ${Object.keys(Model.configs).map(name => {
          const model = new Model(name);
          return `${model.camel}`;
        }).join(',\n')}
      }`)
    }]
  });

  file.addExportAssignment({
    expression: 'actions',
    isExportEquals: false
  });

  //add imports
  for (const specifier in imports) {
    file.addImportDeclaration({
      moduleSpecifier: specifier,
      //remove duplicates
      namedImports: imports[specifier].filter(
        (value, index, self) => {
          return self.indexOf(value) === index;
        }
      )
    });
  }
}