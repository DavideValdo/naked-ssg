import { LayoutFunction } from "@millino/types-naked-ssg"

export const Layout: LayoutFunction = ({ config, html }) => /*jsx*/ `
<!DOCTYPE html>
<html>
<head>
  <title>${config.title || "Default title"}</title>
</head>
<body>
  ${html}
</body>
</html>
`
