export const Layout = ({ config, html }) => /*jsx*/ `
<!DOCTYPE html>
<html>
<head>
  <title>${config.title || "Default title"}</title>
</head>
<body>
  ${html}
</body>
</html>
`;
