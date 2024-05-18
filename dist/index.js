#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { cp, readdir as readDirectory, writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { exec } from "child_process";
import { PROXIES_FOLDER, TYPESCRIPT_BUILD_FOLDER_NAME } from "./constants.js";
function getPath(paths) {
    return join(cwd(), TYPESCRIPT_BUILD_FOLDER_NAME, ...paths);
}
function flattenArray(array) {
    return array.reduce((accumulator, value) => {
        return Array.isArray(value) ? flattenArray(value) : [...accumulator, value];
    }, []);
}
function readTemplate(sourcePath, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const { Page } = yield import(join(sourcePath, fileName));
        return Page;
    });
}
function readConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { Config } = yield import(getPath(["config.js"]));
            return Config;
        }
        catch (e) {
            console.error("[naked] Can't read config");
            return false;
        }
    });
}
function readLayout() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { Layout } = yield import(getPath(["layout.js"]));
            return Layout;
        }
        catch (e) {
            console.error("[naked] Can't read layout");
            return false;
        }
    });
}
function makeFileBuilder({ sourcePath, templateName, currentDirectory = "", layout, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const Page = yield readTemplate(sourcePath, templateName);
        return function ({ isDefaultCulture = false, slugRecord, cultureCode, }) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                const { getConfig, getHTML } = Page(cultureCode);
                const config = yield (slugRecord ? getConfig(slugRecord) : getConfig());
                const destinationFileName = slugRecord
                    ? slugRecord.slug + ".html"
                    : templateName.replace(".js", ".html");
                // Skip a culture, if specified
                if ((_a = config === null || config === void 0 ? void 0 : config.skipForCultures) === null || _a === void 0 ? void 0 : _a.includes(cultureCode))
                    return false;
                const HTMLString = yield (slugRecord ? getHTML(slugRecord) : getHTML());
                const markup = layout({ html: HTMLString, config, cultureCode }).replace(/^\s+|\s+$/g, "");
                const buildPath = join(cwd(), "build", isDefaultCulture ? "" : cultureCode.toLowerCase(), currentDirectory);
                const destinationFilePath = join(buildPath, destinationFileName);
                try {
                    if (!existsSync(buildPath)) {
                        mkdirSync(buildPath, { recursive: true });
                    }
                    yield writeFile(destinationFilePath, markup);
                    console.log("[naked] Building", destinationFileName, config);
                    return false;
                }
                catch (error) {
                    if (error) {
                        console.error("[naked] Unable to build " +
                            destinationFilePath +
                            ", there was an error: " +
                            error);
                    }
                    return true;
                }
            });
        };
    });
}
function buildSite() {
    return __awaiter(this, void 0, void 0, function* () {
        const [Config, Layout] = yield Promise.all([readConfig(), readLayout()]);
        if (!(Config && Layout)) {
            console.error("[naked] Please check your config.ts and layout.ts files");
            return;
        }
        const buildProxyPages = () => __awaiter(this, void 0, void 0, function* () {
            const config = yield Config.proxies;
            if (!config)
                return;
            const tasks = [];
            for (const proxyEntry of config) {
                const { fetchData, templateName } = proxyEntry;
                const data = yield fetchData();
                for (const [cultureCode, { data: cultureSpecificData, directory },] of Object.entries(data)) {
                    const buildFile = yield makeFileBuilder({
                        layout: Layout,
                        sourcePath: getPath([PROXIES_FOLDER]),
                        templateName: templateName + ".js",
                        currentDirectory: directory,
                    });
                    tasks.push(cultureSpecificData.map((slugRecord) => buildFile({
                        cultureCode,
                        isDefaultCulture: cultureCode == Config.cultures[0],
                        slugRecord,
                    })));
                }
            }
            yield Promise.all(flattenArray(tasks));
        });
        const copyResources = () => __awaiter(this, void 0, void 0, function* () {
            const dirs = ["assets", "scripts", "graphics"];
            console.log("[naked] Copying resources");
            try {
                yield Promise.all(dirs.map((dir) => cp(getPath(["..", dir]), getPath(["..", "build", dir]), {
                    recursive: true,
                })));
            }
            catch (e) {
                console.error("== Couldn't copy resources", e);
            }
        });
        const buildPages = (currentDirectory = "") => __awaiter(this, void 0, void 0, function* () {
            const sourcePath = getPath([
                "pages",
                currentDirectory != "" ? currentDirectory : "",
            ]);
            const list = yield readDirectory(sourcePath, {
                withFileTypes: true,
                encoding: "utf8",
            });
            // Separate files and directories
            const files = [], subDirectories = [];
            for (const dirItem of list) {
                const name = dirItem.name;
                if (name == ".")
                    continue; // Ignore hidden files
                if (dirItem.isDirectory()) {
                    subDirectories.push(name);
                }
                if (dirItem.isFile())
                    files.push(name);
            }
            const tasks = flattenArray(files.map(function (templateName) {
                return __awaiter(this, void 0, void 0, function* () {
                    const pipeline = [];
                    const buildFile = yield makeFileBuilder({
                        layout: Layout,
                        sourcePath,
                        templateName,
                        currentDirectory,
                    });
                    // The "default culture" has no dedicated subdirectory, by default
                    // @todo: Add global config flag to force a dedicated subdirectory
                    pipeline.push(buildFile({
                        cultureCode: Config.cultures[0],
                        isDefaultCulture: true,
                    }));
                    // Also make promises for the remaining cultures
                    for (let i = 1; i < Config.cultures.length; i++) {
                        pipeline.push(buildFile({ cultureCode: Config.cultures[i] }));
                    }
                    return pipeline;
                });
            }));
            console.log("[naked] Building " + (currentDirectory == "" ? "/" : currentDirectory));
            yield Promise.all(tasks);
            for (const directory of subDirectories) {
                yield buildPages(join(currentDirectory, directory));
            }
        });
        buildProxyPages();
        buildPages();
        copyResources();
    });
}
;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const TASKS = {
        build: () => {
            exec("npx tsc", (error, stdout, stderr) => {
                if (error) {
                    console.error("[naked] There was a TypeScript error building your project.", error);
                    return;
                }
                buildSite();
            });
        },
        initialize: () => {
            exec(`npm init -y && npm i --save-dev typescript && npx tsc --init --outDir ./${TYPESCRIPT_BUILD_FOLDER_NAME}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(error);
                }
                else
                    console.log(stdout);
            });
        },
    };
    if (process.argv[2] in TASKS)
        TASKS[process.argv[2]]();
}))();
