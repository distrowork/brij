import path from 'path'
import klaw from 'klaw'
import { Command } from 'commander'
import { OASGenDTO } from './oas-gen-dto'
import packageJson from './package.symlink.json'

const program = new Command()

program
  .name(packageJson.name)
  .description(
`
          ┏┓━━━━━━━━━━
          ┃┃━━━━━━━━┏┓
          ┃┗━┓┏━┓┏┓━┗┛
          ┃┏┓┃┃┏┛┣┫━┏┓
          ┃┗┛┃┃┃━┃┃━┃┃
          ┗━━┛┗┛━┗┛━┃┃
          ━━━━━━━━━┏┛┃
          ━━━━━━━━━┗━┛
---------------------------------
build responsively in json-schema
---------------------------------

Generate TypeScript interface and validators from JSON schemas defined in OAS files.

license: ${packageJson.license}
`)
  .version(packageJson.version)

program.command('dto')
  .description('Output TypeScript artifacts based on json-schema definitions in OAS files')
  .argument('<string>', 'source directory with OAS files')
  .argument('<string>', 'output directory for generated TypeScript files')
  .option('--schemas <string>', 'JSON path to the section in the OAS with the JSON schemas, e.g. \'#/definitions\'')
  .action(async(oasDirectory: string, outputDirectory: string, options: Record<string, any>) => {
    const specs = []

    for await (const file of klaw(oasDirectory)) {
      if (!file.stats.isDirectory()) {
        specs.push(file)
      }
    }

    const absPrefix = path.resolve(oasDirectory)

    console.log(`
Generating DTOs from JSON schemas
  - OAS directory: '${absPrefix}'
  - schemas JSON path: '${options.schemas}'
`)

    for (const spec of specs) {
      const relativePath = path.relative(absPrefix, spec.path)
      const basename = path.basename(relativePath)
      const intermediatePath = relativePath.slice(0, -1*basename.length)

      console.log(`Found file ${relativePath}`)

      const result = await OASGenDTO.generateDTOs({
        oasDirectory: path.join(oasDirectory, intermediatePath),
        outputDirectory: path.join(outputDirectory, intermediatePath),
        oasName: basename,
        schemasPath: options.schemas,
      })

      result
        ? console.log(`  - Generated DTOs at ${outputDirectory}`)
        : console.log(`  - No DTOs found`)

      console.log()
    }
  })

export function run() {
  program.parse(process.argv)
}