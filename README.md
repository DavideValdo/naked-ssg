# Yet another TypeScript SSG

But with built-in i18n support and a minimal API.

## Why

No need for bloated code for simple tasks. We need to reduce over-engineering and keep our toolchains slim.

## Usage

Initialize a project:

```bash
mkdir project-name
cd project-name
npx @millino/naked-ssg initialize
```

Some files need to be created manually, see the sections below.

To build the project:

```bash
npx @millino/naked-ssg build
```

**todo**:

```bash
npx naked-ssg server
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

```ts
import { SiteConfiguration, TranslationsMap } from "@millino/naked-ssg";

const CONFIG: SiteConfiguration = {
  cultures: ["it", "en"], // "it" is the default culture,

  // @todo:
  defaultCultureDirectoryBuildBehavior: "both", // Builds pages for both / and /it
};

const TRANSLATIONS: TranslationsMap = {
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
  title: "Title", // The title tag
  skipForCultures: ["it"], // The current page won't be built for the "it" culture,
};

export default Index;
```

## Plug-ins

Advanced features are OSP, meaning: plug-in system WIP, meanwhile fork the project.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

**Tests are more than welcome.**
