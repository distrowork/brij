"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path_1 = __importDefault(require("path"));
const klaw_1 = __importDefault(require("klaw"));
const commander_1 = require("commander");
const oas_gen_dto_1 = require("./oas-gen-dto");
const package_symlink_json_1 = __importDefault(require("./package.symlink.json"));
const program = new commander_1.Command();
program
    .name(package_symlink_json_1.default.name)
    .description(`
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

license: ${package_symlink_json_1.default.license}
`)
    .version(package_symlink_json_1.default.version);
program.command('dto')
    .description('Output TypeScript artifacts based on json-schema definitions in OAS files')
    .argument('<string>', 'source directory with OAS files')
    .argument('<string>', 'output directory for generated TypeScript files')
    .option('--schemas <string>', 'JSON path to the section in the OAS with the JSON schemas, e.g. \'#/definitions\'')
    .action(async (oasDirectory, outputDirectory, options) => {
    const specs = [];
    for await (const file of (0, klaw_1.default)(oasDirectory)) {
        if (!file.stats.isDirectory()) {
            specs.push(file);
        }
    }
    const absPrefix = path_1.default.resolve(oasDirectory);
    console.log(`
Generating DTOs from JSON schemas
  - OAS directory: '${absPrefix}'
  - schemas JSON path: '${options.schemas}'
`);
    for (const spec of specs) {
        const relativePath = path_1.default.relative(absPrefix, spec.path);
        const basename = path_1.default.basename(relativePath);
        const intermediatePath = relativePath.slice(0, -1 * basename.length);
        console.log(`Found file ${relativePath}`);
        const result = await oas_gen_dto_1.OASGenDTO.generateDTOs({
            oasDirectory: path_1.default.join(oasDirectory, intermediatePath),
            outputDirectory: path_1.default.join(outputDirectory, intermediatePath),
            oasName: basename,
            schemasPath: options.schemas,
        });
        result
            ? console.log(`  - Generated DTOs at ${outputDirectory}`)
            : console.log(`  - No DTOs found`);
        console.log();
    }
});
function run() {
    program.parse(process.argv);
}
exports.run = run;
//# sourceMappingURL=main.js.map