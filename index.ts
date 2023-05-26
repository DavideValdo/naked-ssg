#!/usr/bin/env node
import { readdir as readDirectory, writeFile } from "fs/promises"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import { cwd } from "process"
import { exec } from "child_process"
import {
  ProxyConfiguration,
  SiteConfiguration,
  SlugRecord,
  PageBuilder,
} from "@millino/types-naked-ssg"

import Layout from "./layout/index.js"
import { PROXIES_FOLDER, TYPESCRIPT_BUILD_FOLDER_NAME } from "./constants.js"

function getPath(paths: string[]) {
  return join(cwd(), TYPESCRIPT_BUILD_FOLDER_NAME, ...paths)
}

function flattenArray<T>(array: Array<T>): Array<T> {
  return array.reduce((accumulator: Array<T>, value: T | Array<T>) => {
    return Array.isArray(value) ? flattenArray(value) : [...accumulator, value]
  }, [])
}

type FileBuilderFactorySignature = {
  sourcePath: string
  templateName: string
  currentDirectory: string
}

type FileBuilderSignature<T> = {
  cultureCode: string
  isDefaultCulture?: boolean
  slugRecord?: SlugRecord<T>
}

async function readTemplate(sourcePath: string, fileName: string) {
  const { Page } = await import(join(sourcePath, fileName))

  return Page as PageBuilder<unknown>
}

async function makeFileBuilder({
  sourcePath,
  templateName,
  currentDirectory = "",
}: FileBuilderFactorySignature) {
  const Page = await readTemplate(sourcePath, templateName)

  return async function ({
    isDefaultCulture = false,
    slugRecord,
    cultureCode,
  }: FileBuilderSignature<unknown>) {
    const { config, html } = Page(cultureCode)

    const destinationFileName = slugRecord
      ? slugRecord.slug + ".html"
      : templateName.replace(".js", ".html")
    // Skip a culture, if specified
    if (config?.skipForCultures?.includes(cultureCode)) return false

    const HTMLString = await (slugRecord ? html(slugRecord) : html())

    const markup = Layout(HTMLString, config, cultureCode).replace(
      /^\s+|\s+$/g,
      ""
    )

    const buildPath = getPath([
      isDefaultCulture ? "" : cultureCode,
      currentDirectory,
    ])

    const destinationFilePath = join(buildPath, destinationFileName)

    try {
      if (!existsSync(buildPath)) {
        mkdirSync(buildPath, { recursive: true })
      }

      await writeFile(destinationFilePath, markup)

      console.log("[naked] Building", destinationFileName, config)

      return false
    } catch (error) {
      if (error) {
        console.error(
          "[naked] Unable to build " +
            destinationFilePath +
            ", there was an error: " +
            error
        )
      }

      return true
    }
  }
}

async function buildSite() {
  const {
    Config,
  }: {
    Config: SiteConfiguration
  } = await import(getPath(["config.js"]))

  const buildProxyPages = async () => {
    const config = await Config.proxies

    if (!config) return

    const tasks = []

    for (const proxyEntry of config) {
      const { fetchData, templateName } = proxyEntry

      const data = await fetchData()

      for (const [
        cultureCode,
        { data: cultureSpecificData, directory },
      ] of Object.entries(data)) {
        const buildFile = await makeFileBuilder({
          sourcePath: getPath([PROXIES_FOLDER]),
          templateName: templateName + ".js",
          currentDirectory: directory,
        })

        tasks.push(
          cultureSpecificData.map((slugRecord) =>
            buildFile({
              cultureCode,
              isDefaultCulture: cultureCode == Config.cultures[0],
              slugRecord,
            })
          )
        )
      }
    }

    await Promise.all(flattenArray(tasks))
  }

  const buildPages = async (currentDirectory = "") => {
    const sourcePath = getPath([
      "pages",
      currentDirectory != "" ? currentDirectory : "",
    ])

    const list = await readDirectory(sourcePath, {
      withFileTypes: true,
      encoding: "utf8",
    })

    // Separate files and directories
    const files: string[] = [],
      subDirectories: string[] = []

    for (const dirItem of list) {
      const name = dirItem.name

      if (name == ".") continue // Ignore hidden files

      if (dirItem.isDirectory()) {
        subDirectories.push(name)
      }

      if (dirItem.isFile()) files.push(name)
    }

    const tasks = flattenArray(
      files.map(async function (templateName) {
        const pipeline: Array<Promise<boolean>> = []

        const buildFile = await makeFileBuilder({
          sourcePath,
          templateName,
          currentDirectory,
        })

        // The "default culture" has no dedicated subdirectory, by default
        // @todo: Add global config flag to force a dedicated subdirectory
        pipeline.push(
          buildFile({
            cultureCode: Config.cultures[0],
            isDefaultCulture: true,
          })
        )

        // Also make promises for the remaining cultures
        for (let i = 1; i < Config.cultures.length; i++) {
          pipeline.push(buildFile({ cultureCode: Config.cultures[i] }))
        }

        return pipeline
      })
    )

    console.log(
      "[naked] Building " + (currentDirectory == "" ? "/" : currentDirectory)
    )

    await Promise.all(tasks)

    for (const directory of subDirectories) {
      await buildPages(join(currentDirectory, directory))
    }
  }

  buildProxyPages()
  buildPages()
}

;(async () => {
  const TASKS: Record<string, () => void> = {
    build: () => {
      exec("npx tsc", (error, stdout, stderr) => {
        if (error) {
          console.error(
            "[naked] There was a TypeScript error building your project.",
            error
          )
          return
        }

        buildSite()
      })
    },
    initialize: () => {
      exec(
        `npm init -y && npm i --save-dev typescript && npx tsc --init --outDir ./${TYPESCRIPT_BUILD_FOLDER_NAME}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(error)
          } else console.log(stdout)
        }
      )
    },
  }

  if (process.argv[2] in TASKS) TASKS[process.argv[2]]()
})()
