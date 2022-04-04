# Why

No need for bloated code for simple tasks. We need to learn to reduce over-engineering and to keep our toolchains slim.

## Installation

```bash
npm i -g @millino/naked-ssg
```

## Usage

Go to the project directory and run:

```
naked-ssg --build
```

## Project structure

```
/
 - config.js
 - /pages
   - index.js
   - /test-sub-directory
     - index.js
```

## Example config.js

```js
const CONFIG = {
  langs: ["it", "en"],
};

const LANGS = {
  it: {
    test: "Test IT",
  },
  en: {
    test: "Test EN",
  },
};

export { CONFIG, LANGS };
```

**Please note: ** this lib is strongly WIP, having "no languages" is currently not supported.

## Example page

A page must have a default export, which is a function returning a string with the page markup. You can also override the default configuration, by exporting a `LocalConfig` constant.

```js
import { LANGS } from "../../config.js";

const Index = (langCode) => /*jsx*/ `
<p>
    ${LANGS[langCode].test}! ${2 + 2}
</p>
`;

export const LocalConfig = {
  title: "My Page Title...",
};

export default Index;
```

## Layout

Just create a function that wraps a page.

## Plug-ins

Advanced features are OSP, meaning: plug-in system WIP, meanwhile fork the project.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

**Tests are more than welcome**
