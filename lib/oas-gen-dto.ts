import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import SwaggerParser from '@apidevtools/swagger-parser'
import { compile } from 'json-schema-to-typescript'
import Ajv from 'ajv'

const ajv = new Ajv()

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

    let current = oas

    for (const prop of lookup) {
      if (typeof current !== 'object') {
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
    fs.mkdirSync(outputFolderPath)
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
  static async generateDTOs(config: DTOConfig) {
    const name = OASGenDTO.stripExtensions(config.oasName)

    const dtoFolder = `dto/${name}`
    OASGenDTO.prepareOutputDirectory(dtoFolder)

    const schemas = await OASGenDTO.getSchemas(config)
    console.log({schemas})

    Promise.all(Object.entries(schemas).map(async ([key, content]: [string, any]) => {
      const output = path.join(dtoFolder, `${key}.ts`)
      OASGenDTO.verifyValidator(content)

      // TODO pass an example from the oas and ensure it validatekj

      const tsInteface = await compile(content, key)
      const schemaText = JSON.stringify(content, null, 2)
      const generated = `${tsInteface}
import { JSONSchema } from '../../lib/json-schema.base'

export class ${key}Schema extends JSONSchema {
  constructor() {
    super(${schemaText.split('\n').join('\n    ')})
  }
}
`
      fs.writeFileSync(output, generated)
    }))
  }
}
