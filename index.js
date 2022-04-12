#!/usr/bin/env node
import { readdir as readDirectory, writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";

function getPath(path) {
  return join(cwd(), path);
}

function flattenArray(array) {
  return array.reduce((accumulator, value) => {
    return Array.isArray(value) ? flattenArray(value) : [...accumulator, value];
  }, []);
}

async function makeFileBuilder(sourcePath, fileName, currentDirectory = "") {
  const { default: generateMarkup, localConfig } = await import(
    `${sourcePath}/${fileName}`
  );

  return async function ({ cultureCode, isDefaultCulture = false }) {
    // Skip a culture, if specified
    if (localConfig?.skipForCultures?.includes(cultureCode)) return 0;

    const markup = generateMarkup(cultureCode).replace(/^\s+|\s+$/g, "");

    const buildPath = `build/${
      isDefaultCulture ? "" : cultureCode + "/"
    }${currentDirectory}`;

    const destinationFilePath =
      buildPath + "/" + fileName.replace(".js", ".html");

    try {
      if (!existsSync(buildPath)) {
        mkdirSync(buildPath, { recursive: true });
      }

      await writeFile(getPath(destinationFilePath), markup);

      return 0;
    } catch (error) {
      if (error) {
        console.error(
          "Unable to build " + filePath + ", there was an error: " + error
        );
      }

      return 1;
    }
  };
}

async function buildSite(currentDirectory = "") {
  try {
    const { CONFIG } = await import(getPath("./config.js"));
    const sourcePath = getPath(
      "pages" + (currentDirectory != "" ? currentDirectory : "")
    );

    const list = await readDirectory(sourcePath);

    // Separate files and directories
    const files = [],
      subDirectories = [];

    for (const dirItem of list) {
      if (dirItem[0] == ".") continue; // Ignore hidden files

      (dirItem.includes(".js") ? files : subDirectories).push(dirItem);
    }

    const tasks = flattenArray(
      files.map(async function (fileName) {
        const pipeline = [];

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
      await buildSite(currentDirectory + "/" + directory);
    }
  } catch (error) {
    console.error("Unable to scan directory: " + error);
  }
}

(async () => {
  if (process.argv[2] == "--build") await buildSite();
})();
