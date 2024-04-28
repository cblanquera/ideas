# 💡 Idea Assert

Transforms [ideas](https://github.com/OSSPhilippines/idea) to 
typescript typings.

## Install

```bash
$ npm i idea-assert
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
```

## Configurations

| Name   | Type   | Description                        |
|--------|--------|------------------------------------|
| lang   | string | transforms to `js` or `ts`         |
| output | string | path to put generated assert code  |
