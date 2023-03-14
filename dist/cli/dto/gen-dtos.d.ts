export interface FileConfig {
    sourceDirectory: string;
    outputDirectory: string;
    filename: string;
    schemasJSONPath?: string;
}
export declare class GenDTOs {
    private static getAbsPath;
    private static getFileContent;
    private static getSchemasFromOAS;
    private static parseOAS;
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
    static generateDTOs(config: FileConfig): Promise<boolean>;
}
//# sourceMappingURL=gen-dtos.d.ts.map