"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OASGenDTO = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const json_schema_base_1 = require("../lib/json-schema.base");
const typescriptInterfaceOptions = {
    style: {
        singleQuote: true,
        semi: false,
    },
    bannerComment: '/* eslint-disable */\n/**\n* This file was automatically generated.\n* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,\n* and run `brij dto` to regenerate this file.\n*/'
};
class OASGenDTO {
    static getAbsPath(pathRelToBase, baseDir) {
        const abs = path_1.default.resolve(baseDir);
        const filePath = path_1.default.join(abs, pathRelToBase);
        return filePath;
    }
    static getFileContent(absPath) {
        const fileContent = fs_1.default.readFileSync(absPath).toString();
        return fileContent;
    }
    static async getSchemas(config) {
        const filePath = OASGenDTO.getAbsPath(config.oasName, config.oasDirectory);
        const fileContent = OASGenDTO.getFileContent(filePath);
        const oas = await OASGenDTO.parseOAS(fileContent);
        const lookup = config.schemasPath.split('/').slice(1);
        let current = oas;
        for (const prop of lookup) {
            if (!current || typeof current !== 'object') {
                current = null;
                break;
            }
            current = current[prop];
            if (!current) {
                break;
            }
        }
        return current;
    }
    /**
     * Use the ajv ValidatorFunction instance imported from json-schema.base.ts.
     * This verifies that the same ajv instance that will be used at run time will
     * work for the schema in the generated code.
     *
     * @param schema
     */
    static verifyValidatorCompilation(schema) {
        const validate = json_schema_base_1.ajv.compile(schema);
        validate({});
    }
    static async parseOAS(content) {
        const parsers = {
            json: (x) => JSON.parse(x),
            yaml: (x) => js_yaml_1.default.load(x),
        };
        let o;
        for (const parser of Object.values(parsers)) {
            try {
                o = parser(content);
                if (o) {
                    break;
                }
            }
            catch { /* try again */ }
        }
        if (!o) {
            throw new Error(`file format must be one of ${Object.keys(parsers).join('|')}`);
        }
        try {
            return await swagger_parser_1.default.dereference(o);
        }
        catch (e) {
            // will throw if invalid
            await swagger_parser_1.default.validate(o);
            // otherwise it can't be dereferenced for some reason
            console.error(`unable to dereference OAS file: ${e?.message}`);
            throw e;
        }
    }
    static prepareOutputDirectory(outputFolderPath) {
        if (fs_1.default.existsSync(outputFolderPath)) {
            fs_1.default.rmSync(outputFolderPath, { recursive: true });
        }
        let cumulative = '';
        outputFolderPath.split('/').forEach(folder => {
            cumulative = path_1.default.join(cumulative, folder);
            if (cumulative) {
                if (!fs_1.default.existsSync(cumulative)) {
                    fs_1.default.mkdirSync(cumulative);
                }
            }
        });
    }
    static stripExtensions(oasName) {
        return oasName
            .replace(/\.json$/, '')
            .replace(/\.yaml$/, '')
            .replace(/\.yml$/, '');
    }
    static writeIndexExports(args) {
        args.writeExport = args.writeExport
            || ((filename) => `export * from './${OASGenDTO.stripExtensions(filename)}'`);
        const indexPath = path_1.default.join(args.outputDirectory, 'index.ts');
        fs_1.default.writeFileSync(indexPath, args.indexExportFiles.map(args.writeExport).join('\n') + '\n');
    }
    static async renderTypeScriptDTO(jsonSchema, key) {
        const generatedTsInteface = await (0, json_schema_to_typescript_1.compile)(jsonSchema, key, typescriptInterfaceOptions);
        const schemaText = JSON.stringify(jsonSchema, null, 2);
        return `${generatedTsInteface}
import { JSONSchema } from 'brij'

class ${key}Schema extends JSONSchema {
  constructor() {
    super(${schemaText.split('\n').join('\n    ')})
  }
}

export const ${key} = new ${key}Schema()
`;
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
    static async generateDTOs(config) {
        const name = OASGenDTO.stripExtensions(config.oasName);
        const schemas = await OASGenDTO.getSchemas(config);
        const sourceAbsPath = OASGenDTO.getAbsPath(config.oasName, config.oasDirectory);
        if (!schemas) {
            console.warn(`no schemas found at JSON path '${config.schemasPath}' in oas at ${sourceAbsPath}`);
            return false;
        }
        const dtoFolder = path_1.default.join(config.outputDirectory, name);
        OASGenDTO.prepareOutputDirectory(dtoFolder);
        const dtoFiles = [];
        await Promise.all(Object.entries(schemas).map(async ([key, schema]) => {
            const output = path_1.default.join(dtoFolder, `${key}.ts`);
            try {
                OASGenDTO.verifyValidatorCompilation(schema);
            }
            catch (e) {
                console.error(`error compiling ajv for ${key} in ${sourceAbsPath}`);
                console.error(`\t- ${e?.message}\n`);
                return;
            }
            const generated = await OASGenDTO.renderTypeScriptDTO(schema, key);
            fs_1.default.writeFileSync(output, generated);
            dtoFiles.push(key);
        }));
        OASGenDTO.writeIndexExports({
            outputDirectory: dtoFolder,
            indexExportFiles: dtoFiles,
            writeExport: (filename) => `export { ${filename} } from './${OASGenDTO.stripExtensions(filename)}'`
        });
        return !!dtoFiles.length;
    }
}
exports.OASGenDTO = OASGenDTO;
//# sourceMappingURL=oas-gen-dto.js.map