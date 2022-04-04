#!/usr/bin/env node
import { readdir as readDirectory, writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";

function getPath(path) {
  console.log(cwd());
  return join(cwd(), path);
}

function flattenArray(array) {
  return array.reduce((accumulator, value) => {
    return Array.isArray(value) ? flattenArray(value) : [...accumulator, value];
  }, []);
}

async function buildFile(
  langCode,
  sourcePath,
  fileName,
  currentDirectory = ""
) {
  const { default: generateMarkup, LocalConfig } = await import(
    `${sourcePath}/${fileName}`
  );

  const markup = generateMarkup(langCode).replace(/^\s+|\s+$/g, "");

  const buildPath = `build/${langCode}/${currentDirectory}`;
  const destinationFilePath =
    buildPath + "/" + fileName.replace(".js", ".html");

  try {
    if (!existsSync(buildPath)) {
      mkdirSync(buildPath, { recursive: true });
    }

    await writeFile(getPath(destinationFilePath), markup);
  } catch (error) {
    if (error) {
      console.error(
        "Unable to build " + filePath + ", there was an error: " + error
      );
    }
  }
}

async function buildSite(currentDirectory = "") {
  try {
    const { CONFIG } = await import(getPath("./config.js"));
    const sourcePath = getPath(
      "pages" + (currentDirectory != "" ? currentDirectory : "")
    );

    console.log("Pages path: " + sourcePath);

    const list = await readDirectory(sourcePath);

    // Separate files and directories
    const files = [],
      subDirectories = [];

    for (const dirItem of list) {
      if (dirItem[0] == ".") continue; // Ignore hidden files

      (dirItem.includes(".js") ? files : subDirectories).push(dirItem);
    }

    console.log(files, subDirectories);

    const tasks = flattenArray(
      files.map(async function (fileName) {
        return CONFIG.langs.map((lang) =>
          buildFile(lang, sourcePath, fileName, currentDirectory)
        );
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
