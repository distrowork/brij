export interface DTOConfig {
    oasDirectory: string;
    outputDirectory: string;
    oasName: string;
    schemasPath: string;
}
export declare class OASGenDTO {
    private static getAbsPath;
    private static getFileContent;
    private static getSchemas;
    /**
     * Use the ajv ValidatorFunction instance imported from json-schema.base.ts.
     * This verifies that the same ajv instance that will be used at run time will
     * work for the schema in the generated code.
     *
     * @param schema
     */
    private static verifyValidatorCompilation;
    private static parseOAS;
    private static prepareOutputDirectory;
    private static stripExtensions;
    private static writeIndexExports;
    private static renderTypeScriptDTO;
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
    static generateDTOs(config: DTOConfig): Promise<boolean>;
}
//# sourceMappingURL=oas-gen-dto.d.ts.map