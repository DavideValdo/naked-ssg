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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { exec } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { cp, readdir as readDirectory, writeFile } from "fs/promises";
import { join } from "path";
import { cwd } from "process";
import { PROXIES_FOLDER, TYPESCRIPT_BUILD_FOLDER_NAME } from "./constants.js";
function getPath(paths) {
    return join.apply(void 0, __spreadArray([cwd(), TYPESCRIPT_BUILD_FOLDER_NAME], paths, false));
}
function flattenArray(array) {
    return array.reduce(function (accumulator, value) {
        return Array.isArray(value) ? flattenArray(value) : __spreadArray(__spreadArray([], accumulator, true), [value], false);
    }, []);
}
function readTemplate(sourcePath, fileName) {
    return __awaiter(this, void 0, void 0, function () {
        var Page;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, import(join(sourcePath, fileName))];
                case 1:
                    Page = (_a.sent()).Page;
                    return [2 /*return*/, Page];
            }
        });
    });
}
function readConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var Config, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, import(getPath(["config.js"]))];
                case 1:
                    Config = (_a.sent()).Config;
                    return [2 /*return*/, Config];
                case 2:
                    e_1 = _a.sent();
                    console.error("[naked] Can't read config");
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function readLayout() {
    return __awaiter(this, void 0, void 0, function () {
        var Layout, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, import(getPath(["layout.jsx"]))];
                case 1:
                    Layout = (_a.sent()).Layout;
                    return [2 /*return*/, Layout];
                case 2:
                    e_2 = _a.sent();
                    console.error("[naked] Can't read layout");
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function makeFileBuilder(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var Page;
        var sourcePath = _b.sourcePath, templateName = _b.templateName, _c = _b.currentDirectory, currentDirectory = _c === void 0 ? "" : _c, layout = _b.layout;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, readTemplate(sourcePath, templateName)];
                case 1:
                    Page = _d.sent();
                    return [2 /*return*/, function (_a) {
                            return __awaiter(this, arguments, void 0, function (_b) {
                                var _c, getConfig, getHTML, config, destinationFileName, HTMLString, markup, buildPath, destinationFilePath, error_1;
                                var _d;
                                var _e = _b.isDefaultCulture, isDefaultCulture = _e === void 0 ? false : _e, slugRecord = _b.slugRecord, cultureCode = _b.cultureCode;
                                return __generator(this, function (_f) {
                                    switch (_f.label) {
                                        case 0:
                                            _c = Page(cultureCode), getConfig = _c.getConfig, getHTML = _c.getHTML;
                                            return [4 /*yield*/, (slugRecord ? getConfig(slugRecord) : getConfig())];
                                        case 1:
                                            config = _f.sent();
                                            destinationFileName = slugRecord
                                                ? slugRecord.slug + ".html"
                                                : templateName.replace(".jsx", ".html");
                                            // Skip a culture, if specified
                                            if ((_d = config === null || config === void 0 ? void 0 : config.skipForCultures) === null || _d === void 0 ? void 0 : _d.includes(cultureCode))
                                                return [2 /*return*/, false];
                                            return [4 /*yield*/, (slugRecord ? getHTML(slugRecord) : getHTML())];
                                        case 2:
                                            HTMLString = _f.sent();
                                            return [4 /*yield*/, layout({ html: HTMLString, config: config, cultureCode: cultureCode })];
                                        case 3:
                                            markup = (_f.sent()).replace(/^\s+|\s+$/g, "");
                                            buildPath = join(cwd(), "build", isDefaultCulture ? "" : cultureCode.toLowerCase(), currentDirectory);
                                            destinationFilePath = join(buildPath, destinationFileName);
                                            _f.label = 4;
                                        case 4:
                                            _f.trys.push([4, 6, , 7]);
                                            if (!existsSync(buildPath)) {
                                                mkdirSync(buildPath, { recursive: true });
                                            }
                                            return [4 /*yield*/, writeFile(destinationFilePath, markup)];
                                        case 5:
                                            _f.sent();
                                            console.log("[naked] Building", destinationFileName, config);
                                            return [2 /*return*/, false];
                                        case 6:
                                            error_1 = _f.sent();
                                            if (error_1) {
                                                console.error("[naked] Unable to build " +
                                                    destinationFilePath +
                                                    ", there was an error: " +
                                                    error_1);
                                            }
                                            return [2 /*return*/, true];
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            });
                        }];
            }
        });
    });
}
function buildSite() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, Config, Layout, buildProxyPages, copyResources, buildPages;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([readConfig(), readLayout()])];
                case 1:
                    _a = _b.sent(), Config = _a[0], Layout = _a[1];
                    if (!(Config && Layout)) {
                        console.error("[naked] Please check your config.ts and layout.tsx files");
                        return [2 /*return*/];
                    }
                    buildProxyPages = function () { return __awaiter(_this, void 0, void 0, function () {
                        var config, tasks, _i, config_1, proxyEntry, fetchData, templateName, data, _loop_1, _a, _b, _c, cultureCode, _d, cultureSpecificData, directory;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0: return [4 /*yield*/, Config.proxies];
                                case 1:
                                    config = _e.sent();
                                    if (!config)
                                        return [2 /*return*/];
                                    tasks = [];
                                    _i = 0, config_1 = config;
                                    _e.label = 2;
                                case 2:
                                    if (!(_i < config_1.length)) return [3 /*break*/, 8];
                                    proxyEntry = config_1[_i];
                                    fetchData = proxyEntry.fetchData, templateName = proxyEntry.templateName;
                                    return [4 /*yield*/, fetchData()];
                                case 3:
                                    data = _e.sent();
                                    _loop_1 = function (cultureCode, cultureSpecificData, directory) {
                                        var buildFile;
                                        return __generator(this, function (_f) {
                                            switch (_f.label) {
                                                case 0: return [4 /*yield*/, makeFileBuilder({
                                                        layout: Layout,
                                                        sourcePath: getPath([PROXIES_FOLDER]),
                                                        templateName: templateName + ".jsx",
                                                        currentDirectory: directory,
                                                    })];
                                                case 1:
                                                    buildFile = _f.sent();
                                                    tasks.push(cultureSpecificData.map(function (slugRecord) {
                                                        return buildFile({
                                                            cultureCode: cultureCode,
                                                            isDefaultCulture: cultureCode == Config.cultures[0],
                                                            slugRecord: slugRecord,
                                                        });
                                                    }));
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _a = 0, _b = Object.entries(data);
                                    _e.label = 4;
                                case 4:
                                    if (!(_a < _b.length)) return [3 /*break*/, 7];
                                    _c = _b[_a], cultureCode = _c[0], _d = _c[1], cultureSpecificData = _d.data, directory = _d.directory;
                                    return [5 /*yield**/, _loop_1(cultureCode, cultureSpecificData, directory)];
                                case 5:
                                    _e.sent();
                                    _e.label = 6;
                                case 6:
                                    _a++;
                                    return [3 /*break*/, 4];
                                case 7:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 8: return [4 /*yield*/, Promise.all(flattenArray(tasks))];
                                case 9:
                                    _e.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    copyResources = function () { return __awaiter(_this, void 0, void 0, function () {
                        var dirs, e_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    dirs = ["assets", "scripts", "graphics"];
                                    console.log("[naked] Copying resources");
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, Promise.all(dirs.map(function (dir) {
                                            return cp(getPath(["..", dir]), getPath(["..", "build", dir]), {
                                                recursive: true,
                                            });
                                        }))];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    e_3 = _a.sent();
                                    console.error("[naked] Couldn't copy resources", e_3);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); };
                    buildPages = function () {
                        var args_1 = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args_1[_i] = arguments[_i];
                        }
                        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (currentDirectory) {
                            var sourcePath, list, files, subDirectories, _a, list_1, dirItem, name_1, tasks, _b, subDirectories_1, directory;
                            if (currentDirectory === void 0) { currentDirectory = ""; }
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        sourcePath = getPath([
                                            "pages",
                                            currentDirectory != "" ? currentDirectory : "",
                                        ]);
                                        return [4 /*yield*/, readDirectory(sourcePath, {
                                                withFileTypes: true,
                                                encoding: "utf8",
                                            })
                                            // Separate files and directories
                                        ];
                                    case 1:
                                        list = _c.sent();
                                        files = [], subDirectories = [];
                                        for (_a = 0, list_1 = list; _a < list_1.length; _a++) {
                                            dirItem = list_1[_a];
                                            name_1 = dirItem.name;
                                            if (name_1 == ".")
                                                continue; // Ignore hidden files
                                            if (dirItem.isDirectory()) {
                                                subDirectories.push(name_1);
                                            }
                                            if (dirItem.isFile())
                                                files.push(name_1);
                                        }
                                        tasks = flattenArray(files.map(function (templateName) {
                                            return __awaiter(this, void 0, void 0, function () {
                                                var pipeline, buildFile, i;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            pipeline = [];
                                                            return [4 /*yield*/, makeFileBuilder({
                                                                    layout: Layout,
                                                                    sourcePath: sourcePath,
                                                                    templateName: templateName,
                                                                    currentDirectory: currentDirectory,
                                                                })
                                                                // The "default culture" has no dedicated subdirectory, by default
                                                                // @todo: Add global config flag to force a dedicated subdirectory
                                                            ];
                                                        case 1:
                                                            buildFile = _a.sent();
                                                            // The "default culture" has no dedicated subdirectory, by default
                                                            // @todo: Add global config flag to force a dedicated subdirectory
                                                            pipeline.push(buildFile({
                                                                cultureCode: Config.cultures[0],
                                                                isDefaultCulture: true,
                                                            }));
                                                            // Also make promises for the remaining cultures
                                                            for (i = 1; i < Config.cultures.length; i++) {
                                                                pipeline.push(buildFile({ cultureCode: Config.cultures[i] }));
                                                            }
                                                            return [2 /*return*/, pipeline];
                                                    }
                                                });
                                            });
                                        }));
                                        console.log("[naked] Building " + (currentDirectory == "" ? "/" : currentDirectory));
                                        return [4 /*yield*/, Promise.all(tasks)];
                                    case 2:
                                        _c.sent();
                                        _b = 0, subDirectories_1 = subDirectories;
                                        _c.label = 3;
                                    case 3:
                                        if (!(_b < subDirectories_1.length)) return [3 /*break*/, 6];
                                        directory = subDirectories_1[_b];
                                        return [4 /*yield*/, buildPages(join(currentDirectory, directory))];
                                    case 4:
                                        _c.sent();
                                        _c.label = 5;
                                    case 5:
                                        _b++;
                                        return [3 /*break*/, 3];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    buildProxyPages();
                    buildPages();
                    copyResources();
                    return [2 /*return*/];
            }
        });
    });
}
;
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var TASKS;
    return __generator(this, function (_a) {
        TASKS = {
            build: function () {
                exec("npx tsc", function (error, stdout, stderr) {
                    if (error) {
                        console.error("[naked] There was a TypeScript error building your project.", error);
                        return;
                    }
                    buildSite();
                });
            },
            initialize: function () {
                exec("npm init -y && npm i --save-dev typescript @kitajs/html @kitajs/ts-html-plugin @millino/types-naked-ssg && npx tsc --init --outDir ./".concat(TYPESCRIPT_BUILD_FOLDER_NAME), function (error, stdout, stderr) {
                    if (error) {
                        console.error("[naked] There was an error initializing your project.", error);
                        return;
                    }
                    console.log(stdout);
                    try {
                        var TSConfigPath = join(cwd(), "tsconfig.json");
                        var TSConfigFile = readFileSync(TSConfigPath, "utf8");
                        var updatedTSConfig = TSConfigFile.replace(/"compilerOptions":\s*\{/, "\"compilerOptions\": {\n    \"jsx\": \"react-jsx\",\n    \"jsxImportSource\": \"@kitajs/html\",\n    \"plugins\": [{ \"name\": \"@kitajs/ts-html-plugin\" }],");
                        writeFileSync(TSConfigPath, updatedTSConfig);
                    }
                    catch (e) {
                        console.error("[naked] Error updating tsconfig.json", e);
                    }
                });
            },
        };
        if (process.argv[2] in TASKS)
            TASKS[process.argv[2]]();
        return [2 /*return*/];
    });
}); })();
