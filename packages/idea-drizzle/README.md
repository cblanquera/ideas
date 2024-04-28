# 💡 Idea Drizzle

Transforms [ideas](https://github.com/OSSPhilippines/idea) to 
implemented [Drizzle](https://orm.drizzle.team/) code.

## Install

```bash
$ npm i idea-drizzle
```

## Usage

In your `.idea` file, add the following plugin settings.

```js
plugin "idea-ts" {
  lang "ts"
  enums "./modules/enums"
  types "./modules/[name]/types"
}

plugin "idea-assert" {
  output "./modules/[name]/assert"
}

plugin "idea-drizzle" {
  lang "ts"
  engine "pg"
  url "env(DATABASE_URL)"
  actions "./modules/[name]/actions"
  schema "./modules/[name]/schema"
  store "./modules/store"
}
```

## Configurations

| Name    | Type   | Description                        |
|---------|--------|------------------------------------|
| lang    | string | transforms to `js` or `ts`         |
| engine  | string | database engine to use             |
| url     | string | database URL location              |
| actions | string | path to put generated actions code |
| schema  | string | path to put generated schema code  |
| store   | string | path to put generated store code   |
