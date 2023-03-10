import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import SwaggerParser from '@apidevtools/swagger-parser'
import { compile } from 'json-schema-to-typescript'
import { ajv } from './json-schema.base'
export interface DTOConfig {
  oasDirectory: string
  outputDirectory: string
  oasName: string
  schemasPath: string
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

  private static verifyValidator(schema: any) {
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
    } catch {
      // will throw if invalid
      await SwaggerParser.validate(o)

      // otherwise it can't be dereferenced for some reason
      throw new Error(`unable to dereference OAS file`)
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

  /**
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

    await Promise.all(Object.entries(schemas).map(async ([key, content]: [string, any]) => {
      const output = path.join(dtoFolder, `${key}.ts`)
      try {
        OASGenDTO.verifyValidator(content)
      } catch (e: any) {
        console.error(`error compiling ajv for ${key} in ${sourceAbsPath}`)
        console.error(`\t- ${e?.message}\n`)

        return
      }

      const tsInteface = await compile(content, key)
      const schemaText = JSON.stringify(content, null, 2)
      const generated = `${tsInteface}
import { JSONSchema } from 'brij/lib/json-schema.base'

export class ${key}Schema extends JSONSchema {
  constructor() {
    super(${schemaText.split('\n').join('\n    ')})
  }
}
`
      fs.writeFileSync(output, generated)
    }))

    return true
  }
}
