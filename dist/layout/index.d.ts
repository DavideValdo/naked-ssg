import { PageConfiguration } from "../types/PageConfiguration";
declare type HTMLMaker = (cultureCode: string) => string;
declare const Layout: (makeHTML: HTMLMaker, localConfig: PageConfiguration, cultureCode: string) => string;
export default Layout;
//# sourceMappingURL=index.d.ts.map