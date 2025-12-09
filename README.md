# Yet another TypeScript SSG

But with built-in internationalization support and a minimal API, relies on `@kitajs/html` and `@kitajs/ts-html-plugin` to make TSX available in the target projects.

## Why

Internationalization is a common requirement, but existing tools (e.g. NextJS) feels like overkill for the purpose of obtaining a static website. I wanted the possibility to use TSX with a NodeJS static site generator, but without React involved.

## Usage

Initialize a project:

```bash
mkdir project-name
cd project-name
npx @millino/naked-ssg initialize
```

`config.ts` and `layout.tsx` need to be created manually, see the sections below.

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
 - layout.tsx
 - config.ts
 - /pages
   - index.tsx
   - /test-sub-directory
     - index.tsx
- /assets
- /scripts
- /graphics
```

## Example layout.tsx

This will wrap every page, except for proxy-generated pages.

```tsx
import { LayoutFunction } from "@millino/types-naked-ssg";

const Layout: LayoutFunction = async ({ html, config, cultureCode }) => (
  <html>
    <head>
      <title>{config.title}</title>
    </head>
    <body>{html}</body>
  </html>
);

export default Layout;
```

## Example config.ts

```ts
import { SiteConfiguration, TranslationsMap } from "@millino/naked-ssg";

const CONFIG: SiteConfiguration = {
  cultures: ["it-IT", "en-EN"], // "it-IT" is the default culture,
};

const TRANSLATIONS: TranslationsMap = {
  "it-IT": {
    test: "Test IT",
  },
  "en-EN": {
    test: "Test EN",
  },
};

export { CONFIG, TRANSLATIONS };
```

**Please note:** The first culture in the `CONFIG.cultures` array will be the default culture, which currently has no dedicated subdirectory.

## Example page

A page must have a default export, which is a function returning a string with the page markup.

**/pages/index.tsx**

```tsx
import { TRANSLATIONS } from "../config.ts";

const Index = (cultureCode: string) => (
  <p>
    {TRANSLATIONS[cultureCode].test}! {2 + 2}
  </p>
);

export default Index;
```

## Page-level configuration

Certain things are overridable in the configuration by exporting a `getConfig` function. **See the available configuration options in the example below:**

```tsx
import type { PageBuilder } from '@millino/types-naked-ssg';
import { TRANSLATIONS } from '../config.js';

const Index: PageBuilder = cultureCode => ({
	getHTML: async () => (
        <p>
            ${TRANSLATIONS[cultureCode]!.test}! ${2 + 2}
        </p>
    ),
    getConfig: async () => ({
        title: 'Home',
        description: 'Homepage example.',
    })
});

export default Index;

```

## Proxies
"Proxies" is a mechanism to output pages from sets of external data. `data` should be an array of objects with a string `slug` property: each object will generate an HTML page.


```ts
const CONFIG: SiteConfiguration = {
  ...,
  proxies: [
    {
      fetchData: async () => {
        return {
          "it-IT": {
            data: await fancyAPI({culture: "it-IT"}),
            directory: "prodotti",
          },
          "en-EN": {
            data: await fancyAPI({culture: "en-EN"}),
            directory: "products",
          },
        }
      },
      layoutName: "products",
    },
  ],
};
```

This configuration will try to read a `/proxies/products.tsx` file, and output pages for each culture in the `it-IT` and `en-EN` directories.

## Plug-ins

Advanced features are OSP, meaning: plug-in system WIP, meanwhile fork the project.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

**Tests are more than welcome.**
