#!/usr/bin/env node
import {
  LayoutFunction,
  PageBuilder,
  SiteConfiguration,
  SlugRecord,
} from "@millino/types-naked-ssg"
import { exec } from "child_process"
import { existsSync, mkdirSync } from "fs"
import { cp, readdir as readDirectory, writeFile } from "fs/promises"
import { join } from "path"
import { cwd } from "process"

import { pathToFileURL } from "url"
import { PROXIES_FOLDER, TYPESCRIPT_BUILD_FOLDER_NAME } from "./constants.js"

function getPath(paths: string[]) {
  const fullPath = join(cwd(), TYPESCRIPT_BUILD_FOLDER_NAME, ...paths)
  return pathToFileURL(fullPath).href
}

function flattenArray<T>(array: Array<T>): Array<T> {
  return array.reduce((accumulator: Array<T>, value: T | Array<T>) => {
    return Array.isArray(value) ? flattenArray(value) : [...accumulator, value]
  }, [])
}

type FileBuilderFactorySignature = {
  sourcePath: string
  layoutName: string
  currentDirectory: string
  layout: LayoutFunction
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

async function readConfig() {
  try {
    const { Config } = await import(getPath(["config.js"]))
    return Config as SiteConfiguration
  } catch (e) {
    console.error("[naked] Can't read config")
    return false
  }
}

async function readLayout() {
  try {
    const { Layout } = await import(getPath(["layout.js"]))
    return Layout as LayoutFunction
  } catch (e) {
    console.error("[naked] Can't read layout")
    return false
  }
}

async function makeFileBuilder({
  sourcePath,
  layoutName,
  currentDirectory = "",
  layout,
}: FileBuilderFactorySignature) {
  const Page = await readTemplate(sourcePath, layoutName)

  return async function ({
    isDefaultCulture = false,
    slugRecord,
    cultureCode,
  }: FileBuilderSignature<unknown>) {
    const { getConfig, getHTML } = Page(cultureCode)

    const config = await (slugRecord ? getConfig(slugRecord) : getConfig())

    const destinationFileName = slugRecord
      ? slugRecord.slug + ".html"
      : layoutName.replace(".js", ".html")
    // Skip a culture, if specified
    if (config?.skipForCultures?.includes(cultureCode)) return false

    const HTMLString = await (slugRecord ? getHTML(slugRecord) : getHTML())

    const markup = (
      await layout({ html: HTMLString, config, cultureCode })
    ).replace(/^\s+|\s+$/g, "")

    const buildPath = join(
      cwd(),
      "build",
      isDefaultCulture ? "" : cultureCode.toLowerCase(),
      currentDirectory,
    )

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
            error,
        )
      }

      return true
    }
  }
}

async function buildSite() {
  const [Config, Layout] = await Promise.all([readConfig(), readLayout()])

  if (!(Config && Layout)) {
    console.error("[naked] Please check your config.ts and layout.tsx files")
    return
  }

  const buildProxyPages = async () => {
    const config = await Config.proxies

    if (!config) return

    const tasks = []

    for (const proxyEntry of config) {
      const { fetchData, layoutName } = proxyEntry

      const data = await fetchData()

      for (const [
        cultureCode,
        { data: cultureSpecificData, directory },
      ] of Object.entries(data)) {
        const buildFile = await makeFileBuilder({
          layout: Layout,
          sourcePath: getPath([PROXIES_FOLDER]),
          layoutName: layoutName + ".js",
          currentDirectory: directory,
        })

        tasks.push(
          cultureSpecificData.map((slugRecord) =>
            buildFile({
              cultureCode,
              isDefaultCulture: cultureCode == Config.cultures[0],
              slugRecord,
            }),
          ),
        )
      }
    }

    await Promise.all(flattenArray(tasks))
  }

  const copyResources = async () => {
    const dirs = ["assets", "scripts", "graphics"]
    console.log("[naked] Copying resources")
    try {
      await Promise.all(
        dirs.map((dir) =>
          cp(getPath(["..", dir]), getPath(["..", "build", dir]), {
            recursive: true,
          }),
        ),
      )
    } catch (e) {
      console.error("[naked] Couldn't copy resources", e)
    }
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
      files.map(async function (layoutName) {
        const pipeline: Array<Promise<boolean>> = []

        const buildFile = await makeFileBuilder({
          layout: Layout,
          sourcePath,
          layoutName,
          currentDirectory,
        })

        // The "default culture" has no dedicated subdirectory, by default
        // @todo: Add global config flag to force a dedicated subdirectory
        pipeline.push(
          buildFile({
            cultureCode: Config.cultures[0],
            isDefaultCulture: true,
          }),
        )

        // Also make promises for the remaining cultures
        for (let i = 1; i < Config.cultures.length; i++) {
          pipeline.push(buildFile({ cultureCode: Config.cultures[i] }))
        }

        return pipeline
      }),
    )

    console.log(
      "[naked] Building " + (currentDirectory == "" ? "/" : currentDirectory),
    )

    await Promise.all(tasks)

    for (const directory of subDirectories) {
      await buildPages(join(currentDirectory, directory))
    }
  }

  buildProxyPages()
  buildPages()
  copyResources()
}

;(async () => {
  const TASKS: Record<string, () => void> = {
    build: () => {
      exec("npx tsc", (error, stdout, stderr) => {
        if (error) {
          console.error(
            "[naked] There was a TypeScript error building your project.",
            error,
          )
          return
        }

        buildSite()
      })
    },
    initialize: () => {
      exec(
        `npm init -y && npm i --save-dev typescript @kitajs/html @kitajs/ts-html-plugin @millino/types-naked-ssg && npx tsc --init --outDir ./${TYPESCRIPT_BUILD_FOLDER_NAME}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(
              "[naked] There was an error initializing your project.",
              stderr,
            )

            return
          }

          console.log(stdout)

          cp(
            getPath(["defaults", "tsconfig.json"]),
            getPath(["tsconfig.json"]),
          ).then(() => {
            console.log("[naked] tsconfig.json copied.")
            console.log("[naked] Project initialized successfully.")
          })
        },
      )
    },
  }

  if (process.argv[2] in TASKS) TASKS[process.argv[2]]()
})()
