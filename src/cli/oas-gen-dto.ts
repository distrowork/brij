import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import SwaggerParser from '@apidevtools/swagger-parser'
import { compile, Options as TypescriptInterfaceOptions } from 'json-schema-to-typescript'
import { ajv } from '../lib/json-schema.base'

export interface DTOConfig {
  oasDirectory: string
  outputDirectory: string
  oasName: string
  schemasPath: string
}

const typescriptInterfaceOptions: Partial<TypescriptInterfaceOptions> = {
  style: {
    singleQuote: true,
    semi: false,
  },
  bannerComment: '/* eslint-disable */\n/**\n* This file was automatically generated.\n* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,\n* and run `brij dto` to regenerate this file.\n*/'
}

export class OASGenDTO {
  private static getAbsPath(pathRelToBase: string, baseDir: string) {
    const abs = path.resolve(baseDir)
    const filePath = path.join(abs, pathRelToBase)

    return filePath
  }

  private static getFileContent(absPath: string) {
    const fileContent = fs.readFileSync(absPath).toString()

    return fileContent
  }

  private static async getSchemas(config: DTOConfig) {
    const filePath = OASGenDTO.getAbsPath(config.oasName, config.oasDirectory)
    const fileContent = OASGenDTO.getFileContent(filePath)
    const oas = await OASGenDTO.parseOAS(fileContent)
    const lookup = config.schemasPath.split('/').slice(1)

    let current: any = oas

    for (const prop of lookup) {
      if (!current || typeof current !== 'object') {
        current = null
        break
      }

      current = current[prop]
      if (!current) {
        break
      }
    }

    return current
  }

  /**
   * Use the ajv ValidatorFunction instance imported from json-schema.base.ts.
   * This verifies that the same ajv instance that will be used at run time will
   * work for the schema in the generated code.
   * 
   * @param schema
   */
  private static verifyValidatorCompilation(schema: any) {
    const validate = ajv.compile(schema)

    validate({})
  }

  private static async parseOAS(content: string) {
    const parsers = {
      json: (x: string) => JSON.parse(x),
      yaml: (x: string) => yaml.load(x),
    }

    let o: any

    for (const parser of Object.values(parsers)) {
      try {
        o = parser(content)
        if (o) { break }
      } catch { /* try again */ }
    }

    if (!o) {
      throw new Error(`file format must be one of ${Object.keys(parsers).join('|')}`)
    }

    try {
      return await SwaggerParser.dereference(o)
    } catch (e: unknown) {
      // will throw if invalid
      await SwaggerParser.validate(o)

      // otherwise it can't be dereferenced for some reason
      console.error(`unable to dereference OAS file: ${(e as any)?.message}`)
      throw e
    }
  }

  private static prepareOutputDirectory(outputFolderPath: string) {
    if (fs.existsSync(outputFolderPath)) {
      fs.rmSync(outputFolderPath, { recursive: true })
    }

    let cumulative = ''

    outputFolderPath.split('/').forEach(folder => {
      cumulative = path.join(cumulative, folder)
      if (cumulative) {
        if (!fs.existsSync(cumulative)) {
          fs.mkdirSync(cumulative)
        }
      }
    })
  }

  private static stripExtensions(oasName: string) {
    return oasName
      .replace(/\.json$/, '')
      .replace(/\.yaml$/, '')
      .replace(/\.yml$/, '')
  }

  private static writeIndexExports(args: {
    outputDirectory: string
    indexExportFiles: string[]
    writeExport?: (filename: string) => string
  }) {
    args.writeExport = args.writeExport
      || ((filename: string) => `export * from './${OASGenDTO.stripExtensions(filename)}'`)

    const indexPath = path.join(args.outputDirectory, 'index.ts')

    fs.writeFileSync(indexPath, args.indexExportFiles.map(args.writeExport).join('\n') + '\n')
  }

  private static async renderTypeScriptDTO(jsonSchema: any, key: string) {
    const generatedTsInteface = await compile(jsonSchema, key, typescriptInterfaceOptions)
    const schemaText = JSON.stringify(jsonSchema, null, 2)

    return `${generatedTsInteface}
import { JSONSchema } from 'brij'

class ${key}Schema extends JSONSchema {
  constructor() {
    super(${schemaText.split('\n').join('\n    ')})
  }
}

export const ${key} = new ${key}Schema()
`
  }

  /**
   * Write DTO files to the specified output directory based on the
   * the JSON schemas in the input OAS. For Each JSON schema found,
   * generate TypeScript for the following:
   *
   * - exported TypeScript interface
   * - class extending JSONSchema, providing the JSON Schema
   * - exported instance of the class with the name overloading the TypeScript interface
   *
   * @param config
   */
  static async generateDTOs(config: DTOConfig): Promise<boolean> {
    const name = OASGenDTO.stripExtensions(config.oasName)

    const schemas = await OASGenDTO.getSchemas(config)
    const sourceAbsPath = OASGenDTO.getAbsPath(config.oasName, config.oasDirectory)

    if (!schemas) {
      console.warn(`no schemas found at JSON path '${config.schemasPath}' in oas at ${sourceAbsPath}`)

      return false
    }

    const dtoFolder = path.join(config.outputDirectory, name)

    OASGenDTO.prepareOutputDirectory(dtoFolder)

    const dtoFiles: string[] = []

    await Promise.all(Object.entries(schemas).map(async([key, schema]: [string, any]) => {
      const output = path.join(dtoFolder, `${key}.ts`)

      try {
        OASGenDTO.verifyValidatorCompilation(schema)
      } catch (e: any) {
        console.error(`error compiling ajv for ${key} in ${sourceAbsPath}`)
        console.error(`\t- ${e?.message}\n`)

        return
      }

      const generated = await OASGenDTO.renderTypeScriptDTO(schema, key)

      fs.writeFileSync(output, generated)
      dtoFiles.push(key)
    }))

    OASGenDTO.writeIndexExports({
      outputDirectory: dtoFolder,
      indexExportFiles: dtoFiles,
      writeExport: (filename: string) => `export { ${filename} } from './${OASGenDTO.stripExtensions(filename)}'`
    })

    return !!dtoFiles.length
  }
}
