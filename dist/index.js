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
import { readdir as readDirectory, writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { exec } from "child_process";
import Layout from "./layout/index.js";
import { TYPESCRIPT_BUILD_FOLDER_NAME } from "./constants.js";
function getPath(path) {
    return join(cwd(), TYPESCRIPT_BUILD_FOLDER_NAME, path);
}
function flattenArray(array) {
    return array.reduce((accumulator, value) => {
        return Array.isArray(value) ? flattenArray(value) : [...accumulator, value];
    }, []);
}
function makeFileBuilder(sourcePath, fileName, currentDirectory = "") {
    return __awaiter(this, void 0, void 0, function* () {
        const { default: fileContent } = yield import(join(sourcePath, fileName));
        const { default: makeHTML, localConfig } = fileContent;
        console.log("==", makeHTML, localConfig);
        return function ({ cultureCode, isDefaultCulture = false, }) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                // Skip a culture, if specified
                if ((_a = localConfig === null || localConfig === void 0 ? void 0 : localConfig.skipForCultures) === null || _a === void 0 ? void 0 : _a.includes(cultureCode))
                    return false;
                const markup = Layout(makeHTML, localConfig, cultureCode).replace(/^\s+|\s+$/g, "");
                const buildPath = join(cwd(), "build", isDefaultCulture ? "" : cultureCode, currentDirectory);
                const destinationFilePath = join(buildPath, fileName.replace(".js", ".html"));
                try {
                    if (!existsSync(buildPath)) {
                        mkdirSync(buildPath, { recursive: true });
                    }
                    yield writeFile(destinationFilePath, markup);
                    return false;
                }
                catch (error) {
                    if (error) {
                        console.error("Unable to build " +
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
function buildSite(currentDirectory = "") {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { CONFIG } = yield import(getPath("config.js"));
            const sourcePath = getPath(join("pages", currentDirectory != "" ? currentDirectory : ""));
            const list = yield readDirectory(sourcePath);
            // Separate files and directories
            const files = [], subDirectories = [];
            for (const dirItem of list) {
                if (dirItem[0] == ".")
                    continue; // Ignore hidden files
                (dirItem.includes(".js") ? files : subDirectories).push(dirItem);
            }
            const tasks = flattenArray(files.map(function (fileName) {
                return __awaiter(this, void 0, void 0, function* () {
                    const pipeline = [];
                    const buildFile = yield makeFileBuilder(sourcePath, fileName, currentDirectory);
                    // The "default culture" has no dedicated subdirectory, by default
                    // @todo: Add global config flag to force a dedicated subdirectory
                    pipeline.push(buildFile({
                        cultureCode: CONFIG.cultures[0],
                        isDefaultCulture: true,
                    }));
                    // Also make promises for the remaining cultures
                    for (let i = 1; i < CONFIG.cultures.length; i++) {
                        pipeline.push(buildFile({ cultureCode: CONFIG.cultures[i] }));
                    }
                    return pipeline;
                });
            }));
            console.log("Building " + (currentDirectory == "" ? "/" : currentDirectory));
            yield Promise.all(tasks);
            for (const directory of subDirectories) {
                yield buildSite(join(currentDirectory, directory));
            }
        }
        catch (error) {
            console.error("Unable to scan directory: " + error);
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const TASKS = {
        build: () => {
            exec("npx tsc", (error, stdout, stderr) => {
                if (error) {
                    console.error("There was a TypeScript error building your project.", error);
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
