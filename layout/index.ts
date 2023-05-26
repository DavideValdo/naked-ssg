import { PageConfiguration } from "@millino/types-naked-ssg"

const Layout = (
  html: string,
  localConfig: PageConfiguration,
  cultureCode: string
) => /*jsx*/ `
<!DOCTYPE html>
<html>
<head>
  <title>${localConfig.title || "Default title"}</title>
</head>
<body>
  ${html}
</body>
</html>
`

export default Layout
