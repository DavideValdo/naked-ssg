#!/usr/bin/env node
import { readdir as readDirectory, writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { exec } from "child_process";

import Layout from "./layout/index.js";
import { TYPESCRIPT_BUILD_FOLDER_NAME } from "./constants.js";

import { SiteConfiguration } from "./types/SiteConfiguration";
import { PageConfiguration } from "./types/PageConfiguration";
import { TranslationsMap } from "./types/TranslationsMap";

function getPath(path: string) {
  return join(cwd(), TYPESCRIPT_BUILD_FOLDER_NAME, path);
}

function flattenArray<T>(array: Array<T>): Array<T> {
  return array.reduce((accumulator: Array<T>, value: T | Array<T>) => {
    return Array.isArray(value) ? flattenArray(value) : [...accumulator, value];
  }, []);
}

type FileBuilderSignature = {
  cultureCode: string;
  isDefaultCulture?: boolean;
};

async function makeFileBuilder(
  sourcePath: string,
  fileName: string,
  currentDirectory = ""
) {
  const { default: fileContent } = await import(join(sourcePath, fileName));

  const { default: makeHTML, localConfig } = fileContent;

  console.log("==", makeHTML, localConfig);

  return async function ({
    cultureCode,
    isDefaultCulture = false,
  }: FileBuilderSignature) {
    // Skip a culture, if specified
    if (localConfig?.skipForCultures?.includes(cultureCode)) return false;

    const markup = Layout(makeHTML, localConfig, cultureCode).replace(
      /^\s+|\s+$/g,
      ""
    );

    const buildPath = join(
      cwd(),
      "build",
      isDefaultCulture ? "" : cultureCode,
      currentDirectory
    );

    const destinationFilePath = join(
      buildPath,
      fileName.replace(".js", ".html")
    );

    try {
      if (!existsSync(buildPath)) {
        mkdirSync(buildPath, { recursive: true });
      }

      await writeFile(destinationFilePath, markup);

      return false;
    } catch (error) {
      if (error) {
        console.error(
          "Unable to build " +
            destinationFilePath +
            ", there was an error: " +
            error
        );
      }

      return true;
    }
  };
}

async function buildSite(currentDirectory = "") {
  try {
    const { CONFIG }: { CONFIG: SiteConfiguration } = await import(
      getPath("config.js")
    );

    const sourcePath = getPath(
      join("pages", currentDirectory != "" ? currentDirectory : "")
    );

    const list = await readDirectory(sourcePath);

    // Separate files and directories
    const files: string[] = [],
      subDirectories: string[] = [];

    for (const dirItem of list) {
      if (dirItem[0] == ".") continue; // Ignore hidden files

      (dirItem.includes(".js") ? files : subDirectories).push(dirItem);
    }

    const tasks = flattenArray(
      files.map(async function (fileName) {
        const pipeline: Array<Promise<boolean>> = [];

        const buildFile = await makeFileBuilder(
          sourcePath,
          fileName,
          currentDirectory
        );

        // The "default culture" has no dedicated subdirectory, by default
        // @todo: Add global config flag to force a dedicated subdirectory
        pipeline.push(
          buildFile({
            cultureCode: CONFIG.cultures[0],
            isDefaultCulture: true,
          })
        );

        // Also make promises for the remaining cultures
        for (let i = 1; i < CONFIG.cultures.length; i++) {
          pipeline.push(buildFile({ cultureCode: CONFIG.cultures[i] }));
        }

        return pipeline;
      })
    );

    console.log(
      "Building " + (currentDirectory == "" ? "/" : currentDirectory)
    );

    await Promise.all(tasks);

    for (const directory of subDirectories) {
      await buildSite(join(currentDirectory, directory));
    }
  } catch (error) {
    console.error("Unable to scan directory: " + error);
  }
}

(async () => {
  const TASKS: Record<string, () => void> = {
    build: () => {
      exec("npx tsc", (error, stdout, stderr) => {
        if (error) {
          console.error(
            "There was a TypeScript error building your project.",
            error
          );
          return;
        }

        buildSite();
      });
    },
    initialize: () => {
      exec(
        `npm init -y && npm i --save-dev typescript && npx tsc --init --outDir ./${TYPESCRIPT_BUILD_FOLDER_NAME}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(error);
          } else console.log(stdout);
        }
      );
    },
  };

  if (process.argv[2] in TASKS) TASKS[process.argv[2]]();
})();

export { SiteConfiguration, PageConfiguration, TranslationsMap };
