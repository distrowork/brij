export declare class GenDTO {
    /**
     * Use the ajv ValidatorFunction instance imported from json-schema.base.ts.
     * This verifies that the same ajv instance that will be used at run time will
     * work for the schema in the generated code.
     *
     * @param schema
     */
    private static verifyValidatorCompilation;
    private static renderTypeScriptDTO;
    static stripExtensions(oasName: string): string;
    static prepareOutputDirectory(outputFolderPath: string): void;
    static writeIndexExports(args: {
        outputDirectory: string;
        indexExportFiles: string[];
        writeExport?: (filename: string) => string;
    }): void;
    static generateDTO(args: {
        key: string;
        schema: any;
        outputPath?: string;
    }): Promise<string>;
}
//# sourceMappingURL=gen-dto.d.ts.map