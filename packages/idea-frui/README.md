# 💡 Idea FRUI

Transforms [ideas](https://github.com/OSSPhilippines/idea) to 
implemented [FRUI](https://frui.js.org/) code.

## Install

```bash
$ npm i idea-frui
```

## Usage

In your `.idea` file, add the following plugin settings.

```js
plugin "idea-frui" {
  lang "ts"
  output "./modules/[name]/components"
}
```

## Configurations

| Name   | Type   | Description                     |
|--------|--------|---------------------------------|
| lang   | string | transforms to `js` or `ts`      |
| output | string | path to put generated FRUI code |
