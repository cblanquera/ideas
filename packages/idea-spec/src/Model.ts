//types
import type { Data, TypeConfig, ModelConfig, ColumnConfig } from '@ossph/idea';
//helpers
import { Exception } from '@ossph/idea';
import Enum from './Enum';
import { camelize, capitalize, toValidator } from './helpers';

export type ColumnRelation = { 
  model: Model, 
  column: Column, 
  key: Column, 
  type: number 
};
export type ColumnRelationLink = { 
  parent: ColumnRelation,
  child: ColumnRelation
};

export type Component = {
  method: string,
  args: Data[],
  attributes: Record<string, Data>
}

export class Column {
  //this is the raw column config collected from exma
  protected _config: ColumnConfig;
  //type or model parent
  protected _fieldset: Fieldset;

  /**
   * Returns true if this column is an @active column
   */
  public get active() {
    return this.attributes.active === true;
  }

  /**
   * Returns the column assertions
   */
  public get assertions() {
    const assertions: {
      method: string,
      args: Data[],
      message: string|null
    }[] = [];

    //if column is system generated
    //if column is a relation to another model
    //if column is related to another model
    if (this.generated || this.relation || this.related) {
      //then there is no need to validate
      //relation columns are not assertable
      //related columns are not assertable
      return assertions;
    }

    //explicit validators
    for (const name in this.attributes) {
      if (!name.startsWith('is.')) {
        continue;
      }
      //we found it.
      const field = this.attributes[name];
      //get the method
      const method = name.replace('is.', '');
      //get the arguments
      const args: Data[] = Array.isArray(field)? field as Data[]: [];
      //the last argument is the message
      const message = typeof args[args.length - 1] !== 'string' 
        ? args.pop() as string
        : null;
        assertions.push({ method, args, message });
    }

    //implied validators
    // String, Text,    Number, Integer, 
    // Float,  Boolean, Date,   Datetime, 
    // Time,   Json,    Object, Hash
    for (const type in toValidator) {
      if (this.type === type) {
        if (this.multiple) {
          if (!assertions.find(v => v.method === 'array')) {
            assertions.unshift({ 
              method: 'array', 
              args: [ toValidator[type] ], 
              message: 'Invalid format'
            });
          }
        } else if (!assertions.find(v => v.method === toValidator[type])) {
          assertions.unshift({ 
            method: toValidator[type], 
            args: [], 
            message: 'Invalid format'
          });
        }
      }
    }
    // - enum
    if (this.enum && !assertions.find(v => v.method === 'option')) {
      assertions.unshift({ 
        method: 'option', 
        args: Object.values(this.enum), 
        message: 'Invalid option'
      });
    }
    // - unique
    if (this.unique) {
      if (!assertions.find(v => v.method === 'unique')) {
        assertions.unshift({ 
          method: 'unique', 
          args: [], 
          message: 'Already exists'
        });
      }
    }
    // - required
    if (this.required && typeof this.default === 'undefined') {
      if (!assertions.find(v => v.method === 'required')) {
        assertions.unshift({ 
          method: 'required', 
          args: [], 
          message: `${this._config.name} is required`
        });
      }
    }

    return assertions;
  }

  /**
   * Returns the column attributes
   * example: @foo @bar() ...
   */
  public get attributes() {
    return this._config.attributes as Record<string, true|Data[]>;
  }

  /**
   * Returns the column config
   */
  public get config() {
    return this._config;
  }

  /**
   * Returns the column @default value
   * example: @default("some value")
   */
  public get default() {
    //@default("some value")
    if (Array.isArray(this._config.attributes.default)) {
      return this._config.attributes.default[0];
    }
    return undefined;
  }

  /**
   * Returns enum if type is an enum
   */
  public get enum() {
    return Enum.has(this.type) ? Enum.get(this.type) : null;
  }

  /**
   * Returns the column field (defaults to none)
   * example: @field.text({type "text"})
   */
  public get field(): Component {
    for (const name in this.attributes) {
      if (!name.startsWith('field.')) {
        continue;
      }
      //we found it.
      const field = this.attributes[name];
      //get the method
      const method = name.replace('field.', '');
      //get the arguments
      const args: Data[] = Array.isArray(field)? field as Data[]: [];
      //the first argument is the field attributes
      const attributes = typeof args[0] === 'object' 
        ? (args[0] || {}) as Record<string, Data>
        : {};
     
      return { method, args, attributes };
    }
    return { 
      method: 'none', 
      args: [],
      attributes: {}
    };
  }

  /**
   * Returns fieldset if type is a fieldset
   * example: user User
   */
  public get fieldset() {
    return Fieldset.has(this.type) ? new Fieldset(this.type) : null;
  }

