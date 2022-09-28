# Why

No need for bloated code for simple tasks. We need to learn to reduce over-engineering and to keep our toolchains slim.

## Installation

```bash
npm i -g @millino/naked-ssg
```

## Usage

Go to the project directory and run:

```bash
naked-ssg build
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
  cultures: ["it", "en"], // "it" is the default culture,

  // @todo:
  defaultCultureDirectoryBuildBehavior: "both", // Builds pages for both / and /it
};

const TRANSLATIONS = {
  it: {
    test: "Test IT",
  },
  en: {
    test: "Test EN",
  },
};

export { CONFIG, TRANSLATIONS };
```

**Please note:** The first culture in the `CONFIG.cultures` array will be the default culture, which currently has no dedicated subdirectory.

## Example page

A page must have a default export, which is a function returning a string with the page markup.

**/pages/index.js**

```js
import { TRANSLATIONS } from "../config.js";

const Index = (cultureCode) => /*jsx*/ `
<p>
    ${TRANSLATIONS[cultureCode].test}! ${2 + 2}
</p>
`;

export default Index;
```

The comment below is used to trigger the `es6-string-jsx` VSCode plugin functionality, which provides JSX-like syntax highlighting within the function body.

```js
/*jsx*/
```

## Custom helpers

Every page is just a JavaScript file, which means that you can make your own custom helpers. Here's an example of how to implement a generic HTML "Layout" by using functional composition.

**layout/layout.js**

```js
const Layout = (HTMLContent, localConfig, cultureCode) => /*jsx*/ `
<!DOCTYPE html>
<html>
<head>
  <title>${localConfig.title || "Default title"}</title>
</head>
<body>
  ${HTMLContent(cultureCode)}
</body>
</html>
`;

export default Layout;
```

**pages/hello.js**

```js
import { TRANSLATIONS } from "../config.js";
import Layout from "../layout/layout.js";

export const localConfig = {
  title: "Custom Title", // Add whatever you need to this object
};

const HTMLContent = (cultureCode) => /*jsx*/ `
<p>
    ${TRANSLATIONS[cultureCode].hello}
</p>
`;

const Index = (cultureCode) => Layout(HTMLContent, localConfig, cultureCode);

export default Index;
```

## Page-level configuration

Certain specific behaviors are obtainable by exporting a `localConfig` constant. **See the available configuration options in the example below:**

```js
import { TRANSLATIONS } from "../../config.js";

const Index = (cultureCode) => /*jsx*/ `
<p>
    ${TRANSLATIONS[cultureCode].test}! ${2 + 2}
</p>
`;

export const localConfig = {
  skipForCultures: ["it"], // The current page won't be built for the "it" culture,
};

export default Index;
```

## Plug-ins

Advanced features are OSP, meaning: plug-in system WIP, meanwhile fork the project.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

**Tests are more than welcome.**
