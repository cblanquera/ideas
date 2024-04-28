# 💡 Idea Typescript

Transforms [ideas](https://github.com/OSSPhilippines/idea) to 
typescript typings.

## Install

```bash
$ npm i idea-ts
```

## Usage

In your `.idea` file, add the following plugin settings.

```js
plugin "idea-ts" {
  lang "ts"
  enums "./modules/enums"
  types "./modules/[name]/types"
}
```

## Configurations

| Name  | Type   | Description                     |
|-------|--------|---------------------------------|
| lang  | string | transforms to `js` or `ts`      |
| enums | string | path to put generated enum code |
| types | string | path to put generated type code |
