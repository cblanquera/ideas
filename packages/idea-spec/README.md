# 💡 Idea Spec

Maps made for [idea](https://github.com/OSSPhilippines/idea) plugins.

## Install

```bash
$ npm i idea-spec
```

## Usage

In your plugin you can populate the maps like the following.

```js
import type { PluginWithCLIProps } from '@ossph/idea';
import { Model, Fieldset, Enum } from 'idea-spec';

export default function transform({ config, schema, cli }: PluginWithCLIProps) {
  //populate model cache
  for (const name in schema.model) {
    Model.add(schema.model[name]);
  }
  //populate fieldset cache
  for (const name in schema.type) {
    Fieldset.add(schema.type[name]);
  }
  //populate enum cach
  for (const name in schema.enum) {
    Enum.add(name, schema.enum[name]);
  }

  //.. your plugin logic
}
```

Then, you can make new constructs like the following.

```js
const model = new Model('profile');
const fieldset = new Fieldset('address');
const roles = Enum.get('roles');
```

## Enum

The following methods are available for enums.

```js
Enum.add(name: string, options: Record<string, Data>)
```

Adds a schema to the static enum cache.

```js
Enum.has(name: string)
```

Returns true if the name is in the enum cache.

```js
Enum.get(name: string)
```

Returns the enum options from the enum cache given the name.

## Fieldset

Fieldsets have the following properties.

| Name       | Type     | Description                    |
|------------|----------|--------------------------------|
| assertions | Column[] | the columns with assertions    |
| attributes | object   | the fieldset attributes        |
| camel      | object   | camel cased fieldset name      |
| columns    | Column[] | all the columns                |
| enums      | Column[] | all columns that are enums     |
| fields     | Column[] | all columns that are fields    |
| fieldsets  | Column[] | all columns that are fieldsets |
| icon       | string   | fieldset icon                  |
| label      | string[] | fieldset label                 |
| lists      | Column[] | all columns that are lists     |
| lower      | string   | lowercase fieldset name        |
| name       | string   | fieldset name                  |
| plural     | string   | plural label                   |
| singular   | string   | singular label                 |
| title      | string   | title label                    |
| views      | Column[] | all columns that are views     |

The following methods are available for fieldsets.

```js
Fieldset.add(name: string, options: Record<string, Data>)
```

Adds a schema to the static fieldset cache.

```js
Fieldset.has(name: string)
```

Returns true if the name is in the fieldset cache.

```js
Fieldset.get(name: string)
```

Returns the fieldset options from the fieldset cache given the name.

```js
const fieldset = new Fieldset('address');
fieldset.column('city');
```

Returns the column information given the column name.

## Model

Models have the following properties

| Name        | Type        | Description                     |
|-------------|-------------|---------------------------------|
| active      | Column|null | the active column               |
| assertions  | Column[]    | the columns with assertions     |
| attributes  | object      | the model attributes            |
| camel       | object      | camel cased model name          |
| columns     | Column[]    | all the columns                 |
| created     | Column|null | the created column              |
| enums       | Column[]    | all columns that are enums      |
| fields      | Column[]    | all columns that are fields     |
| fieldsets   | Column[]    | all columns that are fieldsets  |
| filterables | Column[]    | all columns that are filterable |
| ids         | Column[]    | all columns that are @id's      |
| indexable   | Column[]    | all columns that are indexable  |
| icon        | string      | model icon                      |
| label       | string[]    | model label                     |
| lists       | Column[]    | all columns that are lists      |
| lower       | string      | lowercase model name            |
| name        | string      | model name                      |
| plural      | string      | plural label                    |
| related     | Column[]    | all columns that are related    |
| relations   | Column[]    | all columns that are relations  |
| restorable  | boolean     | true if model is restorable     |
| searchable  | Column[]    | all columns that are searchable |
| sortables   | Column[]    | all columns that are sortable   |
| spanables   | Column[]    | all columns that are spanable   |
| singular    | string      | singular label                  |
| title       | string      | title label                     |
| uniques     | Column[]    | all columns that are @unique    |
| updated     | Column|null | the udpated column              |
| views       | Column[]    | all columns that are views      |

The following methods are available for models.

```js
Model.add(name: string, options: Record<string, Data>)
```

Adds a schema to the static model cache.

```js
Model.has(name: string)
```

Returns true if the name is in the model cache.

```js
Model.get(name: string)
```

Returns the model options from the models cache given the name.

```js
const model = new Model('user');
model.column('name');
```

Returns the column information given the column name.

## Column

Columns have the following properties

| Name       | Type          | Description                                              |
|------------|---------------|----------------------------------------------------------|
| active     | boolean       | true if this column is an @active column                 |
| assertions | object[]      | the column assertions                                    |
| attributes | object        | the column attributes                                    |
| config     | object        | the column config                                        |
| default    | scalar        | the column @default value                                |
| enum       | object|null   | enum if type is an enum                                  |
| field      | object        | the column field (defaults to none)                      |
| fieldset   | Fieldset|null | fieldset if type is a fieldset                           |
| filterable | boolean       | true if column is @filterable                            |
| generated  | boolean       | true if column is @generated                             |
| id         | boolean       | true if column is an @id                                 |
| indexable  | boolean       | true if column is @filterable, @searchable, or @sortable |
| label      | string        | the column @label                                        |
| list       | object        | the column list format (defaults to none)                |
| model      | Model|null    | model if type is a model                                 |
| multiple   | boolean       | true if the column accepts @multiple values              |
| name       | object        | the column name                                          |
| related    | object|null   | the related column, if any                               |
| relation   | object|null   | the column @relation, if any                             |
| required   | boolean       | true if the column is @required or @is.required          |
| searchable | boolean       | true if column is @searchable                            |
| sortable   | boolean       | true if column is @sortable                              |
| spanable   | boolean       | true if column is @spanable                              |
| type       | string        | the column type                                          |
| unique     | boolean       | true if column is @unique                                |
| view       | object        | the column @view format (defaults to none)               |