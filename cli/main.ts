import path from 'path'
import klaw from 'klaw'
import { Command } from 'commander'
import { OASGenDTO } from '../lib/oas-gen-dto'

const program = new Command();

program
  .name('brij')
  .description('build responsively in json-schema')
  .version('0.0.1');

program.command('dto')
  .description('Output TypeScript artifacts based on a json-schema definitions in oas files')
  .argument('<string>', 'source directory with oas files')
  .argument('<string>', 'output directory for generated TypeScript files')
  .action(async (oasDirectory: string, outputDirectory: string, options: Record<string, any>) => {
    const specs = []

    for await (const file of klaw(oasDirectory)) {
      if (!file.stats.isDirectory()) {
        specs.push(file)
      }
    }

    const prefix = path.resolve(oasDirectory)

    console.log({specs, prefix})

    for (const spec of specs) {
      const relativePath = path.relative(prefix, spec.path)
      console.log('rel ' + relativePath)
      const basename = path.basename(relativePath)
      console.log('basename ' + basename)

      const intermediatePath = relativePath.slice(-1*basename.length)

      OASGenDTO.generateDTOs({
        // oasDirectory: path.join(oasDirectory, intermediatePath),
        // outputDirectory: path.join(outputDirectory, intermediatePath),
        oasDirectory,
        outputDirectory,
        oasName: 'petstore.json',
        // oasName: 'petstore.json',
        // oasName: basename,
        schemasPath: '#/definitions',
      })
    }

  })

program.parse()
