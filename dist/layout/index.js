const Layout = (makeHTML, localConfig, cultureCode) => /*jsx*/ `
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
