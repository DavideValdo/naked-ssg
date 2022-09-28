import { PageConfiguration } from "../types/PageConfiguration";

type HTMLMaker = (cultureCode: string) => string;

const Layout = (
  makeHTML: HTMLMaker,
  localConfig: PageConfiguration,
  cultureCode: string
) => /*jsx*/ `
<!DOCTYPE html>
<html>
<head>
  <title>${localConfig.title || "Default title"}</title>
</head>
<body>
  ${makeHTML(cultureCode)}
</body>
</html>
`;

export default Layout;