  /**
   * Returns true if column is @filterable
   */
  public get filterable() {
    return this._config.attributes.filterable === true;
  }

  /**
   * Returns true if column is @generated
   */
  public get generated() {
    return this._config.attributes.generated === true;
  }

  /**
   * Returns true if column is an @id
   */
  public get id() {
    return this._config.attributes.id === true;
  }

  /**
   * Returns true if column is @filterable, @searchable, or @sortable
   */
  public get indexable() {
    return this.searchable || this.filterable || this.spanable || this.sortable;
  }

  /**
   * Returns the column @label
   * example: @label("Some Label")
   */
  public get label() {
    const label = this._config.attributes.label;
    return !Array.isArray(label) ? this._config.name : label[0] as string;
  }

  /**
   * Returns the column list format (defaults to none)
   * example: @list.char({length 1})
   */
  public get list(): Component {
    for (const name in this.attributes) {
      if (!name.startsWith('list.')) {
        continue;
      }
      //we found it.
      const field = this.attributes[name];
      //get the method
      const method = name.replace('list.', '');
      //get the arguments
      const args: Data[] = Array.isArray(field)? field as Data[]: [];
      //the first argument is the field attributes
      const attributes = typeof args[0] === 'object' 
        ? (args[0] || {}) as Record<string, Data>
        : {};
     
      return { method, args, attributes };
    }
    return { 
      method: 'none', 
      args: [],
      attributes: {}
    };
  }

  /**
   * Returns model if type is a model
   * example: user User
   */
  public get model(): Model | null {
    return Model.has(this.type) ? new Model(this.type) : null;
  }

  /**
   * Returns true if the column accepts @multiple values
   */
  public get multiple() {
    return this._config.multiple;
  }

  /**
   * Returns the column name
   */
  public get name() {
    return this._config.name;
  }

  /**
   * Returns the related column, if any
   * example: user User 
   */
  public get related() {
    //if no model is found
    if (!Model.get(this.type)) {
      return null;
    }
    //get foreign model
    //example: user User[]
    const model = new Model(this.type);
    //get the foreign model's relational column
    const column = model.columns
      //example: user User @relation(local "userId" foreign: "id")
      .filter(column => !!column.relation)
      //example: user User @relation(...) === user User[]
      .find(column => column.type ===  this._fieldset.name);
    if (!column?.relation) {
      return null;
    }
    return column.relation;
  }

  /**
   * Returns the column @relation, if any
   * example: user User @relation(local "userId" foreign: "id")
   * returns: {
   *   //foreign model
   *   parent: { model, column, key, type },
   *   //this column's model
   *   child: { model, column, key, type }
   * }
   * 
   * Where: 
   *  - model is the model instance
   *  - column is the relational
   *    - ie. parent = user User[]
   *    - ie. child = user User @relation(local "userId" foreign: "id")
   */
  public get relation(): ColumnRelationLink | null {
    //ie. owner User @relation({ name "connections" local "userId" foreign "id" })
    const attribute = this._config.attributes.relation as [{
      local: string,
      foreign: string,
      name?: string
    }] | undefined;
    //if column not in model, no relation or invalid relation
    if (!this.model || !attribute || typeof attribute[0] !== 'object') {
      return null;
    }
    const localModel = this._fieldset as Model;
    //get the foreign (parent) and local (child) model
    const models = { 
      parent: this.model, 
      child: localModel
    };
    //get all the columns of foreign model where the type is this model
    let foreignColumns = models.parent.columns.filter(
      //ie. users User[]
      column => column.type === localModel.name
    ).filter(
      //filter again if the local column has a relation name
      //ie. owner User @relation({ name "connections" local "userId" foreign "id" })
      //to. connections User[]
      column => !attribute[0].name || attribute[0].name === column.name
    );
    //if no columns are found
    if (foreignColumns.length === 0) {
      //then it's not a valid relation
      return null;
    }
    //get the foreign (parent) and local (child) columns
    const columns = { 
      //ie. users User[]
      //or. connections User[]
      parent: foreignColumns[0], 
      //user User @relation(local "userId" foreign: "id")
      //ie. owner User @relation({ name "connections" local "userId" foreign "id" })
      child: this 
    };
    //get the foreign (parent) and local (child) keys
    //ie. @relation(local "userId" foreign: "id")
    const keys = { 
      parent: models.parent.column(attribute[0].foreign) as Column, 
      child: models.child.column(attribute[0].local) as Column
    };
    if (!keys.parent || !keys.child) {
      return null;
    }
    //get the parent and child relation types
    const types = {
      //ie. user User
      //ie. user User?
      //ie. users User[]
      parent: columns.parent.multiple ? 2 : columns.parent.required ? 1 : 0,
      //ie. user User @relation(local "userId" foreign: "id")
      child: columns.child.multiple ? 2 : columns.child.required ? 1 : 0
    };
    return { 
      parent: { 
        model: models.parent, 
        column: columns.parent, 
        key: keys.parent, 
        type: types.parent 
      }, 
      child: { 
        model: models.child, 
        column: columns.child, 
        key: keys.child, 
        type: types.child 
      } 
    };
  }

  /**
   * Returns true if the column is @required or @is.required
   * example: @is.required("Name is required")
   */
  public get required() {
    return this._config.required || !!this._config.attributes['is.required'];
  }

  /**
   * Returns true if column is @searchable
   */
  public get searchable() {
    return this._config.attributes.searchable === true;
  }

  /**
   * Returns true if column is @sortable
   */
  public get sortable() {
    return this._config.attributes.sortable === true;
  }

  /**
   * Returns true if column is @spanable
   */
  public get spanable() {
    return this._config.attributes.spanable === true;
  }

  /**
   * Returns the column type
   * example: String, Number, Boolean, Date, [Model], [Type], etc.
   */
  public get type() {
    return this._config.type;
  }

  /**
   * Returns true if column is @unique
   */
  public get unique() {
    return this._config.attributes.unique === true;
  }

  /**
   * Returns the column @view format (defaults to none)
   * example: @view.char({length 1})
   */
  public get view(): Component {
    for (const name in this.attributes) {
      if (!name.startsWith('view.')) {
        continue;
      }
      //we found it.
      const field = this.attributes[name];
      //get the method
      const method = name.replace('view.', '');
      //get the arguments
      const args: Data[] = Array.isArray(field)? field as Data[]: [];
      //the first argument is the field attributes
      const attributes = typeof args[0] === 'object' 
        ? (args[0] || {}) as Record<string, Data>
        : {};
     
      return { method, args, attributes };
    }
    return { 
      method: 'none', 
      args: [],
      attributes: {}
    };
  }

  /**
   * Sets the column config
   */
  constructor(fieldset: Fieldset, config: ColumnConfig) {
    this._config = config;
    this._fieldset = fieldset;
  }
}

export class Fieldset {
  /**
   * A cached list of all schemas
   */
  protected static _configs: Record<string, TypeConfig> = {};

  /**
   * Returns all the configs
   */
  public static get configs() {
    return this._configs;
  }

  /**
   * Adds a config to the cache
   */
  public static add(config: TypeConfig|TypeConfig[]) {
    if (Array.isArray(config)) {
      config.forEach(config => this.add(config));
      return;
    }
    this._configs[config.name] = config;
  }

  /**
   * Gets a config from the cache
   */
  public static get(name: string) {
    return this._configs[name];
  }

  /**
   * Returns true if the config exists
   */
  public static has(name: string) {
    return typeof this._configs[name] !== 'undefined';
  }

  /**
   * The schema name
   */
  protected _name: string;

  /**
   * The schema attributes
   */
  protected _attributes: Record<string, Data>;

  /**
   * the column configs
   */
  protected _columns: Column[] = [];

  /**
   * Returns all the columns with assertions
   */
  public get assertions() {
    return this.columns.filter(column => column.assertions.length > 0);
  }
  
  /**
   * Returns the schema attributes
   */
  public get attributes() {
    return this._attributes;
  }

  /**
   * Returns the camel cased fieldset name
   */
  public get camel() {
    return camelize(this._name);
  }

  /**
   * Returns all the columns
   */
  public get columns() {
    return this._columns;
  }

  /**
   * Returns all the enum columns
   */
  public get enums() {
    return this.columns.filter(column => column.enum !== null);
  }

  /**
   * Returns all the field columns
   */
  public get fields() {
    return this.columns.filter(
      column => column.field.method !== 'none'
    );
  }

  /**
   * Returns all the types that are fieldsets
   */
  public get fieldsets(): Column[] {
    //address Address[]
    return this.columns.filter(column => !!column.fieldset);
  }

  /**
   * Returns the icon
   */
  public get icon() {
    const icon = this.attributes.icon as string[];
    return icon[0] || null;
  }

  /**
   * Returns all the indexable columns
   */
  public get label() {
    const label = this._attributes.label;
    return !Array.isArray(label) 
      ? [ this._name, this._name ] 
      : label as string[];
  }

  /**
   * Returns all the listable columns
   */
  public get lists() {
    return this.columns.filter(
      column => column.list.method !== 'hide'
    );
  }

  /**
   * Returns the lower cased fieldset name
   */
  public get lower() {
    return this._name.toLocaleLowerCase();
  }

  /**
   * Returns the fieldset name
   */
  public get name() {
    return this._name;
  }

  /**
   * Returns the schema plural label
   */
  public get plural() {
    const label = this.attributes.label as string[];
    return label[1] || this.name;
  }

  /**
   * Returns the schema singular label
   */
  public get singular() {
    const label = this.attributes.label as string[];
    return label[0] || this.name;
  }

  /**
   * Returns the capitalized column name
   */
  public get title() {
    return capitalize(this._name);
  }

  /**
   * Returns all the viewable columns
   */
  public get views() {
    return this.columns.filter(
      column => column.view.method !== 'hide'
    );
  }

  /**
   * Just load the config
   */
  constructor(config: string|TypeConfig) {
    const parent = this.constructor as typeof Fieldset;
    if (typeof config === 'string') {
      const name = config;
      config = parent.get(config) as TypeConfig;
      if (!config) {
        throw Exception.for(`Config "${name}" not found`);
      }
    }
    this._name = config.name;
    this._attributes = config.attributes;
    config.columns.forEach(column => {
      this._columns.push(new Column(this, column));
    });
    parent._configs[config.name] = config;
  }

  /**
   * Returns a column given the name
   */
  public column(name: string) {
    return this.columns.find(column => column.name === name) || null;
  }

  /**
   * Returns the destination path with name filled in.
   * This is for generating files 
   */
  public destination(path: string) {
    return path.replaceAll('[name]', this.lower);
  }
}

export class Model extends Fieldset {
  /**
   * A cached list of all schemas
   */
  protected static _configs: Record<string, ModelConfig> = {};

  /**
   * Returns all the configs
   */
  public static get configs() {
    return this._configs;
  }

  /**
   * Returns the column that will be used to toggle @active
   */
  public get active() {
    return this.columns.find(column => column.attributes.active === true);
  }

  /**
   * Adds a config to the cache
   */
  public static add(config: ModelConfig|ModelConfig[]) {
    if (Array.isArray(config)) {
      config.forEach(config => this.add(config));
      return;
    }
    this._configs[config.name] = config;
  }

  /**
   * Gets a config from the cache
   */
  public static get(name: string) {
    return this._configs[name];
  }

  /**
   * Returns true if the config exists
   */
  public static has(name: string) {
    return typeof this._configs[name] !== 'undefined';
  }

  /**
   * Returns the column that will be stamped when @created
   */
  public get created() {
    return this.columns.find(column => column.attributes.created === true);
  }

  /**
   * Returns all the @filterable columns
   */
  public get filterables() {
    return this.columns.filter(column => column.filterable);
  }

  /**
   * Returns all the @id columns
   */
  public get ids() {
    return this.columns.filter(column => column.id);
  }

  /**
   * Returns all columns that are @filterable, @searchable, or @sortable
   */
  public get indexables() {
    return this.columns.filter(column => column.indexable);
  }

  /**
   * Returns path link parts
   */
  public get paths() {
    return {
      entity: this.lower,
      object: this.ids.map(id => `[${id.name}]`)
    };
  }

  /**
   * Returns all the models with columns related to this model
   */
  public get related() {
    //all columns with user User[]
    return this.columns.filter(column => column.related !== null);
  }

  /**
   * Returns all the columns with relations
   */
  public get relations() {
    //all columns with @relation(...)
    return this.columns.filter(column => column.relation !== null);
  }

  /**
   * Returns true if the model is restorable
   */
  public get restorable() {
    return this.columns.some(column => column.attributes.active === true);
  }

  /**
   * Returns all the @searchable columns
   */
  public get searchables() {
    return this.columns.filter(column => column.searchable);
  }

  /**
   * Returns all the @sortable columns
   */
  public get sortables() {
    return this.columns.filter(column => column.sortable);
  }

  /**
   * Returns all the @spanable columns
   */
  public get spanables() {
    return this.columns.filter(column => column.spanable);
  }

  /**
   * Returns all the unique columns
   */
  public get uniques() {
    return this.columns.filter(column => column.unique);
  }

  /**
   * Returns the column that will be stamped when @updated
   */
  public get updated() {
    return this.columns.find(column => column.attributes.updated === true);
  }

  /**
   * Returns a function to generate a suggested label
   */
  public suggested(template = '${data.%s}') {
    const suggested = (
      this.attributes.suggested as string[]
    )[0] || this.lower;
    return Array.from(
      suggested.matchAll(/\[([a-zA-Z0-9_]+)\]/g)
    ).reduce((result, match) => {
      return result.replace(match[0], template.replaceAll('%s', match[1]));
    }, suggested);
  }
}